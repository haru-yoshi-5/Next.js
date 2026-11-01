import { ArchiveIcon, RefreshCwIcon } from "lucide-react"
import { io } from "next/cache"

import { formatDuration } from "@/components/visualizer/process-edge"

import { CachePanel } from "./cache-panel"
import {
  getCachedReport,
  getFreshReport,
  readReport,
  type ReportRead,
} from "./report-data"
import { buildCacheTrace } from "./trace"

const timeFormatter = new Intl.DateTimeFormat("ja-JP", {
  timeZone: "Asia/Tokyo",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
})

/** キャッシュなし / ありの読み取りを同じリクエストの中で並べて比べる */
export async function CacheDemo() {
  // ここから先はリクエストのたびに実行する（ビルド時のプリレンダーには含めない）
  await io()

  const requestId = crypto.randomUUID()
  const [fresh, cached] = await Promise.all([
    readReport(getFreshReport),
    readReport(getCachedReport),
  ])

  return (
    <CachePanel trace={buildCacheTrace({ requestId, fresh, cached })}>
      <div className="grid gap-3 sm:grid-cols-2">
        <ReportCard title="キャッシュなし" read={fresh} />
        <ReportCard title='"use cache: remote"' read={cached} />
      </div>
    </CachePanel>
  )
}

function ReportCard({ title, read }: { title: string; read: ReportRead }) {
  const rows = [
    { label: "生成ID", value: read.report.id },
    {
      label: "生成時刻（JST）",
      value: timeFormatter.format(read.report.generatedAt),
    },
    { label: "読み取り時間", value: formatDuration(read.durationMs) },
  ]

  return (
    <section className="flex min-w-0 flex-col rounded-lg border">
      <h3 className="border-b px-3 py-2 font-mono text-sm font-medium">
        {title}
      </h3>
      <dl className="flex flex-col gap-2 px-3 py-3 text-sm">
        {rows.map((row) => (
          <div key={row.label} className="flex justify-between gap-3">
            <dt className="text-muted-foreground">{row.label}</dt>
            <dd className="font-mono tabular-nums">{row.value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-auto flex items-center gap-1.5 border-t px-3 py-2 text-xs font-medium">
        {read.generatedBeforeRead ? (
          <>
            <ArchiveIcon aria-hidden className="size-3.5 text-server" />
            読み取り前に生成された結果
          </>
        ) : (
          <>
            <RefreshCwIcon aria-hidden className="size-3.5" />
            読み取り中に生成された結果
          </>
        )}
      </p>
    </section>
  )
}
