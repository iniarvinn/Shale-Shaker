import { http } from '#/api/client';
import { mapBackendVideoToItem } from '#/mappers/video.mapper';
import type { BackendVideo } from '#/types/api/video';
import type { VideoItem } from '#/types/video';

export const getVideoByIdService = {
  async getVideoById(id: string): Promise<VideoItem> {
    const response = await http.get<BackendVideo>(`/videos/${id}`);
    return mapBackendVideoToItem(response);
  },
};
