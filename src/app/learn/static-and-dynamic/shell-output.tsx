import { ArchiveIcon } from "lucide-react"
import { cacheLife } from "next/cache"

import { StampCard } from "./stamp-card"

const dateFormatter = new Intl.DateTimeFormat("ja-JP", {
  timeZone: "Asia/Tokyo",
  dateStyle: "short",
  timeStyle: "medium",
})

/**
 * "use cache" の結果は寿命が十分に長いので、静的シェルに含まれる。
 * そのためビルド時に作った ID と時刻が、どのリクエストにもそのまま届く。
 */
export async function ShellOutput() {
  "use cache"
  cacheLife("max")

  const shellId = crypto.randomUUID().slice(0, 8)

  return (
    <div data-nsc-shell-id={shellId} className="flex min-w-0">
      <StampCard
        title="静的シェル"
        icon={<ArchiveIcon aria-hidden className="size-3.5 text-server" />}
        rows={[
          { label: "シェルID", value: shellId },
          {
            label: "生成時刻（JST）",
            value: dateFormatter.format(new Date()),
          },
        ]}
      />
    </div>
  )
}
