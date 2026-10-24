import { http } from '#/api/client';
import type { BackendDeleteResponse } from '#/types/api/video';

export const deleteVideoService = {
  async deleteVideo(id: string): Promise<BackendDeleteResponse> {
    return http.delete<BackendDeleteResponse>(`/videos/${id}`);
  },
};
