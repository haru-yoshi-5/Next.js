import { CircleAlertIcon, RotateCcwIcon } from "lucide-react"

import { Button } from "@/components/ui/button"

/** AI の失敗の表示。onRetry を渡したときだけ「もう一度送信する」を出す */
export function AiErrorNotice({
  message,
  onRetry,
}: {
  message: string
  onRetry?: () => void
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3">
      <p className="flex gap-2 text-sm leading-relaxed text-destructive">
        <CircleAlertIcon aria-hidden className="mt-0.5 size-4 shrink-0" />
        {message}
      </p>
      {onRetry ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="self-start"
          onClick={onRetry}
        >
          <RotateCcwIcon aria-hidden />
          もう一度送信する
        </Button>
      ) : null}
    </div>
  )
}
