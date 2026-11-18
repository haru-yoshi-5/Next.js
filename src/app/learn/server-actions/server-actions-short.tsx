import { CodeBlock } from "@/components/learning/code-block"
import {
  ShortPlayer,
  type ShortScene,
} from "@/components/learning/short-player"
import { highlightSourceCode } from "@/lib/source-code"
import { cacheLife } from "next/cache"

const form = {
  id: "form",
  label: "NameForm",
  description: "フォームを送信する",
  runtime: "client",
} as const
const action = {
  id: "action",
  label: "saveName()",
  description: "use server の関数",
  runtime: "server",
} as const
const list = {
  id: "list",
  label: "GuestbookList",
  description: 'cacheTag("guestbook") でキャッシュ',
  runtime: "server",
} as const

const scenes: ShortScene[] = [
  {
    id: "define",
    duration: 7000,
    title: "フォームの送信先は？",
    caption:
      '"use server" で定義した関数は、フォームにそのまま渡せる Server Action になります。ブラウザには関数の本体ではなく、呼び出すための参照だけが届きます。',
    tone: "problem",
    nodes: [form, action, list],
    metrics: [],
    codeKey: "action",
  },
  {
    id: "post",
    duration: 8000,
    title: "POST でサーバーの関数を呼ぶ",
    caption:
      "送信すると、Server Action の ID とフォームデータが POST で送られ、サーバーで saveName が実行されます。useActionState で戻り値と送信中の状態を受け取れます。",
    tone: "explain",
    nodes: [form, action, list],
    metrics: [],
    codeKey: "form",
  },
  {
    id: "validate",
    duration: 8000,
    title: "検証はサーバーで行う",
    caption:
      "Server Action は、直接 POST を送っても呼び出せます。ブラウザ側の制限は外せるので、入力の検証と認可は必ずサーバー側で行います。",
    tone: "explain",
    nodes: [form, { ...action, description: "入力を検証してから保存" }, list],
    metrics: [],
    codeKey: "action",
  },
  {
    id: "update",
    duration: 7000,
    title: "1 回の往復で新しい画面",
    caption:
      "updateTag で一覧のキャッシュを期限切れにすると、戻り値と更新後の画面が 1 回の応答で返ります。",
    tone: "solution",
    nodes: [
      form,
      { ...action, description: 'updateTag("guestbook")' },
      { ...list, description: "新しいデータで描画し直す" },
    ],
    metrics: [
      {
        id: "round-trip",
        label: "保存から新しい画面までの往復",
        value: 1,
        unit: "回",
      },
    ],
    codeKey: "action",
  },
]

export async function ServerActionsShort() {
  "use cache"
  cacheLife("max")

  const actionCode = `"use server"

import { updateTag } from "next/cache"

export async function saveName(prevState: State, formData: FormData) {
  const name = validateName(formData.get("name"))
  if (!name) return { message: "名前を確認してください" }
  await addName(name)
  updateTag("guestbook")
  return { message: "保存しました" }
}`
  const formCode = `"use client"

import { useActionState } from "react"
import { saveName } from "./actions"

export function NameForm() {
  const [state, action, isPending] = useActionState(saveName, initialState)
  return (
    <form action={action}>
      <input name="name" />
      <button disabled={isPending}>保存する</button>
      <p>{state.message}</p>
    </form>
  )
}`

  const [actionSource, formSource] = await Promise.allSettled([
    highlightSourceCode("例/actions.ts", actionCode),
    highlightSourceCode("例/name-form.tsx", formCode),
  ])
  const code = {
    action:
      actionSource.status === "fulfilled" ? (
        <CodeBlock
          key="action"
          source={actionSource.value}
          runtime={{ runtime: "server", basis: "use server" }}
          role="Server Action"
          description="検証 → 保存 → キャッシュの更新"
          highlightedLines={[1, 6, 7, 9]}
        />
      ) : null,
    form:
      formSource.status === "fulfilled" ? (
        <CodeBlock
          key="form"
          source={formSource.value}
          runtime={{ runtime: "client", basis: "use client" }}
          role="Client Component"
          description="form の action に Server Action を渡す"
          highlightedLines={[7, 9]}
        />
      ) : null,
  }
  return (
    <ShortPlayer
      label="30秒でわかる Server Actions"
      metricNote="この図の例"
      scenes={scenes}
      code={code}
    />
  )
}
