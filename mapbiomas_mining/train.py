"""Training loop."""
from __future__ import annotations

from typing import Optional

import tensorflow as tf

from .config import MiningConfig
from .data import get_eval_dataset, get_training_dataset
from .model import build_unet


def train(
    config: MiningConfig,
    epochs: Optional[int] = None,
    initial_epoch: int = 0,
    resume_from: Optional[str] = None,
):
    """Train the U-Net, saving a checkpoint per epoch in ``config.model_dir``.

    ``initial_epoch`` must match the epoch of ``resume_from`` when resuming.
    """
    config.model_dir.mkdir(parents=True, exist_ok=True)
    model = build_unet(config)
    if resume_from:
        model.load_weights(resume_from)

    training, train_size = get_training_dataset(config)
    evaluation, eval_size = get_eval_dataset(config)

    callbacks = [
        tf.keras.callbacks.ModelCheckpoint(
            str(config.model_dir / "cp-{epoch:04d}.keras"),
            save_weights_only=False, save_best_only=False, save_freq="epoch",
        ),
        tf.keras.callbacks.TensorBoard(
            log_dir=str(config.output_dir / "log_model"), write_images=True
        ),
    ]
    history = model.fit(
        x=training,
        epochs=epochs or config.epochs,
        initial_epoch=initial_epoch,
        steps_per_epoch=max(1, train_size // config.batch_size),
        validation_data=evaluation,
        validation_steps=max(1, eval_size // 2),
        callbacks=callbacks,
        shuffle=True,
        verbose=1,
    )
    return model, history
