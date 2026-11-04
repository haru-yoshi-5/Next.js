import { CheckCircle2Icon } from "lucide-react"
import { cookies } from "next/headers"

import { OUTAGE_COOKIE, OUTAGE_MS } from "./demo-config"
import { RecoveredReporter } from "./recovered-reporter"

const timeFormatter = new Intl.DateTimeFormat("ja-JP", {
  timeZone: "Asia/Tokyo",
  timeStyle: "medium",
})

/**
 * cookie の値から、いまが障害中かどうかを判定する。リクエストのたびに現在時刻と比べる。
 * cookie はブラウザから送られる値なので信頼しない。整数でない値や、
 * Server Action が設定しうる範囲（現在から OUTAGE_MS 以内）を超える終了時刻は無視する。
 */
function isInOutage(rawValue: string | undefined) {
  if (!rawValue || !/^\d+$/.test(rawValue)) return false
  const outageUntil = Number(rawValue)
  if (!Number.isSafeInteger(outageUntil)) return false
  const remainingMs = outageUntil - Date.now()
  return remainingMs > 0 && remainingMs <= OUTAGE_MS
}

/**
 * 在庫レポートを描画する async Server Component。
 * 障害中（cookie の終了時刻より前）は、データ取得に失敗したものとして throw する。
 */
export async function InventoryReport() {
  const cookieStore = await cookies()
  if (isInOutage(cookieStore.get(OUTAGE_COOKIE)?.value)) {
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
