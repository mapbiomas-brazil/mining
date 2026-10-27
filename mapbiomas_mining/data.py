"""TFRecord input pipeline for training / evaluation patches."""
from __future__ import annotations

import tensorflow as tf

from .config import MiningConfig


def _features_dict(config: MiningConfig):
    return {
        k: tf.io.FixedLenFeature(shape=config.kernel_shape, dtype=tf.float32)
        for k in config.features
    }


def get_dataset(pattern: str, config: MiningConfig) -> tf.data.Dataset:
    """Read, parse and convert TFRecord files into ``(inputs, labels)`` tuples (HWC)."""
    files = tf.io.gfile.glob(pattern)
    if not files:
        raise FileNotFoundError(f"No TFRecord files match: {pattern}")
    features_dict = _features_dict(config)
    n_bands = len(config.bands)

    def parse(example_proto):
        return tf.io.parse_single_example(example_proto, features_dict)

    def to_tuple(inputs):
        stacked = tf.stack([inputs[k] for k in config.features], axis=0)
        stacked = tf.transpose(stacked, [1, 2, 0])  # CHW -> HWC
        return stacked[:, :, :n_bands], stacked[:, :, n_bands:]

    ds = tf.data.TFRecordDataset(files, compression_type="GZIP", num_parallel_reads=8)
    return ds.map(parse, num_parallel_calls=5).map(to_tuple, num_parallel_calls=5)


def count_samples(dataset: tf.data.Dataset) -> int:
    return int(dataset.reduce(0, lambda x, _: x + 1).numpy())


def get_training_dataset(config: MiningConfig):
    """Returns ``(dataset, size)``; dataset is shuffled, batched and repeating."""
    ds = get_dataset(config.train_glob, config)
    size = count_samples(ds)
    ds = (
        ds.shuffle(config.buffer_size, reshuffle_each_iteration=True)
        .batch(config.batch_size)
        .repeat()
        .prefetch(tf.data.AUTOTUNE)
    )
    return ds, size


def get_eval_dataset(config: MiningConfig, batch_size: int = 2):
    """Returns ``(dataset, size)``; dataset is batched and repeating."""
    ds = get_dataset(config.eval_glob, config)
    size = count_samples(ds)
    return ds.batch(batch_size).repeat(), size
