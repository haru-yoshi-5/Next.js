/** Process Visualizer に表示できるノード */
export type FlowNodeId =
  | "browser"
  | "client-component"
  | "next-server"
  | "server-component"
  | "server-action"
  | "route-handler"
  | "cache"
  | "data-source"

export type FlowStepStatus = "success" | "error"

/** ノード間の1回の処理（矢印1本分） */
export interface FlowStep {
  id: string
  from: FlowNodeId
  to: FlowNodeId
  label: string
  detail?: string
  /** 実際に計測した所要時間（ms）。計測していない処理には付けない */
  durationMs?: number
  status?: FlowStepStatus
}

/**
 * - measured: サーバー / ブラウザで実際に計測・取得した値から組み立てたフロー
 * - model: 計測できない内部処理を、公式ドキュメントに沿ってモデル化したフロー
 */
export type FlowTraceSource = "measured" | "model"

/** 1回の操作で起きた処理の記録 */
export interface FlowTrace {
  /** 操作ごとに一意。変わると再生をやり直す */
  id: string
  title: string
  source: FlowTraceSource
  steps: FlowStep[]
  /** ステップが後から追加される（Streaming など）場合は true */
  live?: boolean
}
