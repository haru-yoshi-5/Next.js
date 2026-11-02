import type { FlowTrace } from "@/types/flow"

import type { BoundaryInspection } from "./inspect-boundary"

/** 操作前に表示する、境界を越える流れの説明 */
export const boundaryModel: FlowTrace = {
  id: "boundary-model",
  title: "Server と Client の境界",
  source: "model",
  steps: [
    {
      id: "render",
      from: "next-server",
      to: "server-component",
      label: "Server Component を実行",
      detail: "このコードはブラウザに届かない",
    },
    {
      id: "payload",
      from: "server-component",
      to: "browser",
      label: "RSC Payload を送る",
      detail: "出力と、シリアライズした props と、Client Component への参照",
    },
    {
      id: "hydrate",
      from: "browser",
      to: "client-component",
      label: "参照先のコードを読み込んで実行",
      detail: "import されたコードだけがブラウザに届く",
    },
  ],
}

interface ClientUpdateTraceInput {
  id: string
  label: string
  detail: string
  renderId: string
}

/** ブラウザの中だけで完結した操作を Process Visualizer 用のデータにする */
export function buildClientUpdateTrace({
  id,
  label,
  detail,
  renderId,
}: ClientUpdateTraceInput): FlowTrace {
  return {
    id,
    title: "Client Component の state 更新",
    source: "measured",
    steps: [
      {
        id: "event",
        from: "browser",
        to: "client-component",
        label: "click イベント → onClick を実行",
      },
      {
        id: "set-state",
        from: "client-component",
        to: "client-component",
        label,
        detail,
      },
      {
        id: "result",
        from: "client-component",
        to: "browser",
        label: "DOM を更新。サーバーへのリクエストは送らない",
        detail: `Server Component の生成ID: ${renderId} のまま`,
      },
    ],
  }
}

interface RefreshTraceInput {
  id: string
  beforeId: string
  afterId: string
  count: number
}

/** 再リクエストの前後の値を Process Visualizer 用のデータにする */
export function buildRefreshTrace({
  id,
  beforeId,
  afterId,
  count,
}: RefreshTraceInput): FlowTrace {
  return {
    id,
    title: "Server Component の再実行",
    source: "measured",
    steps: [
      {
        id: "refresh",
        from: "client-component",
        to: "next-server",
        label: "router.refresh() でサーバーへ再リクエスト",
      },
      {
        id: "render",
        from: "next-server",
        to: "server-component",
        label: "Server Component をもう一度実行",
        detail: `生成ID: ${beforeId} → ${afterId}`,
      },
      {
        id: "payload",
        from: "server-component",
        to: "client-component",
        label: "新しい出力と props を受け取る",
        detail: `Client Component の state は ${count} のまま`,
      },
    ],
  }
}

/** 検査の結果を Process Visualizer 用のデータにする */
export function buildInspectionTrace(
  id: string,
  inspection: BoundaryInspection,
): FlowTrace {
  return {
    id,
    title: "境界を越えた内容の検査",
    source: "measured",
    steps: [
      {
        id: "page",
        from: "client-component",
        to: "next-server",
        label: "このページをもう一度取得して検索",
        detail: `渡した値 ${inspection.publicTokenCount}件 / 渡していない値 ${inspection.secretTokenCount}件`,
      },
      {
        id: "scripts",
        from: "browser",
        to: "client-component",
        label: `読み込んだ JavaScript ${inspection.scriptCount}ファイルを検索`,
        detail: `Client の目印 ${inspection.clientMarkerCount}件 / Server の目印 ${inspection.serverMarkerCount}件`,
      },
    ],
  }
}
