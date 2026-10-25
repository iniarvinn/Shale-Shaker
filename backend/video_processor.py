import os
import shutil
import subprocess
from pathlib import Path

try:
    from .detector import StoneDetector
except ImportError:
    from detector import StoneDetector


def _find_ffmpeg():
    ffmpeg = shutil.which("ffmpeg")
    if ffmpeg:
        return ffmpeg
    # Fallback to common locations
    local = Path(__file__).resolve().parent / "ffmpeg.exe"
    if local.is_file():
        return str(local)
    return None


def _remux_to_browser_friendly(output_path: Path):
    ffmpeg_path = _find_ffmpeg()
    if not ffmpeg_path or not output_path.is_file():
        return
    temp_path = output_path.with_name(f"{output_path.stem}.browser_tmp.mp4")
    try:
        cmd = [
            ffmpeg_path,
            "-y",
            "-i",
            str(output_path),
            "-c:v",
            "libx264",
            "-preset",
            "veryfast",
            "-crf",
            "23",
            "-pix_fmt",
            "yuv420p",
            "-movflags",
            "+faststart",
            "-map",
            "0:v:0",
            "-an",
            str(temp_path),
        ]
        result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        if result.returncode == 0 and temp_path.is_file() and temp_path.stat().st_size > 0:
            os.replace(temp_path, output_path)
        elif temp_path.is_file():
            try:
                temp_path.unlink()
            except Exception:
                pass
    except Exception:
        if temp_path.is_file():
            try:
                temp_path.unlink()
            except Exception:
                pass


def process_video(input_path, output_path, thumbnail_path, on_progress):
    try:
        import cv2
    except ImportError as error:
        raise RuntimeError("opencv-python is not installed; install it before processing videos") from error

    capture = cv2.VideoCapture(str(input_path))
    if not capture.isOpened():
        raise ValueError(f"Unable to open video: {input_path}")

    total_frames = int(capture.get(cv2.CAP_PROP_FRAME_COUNT)) or 0
    fps = capture.get(cv2.CAP_PROP_FPS) or 30.0
    width = int(capture.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(capture.get(cv2.CAP_PROP_FRAME_HEIGHT))
    if width <= 0 or height <= 0:
        capture.release()
        raise ValueError("Video has invalid dimensions")

    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    writer = cv2.VideoWriter(str(output_path), fourcc, fps, (width, height))
    if not writer.isOpened():
        fourcc = cv2.VideoWriter_fourcc(*"avc1")
        writer = cv2.VideoWriter(str(output_path), fourcc, fps, (width, height))

    if not writer.isOpened():
        capture.release()
        raise RuntimeError(f"Unable to create output video: {output_path}")

    detector = StoneDetector()
    processed = frames_with_stone = total_instances = 0
    coverage_sum = max_coverage = 0.0
    thumbnail_written = False
    try:
        while True:
            success, frame = capture.read()
            if not success:
                break
            result = detector.predict(frame)
            annotated = result.plot()
            writer.write(annotated)
            processed += 1
            count = len(result.boxes) if result.boxes is not None else 0
            coverage = 0.0
            if result.masks is not None:
                coverage = float(result.masks.data.sum()) / (height * width) * 100
            frames_with_stone += int(count > 0)
            total_instances += count
            coverage_sum += coverage
            max_coverage = max(max_coverage, coverage)
            if not thumbnail_written:
                cv2.imwrite(str(thumbnail_path), annotated)
                thumbnail_written = True
            if processed == 1 or processed % 10 == 0:
                progress = int(processed / total_frames * 100) if total_frames else 0
                on_progress(progress, {
                    "status": "processing",
                    "total_frames": total_frames,
                    "processed_frames": processed,
                    "frames_with_stone": frames_with_stone,
                    "total_detected_instances": total_instances,
                    "average_coverage": coverage_sum / processed,
                    "max_coverage": max_coverage,
                    "duration_seconds": processed / fps,
                })
    finally:
        capture.release()
        writer.release()

    if processed == 0:
        raise ValueError("Video contains no readable frames")

    _remux_to_browser_friendly(output_path)

    on_progress(100, {
        "status": "processing",
        "total_frames": total_frames or processed,
        "processed_frames": processed,
        "frames_with_stone": frames_with_stone,
        "total_detected_instances": total_instances,
        "average_coverage": coverage_sum / processed,
        "max_coverage": max_coverage,
        "duration_seconds": processed / fps,
    })
