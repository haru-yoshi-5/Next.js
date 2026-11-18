import { CodeBlock } from "@/components/learning/code-block"
import {
  ShortPlayer,
  type ShortScene,
} from "@/components/learning/short-player"
import { highlightSourceCode } from "@/lib/source-code"
import { cacheLife } from "next/cache"

// 数値は教材のデモ（data-source.ts）と同じ待ち時間の例
const nodes = [
  {
    id: "author",
    label: "getAuthor()",
    description: "例: 400 ms",
    runtime: "server",
  },
  {
    id: "posts",
    label: "getPosts()",
    description: "例: 600 ms",
    runtime: "server",
  },
] as const

function metrics(totalMs: number, concurrent: number) {
  return [
    { id: "total", label: "合計の待ち時間", value: totalMs, unit: "ms" },
    {
      id: "concurrent",
      label: "同時に待つ取得",
      value: concurrent,
      unit: "件",
    },
  ]
}

const scenes: ShortScene[] = [
  {
    id: "sequential",
    duration: 7000,
    title: "await を順番に書くと？",
    caption:
      "getPosts() は getAuthor() の完了を待ってから始まります。この例では 400 + 600 で、合計 1,000 ms 待ちます。",
    tone: "problem",
    nodes,
    metrics: metrics(1000, 1),
    codeKey: "sequential",
  },
  {
    id: "parallel",
    duration: 8000,
    title: "先に両方を開始する",
    caption:
      "お互いの結果を使わない 2 つの取得を先に呼び出し、`Promise.all` でまとめて待ちます。",
    tone: "explain",
    nodes,
    metrics: metrics(600, 2),
    codeKey: "parallel",
  },
  {
    id: "compare",
    duration: 8000,
    title: "合計は最も遅い取得に近づく",
    caption:
      "待ち時間が重なるため、この例の合計は 1,000 → 600 ms。遅いほうの getPosts() の時間に近づきます。",
    tone: "explain",
    nodes,
    metrics: metrics(600, 2),
    codeKey: "parallel",
  },
  {
    id: "result",
    duration: 7000,
    title: "独立した取得だけを並列に",
    caption:
      "前の結果を使う取得は直列のままにします。`Promise.all` は 1 つでも失敗すると全体が失敗します。",
    tone: "solution",
    nodes,
    metrics: metrics(600, 2),
    codeKey: "parallel",
  },
]

export async function FetchShort() {
  "use cache"
  cacheLife("max")

  const sequentialCode = `export default async function Page() {
  const author = await getAuthor()
  const posts = await getPosts()
  return <Profile author={author} posts={posts} />
}`
  const parallelCode = `export default async function Page() {
  const [author, posts] = await Promise.all([
    getAuthor(),
    getPosts(),
  ])
  return <Profile author={author} posts={posts} />
}`

  const [sequential, parallel] = await Promise.allSettled([
    highlightSourceCode("例/page.tsx", sequentialCode),
    highlightSourceCode("例/page.tsx", parallelCode),
  ])
  const code = {
    sequential:
      sequential.status === "fulfilled" ? (
        <CodeBlock
          key="sequential"
          source={sequential.value}
          runtime={{ runtime: "server", basis: "page" }}
          role="Server Component"
          description="1 つ目が終わるまで 2 つ目は始まらない"
          highlightedLines={[2, 3]}
        />
      ) : null,
    parallel:
      parallel.status === "fulfilled" ? (
        <CodeBlock
          key="parallel"
          source={parallel.value}
          runtime={{ runtime: "server", basis: "page" }}
          role="Server Component"
          description="2 つを同時に開始し、まとめて待つ"
          highlightedLines={[2, 3, 4, 5]}
        />
      ) : null,
  }
  return (
    <ShortPlayer
      label="30秒でわかる 直列と並列のデータ取得"
      metricNote="図の例の待ち時間"
      scenes={scenes}
      code={code}
    />
  )
}
