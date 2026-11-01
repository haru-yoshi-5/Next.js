import type { FlowStep, FlowTrace } from "@/types/flow"

import type { ReportRead } from "./report-data"

interface CacheTraceInput {
  requestId: string
  fresh: ReportRead
  cached: ReportRead
}

/** 1回のリクエストで起きた読み取りを Process Visualizer 用のデータに変換する */
export function buildCacheTrace({
  requestId,
  fresh,
  cached,
}: CacheTraceInput): FlowTrace {
  const cacheResult: FlowStep[] = cached.reused
    ? [
        {
          id: "cache-hit",
          from: "cache",
          to: "server-component",
          label: "保存済みの結果を返す",
          detail: `id: ${cached.report.id} / 生成時刻がこのリクエストより前なので、本体は実行されていない`,
        },
      ]
    : [
        {
          id: "cache-run",
          from: "cache",
          to: "data-source",
          label: "保存済みの結果がなく、関数本体を実行",
          detail:
            "生成時刻がこのリクエストの中にあるため、本体の実行を確認できる",
        },
        {
          id: "cache-result",
          from: "data-source",
          to: "server-component",
          label: "新しい結果を返す",
          detail: `id: ${cached.report.id}`,
        },
      ]

  return {
    id: requestId,
    title: cached.reused
      ? "キャッシュを再利用したリクエスト"
      : "関数本体を実行したリクエスト",
    source: "measured",
    // 2つの読み取りは並行して実行するので、時間を足し合わせても意味を持たない
    hideTotal: true,
    steps: [
      {
        id: "request",
        from: "browser",
        to: "next-server",
        label: "ページをリクエスト",
      },
      {
        id: "render",
        from: "next-server",
        to: "server-component",
        label: "<CacheDemo /> を実行",
        detail: "このコンポーネント自体はキャッシュせず、毎回実行する",
      },
      {
        id: "fresh",
        from: "server-component",
        to: "data-source",
        label: "getFreshReport() は毎回本体を実行",
        detail: `id: ${fresh.report.id}`,
        durationMs: fresh.durationMs,
      },
      {
        id: "cache-read",
        from: "server-component",
        to: "cache",
        label: "getCachedReport() はキャッシュを確認",
        durationMs: cached.durationMs,
      },
      ...cacheResult,
      {
        id: "response",
        from: "next-server",
        to: "browser",
        label: "結果をストリーミングで送信",
        detail: `request: ${requestId.slice(0, 8)}`,
      },
    ],
  }
}
