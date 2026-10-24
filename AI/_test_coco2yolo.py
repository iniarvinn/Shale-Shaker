import json
import shutil
import tempfile
from pathlib import Path

from COCO2YOLO import convert

d = Path(tempfile.mkdtemp())
root = d / "root"
for split, fname, cat, seg in [
    ("train", "a.jpg", "cutting", [[0, 0, 50, 0, 50, 50, 0, 50]]),
    ("valid", "b.jpg", "cutting", [[10, 10, 20, 10, 20, 20]]),
]:
    sd = root / split
    sd.mkdir(parents=True)
    (sd / fname).write_bytes(b"jpg")
    # duplicate category id/name pairs to test dedupe
    coco = {
        "categories": [{"id": 0, "name": "cutting"}, {"id": 1, "name": "cutting"}],
        "images": [{"id": 0, "file_name": fname, "width": 100, "height": 100}],
        "annotations": [{"id": 0, "image_id": 0, "category_id": 0, "segmentation": seg}],
    }
    (sd / "_annotations.coco.json").write_text(json.dumps(coco))

convert(root, d / "yolo")

assert (d / "yolo/labels/train/a.txt").read_text() == \
    "0 0.000000 0.000000 0.500000 0.000000 0.500000 0.500000 0.000000 0.500000"
assert (d / "yolo/labels/valid/b.txt").read_text() == \
    "0 0.100000 0.100000 0.200000 0.100000 0.200000 0.200000"
yaml = (d / "yolo/data.yaml").read_text()
assert "0: cutting" in yaml and yaml.count("cutting") == 1, yaml
assert (d / "yolo/images/train/a.jpg").exists()
assert (d / "yolo/images/valid/b.jpg").exists()
print("OK")
shutil.rmtree(d)