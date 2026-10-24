import { useQuery } from '@tanstack/react-query';
import { getVideoStatusService } from '#/services/videos';
import { videoKeys } from '#/hooks/queryKeys';

export function useVideoStatusQuery(id: string | null | undefined, enabled = true) {
  return useQuery({
    queryKey: videoKeys.status(id ?? ''),
    queryFn: () => getVideoStatusService.getVideoStatus(id!),
    enabled: !!id && enabled,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === 'completed' || status === 'failed') {
        return false;
      }
      return 1000;
    },
    refetchIntervalInBackground: false,
  });
}
