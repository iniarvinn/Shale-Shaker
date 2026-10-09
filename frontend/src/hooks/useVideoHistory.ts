import { useQuery } from '@tanstack/react-query'
import { getVideoHistory } from '#/services/video'

export function useVideoHistory() {
  return useQuery({
    queryKey: ['videos', 'history'],
    queryFn: getVideoHistory,
  })
}