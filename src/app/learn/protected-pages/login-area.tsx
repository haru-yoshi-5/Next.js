import { AuthDemoUnconfiguredNotice } from "@/components/learning/auth-demo-unconfigured-notice"
import { getAuthState } from "@/lib/auth-demo/dal"
import { listDemoUsers, ROLE_LABEL } from "@/lib/auth-demo/users"

import { LoginForm, type LoginUserOption } from "./login-form"
import { parseReturnTo } from "./return-to"

interface LoginAreaProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

/**
 * ログインページの、リクエスト時に決まる部分。login/page.tsx の <Suspense> の中で描画する。
 * ログイン済みでも自動では戻さず、戻るリンクを表示する（確認の結果とリダイレクトが往復しないようにする）。
 */
export async function LoginArea({ searchParams }: LoginAreaProps) {
  const { next } = await searchParams
  const returnTo = parseReturnTo(next)
  const auth = await getAuthState()

  if (auth.status === "unconfigured") return <AuthDemoUnconfiguredNotice />

  const users: LoginUserOption[] = listDemoUsers().map((user) => ({
    id: user.id,
    label: `${user.name}としてログイン`,
    note: ROLE_LABEL[user.role],
  }))

  return (
    <LoginForm
      returnTo={returnTo}
      users={users}
      currentUser={
        auth.status === "authenticated"
          ? {
              id: auth.viewer.id,
              label: `${auth.viewer.name}（${auth.viewer.roleLabel}）`,
            }
          : null
      }
    />
  )
}
