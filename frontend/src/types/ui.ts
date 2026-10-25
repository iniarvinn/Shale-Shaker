export type UploadErrorKind = 'validation' | 'upload' | 'processing' | 'network' | 'unknown'

export type UploadError = {
  kind: UploadErrorKind
  message: string
  details?: string
} | null
