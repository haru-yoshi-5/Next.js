import type { FlowStep, FlowTrace } from "@/types/flow"

export type ActionOutcome =
  | { type: "invalid"; message: string }
  | { type: "saved"; name: string; writeMs: number }
  | { type: "failed" }

interface ActionTraceInput {
  requestId: string
  /** Server Action の開始から return までの時間（サーバーで計測） */
  totalMs: number
  outcome: ActionOutcome
}

/** Server Action の実行結果を Process Visualizer 用のデータにする（サーバーで実行） */
export function buildActionTrace({
  requestId,
  totalMs,
  outcome,
}: ActionTraceInput): FlowTrace {
  const steps: FlowStep[] = [
    {
      id: "submit",
      from: "client-component",
      to: "next-server",
      label: "フォームを送信（POST）",
      detail: "Server Action を識別する ID とフォームデータが送られる",
      // 送信そのものは Next.js が行うため、ここでは観測していない
      evidence: "conceptual",
    },
    {
      id: "invoke",
      from: "next-server",
      to: "server-action",
      label: "saveName(prevState, formData) を実行",
      // この関数の中で計測を始めているため、実行されたことは観測している
      evidence: "observed",
    },
  ]

  if (outcome.type === "invalid") {
    steps.push(
      {
        id: "validate",
        from: "server-action",
        to: "server-action",
        label: "バリデーション: NG",
        evidence: "observed",
        detail: outcome.message,
        status: "error",
      },
      {
        id: "respond",
        from: "server-action",
        to: "client-component",
        label: "エラー内容を state として返す",
        evidence: "observed",
        detail: "データもキャッシュも更新しない（サーバー処理の合計）",
        durationMs: totalMs,
        status: "error",
      },
    )
  }

  if (outcome.type === "failed") {
    steps.push(
      {
        id: "validate",
        from: "server-action",
        to: "server-action",
        label: "バリデーション: OK",
        evidence: "observed",
      },
      {
        id: "write",
        from: "server-action",
        to: "data-source",
        label: "データ更新に失敗",
        evidence: "observed",
        detail:
          "try / catch でエラーを捕捉し、利用者向けのメッセージに置き換える",
        status: "error",
      },
      {
        id: "respond",
        from: "server-action",
        to: "client-component",
        label: "エラー内容を state として返す",
        evidence: "observed",
        detail: "キャッシュは更新しない（サーバー処理の合計）",
        durationMs: totalMs,
        status: "error",
      },
    )
  }

  if (outcome.type === "saved") {
    steps.push(
      {
        id: "validate",
        from: "server-action",
        to: "server-action",
        label: "バリデーション: OK",
        evidence: "observed",
        detail: `name = "${outcome.name}"`,
      },
      {
        id: "write",
        from: "server-action",
        to: "data-source",
        label: "addEntry() でデータを更新",
        evidence: "observed",
        durationMs: outcome.writeMs,
      },
      {
        id: "revalidate",
        from: "server-action",
        to: "cache",
        label: 'updateTag("guestbook")',
        evidence: "conceptual",
        detail: "名前一覧のキャッシュを期限切れにする",
      },
      {
        id: "rerender",
        from: "cache",
        to: "server-component",
        label: "<GuestbookList /> を新しいデータで再実行",
        evidence: "conceptual",
        detail: "キャッシュが無効になったため、次の描画で作り直される",
      },
      {
        id: "respond",
        from: "next-server",
        to: "client-component",
        label: "結果と更新後の UI を1回の往復で返す",
        evidence: "observed",
        detail: "サーバー処理の合計時間",
        durationMs: totalMs,
      },
    )
  }

  return {
    id: requestId,
    title: "Server Action の実行",
    source: "measured",
    // 最後のステップが合計時間なので、データ更新時間と足し合わせない
    hideTotal: true,
    steps,
  }
}
