export type StonePoint = {
  second: number
  stones: number
}

export type VideoItem = {
  id: string
  title: string // contoh "Video 2026-11-13 14:32"
  label: string // contoh "01:24" atau "43.1"
  thumbnailUrl: string
  videoUrl: string
  stoneCount: number
  stoneSeries: StonePoint[] // batu per detik, kosong jika belum tersedia
  createdAt: string // ISO date
}