import type { FlowStep, FlowTrace } from "@/types/flow"

import type { RouteCall, RouteKind } from "./call-route"

const formatMs = (ms: number) => `${Math.round(ms).toLocaleString("ja-JP")} ms`

const TITLE: Record<RouteKind, string> = {
  guarded: "Route Handler での確認",
  unguarded: "確認を忘れた Route Handler",
}

/** 応答を待っている間に表示する記録 */
export function pendingRouteTrace(id: string, kind: RouteKind): FlowTrace {
  return {
    id,
    title: TITLE[kind],
    source: "measured",
    live: true,
    steps: [
      {
        id: "request",
        from: "client-component",
        to: "next-server",
        label: "fetch() で GET リクエストを送る",
        detail: "サーバーからの応答を待っています",
      },
    ],
  }
}

/**
 * Route Handler の応答（ステータスと Server-Timing）から、Process Visualizer 用のデータを組み立てる。
 * サーバーの中の判定は、ステータスコードから読み取る（401 = 認証の失敗、403 = 認可の失敗）。
 */
export function buildRouteTrace(id: string, call: RouteCall): FlowTrace {
  const steps: FlowStep[] = [
    {
      id: "request",
      from: "client-component",
      to: "next-server",
      label: `GET ${call.path}`,
      detail: "セッションの cookie は、ブラウザが自動で付ける",
    },
    {
      id: "invoke",
      from: "next-server",
      to: "route-handler",
      label: "GET() を実行",
    },
  ]

  if (call.kind === "guarded" && call.authMs !== undefined) {
    steps.push({
      id: "authenticate",
      from: "route-handler",
      to: "route-handler",
      label: "認証: readSalesReport() がセッションを検証",
      detail:
        call.status === 401 ? "誰か分からない → 未ログイン" : "ユーザーを確認",
      durationMs: call.authMs,
      status: call.status === 401 ? "error" : undefined,
    })
    if (call.status === 200 || call.status === 403) {
      steps.push({
        id: "authorize",
        from: "route-handler",
        to: "route-handler",
        label: "認可: 「売上レポートを見る」の権限があるか",
        detail: call.status === 403 ? "許可されていない" : "許可されている",
        status: call.status === 403 ? "error" : undefined,
      })
    }
  }

  if (call.dataMs !== undefined) {
    steps.push({
      id: "data",
      from: "route-handler",
      to: "data-source",
      label:
        call.kind === "guarded"
          ? "確認を通ったので、売上を読み取る"
          : "確認をせずに、売上を読み取る",
      durationMs: call.dataMs,
      status: call.kind === "unguarded" ? "error" : undefined,
    })
  }

  const leaked = call.kind === "unguarded" && call.status === 200
  const timing = [
    call.handlerMs !== undefined
      ? `Route Handler の処理 ${formatMs(call.handlerMs)}`
      : null,
    `往復 ${formatMs(call.roundTripMs)}（ブラウザで計測）`,
  ]
    .filter(Boolean)
    .join(" / ")

  steps.push({
    id: "response",
    from: "route-handler",
    to: "client-component",
    label: leaked
      ? "200 OK: 誰からのリクエストにもデータを返した"
      : `${call.status} ${call.statusText}`,
    detail: timing,
    status: call.status === 200 && !leaked ? "success" : "error",
  })

  return {
    id,
    title: TITLE[call.kind],
    source: "measured",
    hideTotal: true,
    steps,
  }
}
