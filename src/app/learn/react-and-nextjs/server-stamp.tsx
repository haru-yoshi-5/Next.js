import { LoaderIcon, ServerIcon } from "lucide-react"
import { io } from "next/cache"

const timeFormatter = new Intl.DateTimeFormat("ja-JP", {
  timeZone: "Asia/Tokyo",
  timeStyle: "medium",
})

/**
 * io() より後はプリレンダーされず、リクエストを処理するときに実行される。
 * router.refresh() でサーバーの表示を更新すると、新しい値に変わる。
 * ブラウザ側は data-nsc-server-id から値を読み、更新されたかを確かめる。
 */
export async function ServerStamp() {
  await io()

  const serverId = crypto.randomUUID().slice(0, 8)

  return (
    <div
      data-nsc-server-id={serverId}
      className="flex flex-col gap-1.5 rounded-lg border px-3 py-2"
    >
      <p className="flex items-center gap-1.5 text-xs font-medium">
        <ServerIcon aria-hidden className="size-3.5 text-server" />
        Server Component が描画した部分
      </p>
      <dl className="flex flex-col gap-1 text-sm">
        <div className="flex flex-wrap justify-between gap-x-3">
          <dt className="text-muted-foreground">サーバー生成ID</dt>
          <dd className="font-mono tabular-nums">{serverId}</dd>
        </div>
        <div className="flex flex-wrap justify-between gap-x-3">
          <dt className="text-muted-foreground">生成時刻（JST）</dt>
          <dd className="font-mono tabular-nums">
            {timeFormatter.format(new Date())}
          </dd>
        </div>
      </dl>
    </div>
  )
}

/** Suspense の fallback。こちらは静的シェルに含まれる */
export function ServerStampFallback() {
  return (
    <p
      role="status"
      className="flex items-center gap-1.5 rounded-lg border px-3 py-3 text-sm text-muted-foreground"
    >
      <LoaderIcon aria-hidden className="size-3.5 motion-safe:animate-spin" />
      サーバーの部分を生成しています…
    </p>
  )
}
