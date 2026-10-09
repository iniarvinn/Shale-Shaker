export function validateVideoFile(file: File): boolean {
  const validMimes = ['video/mp4', 'video/quicktime']
  const name = file.name.toLowerCase()
  const isExtOk = name.endsWith('.mp4') || name.endsWith('.mov')
  const isMimeOk = validMimes.includes(file.type)
  const maxSize = 5 * 1024 * 1024 // 5MB
  if (!isExtOk && !isMimeOk) return false
  if (file.size > maxSize) return false
  return true
}