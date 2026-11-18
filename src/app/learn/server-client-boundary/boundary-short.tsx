import { CodeBlock } from "@/components/learning/code-block"
import {
  ShortPlayer,
  type ShortScene,
} from "@/components/learning/short-player"
import { highlightSourceCode } from "@/lib/source-code"
import { cacheLife } from "next/cache"

const details = { id: "details", label: "Details", description: "内容を表示" }
const likeButton = {
  id: "like",
  label: "LikeButton",
  description: "クリックで操作",
  runtime: "client",
} as const
const splitNodes = [{ ...details, runtime: "server" }, likeButton] as const

function metrics(clientCount: number) {
  return [
    { id: "client", label: "Client 境界内", value: clientCount, unit: "部品" },
    { id: "click", label: "操作する部品", value: 1, unit: "部品" },
  ]
}

const scenes: ShortScene[] = [
  {
    id: "wide",
    duration: 7000,
    title: "境界が広いと？",
    caption:
      "表示だけの Details と操作する LikeButton の両方が、page の import を通じてブラウザ向け JavaScript の対象に入ります。",
    tone: "problem",
    nodes: [{ ...details, runtime: "client" }, likeButton],
    metrics: metrics(2),
    codeKey: "wide",
  },
  {
    id: "split",
    duration: 8000,
    title: "境界をボタンへ移す",
    caption:
      "Server Component の page で両方を並べ、`use client` を LikeButton のファイルに移します。",
    tone: "explain",
    nodes: splitNodes,
    metrics: metrics(1),
    codeKey: "split",
  },
  {
    id: "compare",
    duration: 8000,
    title: "表示も操作もそのまま",
    caption:
      "この例でブラウザ向け JavaScript の対象は 2 → 1。Details の描画結果は届き、ボタンは引き続き操作できます。",
    tone: "explain",
    nodes: splitNodes,
    metrics: metrics(1),
    codeKey: "split",
  },
  {
    id: "result",
    duration: 7000,
    title: "役割に合わせて分ける",
    caption:
      "表示は Server、操作は Client。初回の HTML は Client Component も含めサーバーで作られます。",
    tone: "solution",
    nodes: splitNodes,
    metrics: metrics(1),
    codeKey: "split",
  },
]

export async function BoundaryShort() {
  "use cache"
  cacheLife("max")

  const pageCode = `import { Details } from "./details"
import { LikeButton } from "./like-button"

export default function Page() {
  return <><Details /><LikeButton /></>
}`
  const buttonCode = `"use client"

import { useState } from "react"

export function LikeButton() {
  const [liked, setLiked] = useState(false)
  return <button aria-pressed={liked}
    onClick={() => setLiked(!liked)}>いいね</button>
}`

  const [wide, splitPage, splitButton] = await Promise.allSettled([
    highlightSourceCode("例/page.tsx", `"use client"\n\n${pageCode}`),
    highlightSourceCode("例/page.tsx", pageCode),
    highlightSourceCode("例/like-button.tsx", buttonCode),
  ])
  const code = {
    wide:
      wide.status === "fulfilled" ? (
        <CodeBlock
          key="wide-page"
          source={wide.value}
          runtime={{ runtime: "client", basis: "use client" }}
          role="Client 境界"
          description="page が両方の部品を import"
          highlightedLines={[1, 3, 4]}
        />
      ) : null,
    split:
      splitPage.status === "fulfilled" && splitButton.status === "fulfilled" ? (
        <div key="split" className="grid gap-2 lg:grid-cols-2">
          <CodeBlock
            key="split-page"
            source={splitPage.value}
            runtime={{ runtime: "server", basis: "page" }}
            role="Server Component"
            description="Server 側から両方を組み合わせる"
            highlightedLines={[1, 2, 5]}
          />
          <CodeBlock
            key="split-button"
            source={splitButton.value}
            runtime={{ runtime: "client", basis: "use client" }}
            role="Client Component"
            description="ここから先が Client 境界"
            highlightedLines={[1, 8]}
          />
        </div>
      ) : null,
  }
  return (
    <ShortPlayer
      label="30秒でわかる Server と Client の境界"
      metricNote="図の例の部品数"
      scenes={scenes}
      code={code}
    />
  )
}
