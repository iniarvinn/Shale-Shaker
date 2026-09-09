from flask import Flask, jsonify

app = Flask(__name__)


@app.route("/")
def home():
    return jsonify({
        "message": "Shale Shaker Backend is running"
    })


@app.route("/api/health")
def health():
    return jsonify({
        "status": "OK",
        "service": "Shale Shaker Backend"
    })


if __name__ == "__main__":
    app.run(debug=True)