import { useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '#/components/ui/chart'
import type { ChartConfig } from '#/components/ui/chart'
import { formatSecondsToMMSS } from '#/mappers/video.mapper'
import type { StonePoint } from '#/types/video'

type Props = {
  series: StonePoint[]
  isLive?: boolean
  /** Elemen video yang diputar. Jika ada, garis vertikal mengikuti posisi putarnya. */
  videoRef?: RefObject<HTMLVideoElement | null>
}

// Geometri area plot (harus sama dengan margin LineChart dan lebar YAxis di bawah)
const MARGIN = { top: 8, right: 8, bottom: 0, left: -20 }
const Y_AXIS_WIDTH = 44
const X_AXIS_HEIGHT = 30
const PLOT_LEFT = MARGIN.left + Y_AXIS_WIDTH

const chartConfig = {
  stones: {
    label: 'Batu/detik',
    color: 'var(--brand-text)',
  },
} satisfies ChartConfig

export function StoneChartCard({ series, isLive = false, videoRef }: Props) {
  const hasData = series.length > 0
  const lastPoint = hasData ? series[series.length - 1] : null
  const maxSecond = lastPoint?.second ?? 0
  const following = hasData && videoRef !== undefined
  const lineRef = useRef<HTMLDivElement>(null)
  const [playSecond, setPlaySecond] = useState(0)

  // Garis digerakkan langsung lewat style tiap frame (tanpa render ulang React) agar mulus.
  // State hanya berubah sekali per detik, untuk angka besar.
  useEffect(() => {
    if (!following) return
    let raf = 0
    let lastSecond = -1
    const tick = () => {
      const video = videoRef.current
      const line = lineRef.current
      if (line) {
        if (video) {
          const t = Math.min(Math.max(video.currentTime, 0), maxSecond)
          line.style.left = `${maxSecond > 0 ? (t / maxSecond) * 100 : 0}%`
          line.style.visibility = 'visible'
          const second = Math.floor(t)
          if (second !== lastSecond) {
            lastSecond = second
            setPlaySecond(second)
          }
        } else {
          line.style.visibility = 'hidden'
        }
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [following, videoRef, maxSecond])

  // Saat video diputar, angka besar mengikuti detik yang sedang diputar
  const shown = following ? (series.find((p) => p.second === playSecond) ?? lastPoint) : lastPoint
  const peak = hasData ? Math.max(...series.map((p) => p.stones)) : 0

  return (
    <Card className="rounded-xl border border-neutral-200 shadow-sm pt-4">
      <CardHeader className="pb-0 px-4">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base font-bold text-brand-text">Jumlah Batu</CardTitle>
          {/* {isLive && (
            <span className="flex items-center gap-1 text-xs text-brand-text">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
              </span>
              Live
            </span>
          )} */}
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-2">
        {hasData ? (
          <>
            <div className="flex items-end justify-between pb-1">
              <div>
                <span className="text-3xl font-bold text-brand-text">{Math.round(shown?.stones ?? 0)}</span>
                <span className="ml-1 text-xs text-brand-text">
                  batu/dtk{following ? ` · ${formatSecondsToMMSS(playSecond)}` : ''}
                </span>
              </div>
              {/* <div className="text-right text-xs text-brand-text">
                Puncak <span className="font-semibold">{Math.round(peak)}</span>
              </div> */}
            </div>
            <div className="relative">
            <ChartContainer config={chartConfig} className="aspect-auto h-32 w-full">
              <LineChart data={series} margin={MARGIN}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="second"
                  type="number"
                  domain={[0, 'dataMax']}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={6}
                  minTickGap={24}
                  height={X_AXIS_HEIGHT}
                  tickFormatter={(v: number) => formatSecondsToMMSS(v)}
                />
                <YAxis tickLine={false} axisLine={false} tickMargin={4} allowDecimals={false} width={Y_AXIS_WIDTH} />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      labelFormatter={(_, payload) => formatSecondsToMMSS(payload[0]?.payload.second)}
                    />
                  }
                />
                <Line
                  dataKey="stones"
                  type="monotone"
                  stroke="var(--color-brand-yellow)"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ChartContainer>
            {following && (
              <div
                className="pointer-events-none absolute"
                style={{ left: PLOT_LEFT, right: MARGIN.right, top: MARGIN.top, bottom: X_AXIS_HEIGHT }}
              >
                <div
                  ref={lineRef}
                  className="absolute inset-y-0 w-px -translate-x-1/2 bg-brand-text"
                  style={{ left: 0, visibility: 'hidden' }}
                />
              </div>
            )}
            </div>
          </>
        ) : (
          <div className="flex h-32 items-center justify-center text-xs text-neutral-500">Belum ada data</div>
        )}
      </CardContent>
    </Card>
  )
}
