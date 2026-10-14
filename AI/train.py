#!/usr/bin/env python3
"""Train a YOLO segmentation model on the prepared PMLD stone dataset.

Usage:
  python prepare_dataset.py                 # build dataset/ first
  python train.py                           # full run on GPU if available
  python train.py --epochs 3 --fraction 0.1 # quick smoke test
  python train.py --model yolo26n-seg.pt --epochs 100
"""
import argparse
from pathlib import Path

from ultralytics import YOLO

HERE = Path(__file__).resolve().parent


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--data", default=str(HERE / "dataset" / "data.yaml"))
    ap.add_argument("--model", default="yolo26s-seg.pt",
                    help="base weights: yolo26n/s/m-seg.pt (n is smallest/fastest)")
    ap.add_argument("--epochs", type=int, default=100)
    ap.add_argument("--imgsz", type=int, default=640)
    ap.add_argument("--batch", type=int, default=16)
    ap.add_argument("--patience", type=int, default=20, help="early-stop patience")
    ap.add_argument("--seed", type=int, default=42)
    ap.add_argument("--name", default="shaker")
    ap.add_argument("--device", default=None, help="'0' for first GPU, 'cpu'; default auto")
    ap.add_argument("--fraction", type=float, default=1.0, help="train on a fraction (smoke tests)")
    args = ap.parse_args()

    model = YOLO(args.model)
    project = str(HERE / "runs" / "segment")
    train_kwargs = dict(
        data=args.data, epochs=args.epochs, imgsz=args.imgsz, batch=args.batch,
        name=args.name, project=project,
        patience=args.patience, seed=args.seed, fraction=args.fraction,
    )
    if args.device is not None:
        train_kwargs["device"] = args.device
    model.train(**train_kwargs)

    best = str(model.trainer.best) if model.trainer and model.trainer.best else args.name
    model = YOLO(best)
    val_kwargs = {"data": args.data, "imgsz": args.imgsz, "project": project}
    if args.device is not None:
        val_kwargs["device"] = args.device
    model.val(name=f"{args.name}-val", split="val", **val_kwargs)
    model.val(name=f"{args.name}-test", split="test", **val_kwargs)
    model.export(format="onnx", imgsz=args.imgsz, opset=12)


if __name__ == "__main__":
    main()
