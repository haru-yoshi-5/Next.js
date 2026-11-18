import { CodeBlock } from "@/components/learning/code-block"
import {
  ShortPlayer,
  type ShortScene,
} from "@/components/learning/short-player"
import { highlightSourceCode } from "@/lib/source-code"
import { cacheLife } from "next/cache"

function nodes(withNext: boolean) {
  return [
    {
      id: "component",
      label: "コンポーネント",
      description: withNext
        ? "Server Components として実行できる"
        : "React で画面の部品を書く",
      runtime: withNext ? "server" : "client",
    },
    {
      id: "routing",
      label: "ルーティング",
      description: withNext
        ? "src/app のフォルダが URL に対応"
        : "URL と画面の対応を自分で組む",
      runtime: withNext ? "server" : "client",
    },
    {
      id: "html",
      label: "HTML",
      description: withNext
        ? "内容の入った HTML をサーバーで作る"
        : "JavaScript の実行後に中身を描画",
      runtime: withNext ? "server" : "client",
    },
  ] as const
}

function metrics(provided: number) {
  return [
    {
      id: "provided",
      label: "Next.js が用意する仕組み",
      value: provided,
      unit: "件",
    },
  ]
}

const scenes: ShortScene[] = [
  {
    id: "react-only",
    duration: 7000,
    title: "React だけでは足りない？",
    caption:
      "React は画面を部品に分けて作るライブラリです。URL ごとの画面の切り替えや、サーバーでの HTML の生成は、別に選んで組み合わせる必要があります。",
    tone: "problem",
    nodes: nodes(false),
    metrics: metrics(0),
    codeKey: "react",
  },
  {
    id: "with-next",
    duration: 8000,
    title: "Next.js がまとめて用意する",
    caption:
      "ルーティング、サーバーでのレンダリング、サーバー側の処理、バンドルの設定。この 4 つを、Next.js が 1 つのプロジェクトにまとめて用意します。",
    tone: "explain",
    nodes: nodes(true),
    metrics: metrics(4),
    codeKey: "page",
  },
  {
    id: "folder-url",
    duration: 8000,
    title: "フォルダが URL になる",
    caption:
      "src/app/learn/what-is-nextjs/page.tsx を置くと、/learn/what-is-nextjs の URL になります。サーバーは内容の入った HTML を返します。",
    tone: "explain",
    nodes: nodes(true),
    metrics: metrics(4),
    codeKey: "page",
  },
  {
    id: "result",
    duration: 7000,
    title: "部品は React、仕組みは Next.js",
    caption:
      "Next.js を使っても、画面の部品は React のコンポーネントとして書きます。Next.js は、それを動かして届ける仕組みを担当します。",
    tone: "solution",
    nodes: nodes(true),
    metrics: metrics(4),
    codeKey: "page",
  },
]

export async function WhatIsShort() {
  "use cache"
  cacheLife("max")

  const reactCode = `import { createRoot } from "react-dom/client"
import { App } from "./app"

// URL ごとの画面の切り替えや HTML の生成は、別に用意する
createRoot(document.getElementById("root")!).render(<App />)`
  const pageCode = `// src/app/learn/what-is-nextjs/page.tsx
export default function Page() {
  return <h1>Next.jsとは</h1>
}`

  const [react, page] = await Promise.allSettled([
    highlightSourceCode("例/main.tsx", reactCode),
    highlightSourceCode("例/page.tsx", pageCode),
  ])
  const code = {
    react:
      react.status === "fulfilled" ? (
        <CodeBlock
          key="react"
          source={react.value}
          runtime={{ runtime: "client", basis: "React だけの場合" }}
          role="ブラウザで描画"
          description="React だけで作る場合の入口（例）"
          highlightedLines={[4, 5]}
        />
      ) : null,
    page:
      page.status === "fulfilled" ? (
        <CodeBlock
          key="page"
          source={page.value}
          runtime={{ runtime: "server", basis: "page" }}
          role="Server Component"
          description="ファイルを置いた場所が URL になる"
          highlightedLines={[1, 2]}
        />
      ) : null,
  }
  return (
    <ShortPlayer
      label="30秒でわかる Next.js の役割"
      metricNote="この図の例"
      scenes={scenes}
      code={code}
    />
  )
}
