import argparse
import json
import shutil
from pathlib import Path


def convert(root, out):
    class_names = []
    for json_path in sorted(Path(root).rglob("_annotations.coco.json")):
        for c in json.loads(json_path.read_text("utf-8"))["categories"]:
            if c["name"] not in class_names:
                class_names.append(c["name"])
    cls_map = {n: i for i, n in enumerate(class_names)}

    for json_path in sorted(Path(root).rglob("_annotations.coco.json")):
        split = json_path.parent.name
        coco = json.loads(json_path.read_text("utf-8"))
        imgs = {im["id"]: im for im in coco["images"]}
        by_img = {}
        for a in coco["annotations"]:
            by_img.setdefault(a["image_id"], []).append(a)
        img_dir = out / "images" / split
        lbl_dir = out / "labels" / split
        img_dir.mkdir(parents=True, exist_ok=True)
        lbl_dir.mkdir(parents=True, exist_ok=True)
        for im in imgs.values():
            src = json_path.parent / im["file_name"]
            shutil.copy2(src, img_dir / src.name)
            lines = []
            for a in by_img.get(im["id"], []):
                segs = a.get("segmentation")
                if not segs:
                    continue
                if isinstance(segs, dict):
                    continue  # ponytail: RLE needs pycocotools; add when crowd masks appear
                w, h = im["width"], im["height"]
                for poly in segs:
                    pts = " ".join(f"{min(max(poly[i]/w, 0), 1):.6f} {min(max(poly[i+1]/h, 0), 1):.6f}"
                                   for i in range(0, len(poly), 2))
                    name = next(c["name"] for c in coco["categories"] if c["id"] == a["category_id"])
                    lines.append(f"{cls_map[name]} {pts}")
            (lbl_dir / f"{src.stem}.txt").write_text("\n".join(lines))

    (out / "data.yaml").write_text(
        f"path: {out.resolve()}\ntrain: 'images/train'\nval: 'images/val'\nnames:\n"
        + "".join(f"  {i}: {n}\n" for i, n in enumerate(class_names))
    )


def main():
    ap = argparse.ArgumentParser(description="Roboflow COCO segmentation export -> YOLO segmentation dataset")
    ap.add_argument("--root", default="dataset-final.v28i.coco-segmentation",
                    help="folder with train/valid subdirs each holding images + _annotations.coco.json")
    ap.add_argument("--out", default="YOLO dataset")
    a = ap.parse_args()
    convert(Path(a.root), Path(a.out))


if __name__ == "__main__":
    main()