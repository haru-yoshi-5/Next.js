import { CodeBlock } from "@/components/learning/code-block"
import {
  ShortPlayer,
  type ShortScene,
} from "@/components/learning/short-player"
import { highlightSourceCode } from "@/lib/source-code"
import { cacheLife } from "next/cache"

function nodes(stage: number) {
  return [
    {
      id: "prerendered",
      label: "articles/1",
      description:
        stage >= 2 ? "ビルド時に作った HTML が届く" : "params は { id: '1' }",
      runtime: "server",
    },
    {
      id: "runtime",
      label: "articles/42",
      description:
        stage >= 3 ? "App Shell の後に記事が届く" : "params は { id: '42' }",
      runtime: "server",
    },
    {
      id: "missing",
      label: "articles/999",
      description:
        stage >= 4 ? "not-found（200 と noindex）" : "params は { id: '999' }",
      runtime: "server",
    },
  ] as const
}

function metrics(prerendered: number) {
  return [
    {
      id: "prerendered",
      label: "ビルド時に作るページ",
      value: prerendered,
      unit: "件",
    },
  ]
}

const scenes: ShortScene[] = [
  {
    id: "params",
    duration: 7000,
    title: "URL の値を受け取るには？",
    caption:
      "フォルダ名を [id] にすると、/articles/42 の 42 を params で受け取れます。値は誰でも入力できる文字列なので、サーバー側で確かめます。",
    tone: "problem",
    nodes: nodes(1),
    metrics: metrics(0),
    codeKey: "page",
  },
  {
    id: "static-params",
    duration: 8000,
    title: "事前に作る値を決める",
    caption:
      "generateStaticParams で返した 1〜3 は、ビルド時にプリレンダーされます。完成した HTML がまとめて届きます。",
    tone: "explain",
    nodes: nodes(2),
    metrics: metrics(3),
    codeKey: "static",
  },
  {
    id: "shell",
    duration: 8000,
    title: "返していない値も表示できる",
    caption:
      "Cache Components では、返していない値も同じ URL で表示できます。loading.tsx を含む App Shell が先に届き、記事が応答の続きとして届きます。",
    tone: "explain",
    nodes: nodes(3),
    metrics: metrics(3),
    codeKey: "page",
  },
  {
    id: "not-found",
    duration: 7000,
    title: "notFound() でもステータスは 200",
    caption:
      "存在しない値では notFound() で not-found.tsx を表示します。App Shell を送った後なのでステータスは 200 のまま。代わりに noindex が付きます。",
    tone: "solution",
    nodes: nodes(4),
    metrics: metrics(3),
    codeKey: "page",
  },
]

export async function DynamicRoutesShort() {
  "use cache"
  cacheLife("max")

  const pageCode = `export default async function ArticlePage({
  params,
}: PageProps<"/learn/dynamic-routes/articles/[id]">) {
  const { id } = await params
  const article = findArticle(id)
  if (!article) notFound()
  return <h1>{article.title}</h1>
}`
  const staticCode = `// 1〜3 をビルド時にプリレンダーする
export function generateStaticParams() {
  return ["1", "2", "3"].map((id) => ({ id }))
}`

  const [pageSource, staticSource] = await Promise.allSettled([
    highlightSourceCode("例/articles/[id]/page.tsx", pageCode),
    highlightSourceCode("例/articles/[id]/page.tsx", staticCode),
  ])
  const code = {
    page:
      pageSource.status === "fulfilled" ? (
        <CodeBlock
          key="page"
          source={pageSource.value}
          runtime={{ runtime: "server", basis: "page" }}
          role="Server Component"
          description="params を await して、値を確かめる"
          highlightedLines={[4, 5, 6]}
        />
      ) : null,
    static:
      staticSource.status === "fulfilled" ? (
        <CodeBlock
          key="static"
          source={staticSource.value}
          runtime={{ runtime: "server", basis: "page" }}
          role="ビルド時に実行"
          description="返した値のページを事前に作る"
          highlightedLines={[2, 3]}
        />
      ) : null,
  }
  return (
    <ShortPlayer
      label="30秒でわかる Dynamic Routes"
      metricNote="この図の例"
      scenes={scenes}
      code={code}
    />
  )
}
