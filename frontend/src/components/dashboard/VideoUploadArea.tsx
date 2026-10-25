import { CloudUpload, Plus, RotateCw, X } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { cn } from '#/lib/utils'
import type { VideoItem } from '#/types/video'
import type { UploadError } from '#/types/ui'
import { useRef, useState } from 'react'
import { UploadProgressBar } from './UploadProgressBar'

export type UploadState = 'idle' | 'uploading' | 'success' | 'error'

type Props = {
  state: UploadState
  progress: number
  video: VideoItem | null
  onFile: (file: File) => void
  onReset: () => void
  error?: UploadError | null
}

export function VideoUploadArea({ state, progress, video, onFile, onReset, error }: Props) {
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDropzoneClick = () => {
    if (state === 'uploading') return
    inputRef.current?.click()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (state === 'uploading') return
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      inputRef.current?.click()
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (state === 'uploading') return
    const file = e.target.files?.[0]
    if (file) {
      onFile(file)
    }
    // reset input so same file can be selected again
    e.target.value = ''
  }

  const handleDragEnter = (e: React.DragEvent) => {
    if (state === 'uploading') return
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragOver = (e: React.DragEvent) => {
    if (state === 'uploading') return
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    if (state === 'uploading') return
    e.preventDefault()
    e.stopPropagation()
    const related = e.relatedTarget as Node | null
    if (related && e.currentTarget.contains(related)) return
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    if (state === 'uploading') return
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    onFile(file)
  }

  if (state === 'success' && video) {
    return (
      <div className="w-full flex flex-col">
        <video
          key={video.id}
          src={video.videoUrl}
          controls
          autoPlay
          muted
          playsInline
          className="w-full aspect-1280/720 bg-black object-contain"
        />
        <div className="mt-4 flex justify-end">
          <Button
            type="button"
            onClick={onReset}
            className="bg-brand-yellow text-neutral-800 hover:bg-[#E6C500] font-bold text-sm px-5 h-9 rounded-lg shadow-md gap-2 cursor-pointer py-2"
          >
            Tambah Video
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div
      role="button"
      tabIndex={state === 'uploading' ? -1 : 0}
      onClick={handleDropzoneClick}
      onKeyDown={handleKeyDown}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        'w-full aspect-1280/720 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center transition-colors',
        state === 'error' ? 'bg-danger-bg border-danger' : 'bg-drop-bg border-brand-navbar',
        isDragging && state !== 'uploading' && 'ring-2 ring-brand-navbar/60',
        state === 'uploading' && 'pointer-events-none',
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept="video/mp4,video/quicktime,video/x-msvideo,video/x-matroska,video/webm,.mp4,.mov,.avi,.mkv,.webm"
        hidden
        onChange={handleFileChange}
      />

      {state === 'error' ? (
        <>
          <X className="w-9 h-9 text-danger stroke-[3]" />
          <p className="mt-2 max-w-[80%] text-base font-semibold text-neutral-700 text-center px-4">{error?.message || 'Terjadi kesalahan'}</p>
          <p className="mt-1 text-sm text-neutral-500">MP4, MOV, AVI, MKV, WebM (maks. 500 MB)</p>
          <div className="mt-4 flex justify-center">
            <Button
              type="button"
              onClick={onReset}
              className="bg-brand-yellow text-neutral-800 hover:bg-[#E6C500] font-semibold text-sm px-6 h-9 rounded-lg shadow-md gap-2 cursor-pointer"
            >
              Coba Lagi
              <RotateCw className="w-4 h-4" />
            </Button>
          </div>
        </>
      ) : state === 'uploading' ? (
        <div className="w-1/2 max-w-[480px] flex flex-col">
          <div className="text-right text-sm font-medium text-[#4A4A4A] mb-1.5">
            {progress.toFixed(1)}%
          </div>
          <UploadProgressBar value={progress} />
          <div className="mt-4 text-center text-base font-medium text-[#4A4A4A]">
            Mengunggah video
            <span className="dot-blink">.</span>
            <span className="dot-blink">.</span>
            <span className="dot-blink">.</span>
          </div>
        </div>
      ) : (
        <>
          <CloudUpload className="w-10 h-10 text-brand-navbar" />
          <p className="mt-2 text-base font-semibold text-neutral-600">
            Drag & drop video disini, atau{' '}
            <span className="text-brand-navbar font-bold underline cursor-pointer">pilih file</span>
          </p>
          <p className="mt-1 text-sm text-neutral-500">MP4, MOV, AVI, MKV, WebM (maks. 500 MB)</p>
        </>
      )}
    </div>
  )
}