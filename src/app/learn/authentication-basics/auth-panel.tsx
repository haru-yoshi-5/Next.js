"use client"

import {
  CircleAlertIcon,
  CircleCheckIcon,
  KeyRoundIcon,
  LoaderIcon,
  UserRoundIcon,
} from "lucide-react"
import { type ReactNode, useActionState, useState } from "react"

import { DemoLayout } from "@/components/learning/demo-layout"
import { Button } from "@/components/ui/button"
import { ProcessVisualizer } from "@/components/visualizer/process-visualizer"
import type { AnonymousReason, AuthState } from "@/lib/auth-demo/dal"
import { cn } from "@/lib/utils"
import type { FlowTrace } from "@/types/flow"

import {
  type AuthDemoState,
  type DemoIntent,
  initialAuthDemoState,
} from "./action-state"
import { runAuthDemo } from "./actions"

export interface LoginOption {
  id: string
  name: string
  roleLabel: string
}

interface AuthPanelProps {
  /** サーバーが cookie を検証した結果 */
  auth: AuthState
  loginOptions: LoginOption[]
}

const ANONYMOUS_REASON: Record<AnonymousReason, string> = {
  missing: "セッションの cookie がありません。",
  "bad-signature":
    "cookie はありますが、署名が一致しないため無効として扱いました。中身が書き換えられた可能性があります。",
  invalid:
    "cookie はありますが、形式や発行者の検証に失敗したため無効として扱いました。",
  expired: "cookie はありますが、期限が切れているため無効として扱いました。",
  "unknown-user":
    "署名は正しいものの、そのユーザーが存在しないため無効として扱いました。",
}

const NODES = [
  "browser",
  "client-component",
  "next-server",
  "server-action",
  "server-component",
] as const

// ボタンの操作と、画面の制限を外すチェックボックスの状態を扱うため Client Component。
// 認証と認可の判定はすべて actions.ts の Server Action がサーバーで行う。
export function AuthPanel({ auth, loginOptions }: AuthPanelProps) {
  const [state, formAction, isPending] = useActionState(
    runAuthDemo,
    initialAuthDemoState,
  )
  const [showAllButtons, setShowAllButtons] = useState(false)

  if (auth.status === "unconfigured") {
    return (
      <DemoLayout
        runtime="client"
        runtimeDetail="ログインと操作のボタン"
        demo={<UnconfiguredNotice />}
        visualizer={
          <ProcessVisualizer
            nodes={[...NODES]}
            trace={null}
            emptyMessage="秘密鍵を設定すると、認証と認可の処理がここに表示されます"
          />
        }
      />
    )
  }

  // 画面に出すボタンを決めるだけの判定。守るための判定はサーバーで行う
  const isAdmin =
    auth.status === "authenticated" && auth.viewer.role === "admin"
  const showPublish = isAdmin || showAllButtons

  const pendingTrace: FlowTrace = {
    id: `${state.trace?.id ?? "initial"}-pending`,
    title: "Server Action での認証と認可",
    source: "measured",
    live: true,
    steps: [
      {
        id: "submit",
        from: "client-component",
        to: "next-server",
        label: "Server Action を呼ぶ（POST）",
        detail: "サーバーからの応答を待っています",
      },
    ],
  }

  const actionButton = (
    intent: DemoIntent,
    label: string,
    note: string,
    hidden?: Record<string, string>,
  ) => (
    <form action={formAction} className="flex">
      <input type="hidden" name="intent" value={intent} />
      {Object.entries(hidden ?? {}).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <Button
        type="submit"
        variant="outline"
        disabled={isPending}
        className="h-auto w-full flex-col items-start gap-0.5 py-2 text-left whitespace-normal"
      >
        <span>{label}</span>
        <span className="text-xs font-normal text-muted-foreground">
          {note}
        </span>
      </Button>
    </form>
  )

  return (
    <DemoLayout
      runtime="client"
      runtimeDetail="ログインと操作のボタン"
      demo={
        <div className="flex flex-col gap-5">
          <ServerViewCard auth={auth} />

          <DemoSection
            title="ログイン（本人確認を省略したデモ）"
            note="パスワードなどの本人確認を省き、選んだユーザーのセッションを発行します。"
          >
            <ul className="grid gap-2 sm:grid-cols-2">
              {loginOptions.map((option) => (
                <li key={option.id}>
                  {actionButton(
                    "login",
                    `${option.name}としてログイン`,
                    option.roleLabel,
                    { userId: option.id },
                  )}
                </li>
              ))}
              <li>
                {actionButton("logout", "ログアウト", "cookie を削除する")}
              </li>
            </ul>
          </DemoSection>

          <DemoSection
            title="操作する（Server Action）"
            note="どの操作も、サーバーが cookie を検証して「誰か」を確かめ、その人に許可されているかを判定します。"
          >
            <ul className="grid gap-2 sm:grid-cols-2">
              <li>
                {actionButton(
                  "view-profile",
                  "プロフィールを見る",
                  "一般ユーザーと管理者に許可",
                )}
              </li>
              <li>
                {showPublish ? (
                  actionButton(
                    "publish",
                    "お知らせを公開する",
                    "管理者だけに許可",
                  )
                ) : (
                  <p className="flex h-full items-center rounded-lg border border-dashed px-3 py-2 text-xs leading-relaxed text-muted-foreground">
                    管理者としてログインしていないため、「お知らせを公開する」ボタンを表示していません。
                  </p>
                )}
              </li>
            </ul>
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={showAllButtons}
                onChange={(event) => setShowAllButtons(event.target.checked)}
                className="mt-0.5 size-4 shrink-0 accent-primary"
              />
              <span>
                画面の制限を外す
                <span className="block text-xs text-muted-foreground">
                  ブラウザ側の表示だけを変え、管理者向けのボタンを出します。サーバーの判定は変わりません。
                </span>
              </span>
            </label>
          </DemoSection>

          <DemoSection
            title="セッションを壊す"
            note="壊れた cookie を保存し、サーバーが検証で見つけることを確かめます。"
          >
            <ul className="grid gap-2 sm:grid-cols-2">
              <li>
                {actionButton(
                  "tamper",
                  "中身を書き換える",
                  "一般ユーザーの ID を管理者の ID に変える。署名は元のまま",
                )}
              </li>
              <li>
                {actionButton(
                  "expire",
                  "期限切れにする",
                  "署名は正しいが、期限が1分前に切れている",
                )}
              </li>
            </ul>
          </DemoSection>

          <ResultMessage state={state} isPending={isPending} />
        </div>
      }
      visualizer={
        <ProcessVisualizer
          nodes={[...NODES]}
          trace={isPending ? pendingTrace : state.trace}
          emptyMessage="ボタンを押すと、Server Action での認証と認可の処理がここに表示されます"
        />
      }
    />
  )
}

function DemoSection({
  title,
  note,
  children,
}: {
  title: string
  note: string
  children: ReactNode
}) {
  return (
    <section className="flex flex-col gap-2">
      <h4 className="text-sm font-medium">{title}</h4>
      <p className="text-xs leading-relaxed text-muted-foreground">{note}</p>
      {children}
    </section>
  )
}

/** サーバーが cookie を検証した結果（ページを描画したときのもの） */
function ServerViewCard({
  auth,
}: {
  auth: Exclude<AuthState, { status: "unconfigured" }>
}) {
  const isAuthenticated = auth.status === "authenticated"
  return (
    <section
      aria-labelledby="auth-server-view"
      className="flex flex-col gap-1.5 rounded-lg border px-3 py-3"
    >
      <h4
        id="auth-server-view"
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
          : ANONYMOUS_REASON[auth.reason]}
      </p>
    </section>
  )
}

