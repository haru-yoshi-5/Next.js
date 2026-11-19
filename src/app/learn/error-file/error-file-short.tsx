import { CodeBlock } from "@/components/learning/code-block"
import {
  ShortPlayer,
  type ShortScene,
} from "@/components/learning/short-player"
import { highlightSourceCode } from "@/lib/source-code"
import { cacheLife } from "next/cache"

const layout = {
  id: "layout",
  label: "layout.tsx",
  description: "境界の外側。エラーでも残る",
  runtime: "server",
} as const
const page = {
  id: "page",
  label: "page.tsx",
  description: "描画中に throw する",
  runtime: "server",
} as const
const boundary = {
  id: "error",
  label: "error.tsx",
  description: "page を包むエラー境界",
  runtime: "client",
} as const

const scenes: ShortScene[] = [
  {
    id: "throw",
    duration: 7000,
    title: "描画中に throw したら？",
    caption:
      "近くにエラー境界がなければ、エラーは上へ伝わり、より広い範囲の表示が置き換わります。page 1 つのエラーで、周りの画面まで使えなくなります。",
    tone: "problem",
    nodes: [
      { ...layout, description: "エラーが伝わると巻き込まれる" },
      page,
      { ...boundary, description: "なし" },
    ],
    metrics: [],
    codeKey: "page",
  },
  {
    id: "boundary",
    duration: 8000,
    title: "error.tsx がエラー境界になる",
    caption:
      "error.tsx は、同じフォルダの page とその下を React のエラー境界で包みます。同じフォルダの layout は包まないので、外側は残ります。",
    tone: "explain",
    nodes: [layout, page, boundary],
    metrics: [],
    codeKey: "error",
  },
  {
    id: "digest",
    duration: 8000,
    title: "本番では message が伏せられる",
    caption:
      "本番では Server Component のエラーの message が伏せられ、一般的な message と digest が届きます。digest でログと照合します。",
    tone: "explain",
    nodes: [
      layout,
      page,
      { ...boundary, description: "message は伏せられ digest が届く" },
    ],
    metrics: [],
    codeKey: "error",
  },
  {
    id: "retry",
    duration: 7000,
    title: "retry() と reset()",
    caption:
      "retry() は中身をサーバーから取り直して描画し直します。reset() は取り直さず状態だけを消すので、多くの場合は retry() を使います。",
    tone: "solution",
    nodes: [layout, page, { ...boundary, description: "retry() で取り直す" }],
    metrics: [],
    codeKey: "error",
  },
]

export async function ErrorFileShort() {
  "use cache"
  cacheLife("max")

  const pageCode = `export default async function Page() {
  const report = await getInventoryReport()
  if (!report.ok) throw new Error("在庫サーバーに接続できません")
  return <Report report={report} />
}`
  const errorCode = `"use client"

export default function Error({
  error,
  retry,
  reset,
}: {
  error: Error & { digest?: string }
  retry: () => void
  reset: () => void
}) {
  return (
    <div>
      <p>{error.message}（digest: {error.digest}）</p>
      <button onClick={() => retry()}>取り直して表示</button>
      <button onClick={() => reset()}>状態だけを消す</button>
    </div>
  )
}`

  const [pageSource, errorSource] = await Promise.allSettled([
    highlightSourceCode("例/page.tsx", pageCode),
    highlightSourceCode("例/error.tsx", errorCode),
  ])
  const code = {
    page:
      pageSource.status === "fulfilled" ? (
        <CodeBlock
          key="page"
          source={pageSource.value}
          runtime={{ runtime: "server", basis: "page" }}
          role="Server Component"
          description="予期しない障害で throw する"
          highlightedLines={[3]}
        />
      ) : null,
    error:
      errorSource.status === "fulfilled" ? (
        <CodeBlock
          key="error"
          source={errorSource.value}
          runtime={{ runtime: "client", basis: "use client" }}
          role="エラー境界"
          description="エラー境界は Client Component にする"
          highlightedLines={[1, 14, 15]}
        />
      ) : null,
  }
  return (
    <ShortPlayer label="30秒でわかる error.tsx" scenes={scenes} code={code} />
  )
}
