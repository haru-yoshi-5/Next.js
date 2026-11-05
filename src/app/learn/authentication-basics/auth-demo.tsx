import { getAuthState } from "@/lib/auth-demo/dal"
import { listDemoUsers, ROLE_LABEL } from "@/lib/auth-demo/users"

import { AuthPanel, type LoginOption } from "./auth-panel"

/**
 * リクエストの cookie を読み、サーバーが確認したユーザーを操作パネルへ渡す。
 * cookie を読むためリクエストのたびに描画する。page.tsx の <Suspense> の中に置き、
 * 教材の本文はビルド時の静的な部分に残す。
 */
export async function AuthDemo() {
  const auth = await getAuthState()
  const loginOptions: LoginOption[] = listDemoUsers().map((user) => ({
    id: user.id,
    name: user.name,
    roleLabel: ROLE_LABEL[user.role],
  }))

  return <AuthPanel auth={auth} loginOptions={loginOptions} />
}
