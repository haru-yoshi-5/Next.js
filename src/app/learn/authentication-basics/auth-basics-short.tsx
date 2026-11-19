import { CodeBlock } from "@/components/learning/code-block"
import {
  ShortPlayer,
  type ShortScene,
} from "@/components/learning/short-player"
import { highlightSourceCode } from "@/lib/source-code"
import { cacheLife } from "next/cache"

const button = {
  id: "button",
  label: "公開ボタン",
  description: "表示は利用者が変えられる",
  runtime: "client",
} as const
const authn = {
  id: "authn",
  label: "認証",
  description: "誰か？（セッションを検証）",
  runtime: "server",
} as const
const authz = {
  id: "authz",
  label: "認可",
  description: "何をしてよいか？（ロールで判定）",
  runtime: "server",
} as const

const scenes: ShortScene[] = [
  {
    id: "hide",
    duration: 7000,
    title: "ボタンを隠せば守れる？",
    caption:
      "ブラウザの表示は、利用者が自由に変えられます。管理者向けのボタンを隠しても、Server Action はリクエストを組み立てれば直接呼び出せます。",
    tone: "problem",
    nodes: [button, authn, authz],
    metrics: [],
    codeKey: "hidden",
  },
  {
    id: "two-checks",
    duration: 8000,
    title: "認証と認可は別の確認",
    caption:
      "認証は、リクエストを送ってきたのが誰かを確かめること。認可は、その人に操作が許可されているかを確かめることです。どちらもサーバーで行います。",
    tone: "explain",
    nodes: [button, authn, authz],
    metrics: [],
    codeKey: "action",
  },
  {
    id: "session",
    duration: 8000,
    title: "署名付き cookie で覚える",
    caption:
      "ログインした事実は、署名付きの cookie に入れて覚えます。書き換えると署名が一致せず、期限が過ぎれば無効です。署名は暗号化ではありません。",
    tone: "explain",
    nodes: [button, { ...authn, description: "署名と期限を検証する" }, authz],
    metrics: [],
    codeKey: "dal",
  },
  {
    id: "result",
    duration: 7000,
    title: "確認を 1 か所にまとめる",
    caption:
      "検証は getAuthState() にまとめ、どの入口からも使います。React の cache で、1 回の描画では 1 回だけ検証します。",
    tone: "solution",
    nodes: [button, authn, authz],
    metrics: [],
    codeKey: "dal",
  },
]

export async function AuthBasicsShort() {
  "use cache"
  cacheLife("max")

  const hiddenCode = `"use client"

export function AdminTools({ isAdmin }: { isAdmin: boolean }) {
  // 見た目を変えているだけ。Server Action は直接呼び出せる
  if (!isAdmin) return null
  return <button onClick={() => publishNotice()}>お知らせを公開する</button>
}`
  const actionCode = `"use server"

export async function publishNotice() {
  const auth = await getAuthState()
  if (auth.status !== "signed-in") return { error: "ログインしてください" } // 認証
  if (!can(auth.user, "notice:publish")) return { error: "権限がありません" } // 認可
  await saveNotice()
  return { ok: true }
}`
  const dalCode = `import "server-only"
import { cookies } from "next/headers"
import { cache } from "react"

export const getAuthState = cache(async () => {
  const token = (await cookies()).get("session")?.value
  const session = token ? await verifySession(token) : null // 署名・期限を検証
  return session
    ? { status: "signed-in", user: session.user }
    : { status: "signed-out" }
})`

  const [hidden, action, dal] = await Promise.allSettled([
    highlightSourceCode("例/admin-tools.tsx", hiddenCode),
    highlightSourceCode("例/actions.ts", actionCode),
    highlightSourceCode("例/dal.ts", dalCode),
  ])
  const code = {
    hidden:
      hidden.status === "fulfilled" ? (
        <CodeBlock
          key="hidden"
          source={hidden.value}
          runtime={{ runtime: "client", basis: "use client" }}
          role="Client Component"
          description="ボタンを隠しても守りにはならない"
          highlightedLines={[4, 5]}
        />
      ) : null,
    action:
      action.status === "fulfilled" ? (
        <CodeBlock
          key="action"
          source={action.value}
          runtime={{ runtime: "server", basis: "use server" }}
          role="Server Action"
          description="処理の前に、認証と認可を順に確かめる"
          highlightedLines={[5, 6]}
        />
      ) : null,
    dal:
      dal.status === "fulfilled" ? (
        <CodeBlock
          key="dal"
          source={dal.value}
          runtime={{ runtime: "server", basis: "server-only" }}
          role="サーバー専用"
          description="セッションの検証を 1 か所にまとめる"
          highlightedLines={[5, 7]}
        />
      ) : null,
  }
  return (
    <ShortPlayer label="30秒でわかる 認証と認可" scenes={scenes} code={code} />
  )
}
