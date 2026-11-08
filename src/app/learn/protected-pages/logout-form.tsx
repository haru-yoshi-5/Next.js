"use client"

import { CircleAlertIcon, LoaderIcon, LogOutIcon } from "lucide-react"
import { useActionState } from "react"

import { Button } from "@/components/ui/button"

import { initialAuthActionState } from "./action-state"
import { logout } from "./actions"

/** ログアウトのボタン。cookie を消すと、ページはサーバーで描画し直される */
export function LogoutForm() {
  const [state, action, isPending] = useActionState(
    logout,
    initialAuthActionState,
  )

  return (
    <div className="flex flex-col gap-2">
      <form action={action}>
        <Button type="submit" variant="outline" size="sm" disabled={isPending}>
          {isPending ? (
            <LoaderIcon
              aria-hidden
              className="size-4 motion-safe:animate-spin"
            />
          ) : (
            <LogOutIcon aria-hidden className="size-4" />
          )}
          ログアウト
        </Button>
      </form>
      {state.error ? (
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
