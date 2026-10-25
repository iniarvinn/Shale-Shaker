import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { getVideoByIdService, getVideoStatusService, uploadVideoService } from '#/services/videos';
import { videoKeys } from '#/hooks/queryKeys';
import type { VideoItem } from '#/types/video';

function normalizeProcessingError(message?: string | null): string {
  if (!message) return 'Proses deteksi gagal.'
  const msg = message.toLowerCase()
  if (msg.includes('unable to open video') || msg.includes('failed to open')) {
    return 'Tidak dapat membaca file video. File mungkin rusak atau menggunakan codec yang tidak didukung. Coba gunakan file MP4 dengan codec H.264.'
  }
  if (msg.includes('video contains no readable frames')) {
    return 'Video tidak memiliki frame yang bisa dibaca. Coba gunakan file video yang valid.'
  }
  if (msg.includes('no trained model found')) {
    return 'Model deteksi belum tersedia. Hubungi admin.'
  }
  if (msg.includes('configured model does not exist')) {
    return 'Model deteksi tidak ditemukan. Hubungi admin.'
  }
  if (msg.includes('ultralytics') || msg.includes('torch') || msg.includes('opencv')) {
    return 'Terjadi kesalahan saat memproses video. Silakan coba lagi atau gunakan video lain.'
  }
  // Clean up Windows paths
  return message.replace(/[A-Z]:\\[^\s]+\\/gi, '').replace(/\\/g, '/').trim() || 'Proses deteksi gagal.'
}

export function useUploadVideoMutation() {
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState<number>(0);
  const [liveStoneCount, setLiveStoneCount] = useState<number>(0);
  const [liveProgress, setLiveProgress] = useState<number>(0);
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
      setLiveProgress(0);
      setLiveStoneCount(0);
      const uploadRes = await uploadVideoService.uploadVideo(file);
      const videoId = uploadRes.id;

      return new Promise<VideoItem>((resolve, reject) => {
        const poll = async () => {
          try {
            const [statusRes, videoDetail] = await Promise.all([
              getVideoStatusService.getVideoStatus(videoId),
              getVideoByIdService.getVideoById(videoId),
            ]);

            if (typeof statusRes.progress === 'number') {
              setProgress(Number(statusRes.progress));
              setLiveProgress(Number(statusRes.progress));
            }
            if (typeof videoDetail.stoneCount === 'number') {
              setLiveStoneCount(videoDetail.stoneCount);
            }

            if (statusRes.status === 'completed') {
              stopPolling();
              try {
                const finalItem = await getVideoByIdService.getVideoById(videoId);
                queryClient.invalidateQueries({ queryKey: videoKeys.lists() });
                resolve(finalItem);
              } catch (err) {
                reject(err);
              }
            } else if (statusRes.status === 'failed') {
              stopPolling();
              reject(new Error(normalizeProcessingError(statusRes.error_message)));
            }
          } catch (err) {
            stopPolling();
            reject(err);
          }
        };

        poll();
        intervalRef.current = setInterval(poll, 1000);
      });
    },
    onMutate: () => {
      setProgress(0);
      setLiveProgress(0);
      setLiveStoneCount(0);
      stopPolling();
    },
    onSettled: () => {
      stopPolling();
    },
  });

  const reset = () => {
    stopPolling();
    setProgress(0);
    setLiveProgress(0);
    setLiveStoneCount(0);
    mutation.reset();
  };

  return { ...mutation, progress: liveProgress || progress, liveStoneCount, reset };
}

// Backwards compatible export
export { useUploadVideoMutation as useUploadVideo };
