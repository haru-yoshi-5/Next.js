import { ServerIcon } from "lucide-react"
import { io } from "next/cache"

import { readBoundaryRecord, SERVER_CODE_MARKER } from "./boundary-data"
import { BoundaryPanel } from "./boundary-panel"

const timeFormatter = new Intl.DateTimeFormat("ja-JP", {
  timeZone: "Asia/Tokyo",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
})

/** BoundaryPanel の children として渡す。Client Component はこのコードを import しない */
function ServerOutput({
  renderId,
  renderedAt,
  noteLength,
}: {
  renderId: string
  renderedAt: Date
  noteLength: number
}) {
  const rows = [
    { label: "生成ID", value: renderId },
    { label: "実行時刻（JST）", value: timeFormatter.format(renderedAt) },
    { label: "内部メモ", value: `${noteLength}文字（本文は渡さない）` },
    { label: "サーバー専用の目印", value: SERVER_CODE_MARKER },
  ]

  return (
    <section className="rounded-lg border">
      <h4 className="flex items-center gap-1.5 border-b px-3 py-2 text-sm font-medium">
        <ServerIcon aria-hidden className="size-3.5 text-server" />
        Server Component の出力
      </h4>
      <dl className="flex flex-col gap-2 px-3 py-3 text-sm">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex flex-wrap justify-between gap-x-3"
          >
            <dt className="text-muted-foreground">{row.label}</dt>
            <dd className="font-mono break-all tabular-nums">{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

/** サーバーでデータを読み、渡す値だけを選んで Client Component へ渡す */
export async function BoundaryDemo() {
  // ここから先はリクエストのたびに実行する（ビルド時のプリレンダーには含めない）
  await io()

  const record = await readBoundaryRecord()

  return (
    <BoundaryPanel
      renderId={record.renderId}
      publicToken={record.publicToken}
      createdAt={record.createdAt}
      tags={record.tags}
      scores={record.scores}
    >
      <ServerOutput
        renderId={record.renderId}
        renderedAt={record.createdAt}
        noteLength={record.internalNote.length}
      />
    </BoundaryPanel>
  )
}
