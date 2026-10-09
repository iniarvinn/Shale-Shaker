import { CloudUpload, RotateCw, X } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { cn } from '#/lib/utils'
import type { VideoItem } from '#/types/video'
import { useRef, useState } from 'react'
import { UploadProgressBar } from './UploadProgressBar'

export type UploadState = 'idle' | 'uploading' | 'success' | 'error'

type Props = {
  state: UploadState
  progress: number
  video: VideoItem | null
  onFile: (file: File) => void
  onReset: () => void
}

export function VideoUploadArea({ state, progress, video, onFile, onReset }: Props) {
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
    const file = e.dataTransfer.files?.[0]
    if (file) {
      onFile(file)
    }
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
            className="bg-brand-yellow text-neutral-800 hover:bg-[#E6C500] font-semibold text-sm px-6 h-9 rounded-lg shadow-md gap-2 cursor-pointer"
          >
            Upload Ulang
            <RotateCw className="w-4 h-4" />
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
        accept="video/mp4,video/quicktime,.mp4,.mov"
        hidden
        onChange={handleFileChange}
      />

      {state === 'error' ? (
        <>
          <X className="w-9 h-9 text-danger stroke-[3]" />
          <p className="mt-2 text-base font-semibold text-neutral-700">File tidak sesuai</p>
          <p className="mt-1 text-sm text-neutral-500">MP4, MOV (maks. 5 MB)</p>
        </>
      ) : state === 'uploading' ? (
        <div className="w-1/2 max-w-[480px] flex flex-col">
          <div className="text-right text-sm font-medium text-[#4A4A4A] mb-1.5">
            {progress.toFixed(1)}%
          </div>
          <UploadProgressBar value={progress} />
          <div className="mt-4 text-center text-base font-medium text-[#4A4A4A]">
            Mengunggah video...
          </div>
        </div>
      ) : (
        <>
          <CloudUpload className="w-10 h-10 text-brand-navbar" />
          <p className="mt-2 text-base font-semibold text-neutral-600">
            Drag & drop video disini, atau{' '}
            <span className="text-brand-navbar font-bold underline">pilih file</span>
          </p>
          <p className="mt-1 text-sm text-neutral-500">MP4, MOV (maks. 5 MB)</p>
        </>
      )}
    </div>
  )
}