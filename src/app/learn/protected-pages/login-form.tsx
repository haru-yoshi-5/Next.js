"use client"

import {
  CircleAlertIcon,
  CornerDownLeftIcon,
  LoaderIcon,
  TriangleAlertIcon,
} from "lucide-react"
import Link from "next/link"
import { useActionState } from "react"

import { Button } from "@/components/ui/button"

import { initialAuthActionState } from "./action-state"
import { loginAndReturn } from "./actions"
import type { ReturnTo } from "./return-to"

export interface LoginUserOption {
  id: string
  label: string
  note: string
}

interface LoginFormProps {
  /** サーバーで許可リストと照らし合わせた戻り先 */
  returnTo: ReturnTo
  users: LoginUserOption[]
  currentUser: { id: string; label: string } | null
}

/**
 * デモのログインボタン。判定はせず、選んだユーザーと戻り先を Server Action に送るだけ。
 * 戻り先は Server Action の中でもう一度確かめる。
 */
export function LoginForm({ returnTo, users, currentUser }: LoginFormProps) {
  const [state, action, isPending] = useActionState(
    loginAndReturn,
    initialAuthActionState,
  )

  return (
    <div className="flex flex-col gap-3">
      <dl className="grid gap-1 rounded-md border px-3 py-2 text-xs">
        <dt className="text-muted-foreground">ログイン後の戻り先</dt>
        <dd className="font-mono break-all">{returnTo.path}</dd>
      </dl>
      {returnTo.rejected ? (
        <p
          role="note"
          className="flex items-start gap-1.5 text-xs leading-relaxed"
        >
          <TriangleAlertIcon
            aria-hidden
            className="mt-0.5 size-3.5 shrink-0 text-client"
          />
          URL の ?next=
          に、許可していない戻り先が指定されていました。外部のサイトなどへ移動させないよう、既定の会員ページに戻します。
        </p>
      ) : null}

      {currentUser ? (
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
          <span>{currentUser.label}としてログインしています。</span>
          <Link
            href={returnTo.path}
            className="inline-flex items-center gap-1 text-server underline-offset-4 hover:underline"
          >
            <CornerDownLeftIcon aria-hidden className="size-3.5" />
            戻り先のページへ
          </Link>
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">
          ログインしていません。デモのユーザーを選んでください（本人確認は省略しています）。
        </p>
      )}

      <ul
        aria-label="デモのユーザーでログインする"
        className="grid gap-2 sm:grid-cols-2"
      >
        {users.map((user) => {
          const isCurrent = user.id === currentUser?.id
          return (
            <li key={user.id}>
              <form action={action} className="flex h-full">
                <input type="hidden" name="userId" value={user.id} />
                <input type="hidden" name="next" value={returnTo.path} />
                <Button
                  type="submit"
                  variant="outline"
                  disabled={isPending || isCurrent}
                  aria-pressed={isCurrent}
                  className="h-auto w-full flex-col items-start gap-0.5 py-2 text-left whitespace-normal aria-pressed:border-server/50 aria-pressed:bg-server-muted"
                >
                  <span>{user.label}</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    {isCurrent ? "現在のユーザー" : user.note}
                  </span>
                </Button>
              </form>
            </li>
          )
        })}
      </ul>

      {isPending ? (
        <p
          role="status"
          className="flex items-center gap-1.5 text-xs text-muted-foreground"
        >
          <LoaderIcon
            aria-hidden
            className="size-3.5 motion-safe:animate-spin"
          />
          ログインして、戻り先へ移動しています…
        </p>
      ) : state.error ? (
        <p
          role="alert"
          className="flex items-start gap-1.5 text-xs text-destructive"
        >
          <CircleAlertIcon aria-hidden className="mt-0.5 size-3.5 shrink-0" />
          {state.error}
        </p>
      ) : null}
    </div>
  )
}
