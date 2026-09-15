import type { FlowTrace } from "@/types/flow"

interface SnapshotTraceInput {
  requestId: string
  /** getServerSnapshot() にかかった時間（サーバーで計測） */
  fetchMs: number
}

/** ServerSnapshot の1回のレンダリングを Process Visualizer 用のデータに変換する */
export function buildSnapshotTrace({
  requestId,
  fetchMs,
}: SnapshotTraceInput): FlowTrace {
  return {
    id: requestId,
    title: "Server Component のレンダリング",
    source: "measured",
    steps: [
      {
        id: "request",
        from: "browser",
        to: "next-server",
        label: "ページをリクエスト",
        detail:
          "初回アクセスでは HTML を、router.refresh() では RSC Payload を要求する",
      },
      {
        id: "render",
        from: "next-server",
        to: "server-component",
        label: "<ServerSnapshot /> を実行",
        detail: "async 関数としてサーバーで呼び出される",
      },
      {
        id: "fetch",
        from: "server-component",
        to: "data-source",
        label: "await getServerSnapshot()",
        detail: "この時間はサーバー上で実際に計測した値",
        durationMs: fetchMs,
      },
      {
        id: "data",
        from: "data-source",
        to: "server-component",
        label: "データを返す",
      },
      {
        id: "serialize",
        from: "server-component",
        to: "next-server",
        label: "描画結果を RSC Payload に変換",
        detail: "コンポーネントのコードは含まれず、描画結果だけが残る",
      },
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
