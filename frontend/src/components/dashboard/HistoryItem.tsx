import { Play } from 'lucide-react'
import type { VideoItem } from '#/types/video'
import { cn } from '#/lib/utils'
import { useState } from 'react'

type Props = {
  video: VideoItem
  isActive: boolean
  onSelect: (video: VideoItem) => void
}

export function HistoryItem({ video, isActive, onSelect }: Props) {
  const [thumbSrc, setThumbSrc] = useState(video.thumbnailUrl || '/image-placeholder.png')

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    } catch {
      return ''
    }
  }

  return (
    <button
      type="button"
      onClick={() => onSelect(video)}
      className={cn(
        'w-full text-left flex items-center gap-3 py-[6px] px-1 transition-colors  cursor-pointer',
        isActive ? 'bg-sky-50' : 'hover:bg-sky-50',
      )}
    >
      <div className="relative h-[41px] w-[72px] flex-shrink-0">
        <img
          src={thumbSrc}
          alt={video.title}
          className="h-[41px] w-[72px] rounded object-cover"
          onError={() => setThumbSrc('/image-placeholder.png')}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-5 h-5 rounded-full bg-brand-navbar/90 flex items-center justify-center shadow-sm">
            <Play className="w-2.5 h-2.5 fill-white text-white" />
          </div>
        </div>
      </div>
      <div className="flex flex-col min-w-0">
        <span className={cn('text-[15px] truncate', isActive ? 'font-semibold text-brand-text' : 'text-neutral-800')}>
          {video.title}
        </span>
        <span className="text-[10px] text-neutral-500">{video.label}</span>
      </div>
      <span className="ml-auto self-start text-[10px] text-neutral-500 whitespace-nowrap">
        {formatDate(video.createdAt)}
      </span>
    </button>
  )
}
