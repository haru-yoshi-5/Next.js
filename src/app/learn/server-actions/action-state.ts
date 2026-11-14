import type { RuntimeExplainTicket } from "@/lib/tracing/adapter"
import type { FlowTrace } from "@/types/flow"

/**
 * Server Action（saveName）が返す state。
 * "use server" のファイルからは async 関数しか export できないため、型と初期値はこのファイルに置く。
 */
export type SaveNameState =
  | { status: "idle"; message: null; trace: null }
  | {
      status: "success" | "error"
      message: string
      /** エラー時に入力欄へ戻す値 */
      submittedName: string
      trace: FlowTrace
      /** 「この実行を AI で解説」に使う、署名付きの要約。AI 機能が使えないときは null */
      explain: RuntimeExplainTicket | null
      /**
       * 送信から応答を受け取るまでの時間（ブラウザで計測）。
       * Server Action は返さず、name-form.tsx がブラウザで付け足す。改ざんできるため「申告」として扱う
       */
      browserRoundTripMs?: number
    }

export const initialSaveNameState: SaveNameState = {
  status: "idle",
  message: null,
  trace: null,
}
