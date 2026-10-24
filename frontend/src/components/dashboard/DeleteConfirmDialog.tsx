import { Button } from '#/components/ui/button'
import { cn } from '#/lib/utils'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  isLoading?: boolean
  title?: string
  description?: string
}

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  isLoading = false,
  title = 'Hapus Video',
  description = 'Yakin mau hapus video ini beserta hasil deteksinya? Tindakan ini tidak bisa dibatalkan.',
}: Props) {
  if (!open) return null

  const handleClose = () => {
    if (isLoading) return
    onOpenChange(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px]" onClick={handleClose} />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'relative z-10 w-[90%] max-w-sm rounded-xl border border-neutral-200 bg-white shadow-lg',
        )}
      >
        <div className="px-5 pt-5 pb-4">
          <h2 className="text-base font-bold text-brand-text">{title}</h2>
          <p className="mt-1 text-sm text-neutral-600">{description}</p>
        </div>
        <div className="flex items-center justify-end gap-2 px-5 pb-5">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
            className="h-9 px-4 cursor-pointer"
          >
            Batal
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="h-9 px-4 bg-red-500 text-white hover:bg-red-600 cursor-pointer"
          >
            {isLoading ? 'Menghapus...' : 'Hapus'}
          </Button>
        </div>
      </div>
    </div>
  )
}
