import type { FlowStep, FlowTrace } from "@/types/flow"

import type { RouteCall } from "./call-route"

const formatMs = (ms: number) => `${Math.round(ms).toLocaleString("ja-JP")} ms`

/** リクエストを送る前に表示する、Route Handler の流れの説明 */
export const routeModel: FlowTrace = {
  id: "route-model",
  title: "Route Handler へのリクエスト",
  source: "model",
  steps: [
    {
      id: "request",
      from: "client-component",
      to: "next-server",
      label: "fetch() で HTTP リクエストを送る",
    },
    {
      id: "invoke",
      from: "next-server",
      to: "route-handler",
      label: "URL とメソッドに対応する関数を呼び出す",
      detail:
        "定義していないメソッドなら関数は呼ばれず 405 が返る（HEAD と OPTIONS は自動で用意される）",
    },
    {
      id: "store",
      from: "route-handler",
      to: "data-source",
      label: "データを読み書きする",
    },
    {
      id: "response",
      from: "route-handler",
      to: "client-component",
      label: "Response を返す",
    },
  ],
}

/** 実際のレスポンスから Process Visualizer 用のデータを組み立てる */
export function buildRouteTrace(id: string, call: RouteCall): FlowTrace {
  const statusLabel = `${call.status} ${call.statusText}`
  const roundTrip = `往復 ${formatMs(call.roundTripMs)}（ブラウザで計測）`
  const isError = call.status >= 400

  const request: FlowStep = {
    id: "request",
    from: "client-component",
    to: "next-server",
    label: `${call.method} ${call.path}`,
    detail: call.requestBody ? `本文: ${call.requestBody}` : undefined,
  }

  // Server-Timing がない = route.ts の関数が実行されずに Next.js が応答した
  if (call.handlerMs === undefined) {
    return {
      id,
      title: "Route Handler へのリクエスト",
      source: "measured",
      hideTotal: true,
      steps: [
        request,
        {
          id: "response",
          from: "next-server",
          to: "client-component",
          label: statusLabel,
          detail:
            call.status === 405
              ? `route.ts に ${call.method} が定義されていないため、Next.js が応答した。${roundTrip}`
              : roundTrip,
          status: isError ? "error" : "success",
        },
      ],
    }
  }

  const steps: FlowStep[] = [
    request,
    {
      id: "invoke",
      from: "next-server",
      to: "route-handler",
      label: `${call.method}(request) を実行`,
    },
  ]

  if (call.storeMs !== undefined) {
    steps.push({
      id: "store",
      from: "route-handler",
      to: "data-source",
      label:
        call.method === "GET" ? "メッセージを読み取る" : "メッセージを保存する",
      detail:
        "この時間はサーバーで計測し、Server-Timing ヘッダーで受け取った値",
      durationMs: call.storeMs,
    })
  }

  steps.push({
    id: "response",
    from: "route-handler",
    to: "client-component",
    label: statusLabel,
    detail: `Route Handler の処理 ${formatMs(call.handlerMs)} / ${roundTrip}`,
    status: isError ? "error" : "success",
  })

  return {
    id,
    title: "Route Handler へのリクエスト",
    source: "measured",
    hideTotal: true,
    steps,
  }
}
