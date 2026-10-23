from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

from dotenv import load_dotenv
from flask import Flask, jsonify, request, send_file
from werkzeug.utils import secure_filename

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR.parent / ".env")

try:
    from .detector import DetectorError
    from .storage import Storage
    from .video_processor import process_video
except ImportError:
    from detector import DetectorError
    from storage import Storage
    from video_processor import process_video

UPLOAD_DIR = BASE_DIR / "uploads"
ORIGINAL_DIR = UPLOAD_DIR / "original"
PROCESSED_DIR = UPLOAD_DIR / "processed"
THUMBNAIL_DIR = UPLOAD_DIR / "thumbnails"
ALLOWED_EXTENSIONS = {".mp4", ".avi", ".mov", ".mkv", ".webm"}
MAX_UPLOAD_BYTES = 500 * 1024 * 1024

for directory in (ORIGINAL_DIR, PROCESSED_DIR, THUMBNAIL_DIR):
    directory.mkdir(parents=True, exist_ok=True)

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = MAX_UPLOAD_BYTES
storage = Storage()
executor = ThreadPoolExecutor(max_workers=1, thread_name_prefix="video-detector")


def utc_now():
    return datetime.now(timezone.utc).replace(tzinfo=None)


def video_response(video):
    if not video:
        return None
    video = dict(video)
    video["result_url"] = f"/api/videos/{video['id']}/result"
    video["thumbnail_url"] = f"/api/videos/{video['id']}/thumbnail"
    return video


def run_detection(video_id, input_path):
    output_path = PROCESSED_DIR / f"{video_id}.mp4"
    thumbnail_path = THUMBNAIL_DIR / f"{video_id}.jpg"
    try:
        process_video(
            input_path=input_path,
            output_path=output_path,
            thumbnail_path=thumbnail_path,
            on_progress=lambda progress, values: storage.update_video(
                video_id, progress=progress, **values
            ),
        )
        storage.update_video(
            video_id,
            status="completed",
            progress=100,
            completed_at=utc_now(),
            result_path=str(output_path),
            thumbnail_path=str(thumbnail_path),
        )
    except (OSError, ValueError, RuntimeError, DetectorError) as error:
        storage.update_video(
            video_id, status="failed", error_message=str(error), completed_at=utc_now()
        )


@app.get("/")
def home():
    return jsonify({"message": "Shale Shaker Backend is running"})


@app.get("/api/health")
def health():
    return jsonify({"status": "OK", "service": "Shale Shaker Backend"})


@app.post("/api/videos")
def upload_video():
    uploaded = request.files.get("video")
    if uploaded is None or not uploaded.filename:
        return jsonify({"error": "Field 'video' is required"}), 400

    suffix = Path(uploaded.filename).suffix.lower()
    if suffix not in ALLOWED_EXTENSIONS:
        return jsonify({
            "error": f"Unsupported video type. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
        }), 400

    video_id = uuid4().hex
    filename = secure_filename(uploaded.filename) or f"video{suffix}"
    input_path = ORIGINAL_DIR / f"{video_id}_{filename}"
    uploaded.save(input_path)
    storage.create_video(video_id, filename, input_path, utc_now())
    executor.submit(run_detection, video_id, input_path)

    return jsonify({
        "id": video_id,
        "filename": filename,
        "status": "queued",
        "message": "Video berhasil diupload dan menunggu proses deteksi",
    }), 202


@app.get("/api/videos")
def list_videos():
    try:
        page = max(1, int(request.args.get("page", 1)))
        limit = min(100, max(1, int(request.args.get("limit", 20))))
    except ValueError:
        return jsonify({"error": "page and limit must be integers"}), 400
    videos, total = storage.list_videos(page, limit)
    return jsonify({
        "items": [video_response(video) for video in videos],
        "page": page,
        "limit": limit,
        "total": total,
    })


@app.get("/api/videos/<video_id>")
def get_video(video_id):
    video = storage.get_video(video_id)
    if not video:
        return jsonify({"error": "Video not found"}), 404
    return jsonify(video_response(video))


@app.get("/api/videos/<video_id>/status")
def video_status(video_id):
    video = storage.get_video(video_id)
    if not video:
        return jsonify({"error": "Video not found"}), 404
    return jsonify({
        "id": video["id"],
        "status": video["status"],
        "progress": video["progress"],
        "processed_frames": video["processed_frames"],
        "total_frames": video["total_frames"],
        "error_message": video["error_message"],
    })


@app.get("/api/videos/<video_id>/result")
def video_result(video_id):
    video = storage.get_video(video_id)
    if not video:
        return jsonify({"error": "Video not found"}), 404
    if video["status"] != "completed" or not video["result_path"]:
        return jsonify({"error": "Processed video is not available", "status": video["status"]}), 409
    result_path = Path(video["result_path"])
    if not result_path.is_file():
        return jsonify({"error": "Processed video file is missing"}), 404
    return send_file(result_path, mimetype="video/mp4", as_attachment=False)


@app.get("/api/videos/<video_id>/thumbnail")
def video_thumbnail(video_id):
    video = storage.get_video(video_id)
    if not video or not video["thumbnail_path"]:
        return jsonify({"error": "Thumbnail not found"}), 404
    thumbnail_path = Path(video["thumbnail_path"])
    if not thumbnail_path.is_file():
        return jsonify({"error": "Thumbnail file is missing"}), 404
    return send_file(thumbnail_path, mimetype="image/jpeg")


@app.delete("/api/videos/<video_id>")
def delete_video(video_id):
    video = storage.get_video(video_id)
    if not video:
        return jsonify({"error": "Video not found"}), 404
    storage.delete_video(video_id)
    for path in (video["original_path"], video["result_path"], video["thumbnail_path"]):
        if path:
            Path(path).unlink(missing_ok=True)
    return jsonify({"message": "Video history deleted", "id": video_id})


@app.errorhandler(413)
def request_too_large(_error):
    return jsonify({"error": "Video exceeds the 500 MB upload limit"}), 413


if __name__ == "__main__":
    app.run(debug=True)