function ResultMessage({
  state,
  isPending,
}: {
  state: AuthDemoState
  isPending: boolean
}) {
  const isError = state.status !== "idle" && state.status !== "success"

  return (
    <p
      role={isError ? "alert" : "status"}
      className={cn(
        "flex min-h-5 items-start gap-1.5 border-t pt-4 text-sm leading-relaxed",
        isError ? "text-destructive" : "text-muted-foreground",
        state.status === "success" && "text-server",
      )}
    >
      {isPending ? (
        <>
          <LoaderIcon
            aria-hidden
            className="mt-0.5 size-4 shrink-0 motion-safe:animate-spin"
          />
          サーバーで確認しています…
        </>
      ) : state.message ? (
        <>
          {isError ? (
            <CircleAlertIcon aria-hidden className="mt-0.5 size-4 shrink-0" />
          ) : (
            <CircleCheckIcon aria-hidden className="mt-0.5 size-4 shrink-0" />
          )}
          {state.message}
        </>
      ) : (
        "まだ操作していません。ログインの状態を変えながら、2つの操作を試しましょう。"
      )}
    </p>
  )
}

function UnconfiguredNotice() {
  return (
    <section className="flex flex-col gap-2 rounded-lg border border-dashed px-4 py-4">
      <h4 className="flex items-center gap-2 text-sm font-medium">
        <KeyRoundIcon aria-hidden className="size-4 shrink-0" />
        このデモは現在使えません
      </h4>
      <p className="text-sm leading-relaxed text-muted-foreground">
        セッションに署名するための秘密鍵（環境変数{" "}
        <code className="font-mono text-xs">AUTH_DEMO_SECRET</code>
        ）が、サーバーに設定されていないか、短すぎます。教材の本文はそのまま読めます。
      </p>
      <p className="text-xs leading-relaxed text-muted-foreground">
        手元で動かす場合は、32文字以上のランダムな文字列（例:{" "}
        <code className="font-mono">openssl rand -base64 32</code> の出力）を{" "}
        <code className="font-mono">.env.local</code>{" "}
        に設定し、サーバーを起動し直してください。
      </p>
    </section>
  )
}
