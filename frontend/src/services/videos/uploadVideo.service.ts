import { http } from '#/api/client';
import type { BackendUploadResponse } from '#/types/api/video';

export const uploadVideoService = {
  async uploadVideo(file: File): Promise<BackendUploadResponse> {
    const formData = new FormData();
    formData.append('video', file);
    return http.post<BackendUploadResponse>('/videos', formData);
  },
};
