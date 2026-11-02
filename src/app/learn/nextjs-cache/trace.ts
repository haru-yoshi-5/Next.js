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
  const cacheResult: FlowStep = cached.generatedBeforeRead
    ? {
        id: "cache-earlier",
        from: "cache",
        to: "server-component",
        label: "読み取り前に生成された結果を受け取る",
        detail: `id: ${cached.report.id} / 裏側で再生成が動いているかは、この値からは分からない`,
      }
    : {
        id: "cache-during",
        from: "cache",
        to: "server-component",
        label: "読み取り中に生成された結果を受け取る",
        detail: `id: ${cached.report.id} / 同時に届いた別のリクエストが生成した可能性もある`,
      }

  return {
    id: requestId,
    title: cached.generatedBeforeRead
      ? "読み取り前の結果を受け取ったリクエスト"
      : "読み取り中に生成された結果を受け取ったリクエスト",
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
        label: "getCachedReport() を読み取る",
        durationMs: cached.durationMs,
      },
      cacheResult,
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
