"use client"

import { CircleAlertIcon, CircleCheckIcon, LoaderIcon } from "lucide-react"
import { type ReactNode, useActionState } from "react"

import { RuntimeDetective } from "@/components/ai/runtime-detective"
import { DemoLayout } from "@/components/learning/demo-layout"
import { Button } from "@/components/ui/button"
import { ProcessVisualizer } from "@/components/visualizer/process-visualizer"
import { cn } from "@/lib/utils"
import type { FlowTrace } from "@/types/flow"

import { initialSaveNameState, type SaveNameState } from "./action-state"
import { saveName } from "./actions"

/**
 * Server Action を呼び、送信から応答を受け取るまでの時間をブラウザで計測して付け足す。
 * この値は改ざんできるため、AI には「ブラウザからの申告」として送る
 */
async function saveNameWithTiming(
  previousState: SaveNameState,
  formData: FormData,
): Promise<SaveNameState> {
  const startedAt = performance.now()
  const next = await saveName(previousState, formData)
  if (next.status === "idle") return next
  return { ...next, browserRoundTripMs: performance.now() - startedAt }
}

interface NameFormProps {
  /** Server Component（GuestbookList）の描画結果 */
  list: ReactNode
}

// useActionState とフォームの入力状態を扱うため Client Component。
// 保存処理そのものは actions.ts の Server Action がサーバーで行う。
export function NameForm({ list }: NameFormProps) {
  const [state, formAction, isPending] = useActionState(
    saveNameWithTiming,
    initialSaveNameState,
  )

  // 送信中は、ブラウザから見えている「送信した」ところまでを表示する
  const pendingTrace: FlowTrace = {
    id: `${state.trace?.id ?? "initial"}-pending`,
    title: "Server Action の実行",
    source: "measured",
    live: true,
    steps: [
      {
        id: "submit",
        from: "client-component",
        to: "next-server",
        label: "フォームを送信（POST）",
        detail: "サーバーからの応答を待っています",
      },
    ],
  }

  const hasError = state.status === "error"

  return (
    <DemoLayout
      runtime="client"
      runtimeDetail="フォーム"
      demo={
        <div className="flex flex-col gap-6">
          <form action={formAction} noValidate className="flex flex-col gap-2">
            <label htmlFor="guest-name" className="text-sm font-medium">
              名前
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                // エラー後は送信した値を残し、成功後は空に戻す
                key={state.trace?.id ?? "initial"}
                id="guest-name"
                name="name"
                defaultValue={hasError ? state.submittedName : ""}
                autoComplete="off"
                aria-invalid={hasError}
                aria-describedby="guest-name-hint guest-name-message"
                className={cn(
                  "h-9 min-w-0 flex-1 rounded-lg border bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40",
                  hasError && "border-destructive",
                )}
              />
              <Button type="submit" size="lg" disabled={isPending}>
                {isPending ? (
                  <LoaderIcon
                    aria-hidden
                    className="motion-safe:animate-spin"
                  />
                ) : null}
                保存する
              </Button>
            </div>
            <p id="guest-name-hint" className="text-xs text-muted-foreground">
              20文字以内。検証はサーバー側で行うため、空欄や長すぎる名前もそのまま送信できます。「error」と入力すると、データ更新の失敗を再現できます。名前は他の人にも表示されるため、実名は入力しないでください。
            </p>
            <p
              id="guest-name-message"
              role={hasError ? "alert" : "status"}
              className={cn(
                "flex min-h-5 items-center gap-1.5 text-sm",
                hasError ? "text-destructive" : "text-server",
              )}
            >
              {state.message ? (
                <>
                  {hasError ? (
                    <CircleAlertIcon aria-hidden className="size-4" />
                  ) : (
                    <CircleCheckIcon aria-hidden className="size-4" />
                  )}
                  {state.message}
                </>
              ) : null}
            </p>
          </form>
          {list}
        </div>
      }
      visualizer={
        <div className="flex flex-col gap-4">
          <ProcessVisualizer
            nodes={[
              "browser",
              "client-component",
              "next-server",
              "server-action",
              "data-source",
              "cache",
              "server-component",
            ]}
            trace={isPending ? pendingTrace : state.trace}
            emptyMessage="名前を入力して「保存する」を押すと、Server Action の処理がここに表示されます"
          />
          {state.status !== "idle" && state.explain && !isPending ? (
            <RuntimeDetective
              // 実行が変わったら作り直し、前の実行の回答を残さない
              key={state.trace.id}
              lessonId="server-actions"
              ticket={state.explain}
              browserRoundTripMs={state.browserRoundTripMs}
            />
          ) : null}
        </div>
      }
    />
  )
}
