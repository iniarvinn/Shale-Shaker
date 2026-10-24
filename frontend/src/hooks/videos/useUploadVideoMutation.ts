import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { getVideoByIdService, getVideoStatusService, uploadVideoService } from '#/services/videos';
import { videoKeys } from '#/hooks/queryKeys';
import type { VideoItem } from '#/types/video';

export function useUploadVideoMutation() {
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, []);

  const mutation = useMutation({
    mutationFn: async (file: File): Promise<VideoItem> => {
      setProgress(0);
      const uploadRes = await uploadVideoService.uploadVideo(file);
      const videoId = uploadRes.id;

      // Poll status until completed or failed
      return new Promise<VideoItem>((resolve, reject) => {
        const poll = async () => {
          try {
            const statusRes = await getVideoStatusService.getVideoStatus(videoId);
            if (typeof statusRes.progress === 'number') {
              setProgress(Number(statusRes.progress));
            }

            if (statusRes.status === 'completed') {
              stopPolling();
              try {
                const videoItem = await getVideoByIdService.getVideoById(videoId);
                queryClient.invalidateQueries({ queryKey: videoKeys.lists() });
                resolve(videoItem);
              } catch (err) {
                reject(err);
              }
            } else if (statusRes.status === 'failed') {
              stopPolling();
              reject(new Error(statusRes.error_message || 'Video processing failed'));
            }
            // If queued/processing, continue polling
          } catch (err) {
            stopPolling();
            reject(err);
          }
        };

        // Start polling immediately
        poll();
        intervalRef.current = setInterval(poll, 1000);
      });
    },
    onMutate: () => {
      setProgress(0);
      stopPolling();
    },
    onSettled: () => {
      stopPolling();
    },
  });

  const reset = () => {
    stopPolling();
    setProgress(0);
    mutation.reset();
  };

  return { ...mutation, progress, reset };
}

// Backwards compatible export
export { useUploadVideoMutation as useUploadVideo };
