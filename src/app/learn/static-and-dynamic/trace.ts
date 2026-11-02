import type { FlowTrace } from "@/types/flow"

import type { DeliveryMeasurement } from "./measure-delivery"

/** 計測する前に表示する、配信の流れの説明 */
export const deliveryModel: FlowTrace = {
  id: "delivery-model",
  title: "静的シェルとリクエスト時の部分",
  source: "model",
  steps: [
    {
      id: "build",
      from: "next-server",
      to: "server-component",
      label: "ビルド時に、実行できる部分をプリレンダー",
      detail: "結果を静的シェルとして保存する",
    },
    {
      id: "shell",
      from: "next-server",
      to: "browser",
      label: "リクエストが来たら静的シェルを送る",
      detail: "Suspense の fallback も含まれる",
    },
    {
      id: "resume",
      from: "next-server",
      to: "server-component",
      label: "残りの部分をリクエスト時に実行",
    },
    {
      id: "stream",
      from: "server-component",
      to: "browser",
      label: "結果を同じ応答の続きとして送る",
    },
  ],
}

/** 計測した結果を Process Visualizer 用のデータにする。時間は取得開始からの経過時間 */
export function buildDeliveryTrace(
  id: string,
  measurement: DeliveryMeasurement,
): FlowTrace {
  return {
    id,
    title: "このページの配信の計測",
    source: "measured",
    hideTotal: true,
    steps: [
      {
        id: "request",
        from: "browser",
        to: "next-server",
        label: "このページを取得",
      },
      {
        id: "shell",
        from: "next-server",
        to: "browser",
        label: "静的シェルの値が届く",
        detail: `シェルID: ${measurement.shellId}`,
        durationMs: measurement.shellAtMs,
      },
      {
        id: "stream",
        from: "next-server",
        to: "browser",
        label: "リクエスト時の値が続きとして届く",
        detail: `リクエストID: ${measurement.requestId}`,
        durationMs: measurement.requestAtMs,
      },
    ],
  }
}
