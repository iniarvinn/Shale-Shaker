import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteVideoService } from '#/services/videos';
import { videoKeys } from '#/hooks/queryKeys';

export function useDeleteVideoMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteVideoService.deleteVideo(id),
    // onSettled (bukan onSuccess): daftar tetap disegarkan walau request gagal/500,
    // karena baris di database bisa saja sudah terhapus lebih dulu.
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: videoKeys.lists() });
    },
  });
}
