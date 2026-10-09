import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { uploadVideo } from '#/services/video'

export function useUploadVideo() {
  const queryClient = useQueryClient()
  const [progress, setProgress] = useState<number>(0)
  const mutation = useMutation({
    mutationFn: (file: File) => uploadVideo(file, setProgress),
    onMutate: () => setProgress(0),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videos', 'history'] })
    },
  })
  return { ...mutation, progress }
}