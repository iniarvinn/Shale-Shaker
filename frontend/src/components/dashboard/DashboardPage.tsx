import { useState } from 'react'
import { Navbar } from './Navbar'
import { VideoUploadArea, type UploadState } from './VideoUploadArea'
import { StoneCountCard } from './StoneCountCard'
import { HistoryCard } from './HistoryCard'
import { useVideoHistory } from '#/hooks/useVideoHistory'
import { useUploadVideo } from '#/hooks/useUploadVideo'
import type { VideoItem } from '#/types/video'
import { validateVideoFile } from '#/lib/validateVideoFile'

type PreviewState = 'idle' | 'uploading' | 'success' | 'error' | null

export function DashboardPage() {
  const [validationError, setValidationError] = useState(false)
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null)
  const upload = useUploadVideo()
  const history = useVideoHistory()

  const urlParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')
  const preview = (urlParams.get('state') as PreviewState) || null
  const isDev = import.meta.env.DEV

  let activeVideo: VideoItem | null = selectedVideo ?? upload.data ?? null
  let uiState: UploadState = upload.isPending
    ? 'uploading'
    : selectedVideo !== null
      ? 'success'
      : upload.isSuccess
        ? 'success'
        : validationError || upload.isError
          ? 'error'
          : 'idle'

  // DEV preview overrides
  if (isDev && preview) {
    if (preview === 'uploading') {
      uiState = 'uploading'
      activeVideo = null
    } else if (preview === 'success') {
      uiState = 'success'
      activeVideo = {
        id: 'preview-success',
        title: 'Video 1',
        label: '43.1',
        thumbnailUrl: '/image-placeholder.png',
        videoUrl: '/pmld.mp4',
        stoneCount: 1532,
        createdAt: new Date('2026-11-13T00:00:00.000Z').toISOString(),
      }
    } else if (preview === 'error') {
      uiState = 'error'
      activeVideo = null
    } else if (preview === 'idle') {
      uiState = 'idle'
      activeVideo = null
    }
  }

  const stoneCount = uiState === 'success' ? (activeVideo?.stoneCount ?? 0) : 0

  const handleFile = (file: File) => {
    if (upload.isPending) return
    if (!validateVideoFile(file)) {
      setValidationError(true)
      return
    }
    setValidationError(false)
    setSelectedVideo(null)
    upload.mutate(file)
  }

  const handleSelectHistory = (video: VideoItem) => {
    if (upload.isPending) return
    setValidationError(false)
    setSelectedVideo(video)
  }

  const handleReset = () => {
    upload.reset()
    setSelectedVideo(null)
    setValidationError(false)
  }

  const previewProgress = 39.8

  return (
    <div className="h-screen max-h-screen flex flex-col overflow-hidden">
      <Navbar />
      <div className="px-4 md:px-8 pt-6 pb-6 flex-1 min-h-0 overflow-hidden">
        <h1 className="text-2xl font-bold text-brand-text pb-6">Dashboard</h1>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-full">
          <div className="lg:col-span-8 min-h-0">
            <VideoUploadArea
              state={uiState}
              progress={isDev && preview === 'uploading' ? previewProgress : upload.progress}
              video={activeVideo}
              onFile={handleFile}
              onReset={handleReset}
            />
          </div>
          <div className="lg:col-span-4 flex flex-col gap-4 min-h-0">
            <StoneCountCard count={stoneCount} />
            <div className="flex-1 min-h-0">
              <HistoryCard
                videos={history.data ?? []}
                isLoading={history.isLoading}
                activeId={selectedVideo?.id}
                disabled={upload.isPending}
                onSelect={handleSelectHistory}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}