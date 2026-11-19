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
  description: "既定で Server Component",
  runtime: "server",
} as const
const snapshot = {
  id: "snapshot",
  label: "ServerSnapshot",
  description: "async で直接データを取得",
  runtime: "server",
} as const
const refresh = {
  id: "refresh",
  label: "RefreshButton",
  description: "クリックを扱う",
  runtime: "client",
} as const

const metrics = [
  {
    id: "browser",
    label: "コードをブラウザへ送る部品",
    value: 1,
    unit: "個",
  },
]

const scenes: ShortScene[] = [
  {
    id: "default",
    duration: 7000,
    title: "部品はどこで動く？",
    caption:
      'page や layout は既定で Server です。"use client" のファイルとその import 先が Client です。',
    tone: "problem",
    nodes: [page, snapshot, refresh],
    metrics,
    codeKey: "snapshot",
  },
  {
    id: "async",
    duration: 8000,
    title: "async で直接取得する",
    caption:
      "Server Component は async 関数にでき、await でデータベースや API から直接取得できます。取得用の API を別に作る必要はありません。",
    tone: "explain",
    nodes: [page, snapshot, refresh],
    metrics,
    codeKey: "snapshot",
  },
  {
    id: "secret",
    duration: 8000,
    title: "秘密情報はブラウザへ送らない",
    caption:
      "Server Component のコードはブラウザへ送られず、結果だけが HTML と RSC Payload として届きます。API キーを使う処理も書けます。",
    tone: "explain",
    nodes: [
      page,
      { ...snapshot, description: "API キーを使ってもコードは届かない" },
      refresh,
    ],
    metrics,
    codeKey: "secret",
  },
  {
    id: "result",
    duration: 7000,
    title: "操作する部分だけを Client に",
    caption:
      "useState・onClick・window が必要な部分だけを Client にします。この例では、再レンダリングを頼むボタンだけです。",
    tone: "solution",
    nodes: [page, snapshot, refresh],
    metrics,
    codeKey: "refresh",
  },
]

export async function ServerComponentsShort() {
  "use cache"
  cacheLife("max")

  const snapshotCode = `import { io } from "next/cache"

export async function ServerSnapshot() {
  await io()
  const snapshot = await getSnapshot()
  return <p>取得時刻: {snapshot.fetchedAt}</p>
}`
  const secretCode = `import "server-only"

export async function getSnapshot() {
  const res = await fetch("https://api.example.com/stats", {
    headers: { Authorization: \`Bearer \${process.env.API_KEY}\` },
  })
  return res.json()
}`
  const refreshCode = `"use client"

import { useRouter } from "next/navigation"

export function RefreshButton() {
  const router = useRouter()
  return <button onClick={() => router.refresh()}>再レンダリング</button>
}`

  const [snapshotSource, secretSource, refreshSource] =
    await Promise.allSettled([
      highlightSourceCode("例/server-snapshot.tsx", snapshotCode),
      highlightSourceCode("例/get-snapshot.ts", secretCode),
      highlightSourceCode("例/refresh-button.tsx", refreshCode),
    ])
  const code = {
    snapshot:
      snapshotSource.status === "fulfilled" ? (
        <CodeBlock
          key="snapshot"
          source={snapshotSource.value}
          runtime={{ runtime: "server", basis: "ディレクティブなし" }}
          role="Server Component"
          description="コンポーネントの中で await する"
          highlightedLines={[3, 5]}
        />
      ) : null,
    secret:
      secretSource.status === "fulfilled" ? (
        <CodeBlock
          key="secret"
          source={secretSource.value}
          runtime={{ runtime: "server", basis: "server-only" }}
          role="サーバー専用"
          description="API キーを使う処理もサーバーに置ける"
          highlightedLines={[1, 5]}
        />
      ) : null,
    refresh:
      refreshSource.status === "fulfilled" ? (
        <CodeBlock
          key="refresh"
          source={refreshSource.value}
          runtime={{ runtime: "client", basis: "use client" }}
          role="Client Component"
          description="クリックだけをブラウザで扱う"
          highlightedLines={[1, 7]}
        />
      ) : null,
  }
  return (
    <ShortPlayer
      label="30秒でわかる Server Components"
      metricNote="図の例の部品数"
      scenes={scenes}
      code={code}
    />
  )
}
