import { cn } from "@/lib/utils"

import type { RouteCall } from "./call-route"

/** Route Handler から届いたレスポンスを、ステータス・ヘッダー・本文に分けて表示する */
export function ResponseView({ call }: { call: RouteCall }) {
  const isError = call.status >= 400

  return (
    <section
      aria-label="レスポンス"
      className="flex min-w-0 flex-col rounded-lg border"
    >
      <header className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b px-3 py-2">
        <p className="font-mono text-xs break-all text-muted-foreground">
          {call.method} {call.path}
        </p>
        <p
          className={cn(
            "font-mono text-sm font-medium tabular-nums",
            isError ? "text-destructive" : "text-server",
          )}
        >
          {call.status} {call.statusText}
        </p>
      </header>
      <dl className="flex flex-col gap-1 border-b px-3 py-2 font-mono text-xs">
        {call.headers.map((header) => (
          <div key={header.name} className="flex flex-wrap gap-x-2">
            <dt className="text-muted-foreground">{header.name}:</dt>
            <dd className="break-all">{header.value}</dd>
          </div>
        ))}
        <div className="flex flex-wrap gap-x-2">
          <dt className="text-muted-foreground">往復（ブラウザで計測）:</dt>
          <dd className="tabular-nums">{Math.round(call.roundTripMs)} ms</dd>
        </div>
      </dl>
      {/* 長い本文はこの枠の中だけでスクロールする */}
      <pre
        tabIndex={0}
        aria-label="レスポンスの本文"
        className="max-h-64 overflow-auto px-3 py-2 font-mono text-xs leading-relaxed outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <code>{call.body}</code>
      </pre>
    </section>
  )
}
