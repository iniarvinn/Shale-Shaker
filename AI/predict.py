#!/usr/bin/env python3
"""Run the trained PMLD model on images and report stone coverage per frame.

If the model was trained on tiles (see tile_dataset.py), pass --tile to slice each
full frame the same way and merge the per-tile masks back onto the original image.

Usage:
  python predict.py                                  # newest run, test split -> runs/predict
  python predict.py --tile 640 --overlap 128         # tiled model on full frames
  python predict.py --source path/to/img.jpg
  python predict.py --model runs/segment/shaker-v2/weights/best.pt
"""
import argparse
from pathlib import Path

import cv2
import numpy as np
from ultralytics import YOLO

from tile_dataset import origins

HERE = Path(__file__).resolve().parent


def latest_weights(root):
    """Newest runs/segment/*/weights/best.pt (by mtime)."""
    cands = list(root.glob("*/weights/best.pt"))
    if not cands:
        raise SystemExit(f"no trained weights under {root}\\*/weights\\best.pt; run train.py first or pass --model")
    return max(cands, key=lambda p: p.stat().st_mtime)


def tiled_predict(model, img, tile, overlap, conf):
    """Slice `img`, run the model per tile, merge masks -> (coverage canvas, boxes)."""
    H, W = img.shape[:2]
    stride = tile - overlap
    canvas = np.zeros((H, W), np.uint8)
    boxes = []
    for y0 in origins(H, tile, stride):
        for x0 in origins(W, tile, stride):
            crop = img[y0:y0 + tile, x0:x0 + tile]
            ch, cw = crop.shape[:2]
            r = model(crop, conf=conf, verbose=False)[0]
            if r.masks is None:
                continue
            for i, m in enumerate(r.masks.data.cpu().numpy()):
                if m.shape != (ch, cw):
                    m = cv2.resize(m, (cw, ch), interpolation=cv2.INTER_NEAREST)
                sub = canvas[y0:y0 + ch, x0:x0 + cw]
                np.maximum(sub, (m > 0.5).astype(np.uint8), out=sub)
                x1, y1, x2, y2 = r.boxes.xyxy[i].tolist()
                boxes.append((x0 + x1, y0 + y1, x0 + x2, y0 + y2))
    return canvas, boxes


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--model", default=None, help="weights path (default: newest run under runs/segment)")
    ap.add_argument("--source", default=str(HERE / "dataset" / "images" / "test"))
    ap.add_argument("--out", default=str(HERE / "runs" / "predict"))
    ap.add_argument("--conf", type=float, default=0.25)
    ap.add_argument("--limit", type=int, default=0, help="max images (0 = all)")
    ap.add_argument("--tile", type=int, default=0, help="tile size for full-frame inference (0 = off)")
    ap.add_argument("--overlap", type=int, default=128)
    args = ap.parse_args()

    args.model = args.model or str(latest_weights(HERE / "runs" / "segment"))
    print(f"model: {args.model}")
    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    model = YOLO(args.model)

    src = Path(args.source)
    imgs = [src] if src.is_file() else sorted(
        p for p in src.rglob("*") if p.suffix.lower() in {".jpg", ".jpeg", ".png"})
    if args.limit:
        imgs = imgs[: args.limit]

    for p in imgs:
        if args.tile:
            img = cv2.imread(str(p))
            canvas, boxes = tiled_predict(model, img, args.tile, args.overlap, args.conf)
            cov = float(canvas.sum()) / (img.shape[0] * img.shape[1]) * 100
            for x1, y1, x2, y2 in boxes:
                cv2.rectangle(img, (int(x1), int(y1)), (int(x2), int(y2)), (0, 255, 0), 1)
            cv2.imwrite(str(out / p.name), img)
            n = len(boxes)
        else:
            r = model(p, conf=args.conf, verbose=False, retina_masks=True)[0]
            n = len(r)
            if r.masks is not None:
                cov = float(r.masks.data.sum()) / (r.orig_shape[0] * r.orig_shape[1]) * 100
                r.save(filename=str(out / p.name))
            else:
                cov = 0.0
        print(f"{p.name:60s} => stone coverage: {cov:5.2f}%  ({n} instance(s))")


if __name__ == "__main__":
    main()
