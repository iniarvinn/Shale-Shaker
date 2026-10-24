import { http } from '#/api/client';
import { mapBackendVideoToItem } from '#/mappers/video.mapper';
import type { BackendVideoListResponse } from '#/types/api/video';
import type { VideoItem } from '#/types/video';

export const listVideosService = {
  async getVideos(params?: { page?: number; limit?: number }): Promise<VideoItem[]> {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 100;
    const query = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    const response = await http.get<BackendVideoListResponse>(`/videos?${query.toString()}`);
    return response.items.map((item) => mapBackendVideoToItem(item));
  },
};
