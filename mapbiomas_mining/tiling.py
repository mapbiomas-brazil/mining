"""Pure-numpy tiling helpers (no TensorFlow needed).

The mosaic is padded, split into overlapping windows of ``2*k`` with step ``k``,
and the predictions are stitched back keeping only the central part of each window,
which avoids border artifacts ("white bars") between patches.
"""
from __future__ import annotations

from typing import Tuple

import numpy as np
from patchify import patchify


def pad_to_tiles(img: np.ndarray, kernel: int, mode: str = "mean") -> Tuple[np.ndarray, Tuple[int, int]]:
    """Pad ``(C, H, W)`` so H and W are multiples of ``kernel`` and at least ``2*kernel``.

    Returns the padded array and the original ``(H, W)``.
    """
    _, h, w = img.shape
    new_h = max(2 * kernel, -(-h // kernel) * kernel)
    new_w = max(2 * kernel, -(-w // kernel) * kernel)
    if (new_h, new_w) != (h, w):
        img = np.pad(img, ((0, 0), (0, new_h - h), (0, new_w - w)), mode=mode)
    return img, (h, w)


def extract_windows(img: np.ndarray, kernel: int) -> Tuple[np.ndarray, Tuple[int, int]]:
    """Split ``(C, H, W)`` into windows ``(N, 2k, 2k, C)`` (row-major).

    Returns the windows and the grid shape ``(n_rows, n_cols)``.
    """
    c = img.shape[0]
    win = kernel * 2
    patches = patchify(img, (c, win, win), step=kernel)  # (1, nr, nc, 1?, ...)
    patches = patches[0]
    n_rows, n_cols = patches.shape[0], patches.shape[1]
    patches = patches.reshape(n_rows * n_cols, c, win, win)
    return np.transpose(patches, (0, 2, 3, 1)), (n_rows, n_cols)


def _crop_bounds(idx: int, n: int, kernel: int) -> Tuple[int, int]:
    half = kernel // 2
    start = 0 if idx == 0 else half
    stop = 2 * kernel if idx == n - 1 else kernel + half
    return start, stop


def stitch_windows(preds: np.ndarray, grid: Tuple[int, int], kernel: int) -> np.ndarray:
    """Reassemble predictions ``(N, 2k, 2k)`` into a ``((nr+1)*k, (nc+1)*k)`` array."""
    n_rows, n_cols = grid
    rows = []
    for r in range(n_rows):
        r0, r1 = _crop_bounds(r, n_rows, kernel)
        row = []
        for c in range(n_cols):
            c0, c1 = _crop_bounds(c, n_cols, kernel)
            row.append(preds[r * n_cols + c][r0:r1, c0:c1])
        rows.append(np.concatenate(row, axis=1))
    return np.concatenate(rows, axis=0)
