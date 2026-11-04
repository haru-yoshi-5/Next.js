import { CheckCircle2Icon } from "lucide-react"
import { io } from "next/cache"

import { type DemoPageKey, RENDER_DELAY_MS } from "./demo-pages"

const timeFormatter = new Intl.DateTimeFormat("ja-JP", {
  timeZone: "Asia/Tokyo",
  timeStyle: "medium",
})

/**
 * 描画に約1.5秒かかる async Server Component。
 * データベースや外部 API の待ち時間の代わりに、一定時間待ってから描画する。
 */
export async function SlowContent({ page }: { page: DemoPageKey }) {
  // ここから先はリクエストのたびに実行する（ビルド時のプリレンダーには含めない）
  await io()
  await new Promise((resolve) => setTimeout(resolve, RENDER_DELAY_MS))

  return (
    // data-nsc-demo-content は Live Demo が内容の表示を見つけるための目印
    <div
      data-nsc-demo-content={page}
      className="flex flex-col gap-1 rounded-md bg-muted/50 px-3 py-2 text-sm"
    >
      <p className="flex items-center gap-1.5 font-medium">
        <CheckCircle2Icon aria-hidden className="size-4 text-server" />
        サーバーでの描画が終わりました
      </p>
      <p className="text-xs text-muted-foreground">
        約{RENDER_DELAY_MS / 1000}秒待ってから描画しています（描画時刻{" "}
        <time className="font-mono">{timeFormatter.format(new Date())}</time>
        ）。
      </p>
    </div>
  )
}
