import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'

type Props = {
  count: number
}

export function StoneCountCard({ count }: Props) {
  return (
    <Card className="rounded-xl border border-neutral-200 shadow-sm pt-2">
      <CardHeader className="pb-0 px-4">
        <CardTitle className="text-base font-bold text-brand-text">Jumlah Batu</CardTitle>
      </CardHeader>
      <CardContent className="flex items-end justify-end px-4 pb-2">
        <span className="text-4xl md:text-5xl font-bold text-brand-text">{count}</span>
        <span className="ml-1 text-xs text-brand-text">batu</span>
      </CardContent>
    </Card>
  )
}