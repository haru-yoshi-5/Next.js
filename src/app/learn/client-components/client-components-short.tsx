import { CodeBlock } from "@/components/learning/code-block"
import {
  ShortPlayer,
  type ShortScene,
} from "@/components/learning/short-player"
import { highlightSourceCode } from "@/lib/source-code"
import { cacheLife } from "next/cache"

const page = {
  id: "page",
  label: "page.tsx",
  description: "見出しと解説を表示",
  runtime: "server",
} as const

function counter(description: string) {
  return {
    id: "counter",
    label: "CounterDemo",
    description,
    runtime: "client",
  } as const
}

const roundTrips = [
  { id: "server", label: "クリック時のサーバー通信", value: 0, unit: "回" },
]

const scenes: ShortScene[] = [
  {
    id: "why",
    duration: 7000,
    title: 'なぜ "use client" が必要？',
    caption:
      'Server Component は結果だけが届くため、クリックや state を扱えません。それには "use client" が必要です。',
    tone: "problem",
    nodes: [page, counter("state とクリックを扱う")],
    metrics: [],
    codeKey: "counter",
  },
  {
    id: "prerender",
    duration: 8000,
    title: "最初の表示はサーバーで作る",
    caption:
      "Client Component も、初回の HTML はサーバーでプリレンダーされます。表示された時点では、まだクリックに反応しません。",
    tone: "explain",
    nodes: [page, counter("初期値 0 を HTML にする")],
    metrics: [],
    codeKey: "page",
  },
  {
    id: "hydrate",
    duration: 8000,
    title: "ハイドレーションで動き出す",
    caption:
      "JavaScript を読み込み、ハイドレーションでイベントを結び付けます。以降のクリックと state の更新は、サーバーと通信せずブラウザの中で処理されます。",
    tone: "explain",
    nodes: [page, counter("ブラウザで state を更新")],
    metrics: roundTrips,
    codeKey: "counter",
  },
  {
    id: "result",
    duration: 7000,
    title: "Client の範囲は小さく",
    caption:
      "ページ全体を Client にすると、配下のコードがすべてブラウザ向けの JavaScript になります。操作する部分だけを切り出します。",
    tone: "solution",
    nodes: [page, counter("操作する部分だけ")],
    metrics: roundTrips,
    codeKey: "page",
  },
]

export async function ClientComponentsShort() {
  "use cache"
  cacheLife("max")

  const counterCode = `"use client"

import { useState } from "react"

export function CounterDemo() {
  const [count, setCount] = useState(0)
  return <button onClick={() => setCount(count + 1)}>{count}</button>
}`
  const pageCode = `import { CounterDemo } from "./counter-demo"

export default function Page() {
  return (
    <>
      <h1>Client Components</h1>
      <CounterDemo />
    </>
  )
}`

  const [counterSource, pageSource] = await Promise.allSettled([
    highlightSourceCode("例/counter-demo.tsx", counterCode),
    highlightSourceCode("例/page.tsx", pageCode),
  ])
  const code = {
    counter:
      counterSource.status === "fulfilled" ? (
        <CodeBlock
          key="counter"
          source={counterSource.value}
          runtime={{ runtime: "client", basis: "use client" }}
          role="Client Component"
          description="ここから下がブラウザ向けのバンドルに入る"
          highlightedLines={[1, 6, 7]}
        />
      ) : null,
    page:
      pageSource.status === "fulfilled" ? (
        <CodeBlock
          key="page"
          source={pageSource.value}
          runtime={{ runtime: "server", basis: "page" }}
          role="Server Component"
          description="見出しはサーバー、カウンターだけを Client に"
          highlightedLines={[6, 7]}
        />
      ) : null,
  }
  return (
    <ShortPlayer
      label="30秒でわかる Client Components"
      metricNote="この図の例"
      scenes={scenes}
      code={code}
    />
  )
}
