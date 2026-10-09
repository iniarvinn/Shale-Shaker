import * as ProgressPrimitive from "@radix-ui/react-progress"


type UploadProgressBarProps = {
  value: number
}

export function UploadProgressBar({ value }: UploadProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value))
  return (
    <ProgressPrimitive.Root
      value={clamped}
      className="relative h-2.5 w-full overflow-hidden rounded-full bg-[#FFFFFF]"
    >
      <ProgressPrimitive.Indicator
        className="h-full w-full flex-1 bg-[#3A97F1] transition-all duration-150"
        style={{ transform: `translateX(-${100 - clamped}%)` }}
      />
    </ProgressPrimitive.Root>
  )
}