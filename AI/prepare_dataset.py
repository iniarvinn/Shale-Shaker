#!/usr/bin/env python3
"""Build a leak-free train/val/test split for the PMLD stone-segmentation dataset.

The Roboflow export is 683 frames extracted from ONE video (pmld_mp4-0000..0682).
Roboflow's own split is random, so ~60% of the training frames have a near-identical
neighbour frame sitting in val/test -> the model memorises neighbours and val/test
metrics are meaningless. This script regroups frames into temporal BLOCKS (K
consecutive frames stay together), assigns whole blocks to splits, then drops a
guard band so no two kept frames within `--gap` frames land in different splits.

Use the native-resolution export (v2): the v1 yolo26/coco exports are resized to
432x432, which turns the ~7px stones into ~1px and nothing learns.

Usage:
  python prepare_dataset.py
  python prepare_dataset.py --block 80 --gap 10 --seed 42 --ratios 70,20,10
  python prepare_dataset.py --zip ..\\Dataset\\PMLD.v2i.yolo26.zip --out dataset
"""
import argparse
import random
import re
import shutil
import zipfile
from pathlib import Path

NAMES = ["train", "val", "test"]
FRAME_RE = re.compile(r"mp4-(\d+)")


def parse_frame(stem):
    m = FRAME_RE.search(stem)
    return int(m.group(1)) if m else None


def assign_splits(frames, block, ratios, seed):
    """Group frames into blocks of `block` consecutive frame-ids, shuffle blocks,
    greedily assign each block to whatever split is furthest below its target ratio."""
    blocks = {}
    for f in frames:
        blocks.setdefault(f // block, []).append(f)

    order = sorted(blocks)
    random.Random(seed).shuffle(order)

    target = {n: r for n, r in zip(NAMES, ratios) if r > 0}
    assigned = {n: 0 for n in NAMES}
    out = {}
    for b in order:
        s = min((n for n in target), key=lambda n: assigned[n] / target[n])
        for f in blocks[b]:
            out[f] = s
        assigned[s] += len(blocks[b])
    return out


def guard_splits(assign, gap):
    """Drop any frame within +/-gap that has a neighbour in a different split."""
    kept, dropped = {}, []
    for f, s in assign.items():
        leaked = any(assign.get(n) not in (None, s)
                     for n in range(f - gap, f + gap + 1) if n != f)
        if leaked:
            dropped.append(f)
        else:
            kept[f] = s
    return kept, dropped


def read_zip(zip_path):
    images, labels = {}, {}
    with zipfile.ZipFile(zip_path) as z:
        for name in z.namelist():
            parts = name.split("/")
            if len(parts) < 3:
                continue
            low = name.lower()
            if parts[1] == "images" and low.endswith((".jpg", ".jpeg", ".png")):
                images[Path(parts[-1]).stem] = name
            elif parts[1] == "labels" and low.endswith(".txt"):
                labels[Path(parts[-1]).stem] = name
    return images, labels


def main():
    here = Path(__file__).resolve().parent
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--zip", default=str(here.parent / "Dataset" / "PMLD.v2i.yolo26.zip"))
    ap.add_argument("--out", default=str(here / "dataset"))
    ap.add_argument("--block", type=int, default=80, help="consecutive frames kept in one block")
    ap.add_argument("--gap", type=int, default=10, help="dropped guard band between splits (frames)")
    ap.add_argument("--seed", type=int, default=42)
    ap.add_argument("--ratios", default="70,20,10")
    args = ap.parse_args()

    ratios = [float(x) / 100 for x in args.ratios.split(",")]
    if len(ratios) != 3 or abs(sum(ratios) - 1) > 1e-6:
        raise SystemExit("--ratios must be three values summing to 100, e.g. 70,20,10")

    out = Path(args.out)
    shutil.rmtree(out, ignore_errors=True)  # rebuild cleanly; avoids stale files from earlier exports
    images, labels = read_zip(args.zip)
    frames = {s: parse_frame(s) for s in images}
    ok = {s: f for s, f in frames.items() if f is not None}
    if len(ok) != len(images):
        print(f"! {len(images) - len(ok)} image names did not contain a frame number; ignored")

    assign = assign_splits(ok.values(), args.block, ratios, args.seed)
    kept, dropped = guard_splits(assign, args.gap)

    for n in NAMES:
        (out / "images" / n).mkdir(parents=True, exist_ok=True)
        (out / "labels" / n).mkdir(parents=True, exist_ok=True)

    counts, insts = {n: [] for n in NAMES}, {n: [] for n in NAMES}
    with zipfile.ZipFile(args.zip) as z:
        for stem, frame in ok.items():
            if frame not in kept:
                continue
            split = kept[frame]
            img_src = images[stem]
            lbl_src = labels.get(stem)
            img_name = Path(img_src).name
            with z.open(img_src) as src, open(out / "images" / split / img_name, "wb") as dst:
                shutil.copyfileobj(src, dst)
            text = z.read(lbl_src).decode("utf-8") if lbl_src else ""
            (out / "labels" / split / f"{stem}.txt").write_text(text, encoding="utf-8")
            n_inst = sum(1 for ln in text.splitlines() if ln.strip())
            counts[split].append(frame)
            insts[split].append(n_inst)

    total = sum(len(v) for v in counts.values())
    (out / "data.yaml").write_text(
        f"path: {out.resolve()}\n"
        "train: images/train\n"
        "val: images/val\n"
        "test: images/test\n"
        "names:\n  0: stone\n",
        encoding="utf-8")

    print(f"\nsource : {args.zip}")
    print(f"output : {out.resolve()}")
    print(f"frames : {total} kept, {len(dropped)} dropped by +/-{args.gap} guard "
          f"(block={args.block}, seed={args.seed})\n")
    print(f"{'split':6} {'imgs':>5} {'ratio':>6} {'frames(range)':>16} "
          f"{'inst/img mean':>14} {'median':>7} {'>100':>5}")
    for n in NAMES:
        c, v = counts[n], insts[n]
        if not c:
            print(f"{n:6} {'0':>5}")
            continue
        mean = sum(v) / len(v)
        med = sorted(v)[len(v) // 2]
        print(f"{n:6} {len(c):>5} {100 * len(c) / total:>5.1f}% "
              f"{min(c):>7}-{max(c):<8} {mean:>14.1f} {med:>7} {sum(1 for x in v if x > 100):>5}")

    leak = sum(1 for f, s in kept.items()
               if any(kept.get(n) not in (None, s)
                      for n in range(f - args.gap, f + args.gap + 1) if n != f))
    assert leak == 0, f"{leak} cross-split neighbours remain"
    print(f"\nleakage within +/-{args.gap} frames: {leak}  (OK)")
    print(f"data.yaml -> {out / 'data.yaml'}")


if __name__ == "__main__":
    main()
