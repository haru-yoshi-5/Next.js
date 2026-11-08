import type { FlowTrace } from "@/types/flow"

import type { FetchRun } from "./fetch-strategies"

interface FetchTraceInput {
  requestId: string
  sequential: FetchRun
  parallel: FetchRun
}

/** 1回のレンダリングで行ったデータ取得を Process Visualizer 用のデータに変換する */
export function buildFetchTrace({
  requestId,
  sequential,
  parallel,
}: FetchTraceInput): FlowTrace {
  const [author, posts] = sequential.calls

  return {
    id: requestId,
    title: "Server Component のデータ取得",
    source: "measured",
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
        label: "<FetchDemo /> を実行",
      },
      {
        id: "sequential-author",
        from: "server-component",
        to: "data-source",
        label: "直列: await getAuthor()",
        detail: "完了するまで次の処理へ進まない",
        durationMs: author.durationMs,
      },
      {
        id: "sequential-posts",
        from: "server-component",
        to: "data-source",
        label: "直列: await getPosts()",
        detail: "getAuthor() の完了後に開始した",
        durationMs: posts.durationMs,
      },
      {
        id: "parallel",
        from: "server-component",
        to: "data-source",
        label: "並列: await Promise.all([...])",
        detail: "2つを同時に開始し、遅いほうの完了まで待った",
        durationMs: parallel.totalMs,
      },
      {
        id: "response",
        from: "server-component",
        to: "browser",
        label: "描画結果を送信",
        detail: `request: ${requestId.slice(0, 8)}`,
      },
    ],
  }
}
