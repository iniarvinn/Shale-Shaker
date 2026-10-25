import { useState } from 'react'
import { Navbar } from './Navbar'
import { VideoUploadArea } from './VideoUploadArea'
import type { UploadState } from './VideoUploadArea'
import { StoneCountCard } from './StoneCountCard'
import { HistoryCard } from './HistoryCard'
import { DeleteConfirmDialog } from './DeleteConfirmDialog'
import { useVideoHistory } from '#/hooks/useVideoHistory'
import { useUploadVideo } from '#/hooks/useUploadVideo'
import { useDeleteVideoMutation } from '#/hooks/videos'
import type { VideoItem } from '#/types/video'
import type { UploadError } from '#/types/ui'
import { validateVideoFile } from '#/lib/validateVideoFile'

type PreviewState = 'idle' | 'uploading' | 'success' | 'error' | null

export function DashboardPage() {
  const [uploadError, setUploadError] = useState<UploadError>(null)
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const upload = useUploadVideo()
  const history = useVideoHistory()
  const deleteMutation = useDeleteVideoMutation()

  const urlParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')
  const preview = (urlParams.get('state') as PreviewState) || null
  const isDev = import.meta.env.DEV

  const liveStoneCount = upload.liveStoneCount

  let activeVideo: VideoItem | null = selectedVideo ?? upload.data ?? null
  if (upload.isPending && !selectedVideo) {
    activeVideo = {
      id: 'processing',
      title: 'Sedang diproses',
      label: '--:--',
      thumbnailUrl: '/image-placeholder.png',
      videoUrl: '',
      stoneCount: liveStoneCount,
      createdAt: new Date().toISOString(),
    }
  }
  let uiState: UploadState = upload.isPending
    ? 'uploading'
    : selectedVideo !== null
      ? 'success'
      : upload.isSuccess
        ? 'success'
        : uploadError || upload.isError
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
    } else {
      uiState = 'idle'
      activeVideo = null
    }
  }

  const stoneCount = uiState === 'success' || upload.isPending ? (activeVideo?.stoneCount ?? liveStoneCount) : 0

  const handleFile = (file: File) => {
    if (upload.isPending) return
    const validation = validateVideoFile(file)
    if (!validation.ok) {
      setUploadError(validation.error || { kind: 'validation', message: 'File tidak sesuai.' })
      return
    }
    setUploadError(null)
    setSelectedVideo(null)
    upload.mutate(file)
  }

  const handleSelectHistory = (video: VideoItem) => {
    if (upload.isPending) return
    setUploadError(null)
    setSelectedVideo(video)
  }

  const handleReset = () => {
    upload.reset()
    setSelectedVideo(null)
    setUploadError(null)
  }

  const handleDelete = (id: string) => {
    if (deleteMutation.isPending) return
    setDeleteId(id)
  }

  const handleConfirmDelete = () => {
    if (!deleteId || deleteMutation.isPending) return
    deleteMutation.mutate(deleteId, {
      onSuccess: () => {
        if (selectedVideo?.id === deleteId) {
          handleReset()
        }
        setDeleteId(null)
      },
      onError: () => {
        setDeleteId(null)
      },
    })
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
              error={
                uploadError ||
                (upload.isError
                  ? {
                      kind: 'processing',
                      message: upload.error.message || 'Proses deteksi gagal.',
                    }
                  : null)
              }
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
                onDelete={handleDelete}
                deleteDisabled={deleteMutation.isPending}
              />
            </div>
          </div>
        </div>
      </div>
      <DeleteConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => {
          if (!open && !deleteMutation.isPending) {
            setDeleteId(null)
          }
        }}
        onConfirm={handleConfirmDelete}
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}