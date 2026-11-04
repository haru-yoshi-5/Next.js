import { CheckCircle2Icon } from "lucide-react"
import { cookies } from "next/headers"

import { OUTAGE_COOKIE } from "./demo-config"
import { RecoveredReporter } from "./recovered-reporter"

const timeFormatter = new Intl.DateTimeFormat("ja-JP", {
  timeZone: "Asia/Tokyo",
  timeStyle: "medium",
})

/** 障害の終了時刻より前かどうか。リクエストのたびに現在時刻と比べる */
function isInOutage(outageUntil: number) {
  return Date.now() < outageUntil
}

/**
 * 在庫レポートを描画する async Server Component。
 * 障害中（cookie の終了時刻より前）は、データ取得に失敗したものとして throw する。
 */
export async function InventoryReport() {
  const cookieStore = await cookies()
  const outageUntil = Number(cookieStore.get(OUTAGE_COOKIE)?.value ?? 0)

  if (isInOutage(outageUntil)) {
    // わざと内部のホスト名を含めている。本番ではこの message はブラウザへ送られない
    throw new Error(
      "在庫 API（inventory.internal:8443）への接続がタイムアウトしました",
    )
  }

  return (
    <div className="flex flex-col gap-1 rounded-md bg-muted/50 px-3 py-2 text-sm">
      <p className="flex items-center gap-1.5 font-medium">
        <CheckCircle2Icon aria-hidden className="size-4 text-server" />
        在庫レポートを表示しました
      </p>
      <p className="text-xs text-muted-foreground">
        サーバーで描画した時刻{" "}
        <time className="font-mono">{timeFormatter.format(new Date())}</time>
      </p>
      {/* 描画に成功したことを Live Demo の記録に伝える */}
      <RecoveredReporter />
    </div>
  )
}
