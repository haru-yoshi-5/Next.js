import { io } from "next/cache"

import { measure } from "@/lib/measure"

import { RefreshPanel } from "./refresh-panel"
import { getServerSnapshot } from "./snapshot-data"
import { buildSnapshotTrace } from "./trace"

/**
 * async な Server Component。
 * コンポーネントの中で直接 await してデータを取得し、その結果を描画する。
 */
export async function ServerSnapshot() {
  // ここから先はリクエストのたびに実行する（ビルド時のプリレンダーには含めない）
  await io()

  const requestId = crypto.randomUUID()
  const { result: snapshot, durationMs: fetchMs } =
    await measure(getServerSnapshot)

  const rows = [
    { label: "取得時刻（JST）", value: snapshot.fetchedAt },
    {
      label: "取得回数（このサーバープロセス）",
      value: `${snapshot.fetchCount} 回目`,
    },
    { label: "Node.js", value: snapshot.nodeVersion },
    { label: "プラットフォーム", value: snapshot.platform },
    { label: "サーバーのメモリ使用量", value: `${snapshot.memoryMb} MB` },
  ]

  return (
    // RefreshPanel は Client Component。
    // 下の <dl> はサーバーで描画済みの結果として children に渡され、クライアントでは再実行されない。
    <RefreshPanel trace={buildSnapshotTrace({ requestId, fetchMs })}>
      <dl className="grid gap-px overflow-hidden rounded-lg border bg-border text-sm">
        {rows.map((row) => (
          <div
            key={row.label}
            className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 bg-background px-3 py-2"
          >
            <dt className="text-muted-foreground">{row.label}</dt>
            <dd className="font-mono tabular-nums">{row.value}</dd>
          </div>
        ))}
      </dl>
    </RefreshPanel>
  )
}
