import numpy as np

from mapbiomas_mining.tiling import extract_windows, pad_to_tiles, stitch_windows


def test_roundtrip_identity():
    k = 16
    rng = np.random.default_rng(0)
    img = rng.random((3, 50, 71)).astype(np.float32)
    padded, (h, w) = pad_to_tiles(img, k)
    assert padded.shape[1] % k == 0 and padded.shape[2] % k == 0
    windows, grid = extract_windows(padded, k)
    # "predict" = identity on band 0
    out = stitch_windows(windows[..., 0], grid, k)
    assert out.shape == padded.shape[1:]
    np.testing.assert_allclose(out[:h, :w], img[0])


def test_small_image_is_padded_to_two_tiles():
    k = 8
    img = np.ones((2, 5, 5), dtype=np.float32)
    padded, _ = pad_to_tiles(img, k)
    assert padded.shape == (2, 16, 16)
