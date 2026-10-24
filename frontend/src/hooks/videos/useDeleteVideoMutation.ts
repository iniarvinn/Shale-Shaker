import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteVideoService } from '#/services/videos';
import { videoKeys } from '#/hooks/queryKeys';

export function useDeleteVideoMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteVideoService.deleteVideo(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: videoKeys.lists() });
    },
  });
}
