import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import { ScrollArea } from '#/components/ui/scroll-area'
import { Separator } from '#/components/ui/separator'
import { Skeleton } from '#/components/ui/skeleton'
import type { VideoItem } from '#/types/video'
import { HistoryItem } from './HistoryItem'
import { cn } from '#/lib/utils'

type Props = {
  videos: VideoItem[]
  isLoading: boolean
  activeId?: string
  disabled: boolean
  onSelect: (video: VideoItem) => void
}

export function HistoryCard({ videos, isLoading, activeId, disabled, onSelect }: Props) {
  return (
    <Card className="rounded-xl border border-neutral-200 shadow-sm flex flex-col h-full">
      <CardHeader className=" px-4 flex-shrink-0">
        <CardTitle className="text-base font-bold text-brand-text">History</CardTitle>
      </CardHeader>
      <CardContent className="px-6 pb-4 flex-1 min-h-0">
        <ScrollArea className="h-full pr-2">
          <div className={cn(disabled && 'opacity-60 pointer-events-none', 'pr-1 py-1')}>
            {isLoading ? (
              <div className="flex flex-col">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 py-1.5">
                    <Skeleton className="h-[41px] w-[72px] rounded" />
                    <div className="flex-1">
                      <Skeleton className="h-3 w-24 mb-1" />
                      <Skeleton className="h-2 w-12" />
                    </div>
                    <Skeleton className="h-2 w-20" />
                  </div>
                ))}
              </div>
            ) : videos.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-sm text-neutral-500">
                Belum ada riwayat
              </div>
            ) : (
              <div className="flex flex-col">
                <Separator className="bg-[#BFDDF8]" />
                {videos.map((v) => (
                  <div key={v.id}>
                    <HistoryItem
                      video={v}
                      isActive={activeId === v.id}
                      onSelect={onSelect}
                    />
                    <Separator className="bg-[#BFDDF8]" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}