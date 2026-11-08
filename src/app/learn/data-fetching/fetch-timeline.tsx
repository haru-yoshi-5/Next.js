import type { FetchRun } from "./fetch-strategies"

interface FetchTimelineProps {
  title: string
  description: string
  run: FetchRun
  /** 2つのタイムラインで長さを比べられるように共通にする目盛りの最大値（ms） */
  scaleMs: number
}

const formatMs = (ms: number) => `${Math.round(ms).toLocaleString("ja-JP")} ms`

/** 実測した開始時間と所要時間をタイムラインとして表示する */
export function FetchTimeline({
  title,
  description,
  run,
  scaleMs,
}: FetchTimelineProps) {
  return (
    <section className="flex min-w-0 flex-col gap-3 rounded-lg border p-3">
      <header className="flex flex-wrap items-baseline justify-between gap-x-3">
        <h3 className="text-sm font-medium">{title}</h3>
        <p className="font-mono text-sm tabular-nums">
          <span className="sr-only">合計 </span>
          {formatMs(run.totalMs)}
        </p>
      </header>
      <p className="text-xs leading-relaxed text-muted-foreground">
        {description}
      </p>
      <ol className="flex flex-col gap-2.5">
        {run.calls.map((call) => (
          <li key={call.name} className="flex flex-col gap-1">
            <div className="flex flex-wrap justify-between gap-x-3 text-xs">
              <code className="font-mono">{call.name}</code>
              <span className="font-mono text-muted-foreground tabular-nums">
                {formatMs(call.startMs)} に開始 / {formatMs(call.durationMs)}
              </span>
            </div>
            {/* 同じ内容は上の文字で読めるため、棒は読み上げの対象から外す */}
            <div aria-hidden className="relative h-2 rounded-full bg-muted">
              <div
                className="absolute inset-y-0 rounded-full bg-server"
                style={{
                  left: `${(call.startMs / scaleMs) * 100}%`,
                  width: `${(call.durationMs / scaleMs) * 100}%`,
                }}
              />
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
