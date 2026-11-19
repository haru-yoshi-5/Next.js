import { CodeBlock } from "@/components/learning/code-block"
import {
  ShortPlayer,
  type ShortScene,
} from "@/components/learning/short-player"
import { highlightSourceCode } from "@/lib/source-code"
import { cacheLife } from "next/cache"

function nodes(withStatus: boolean) {
  return [
    {
      id: "item",
      label: "items/[id]",
      description: withStatus
        ? "同じフォルダの not-found（200）"
        : "同じフォルダの not-found.tsx",
      runtime: "server",
    },
    {
      id: "order",
      label: "orders/[id]",
      description: withStatus
        ? "親フォルダの not-found（200）"
        : "親フォルダの not-found.tsx",
      runtime: "server",
    },
    {
      id: "unmatched",
      label: "一致しない URL",
      description: withStatus
        ? "app/not-found.tsx（404）"
        : "app/not-found.tsx",
      runtime: "server",
    },
  ] as const
}

const scenes: ShortScene[] = [
  {
    id: "call",
    duration: 7000,
    title: "どの not-found.tsx が出る？",
    caption:
      "notFound() を呼ぶと描画が止まり、親のフォルダへさかのぼって、一番近い not-found.tsx が表示されます。",
    tone: "problem",
    nodes: nodes(false),
    metrics: [],
    codeKey: "page",
  },
  {
    id: "nearest",
    duration: 8000,
    title: "近い順にさかのぼる",
    caption:
      "items/[id] は同じフォルダ、orders/[id] は親の not-found.tsx を使い、一致しない URL は app/not-found.tsx です。",
    tone: "explain",
    nodes: nodes(false),
    metrics: [],
    codeKey: "tree",
  },
  {
    id: "status",
    duration: 8000,
    title: "ステータスは 200 のことがある",
    caption:
      "page の中で notFound() を呼んだ時点で送信が始まっていれば、ステータスは 200 のままです。noindex が加わり、検索結果には載りません。",
    tone: "explain",
    nodes: nodes(true),
    metrics: [],
    codeKey: "page",
  },
  {
    id: "proxy",
    duration: 7000,
    title: "本当の 404 は描画の前に",
    caption:
      "proxy.ts で描画の前に確かめ、一致しない URL へ書き換えると 404 を返せます。表示されるのは app/not-found.tsx です。",
    tone: "solution",
    nodes: nodes(true),
    metrics: [],
    codeKey: "proxy",
  },
]

export async function NotFoundShort() {
  "use cache"
  cacheLife("max")

  const pageCode = `import { notFound } from "next/navigation"

export default async function ItemPage({
  params,
}: PageProps<"/learn/not-found-file/items/[id]">) {
  const { id } = await params
  const item = findItem(id)
  if (!item) notFound() // 一番近い not-found.tsx を表示する
  return <h1>{item.name}</h1>
}`
  const treeCode = `// app/learn/not-found-file/
//   not-found.tsx         ← orders/[id] はここまでさかのぼる
//   items/[id]/
//     page.tsx
//     not-found.tsx       ← items/[id] はここを使う
//   orders/[id]/
//     page.tsx            （not-found.tsx なし）`
  const proxyCode = `// matcher で /learn/not-found-file/checked/:id だけを対象にする
export async function proxy(request: NextRequest) {
  const id = request.nextUrl.pathname.slice(CHECKED_PREFIX.length)
  // 描画の前に確かめ、ない場合はどのルートにも一致しない URL へ書き換える
  const destination = findItem(id)
    ? \`\${BASE_PATH}/items/\${id}\`
    : \`\${BASE_PATH}/_missing\`
  return NextResponse.rewrite(new URL(destination, request.url))
}`

  const [pageSource, treeSource, proxySource] = await Promise.allSettled([
    highlightSourceCode("例/items/[id]/page.tsx", pageCode),
    highlightSourceCode("例/フォルダ構成.ts", treeCode),
    highlightSourceCode("例/proxy.ts", proxyCode),
  ])
  const code = {
    page:
      pageSource.status === "fulfilled" ? (
        <CodeBlock
          key="page"
          source={pageSource.value}
          runtime={{ runtime: "server", basis: "page" }}
          role="Server Component"
          description="見つからなければ notFound() を呼ぶ"
          highlightedLines={[8]}
        />
      ) : null,
    tree:
      treeSource.status === "fulfilled" ? (
        <CodeBlock
          key="tree"
          source={treeSource.value}
          runtime={{ runtime: "server", basis: "フォルダ構成" }}
          role="フォルダ構成"
          description="一番近い not-found.tsx が選ばれる"
          highlightedLines={[2, 5]}
        />
      ) : null,
    proxy:
      proxySource.status === "fulfilled" ? (
        <CodeBlock
          key="proxy"
          source={proxySource.value}
          runtime={{ runtime: "server", basis: "proxy.ts" }}
          role="Proxy"
          description="送信を始める前に確かめる"
          highlightedLines={[4, 5, 6, 7, 8]}
        />
      ) : null,
  }
  return (
    <ShortPlayer
      label="30秒でわかる not-found.tsx"
      scenes={scenes}
      code={code}
    />
  )
}
