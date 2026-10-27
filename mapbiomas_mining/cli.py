"""Command line interface: ``mapbiomas-mining train|predict``."""
from __future__ import annotations

import argparse

from .config import MiningConfig


def _config(args) -> MiningConfig:
    return MiningConfig(version=args.version, biome=args.biome,
                        biome_code=args.biome_code, work_dir=args.work_dir)


def main(argv=None):
    p = argparse.ArgumentParser(prog="mapbiomas-mining")
    p.add_argument("--version", default="5")
    p.add_argument("--biome", default="amazonia")
    p.add_argument("--biome-code", type=int, default=1)
    p.add_argument("--work-dir", default="./data")
    sub = p.add_subparsers(dest="cmd", required=True)

    t = sub.add_parser("train")
    t.add_argument("--epochs", type=int, default=50)
    t.add_argument("--initial-epoch", type=int, default=0)
    t.add_argument("--resume-from")

    pr = sub.add_parser("predict")
    pr.add_argument("--epoch", type=int, required=True)
    pr.add_argument("--grid", required=True, help="reference grid GeoJSON")
    pr.add_argument("--mosaic-root", required=True)
    pr.add_argument("--mosaic-version", default="1")
    pr.add_argument("--start-year", type=int, default=1985)
    pr.add_argument("--end-year", type=int, default=2024)
    pr.add_argument("--overwrite", action="store_true")

    args = p.parse_args(argv)
    cfg = _config(args)

    if args.cmd == "train":
        from .train import train
        train(cfg, epochs=args.epochs, initial_epoch=args.initial_epoch,
              resume_from=args.resume_from)
    else:
        from .grid import load_grid, mining_region_ids
        from .model import build_unet
        from .predict import predict_year_range
        model = build_unet(cfg, compile_model=False)
        model.load_weights(str(cfg.checkpoint_path(args.epoch)))
        regions = mining_region_ids(load_grid(args.grid), cfg.biome_code)
        predict_year_range(model, cfg, args.epoch,
                           range(args.start_year, args.end_year + 1), regions,
                           args.mosaic_root, args.mosaic_version, overwrite=args.overwrite)


if __name__ == "__main__":
    main()
