import type { UploadError } from '#/types/ui'

export function validateVideoFile(file: File): { ok: boolean; error?: UploadError } {
  const name = file.name.toLowerCase()
  const allowedExts = ['.mp4', '.mov', '.avi', '.mkv', '.webm']
  const maxSize = 500 * 1024 * 1024 // 500 MB

  const isExtOk = allowedExts.some((ext) => name.endsWith(ext))
  if (isExtOk) {
    if (file.size > maxSize) {
      return {
        ok: false,
        error: {
          kind: 'validation',
          message: 'Ukuran file melebihi batas 500 MB.',
        },
      }
    }
    return { ok: true }
  }

  const validMimes = [
    'video/mp4',
    'video/quicktime',
    'video/x-msvideo',
    'video/webm',
    'video/x-matroska',
  ]
  const isMimeOk = validMimes.includes(file.type)
  if (isMimeOk) {
    if (file.size > maxSize) {
      return {
        ok: false,
        error: {
          kind: 'validation',
          message: 'Ukuran file melebihi batas 500 MB.',
        },
      }
    }
    return { ok: true }
  }

  return {
    ok: false,
    error: {
      kind: 'validation',
      message: 'Format file tidak didukung. Gunakan MP4, MOV, AVI, MKV, atau WebM.',
    },
  }
}