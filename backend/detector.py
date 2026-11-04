import os
from pathlib import Path
from threading import Lock
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
# Load .env from backend directory or project root
load_dotenv(BASE_DIR / ".env")
load_dotenv(BASE_DIR.parent / ".env")


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
            if path.is_file():
                return path

        # Check local backend model directory
        local_model = BASE_DIR / "model" / "best.pt"
        if local_model.is_file():
            return local_model

        # Check trained models under AI/runs/segment
        ai_runs = BASE_DIR.parent / "AI" / "runs" / "segment"
        candidates = list(ai_runs.glob("*/weights/best.pt"))
        if candidates:
            return max(candidates, key=lambda p: p.stat().st_mtime)

        # Check weights/ directory at project root
        root_weights = list((BASE_DIR.parent / "weights").glob("*.pt"))
        if root_weights:
            return root_weights[0]

        raise DetectorError(
            "No trained model found. Set SHALE_SHAKER_MODEL or place best.pt under backend/model/ or AI/runs/segment/*/weights."
        )

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
        conf_thresh = float(os.getenv("SHALE_SHAKER_CONF", "0.08"))
        return self._get_model()(frame, conf=conf_thresh, verbose=False, retina_masks=True)[0]
