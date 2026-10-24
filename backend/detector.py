import os
from pathlib import Path
from threading import Lock


class DetectorError(RuntimeError):
    pass


class StoneDetector:
    _model = None
    _lock = Lock()

    def __init__(self):
        self.model_path = self._find_model()

    @staticmethod
    def _find_model():
        configured = os.getenv("SHALE_SHAKER_MODEL")
        if configured:
            path = Path(configured)
            if not path.is_file():
                raise DetectorError(f"Configured model does not exist: {path}")
            return path
        root = Path(__file__).resolve().parent.parent / "AI" / "runs" / "segment"
        candidates = list(root.glob("*/weights/best.pt"))
        if not candidates:
            raise DetectorError(
                "No trained model found. Set SHALE_SHAKER_MODEL or place best.pt under AI/runs/segment/*/weights."
            )
        return max(candidates, key=lambda path: path.stat().st_mtime)

    def _get_model(self):
        if self._model is None:
            with self._lock:
                if self._model is None:
                    try:
                        from ultralytics import YOLO
                    except ImportError as error:
                        raise DetectorError(
                            "ultralytics is not installed; install it before processing videos"
                        ) from error
                    self._model = YOLO(str(self.model_path))
        return self._model

    def predict(self, frame):
        return self._get_model()(frame, conf=0.25, verbose=False, retina_masks=True)[0]
