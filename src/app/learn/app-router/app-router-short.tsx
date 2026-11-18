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
  description: "共通の枠。移動しても保たれる",
  runtime: "server",
} as const
const page = {
  id: "page",
  label: "page.tsx",
  description: "URL ごとの画面",
  runtime: "server",
} as const
const link = {
  id: "link",
  label: "<Link>",
  description: "クリックで移動する",
  runtime: "client",
} as const

const scenes: ShortScene[] = [
  {
    id: "folder",
    duration: 7000,
    title: "URL はどう決まる？",
    caption:
      "app フォルダの中のフォルダ 1 つが、URL のセグメント 1 つに対応します。page.tsx を置いたフォルダだけが URL として公開されます。",
    tone: "problem",
    nodes: [layout, page, link],
    metrics: [],
    codeKey: "page",
  },
  {
    id: "layout",
    duration: 8000,
    title: "layout が枠を共有する",
    caption:
      "layout.tsx は、同じフォルダ以下のページを children として受け取り、共通の枠で包みます。",
    tone: "explain",
    nodes: [layout, page, link],
    metrics: [],
    codeKey: "layout",
  },
  {
    id: "navigate",
    duration: 8000,
    title: "移動しても layout は保たれる",
    caption:
      "<Link> で移動すると、ページ全体は読み込み直さず、変化した部分だけを差し替えます。layout は再マウントされず、中の state も残ります。",
    tone: "explain",
    nodes: [layout, page, link],
    metrics: [],
    codeKey: "layout",
  },
  {
    id: "dynamic",
    duration: 7000,
    title: "[slug] で値を受け取る",
    caption:
      "フォルダ名を [slug] にすると、任意の値を params で受け取れます。params は Promise なので await し、データがなければ notFound() を呼びます。",
    tone: "solution",
    nodes: [
      layout,
      {
        ...page,
        label: "[slug]/page.tsx",
        description: "値に応じて切り替わる",
      },
      link,
    ],
    metrics: [],
    codeKey: "dynamic",
  },
]

export async function AppRouterShort() {
  "use cache"
  cacheLife("max")

  const pageCode = `// app/learn/app-router/page.tsx → /learn/app-router
export default function Page() {
  return <p>デモの入口</p>
}`
  const layoutCode = `import Link from "next/link"

export default function Layout({
  children,
}: LayoutProps<"/learn/app-router">) {
  return (
    <section>
      <Link href="/learn/app-router/page-file">page.tsx</Link>
      {children}
    </section>
  )
}`
  const dynamicCode = `import { notFound } from "next/navigation"

export default async function Page({
  params,
}: PageProps<"/learn/app-router/[slug]">) {
  const { slug } = await params
  const route = findDemoRoute(slug)
  if (!route) notFound()
  return <h2>{route.title}</h2>
}`

  const [pageSource, layoutSource, dynamicSource] = await Promise.allSettled([
    highlightSourceCode("例/page.tsx", pageCode),
    highlightSourceCode("例/layout.tsx", layoutCode),
    highlightSourceCode("例/[slug]/page.tsx", dynamicCode),
  ])
  const code = {
    page:
      pageSource.status === "fulfilled" ? (
        <CodeBlock
          key="page"
          source={pageSource.value}
          runtime={{ runtime: "server", basis: "page" }}
          role="Server Component"
          description="フォルダの場所が URL になる"
          highlightedLines={[1]}
        />
      ) : null,
    layout:
      layoutSource.status === "fulfilled" ? (
        <CodeBlock
          key="layout"
          source={layoutSource.value}
          runtime={{ runtime: "server", basis: "layout" }}
          role="Server Component"
          description="children の部分だけがページごとに切り替わる"
          highlightedLines={[8, 9]}
        />
      ) : null,
    dynamic:
      dynamicSource.status === "fulfilled" ? (
        <CodeBlock
          key="dynamic"
          source={dynamicSource.value}
          runtime={{ runtime: "server", basis: "page" }}
          role="Server Component"
          description="params を await して値を受け取る"
          highlightedLines={[6, 8]}
        />
      ) : null,
  }
  return (
    <ShortPlayer label="30秒でわかる App Router" scenes={scenes} code={code} />
  )
}
