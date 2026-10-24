import { useQuery } from '@tanstack/react-query';
import { listVideosService } from '#/services/videos';
import { videoKeys } from '#/hooks/queryKeys';

export function useVideosQuery(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: videoKeys.list(params),
    queryFn: () => listVideosService.getVideos(params),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });
}

// Backwards compatible export
export { useVideosQuery as useVideoHistory };
