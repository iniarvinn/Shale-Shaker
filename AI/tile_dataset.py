#!/usr/bin/env python3
import argparse
import shutil
from pathlib import Path

import cv2
import numpy as np

SPLITS = ["train", "val", "test"]
IMG_EXT = {".jpg", ".jpeg", ".png"}


def origins(size, tile, stride):
    """Tile start offsets along one axis, covering [0, size] with the last tile flush."""
    if size <= tile:
        return [0]
    o = list(range(0, size - tile + 1, stride))
    if o[-1] != size - tile:
        o.append(size - tile)
    return sorted(set(o))


def parse_lines(text):
    """YOLO polygon label lines -> [(cls_str, Nx2 pixel points)] on a WxH frame."""
    out = []
    for ln in text.splitlines():
        p = ln.split()
        if len(p) < 7:  # need >= 3 points for a polygon
            continue
        pts = np.array(p[1:], float).reshape(-1, 2)
        out.append((p[0], pts))
    return out


def reproject(text, W, H, tile, stride):
    """Assign each polygon to every tile that fully contains it, in tile-normalized coords.

    "Fully contained" (not clipped) is enough here because stones (~<=42px) are far
    smaller than the tile overlap, so every stone sits whole inside at least one tile.
    ponytail: no polygon clipping; add Sutherland-Hodgman if objects can exceed overlap.
    """
    polys = [(cls, pts * (W, H)) for cls, pts in parse_lines(text)]
    tiles = {}
    for y0 in origins(H, tile, stride):
        for x0 in origins(W, tile, stride):
            lines = []
            for cls, pts in polys:
                xs, ys = pts[:, 0], pts[:, 1]
                if xs.min() >= x0 and xs.max() <= x0 + tile and ys.min() >= y0 and ys.max() <= y0 + tile:
                    tp = pts - (x0, y0)
                    tp = tp / tile
                    lines.append(cls + " " + " ".join(f"{v:.6f}" for v in tp.reshape(-1)))
            tiles[(x0, y0)] = lines
    return tiles


def main():
    here = Path(__file__).resolve().parent
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--src", default=str(here / "dataset"))
    ap.add_argument("--out", default=str(here / "dataset_tiled"))
    ap.add_argument("--tile", type=int, default=640)
    ap.add_argument("--overlap", type=int, default=128, help="must exceed the largest stone")
    ap.add_argument("--keep-empty", action="store_true", help="also write tiles with no labels (default: drop them)")
    args = ap.parse_args()

    stride = args.tile - args.overlap
    if stride <= 0:
        raise SystemExit("--overlap must be smaller than --tile")
    src, out = Path(args.src), Path(args.out)
    shutil.rmtree(out, ignore_errors=True)  # rebuild cleanly
    for n in SPLITS:
        (out / "images" / n).mkdir(parents=True, exist_ok=True)
        (out / "labels" / n).mkdir(parents=True, exist_ok=True)

    total = kept = empty = 0
    for n in SPLITS:
        for img_path in sorted((src / "images" / n).iterdir()):
            if img_path.suffix.lower() not in IMG_EXT:
                continue
            img = cv2.imread(str(img_path))
            if img is None:
                continue
            H, W = img.shape[:2]
            lbl = src / "labels" / n / f"{img_path.stem}.txt"
            text = lbl.read_text(encoding="utf-8") if lbl.exists() else ""
            tiles = reproject(text, W, H, args.tile, stride)
            for i, ((x0, y0), lines) in enumerate(tiles.items()):
                total += 1
                if not lines:
                    empty += 1
                    if not args.keep_empty:
                        continue
                crop = img[y0:y0 + args.tile, x0:x0 + args.tile]
                name = f"{img_path.stem}_t{i:03d}"
                cv2.imwrite(str(out / "images" / n / f"{name}.jpg"), crop)
                (out / "labels" / n / f"{name}.txt").write_text("\n".join(lines), encoding="utf-8")
                kept += 1
        print(f"{n:6}: done")

    (out / "data.yaml").write_text(
        f"path: {out.resolve()}\n"
        "train: images/train\n"
        "val: images/val\n"
        "test: images/test\n"
        "names:\n  0: stone\n",
        encoding="utf-8")

    print(f"\nsource    : {src.resolve()}")
    print(f"output    : {out.resolve()}")
    print(f"tiles     : {total} produced, {kept} written, {empty} empty "
          f"({'kept' if args.keep_empty else 'dropped'})")
    print(f"tile={args.tile} overlap={args.overlap} stride={stride}")
    print(f"data.yaml -> {out / 'data.yaml'}")


if __name__ == "__main__":
    main()
