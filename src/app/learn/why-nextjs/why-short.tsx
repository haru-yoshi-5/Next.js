import { CodeBlock } from "@/components/learning/code-block"
import {
  ShortPlayer,
  type ShortScene,
} from "@/components/learning/short-player"
import { highlightSourceCode } from "@/lib/source-code"
import { cacheLife } from "next/cache"

type Runtime = "server" | "client"

function nodes(article: Runtime, highlight: Runtime) {
  return [
    {
      id: "article",
      label: "解説の本文",
      description:
        article === "server"
          ? "ビルド時に HTML にしておく"
          : "JavaScript を待ってから表示",
      runtime: article,
    },
    {
      id: "highlight",
      label: "コードの色付け",
      description:
        highlight === "server"
          ? "server-only のファイルで行う"
          : "色付けの処理もブラウザへ送る",
      runtime: highlight,
    },
    {
      id: "demo",
      label: "デモのボタン",
      description: "操作に反応する",
      runtime: "client",
    },
  ] as const
}

function metrics(browserParts: number) {
  return [
    {
      id: "browser",
      label: "ブラウザで実行する部品",
      value: browserParts,
      unit: "個",
    },
  ]
}

const scenes: ShortScene[] = [
  {
    id: "all-client",
    duration: 7000,
    title: "全部ブラウザで作ると？",
    caption:
      "本文も、コードの色付けも、ブラウザで JavaScript を実行してから表示します。読むだけの部分も、JavaScript を待つことになります。",
    tone: "problem",
    nodes: nodes("client", "client"),
    metrics: metrics(3),
    codeKey: "client",
  },
  {
    id: "article",
    duration: 8000,
    title: "本文を先に届ける",
    caption:
      "先に用意できる本文は、ビルド時に HTML にしておきます。JavaScript を待たずに読めます。",
    tone: "explain",
    nodes: nodes("server", "client"),
    metrics: metrics(2),
    codeKey: "server",
  },
  {
    id: "highlight",
    duration: 8000,
    title: "ブラウザの仕事を絞る",
    caption:
      "コードの色付けもサーバーで済ませ、完成した UI を渡します。ブラウザで動かすのは、操作が必要なデモだけになります。",
    tone: "explain",
    nodes: nodes("server", "server"),
    metrics: metrics(1),
    codeKey: "server",
  },
  {
    id: "result",
    duration: 7000,
    title: "選べることが利点",
    caption:
      "Next.js なら必ず速くなるわけではありません。どこを先に作るかを選べることが利点です。静的なページだけなら、より小さい構成で足りることもあります。",
    tone: "solution",
    nodes: nodes("server", "server"),
    metrics: metrics(1),
    codeKey: "server",
  },
]

export async function WhyShort() {
  "use cache"
  cacheLife("max")

  const clientCode = `"use client"

import { useEffect, useState } from "react"

export default function Page() {
  const [lesson, setLesson] = useState<Lesson | null>(null)
  useEffect(() => {
    getLesson().then(setLesson)
  }, [])
  return lesson ? <Article lesson={lesson} /> : <p>読み込み中…</p>
}`
  const serverCode = `export default async function Page() {
  const lesson = await getLesson()
  return (
    <>
      <Article lesson={lesson} />
      <DemoButton />
    </>
  )
}`

  const [client, server] = await Promise.allSettled([
    highlightSourceCode("例/page.tsx", clientCode),
    highlightSourceCode("例/page.tsx", serverCode),
  ])
  const code = {
    client:
      client.status === "fulfilled" ? (
        <CodeBlock
          key="client"
          source={client.value}
          runtime={{ runtime: "client", basis: "use client" }}
          role="Client Component"
          description="取得も表示もブラウザで行う"
          highlightedLines={[1, 7, 8, 9]}
        />
      ) : null,
    server:
      server.status === "fulfilled" ? (
        <CodeBlock
          key="server"
          source={server.value}
          runtime={{ runtime: "server", basis: "page" }}
          role="Server Component"
          description="本文はサーバー、操作だけをブラウザへ"
          highlightedLines={[1, 2, 5, 6]}
        />
      ) : null,
  }
  return (
    <ShortPlayer
      label="30秒でわかる Next.js を使う理由"
      metricNote="図の例の部品数"
      scenes={scenes}
      code={code}
    />
  )
}
