import { http } from '#/api/client';
import type { BackendVideoStatusResponse } from '#/types/api/video';

export const getVideoStatusService = {
  async getVideoStatus(id: string): Promise<BackendVideoStatusResponse> {
    return http.get<BackendVideoStatusResponse>(`/videos/${id}/status`);
  },
};
