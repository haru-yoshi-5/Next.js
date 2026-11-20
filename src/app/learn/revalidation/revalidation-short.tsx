import { CodeBlock } from "@/components/learning/code-block"
import {
  ShortPlayer,
  type ShortScene,
} from "@/components/learning/short-player"
import { highlightSourceCode } from "@/lib/source-code"
import { cacheLife } from "next/cache"

const update = {
  id: "update",
  label: "updateTag",
  description: "すぐ期限切れ。次は新しい値を待つ",
  runtime: "server",
} as const
const revalidate = {
  id: "revalidate",
  label: "revalidateTag",
  description: "古い値を返しつつ裏で作り直す",
  runtime: "server",
} as const
const path = {
  id: "path",
  label: "revalidatePath",
  description: "パス単位で無効にする",
  runtime: "server",
} as const
const nodes = [update, revalidate, path]

const scenes: ShortScene[] = [
  {
    id: "when",
    duration: 7000,
    title: "いつ作り直す？",
    caption:
      "キャッシュの作り直しは、cacheLife で期間を決める方法と、データの更新に合わせて指示する方法があります。2 つは併用できます。",
    tone: "problem",
    nodes,
    metrics: [],
    codeKey: "tag",
  },
  {
    id: "update",
    duration: 8000,
    title: "updateTag はすぐ反映",
    caption:
      "updateTag は Server Action 専用です。すぐに期限切れにし、次の読み取りは新しい値を待ちます。自分の変更をすぐ見せたいときに使います。",
    tone: "explain",
    nodes,
    metrics: [],
    codeKey: "update",
  },
  {
    id: "revalidate",
    duration: 8000,
    title: "revalidateTag は裏で更新",
    caption:
      'revalidateTag(tag, "max") は stale-while-revalidate です。古い値を返しながら裏で作り直します。第 2 引数は必須です。',
    tone: "explain",
    nodes,
    metrics: [],
    codeKey: "revalidate",
  },
  {
    id: "result",
    duration: 7000,
    title: "対象に合わせて選ぶ",
    caption:
      "revalidatePath は指定したパスだけが対象です。複数のページで使うデータにはタグを使います。デプロイ先によっては、反映に時間差が出ます。",
    tone: "solution",
    nodes,
    metrics: [],
    codeKey: "path",
  },
]

export async function RevalidationShort() {
  "use cache"
  cacheLife("max")

  const tagCode = `import { cacheLife, cacheTag } from "next/cache"

export async function getSharedData() {
  "use cache"
  cacheLife("hours") // 時間ベース
  cacheTag("revalidation-demo") // オンデマンドで失効させる目印
  return await loadData()
}`
  const actionsCode = `"use server"

import { revalidatePath, revalidateTag, updateTag } from "next/cache"

export async function expire(kind: "update" | "revalidate" | "path") {
  if (kind === "update") updateTag("revalidation-demo")
  if (kind === "revalidate") revalidateTag("revalidation-demo", "max")
  if (kind === "path") revalidatePath("/learn/revalidation")
}`

  const [tag, actions] = await Promise.allSettled([
    highlightSourceCode("例/shared-data.ts", tagCode),
    highlightSourceCode("例/actions.ts", actionsCode),
  ])
  // 同じコードを、場面ごとに強調する行を変えて見せる
  const actionsBlock = (
    key: string,
    description: string,
    highlightedLines: number[],
  ) =>
    actions.status === "fulfilled" ? (
      <CodeBlock
        key={key}
        source={actions.value}
        runtime={{ runtime: "server", basis: "use server" }}
        role="Server Action"
        description={description}
        highlightedLines={highlightedLines}
      />
    ) : null
  const code = {
    tag:
      tag.status === "fulfilled" ? (
        <CodeBlock
          key="tag"
          source={tag.value}
          runtime={{ runtime: "server", basis: "use cache" }}
          role="キャッシュする関数"
          description="期間とタグを付けておく"
          highlightedLines={[5, 6]}
        />
      ) : null,
    update: actionsBlock("update", "すぐ期限切れにする", [6]),
    revalidate: actionsBlock("revalidate", "古い値を返しつつ作り直す", [7]),
    path: actionsBlock("path", "指定したパスだけを無効にする", [8]),
  }
  return (
    <ShortPlayer
      label="30秒でわかる Revalidation"
      scenes={scenes}
      code={code}
    />
  )
}
