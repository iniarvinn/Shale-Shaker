import type { BackendVideo } from '#/types/api/video';
import type { VideoItem } from '#/types/video';

function formatSecondsToMMSS(sec: number | null | undefined): string {
  if (sec === null || sec === undefined || isNaN(sec)) {
    return '--:--';
  }
  const totalSeconds = Math.floor(sec);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function mapBackendVideoToItem(video: BackendVideo): VideoItem {
  const stoneCount = Number(video.total_detected_instances ?? 0);
  const label = formatSecondsToMMSS(video.duration_seconds);

  // Use result_url and thumbnail_url from backend as-is (relative paths work with proxy)
  const videoUrl = video.result_url || '';
  const thumbnailUrl = video.thumbnail_url || '/image-placeholder.png';

  return {
    id: video.id,
    title: video.original_filename || video.id,
    label,
    thumbnailUrl,
    videoUrl,
    stoneCount,
    createdAt: video.created_at,
  };
}

export { formatSecondsToMMSS };
