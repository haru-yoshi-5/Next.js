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
    }

export const initialSaveNameState: SaveNameState = {
  status: "idle",
  message: null,
  trace: null,
}
