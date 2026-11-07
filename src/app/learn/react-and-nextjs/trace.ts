import type { FlowTrace } from "@/types/flow"

import { formatBytes, type RscObservation } from "./observe-rsc"

/**
 * ページを初めて開いたときの流れ（モデル図）。
 * 描画とハイドレーションの内部はブラウザから観測できないため、公式ドキュメントに沿って示す。
 */
export const initialModel: FlowTrace = {
  id: "initial-model",
  title: "ページを初めて開いたとき",
  source: "model",
  steps: [
    {
      id: "render",
      from: "next-server",
      to: "server-component",
      label: "Next.js が URL に合うコンポーネントを React で描画する",
      detail:
        "外側はプリレンダー時、ServerStamp はリクエスト時。描画の仕組みは React が提供する",
    },
    {
      id: "deliver",
      from: "next-server",
      to: "browser",
      label: "HTML と RSC Payload、JavaScript を届ける",
      detail: "配信とコードの分割は Next.js が担当する",
    },
    {
      id: "hydrate",
      from: "browser",
      to: "client-component",
      label: "React DOM が HTML にボタンの操作を結び付ける",
      detail: "ハイドレーション。起動するのは Next.js",
    },
  ],
}

export interface RefreshSnapshot {
  count: number
  serverId: string | null
}

/**
 * 「サーバーの表示を更新」で観測した値を、Process Visualizer で説明するためのデータにする。
 * 値は実測だが、React 内部の処理順序まで測ったものではない。
 */
export function buildRefreshTrace(
  id: string,
  before: RefreshSnapshot,
  after: RefreshSnapshot,
  rsc: RscObservation,
): FlowTrace {
  return {
    id,
    title: "サーバーの表示を更新した結果",
    source: "measured",
    // 取得時間は並行した取得の最大値で、操作全体の所要時間ではないため合計を出さない
    hideTotal: true,
    steps: [
      {
        id: "request",
        from: "browser",
        to: "next-server",
        label: "router.refresh(): Next.js が RSC Payload を要求する",
        detail:
          rsc.longestMs === null
            ? "取得時間は観測できなかった"
            : `このページへの RSC 候補 ${rsc.candidates.length} 件のうち、最も長い取得時間`,
        durationMs: rsc.longestMs ?? undefined,
      },
      {
        id: "render",
        from: "next-server",
        to: "server-component",
        label: "ServerStamp がもう一度描画される",
        detail: `サーバー生成ID ${before.serverId ?? "なし"} → ${after.serverId ?? "なし"}`,
      },
      {
        id: "response",
        from: "next-server",
        to: "browser",
        label: "新しい RSC Payload を返す",
        detail:
          rsc.candidates.length === 0
            ? "サイズは観測できなかった"
            : `展開後の本文 ${rsc.candidates
                .map((candidate) => formatBytes(candidate.decodedBytes))
                .join(" / ")}`,
      },
      {
        id: "reconcile",
        from: "browser",
        to: "client-component",
        label: "React が新しい結果を反映し、state は残す",
        detail: `カウンター ${before.count} → ${after.count}`,
      },
    ],
  }
}
