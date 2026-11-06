import { LogInIcon, UserRoundIcon } from "lucide-react"
import Link from "next/link"

import { AuthDemoUnconfiguredNotice } from "@/components/learning/auth-demo-unconfigured-notice"
import { getAuthState } from "@/lib/auth-demo/dal"
import { describeAuth } from "@/lib/auth-demo/describe"
import { cn } from "@/lib/utils"

import { LogoutForm } from "./logout-form"
import { LOGIN_PATH } from "./return-to"

/**
 * 現在のユーザーの表示。page.tsx の <Suspense> の中で、リクエストのたびに cookie を確かめる。
 * 守る内容は表示しないため、未ログインでもリダイレクトしない。
 */
export async function ViewerCard() {
  const auth = await getAuthState()
  if (auth.status === "unconfigured") return <AuthDemoUnconfiguredNotice />

  const isAuthenticated = auth.status === "authenticated"

  return (
    <section
      aria-labelledby="protected-pages-viewer"
      className="flex flex-col gap-3 rounded-lg border px-3 py-3"
    >
      <div className="flex flex-col gap-1">
        <h4
          id="protected-pages-viewer"
          className="text-xs font-medium text-muted-foreground"
        >
          サーバーが確認したユーザー
        </h4>
        <p className="flex items-center gap-2 text-sm font-medium">
          <UserRoundIcon
            aria-hidden
            className={cn(
              "size-4 shrink-0",
              isAuthenticated ? "text-server" : "text-muted-foreground",
            )}
          />
          {isAuthenticated
            ? `${auth.viewer.name}（${auth.viewer.roleLabel}）`
            : "未ログイン"}
        </p>
        <p className="text-xs leading-relaxed text-muted-foreground">
          {isAuthenticated
            ? `署名と期限を確かめました。セッションの残りは約${Math.ceil(auth.expiresInSeconds / 60)}分です。`
            : describeAuth(auth)}
        </p>
      </div>
      {isAuthenticated ? (
        <LogoutForm />
      ) : (
        <Link
          href={LOGIN_PATH}
          className="inline-flex w-fit items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
        >
          <LogInIcon aria-hidden className="size-4" />
          ログインページを開く
        </Link>
      )}
    </section>
  )
}
