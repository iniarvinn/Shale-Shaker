import os
from pathlib import Path

import pymysql
from pymysql.cursors import DictCursor


class Storage:
    def __init__(self, database_path: Path = None):
        self.host = os.getenv("MYSQL_HOST", "127.0.0.1")
        self.port = int(os.getenv("MYSQL_PORT", "3306"))
        self.user = os.getenv("MYSQL_USER", "root")
        self.password = os.getenv("MYSQL_PASSWORD", "")
        self.database = os.getenv("MYSQL_DATABASE", "shale_shaker")
        self._create_database()
        self._create_table()

    def _connect(self, include_database=True):
        settings = {
            "host": self.host,
            "port": self.port,
            "user": self.user,
            "password": self.password,
            "cursorclass": DictCursor,
            "autocommit": True,
        }
        if include_database:
            settings["database"] = self.database
        return pymysql.connect(**settings)

    def _create_database(self):
        with self._connect(include_database=False) as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    f"CREATE DATABASE IF NOT EXISTS `{self.database}` "
                    "CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
                )

    def _create_table(self):
        with self._connect() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    CREATE TABLE IF NOT EXISTS videos (
                        id VARCHAR(32) PRIMARY KEY,
                        original_filename VARCHAR(255) NOT NULL,
                        original_path TEXT NOT NULL,
                        result_path TEXT,
                        thumbnail_path TEXT,
                        status VARCHAR(20) NOT NULL,
                        progress TINYINT UNSIGNED NOT NULL DEFAULT 0,
                        duration_seconds DOUBLE,
                        total_frames INT UNSIGNED,
                        processed_frames INT UNSIGNED NOT NULL DEFAULT 0,
                        frames_with_stone INT UNSIGNED NOT NULL DEFAULT 0,
                        total_detected_instances INT UNSIGNED NOT NULL DEFAULT 0,
                        average_coverage DOUBLE NOT NULL DEFAULT 0,
                        max_coverage DOUBLE NOT NULL DEFAULT 0,
                        error_message TEXT,
                        created_at DATETIME(6) NOT NULL,
                        completed_at DATETIME(6),
                        INDEX idx_videos_created_at (created_at),
                        INDEX idx_videos_status (status)
                    ) ENGINE=InnoDB
                    """
                )

    def create_video(self, video_id, filename, original_path, created_at):
        with self._connect() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    INSERT INTO videos
                    (id, original_filename, original_path, status, created_at)
                    VALUES (%s, %s, %s, 'queued', %s)
                    """,
                    (video_id, filename, str(original_path), created_at),
                )

    def get_video(self, video_id):
        with self._connect() as connection:
            with connection.cursor() as cursor:
                cursor.execute("SELECT * FROM videos WHERE id = %s", (video_id,))
                return cursor.fetchone()

    def list_videos(self, page, limit):
        offset = (page - 1) * limit
        with self._connect() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    "SELECT * FROM videos ORDER BY created_at DESC LIMIT %s OFFSET %s",
                    (limit, offset),
                )
                rows = cursor.fetchall()
                cursor.execute("SELECT COUNT(*) AS total FROM videos")
                total = cursor.fetchone()["total"]
        return rows, total

    def update_video(self, video_id, **fields):
        allowed = {
            "status", "progress", "duration_seconds", "total_frames",
            "processed_frames", "frames_with_stone", "total_detected_instances",
            "average_coverage", "max_coverage", "error_message", "completed_at",
            "result_path", "thumbnail_path",
        }
        values = {key: value for key, value in fields.items() if key in allowed}
        if not values:
            return
        assignments = ", ".join(f"`{key}` = %s" for key in values)
        with self._connect() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    f"UPDATE videos SET {assignments} WHERE id = %s",
                    (*values.values(), video_id),
                )

    def delete_video(self, video_id):
        with self._connect() as connection:
            with connection.cursor() as cursor:
                cursor.execute("DELETE FROM videos WHERE id = %s", (video_id,))
