"""U-Net architecture used for the mining classification."""
from __future__ import annotations

import tensorflow as tf
from tensorflow.keras import layers, losses, metrics, models

from .config import MiningConfig


def _conv_block(x, filters):
    for _ in range(2):
        x = layers.Conv2D(filters, (3, 3), padding="same")(x)
        x = layers.BatchNormalization()(x)
        x = layers.Activation("relu")(x)
    return x


def _encoder_block(x, filters):
    enc = _conv_block(x, filters)
    pool = layers.MaxPooling2D((2, 2), strides=(2, 2))(enc)
    return pool, enc


def _decoder_block(x, skip, filters):
    x = layers.Conv2DTranspose(filters, (2, 2), strides=(2, 2), padding="same")(x)
    x = layers.concatenate([skip, x], axis=-1)
    x = layers.BatchNormalization()(x)
    x = layers.Activation("relu")(x)
    for _ in range(2):
        x = layers.Conv2D(filters, (3, 3), padding="same")(x)
        x = layers.BatchNormalization()(x)
        x = layers.Activation("relu")(x)
    return x


def build_unet(config: MiningConfig, compile_model: bool = True) -> tf.keras.Model:
    """Build (and optionally compile) the U-Net. Input is fully convolutional (any H, W)."""
    inputs = layers.Input(shape=[None, None, len(config.bands)])
    p0, e0 = _encoder_block(inputs, 64)
    p1, e1 = _encoder_block(p0, 128)
    p2, e2 = _encoder_block(p1, 256)
    p3, e3 = _encoder_block(p2, 512)
    center = _conv_block(p3, 1024)
    d4 = _decoder_block(center, e3, 512)
    d3 = _decoder_block(d4, e2, 256)
    d2 = _decoder_block(d3, e1, 128)
    d1 = _decoder_block(d2, e0, 64)
    x = layers.Dropout(config.dropout, name="dropout")(d1)
    outputs = layers.Conv2D(
        1, (1, 1), activation="sigmoid", padding="same",
        kernel_initializer=tf.keras.initializers.GlorotNormal(),
    )(x)
    model = models.Model(inputs=[inputs], outputs=[outputs])

    if compile_model:
        lr = tf.keras.optimizers.schedules.ExponentialDecay(
            config.initial_learning_rate, config.decay_steps, config.decay_rate
        )
        model.compile(
            optimizer=tf.keras.optimizers.Nadam(lr, name="optimizer"),
            loss=losses.get(config.loss),
            metrics=[metrics.get(m) for m in config.metrics],
        )
    return model


def load_model_weights(model: tf.keras.Model, path: str) -> tf.keras.Model:
    """Load weights from a ``.keras`` checkpoint produced by :func:`train`."""
    model.load_weights(path)
    return model
