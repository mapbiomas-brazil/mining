"""Reference grid helpers (GeoJSON, no extra dependency)."""
from __future__ import annotations

import json
from typing import List


def load_grid(path: str) -> dict:
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def mining_region_ids(grid: dict, biome_code: int, plus_one: bool = True) -> List[int]:
    """Region ids flagged ``mining == 1`` in the given biome.

    ``plus_one`` reproduces the notebook, where mosaic files are named with ``id + 1``.
    """
    ids = [
        int(f["properties"]["id"])
        for f in grid["features"]
        if f["properties"].get("mining") == 1 and f["properties"].get("CD_Bioma") == biome_code
    ]
    return sorted(i + 1 if plus_one else i for i in ids)
