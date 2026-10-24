import { Play, Trash2 } from 'lucide-react'
import type { VideoItem } from '#/types/video'
import { cn } from '#/lib/utils'
import { useState } from 'react'

type Props = {
  video: VideoItem
  isActive: boolean
  onSelect: (video: VideoItem) => void
  onDelete?: (id: string) => void
  deleteDisabled?: boolean
}

export function HistoryItem({ video, isActive, onSelect, onDelete, deleteDisabled }: Props) {
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

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (deleteDisabled) return
    onDelete?.(video.id)
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(video)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect(video)
        }
      }}
      className={cn(
        'w-full text-left flex items-center gap-3 py-[6px] px-1 transition-colors cursor-pointer group',
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
      <div className="flex flex-col min-w-0 flex-1">
        <span className={cn('text-[15px] truncate', isActive ? 'font-semibold text-brand-text' : 'text-neutral-800')}>
          {video.title}
        </span>
        <span className="text-[10px] text-neutral-500">{video.label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-neutral-500 whitespace-nowrap">
          {formatDate(video.createdAt)}
        </span>
        {onDelete && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleteDisabled}
            aria-label="Hapus video"
            className={cn(
              'p-1 rounded hover:bg-red-50 transition-colors',
              deleteDisabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer',
            )}
          >
            <Trash2 className="w-3.5 h-3.5 text-red-500" />
          </button>
        )}
      </div>
    </div>
  )
}
