import type { FlowTrace } from "@/types/flow"

/** デモで実行できる操作 */
export const DEMO_INTENTS = [
  "login",
  "logout",
  "tamper",
  "expire",
  "view-profile",
  "publish",
] as const

export type DemoIntent = (typeof DEMO_INTENTS)[number]

/**
 * 操作の結果。
 * - unauthenticated: 認証の失敗（誰か分からない）
 * - forbidden: 認可の失敗（誰かは分かったが、権限がない）
 */
export type DemoOutcome =
  | "success"
  | "unauthenticated"
  | "forbidden"
  | "invalid"
  | "unconfigured"
  | "failed"

/**
 * Server Action（runAuthDemo）が返す state。
 * "use server" のファイルからは async 関数しか export できないため、型と初期値はこのファイルに置く。
 */
export type AuthDemoState =
  | { status: "idle"; message: null; trace: null }
  | { status: DemoOutcome; message: string; trace: FlowTrace }

export const initialAuthDemoState: AuthDemoState = {
  status: "idle",
  message: null,
  trace: null,
}
