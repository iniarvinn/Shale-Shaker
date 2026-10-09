import type { VideoItem } from '#/types/video'

// const API_URL = import.meta.env.VITE_API_URL // TODO: use when backend ready

function formatIdDate(d: Date) {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hour = String(d.getHours()).padStart(2, '0')
  const minute = String(d.getMinutes()).padStart(2, '0')
  const second = String(d.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`
}

function formatDurationSec(sec: number) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export async function uploadVideo(
  file: File,
  onProgress: (percent: number) => void,
): Promise<VideoItem> {
  // TODO: ganti dengan XMLHttpRequest ke endpoint asli
  return new Promise((resolve) => {
    let progress = 0
    const step = 5 + Math.floor(Math.random() * 6) // 5-10%
    const interval = setInterval(() => {
      progress += step
      if (progress > 100) progress = 100
      onProgress(parseFloat(progress.toFixed(1)))
      if (progress >= 100) {
        clearInterval(interval)
        const now = new Date(Date.now() - Math.floor(Math.random() * 300000)) // -5 menit acak
        const item: VideoItem = {
          id: crypto.randomUUID(),
          title: `Video ${formatIdDate(now)}`,
          label: formatDurationSec(30 + Math.floor(Math.random() * 90)), // 00:30 - 02:00
          thumbnailUrl: '/image-placeholder.png',
          videoUrl: URL.createObjectURL(file),
          stoneCount: 120 + Math.floor(Math.random() * 2400), // bervariasi
          createdAt: now.toISOString(),
        }
        resolve(item)
      }
    }, 150)
  })
}

export async function getVideoHistory(): Promise<VideoItem[]> {
  const now = new Date()
  const year = now.getFullYear()
  const items: VideoItem[] = Array.from({ length: 12 }, (_, i) => {
    // rentang 30-90 hari ke belakang
    const daysBack = 30 + Math.floor(Math.random() * 61) + i * Math.floor(Math.random() * 2)
    const h = Math.floor(Math.random() * 24)
    const m = Math.floor(Math.random() * 60)
    const s = Math.floor(Math.random() * 60)
    let d = new Date(year, now.getMonth(), now.getDate() - daysBack, h, m, s)
    // jika lebih lama dari tahun ini, pakai tahun sebelumnya
    if (d.getTime() > now.getTime()) {
      d.setFullYear(year - 1)
    }
    const n = i + 1
    return {
      id: String(n),
      title: `Video ${formatIdDate(d)}`,
      label: formatDurationSec(20 + (n * 7 + i * 13) % 150),
      thumbnailUrl: '/image-placeholder.png',
      videoUrl: '/pmld.mp4',
      stoneCount: 150 + ((i * 137 + n * 89) % 2500),
      createdAt: d.toISOString(),
    }
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  return items
}