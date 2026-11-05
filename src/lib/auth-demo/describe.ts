import type { AnonymousReason, AuthState } from "./dal"

/**
 * 認証の結果を、Process Visualizer に出す短い説明にする。
 * 型だけを使う純粋な関数なので、サーバーとブラウザのどちらからでも呼べる。
 */

const ANONYMOUS_DETAIL: Record<AnonymousReason, string> = {
  missing: "cookie がない → 未ログイン",
  "bad-signature": "署名が一致しない → 未ログイン",
  invalid: "形式や発行者の検証に失敗 → 未ログイン",
  expired: "期限が切れている → 未ログイン",
  "unknown-user": "存在しないユーザー → 未ログイン",
}

export function describeAuth(auth: AuthState): string {
  if (auth.status === "unconfigured") return "秘密鍵が設定されていない"
  if (auth.status === "anonymous") return ANONYMOUS_DETAIL[auth.reason]
  return `${auth.viewer.name}（${auth.viewer.roleLabel}）と確認`
}
