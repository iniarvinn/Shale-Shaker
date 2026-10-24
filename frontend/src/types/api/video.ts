export type BackendVideo = {
  id: string;
  original_filename: string;
  original_path: string;
  result_path: string | null;
  thumbnail_path: string | null;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  duration_seconds: number | null;
  total_frames: number | null;
  processed_frames: number | null;
  frames_with_stone: number | null;
  total_detected_instances: number | null;
  average_coverage: number | null;
  max_coverage: number | null;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
  result_url: string;
  thumbnail_url: string;
};

export type BackendVideoListResponse = {
  items: BackendVideo[];
  page: number;
  limit: number;
  total: number;
};

export type BackendVideoStatusResponse = {
  id: string;
  status: BackendVideo['status'];
  progress: number;
  processed_frames: number | null;
  total_frames: number | null;
  error_message: string | null;
};

export type BackendUploadResponse = {
  id: string;
  filename: string;
  status: 'queued';
  message: string;
};

export type BackendDeleteResponse = {
  message: string;
  id: string;
};
