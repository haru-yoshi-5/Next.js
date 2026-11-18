import { CodeBlock } from "@/components/learning/code-block"
import {
  ShortPlayer,
  type ShortScene,
} from "@/components/learning/short-player"
import { highlightSourceCode } from "@/lib/source-code"
import { cacheLife } from "next/cache"

const page = {
  id: "page",
  label: "Page",
  description: "React の Server Component",
  runtime: "server",
} as const
const counter = {
  id: "counter",
  label: "Counter",
  description: "React の state を持つ",
  runtime: "client",
} as const
const hydrated = {
  ...counter,
  description: "初回の HTML はサーバーでも描画",
}

const scenes: ShortScene[] = [
  {
    id: "react",
    duration: 7000,
    title: "どこまでが React？",
    caption:
      "コンポーネント、state、ハイドレーション、Suspense は React の仕組みです。Server Components も React の機能です。",
    tone: "problem",
    nodes: [page, counter],
    metrics: [],
    codeKey: "page",
  },
  {
    id: "next",
    duration: 8000,
    title: "Next.js が組み込む",
    caption:
      "どの URL でどの部品を描画するか、ビルド時かリクエスト時か、HTML と RSC Payload をどう届けるか。これを Next.js が決めます。",
    tone: "explain",
    nodes: [page, counter],
    metrics: [],
    codeKey: "page",
  },
  {
    id: "use-client",
    duration: 8000,
    title: '"use client" は境界の印',
    caption:
      '"use client" はブラウザだけで動かす宣言ではありません。Client Component も初回の HTML はサーバーで作られ、ブラウザでハイドレーションされます。',
    tone: "explain",
    nodes: [page, hydrated],
    metrics: [],
    codeKey: "counter",
  },
  {
    id: "result",
    duration: 7000,
    title: "仕組みは React、組み込みは Next.js",
    caption:
      "App Router は、Next.js に同梱された React を使います。package.json の react は、型やツールとの互換性のために書いておきます。",
    tone: "solution",
    nodes: [page, hydrated],
    metrics: [],
    codeKey: "counter",
  },
]

export async function ReactShort() {
  "use cache"
  cacheLife("max")

  const pageCode = `import { Counter } from "./counter"

// どの URL で描画するかは、ファイルの場所で Next.js が決める
export default function Page() {
  return <Counter />
}`
  const counterCode = `"use client"

import { useState } from "react"

export function Counter() {
  const [count, setCount] = useState(0)
  return <button onClick={() => setCount(count + 1)}>{count}</button>
}`

  const [pageSource, counterSource] = await Promise.allSettled([
    highlightSourceCode("例/page.tsx", pageCode),
    highlightSourceCode("例/counter.tsx", counterCode),
  ])
  const code = {
    page:
      pageSource.status === "fulfilled" ? (
        <CodeBlock
          key="page"
          source={pageSource.value}
          runtime={{ runtime: "server", basis: "page" }}
          role="Server Component"
          description="React の部品を、Next.js が URL に結び付ける"
          highlightedLines={[3, 4, 5]}
        />
      ) : null,
    counter:
      counterSource.status === "fulfilled" ? (
        <CodeBlock
          key="counter"
          source={counterSource.value}
          runtime={{ runtime: "client", basis: "use client" }}
          role="Client Component"
          description="state は React、配信とハイドレーションの起動は Next.js"
          highlightedLines={[1, 6]}
        />
      ) : null,
  }
  return (
    <ShortPlayer
      label="30秒でわかる React と Next.js の分担"
      scenes={scenes}
      code={code}
    />
  )
}
