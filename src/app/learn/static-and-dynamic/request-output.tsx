import { LoaderIcon, ServerIcon } from "lucide-react"
import { io } from "next/cache"

import { StampCard } from "./stamp-card"

const timeFormatter = new Intl.DateTimeFormat("ja-JP", {
  timeZone: "Asia/Tokyo",
  timeStyle: "medium",
})

/** 届く順番の違いが見えるように、データ取得の代わりとして待つ時間 */
const WORK_MS = 800

/** io() より後はプリレンダーされず、リクエストのたびに実行される */
export async function RequestOutput() {
  await io()
  await new Promise((resolve) => setTimeout(resolve, WORK_MS))

  const requestId = crypto.randomUUID().slice(0, 8)

  return (
    <div data-nsc-request-id={requestId} className="flex min-w-0">
      <StampCard
        title="リクエスト時の部分"
        icon={<ServerIcon aria-hidden className="size-3.5 text-server" />}
        rows={[
          { label: "リクエストID", value: requestId },
          {
            label: "生成時刻（JST）",
            value: timeFormatter.format(new Date()),
          },
        ]}
      />
    </div>
  )
}

/** Suspense の fallback。こちらは静的シェルに含まれる */
export function RequestOutputFallback() {
  return (
    <p
      role="status"
      className="flex items-center gap-1.5 rounded-lg border px-3 py-3 text-sm text-muted-foreground"
    >
      <LoaderIcon aria-hidden className="size-3.5 motion-safe:animate-spin" />
      リクエスト時の部分を生成しています…
    </p>
  )
}
