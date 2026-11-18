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
  description: "Suspense の外側。そのまま操作できる",
  runtime: "server",
} as const
const loading = {
  id: "loading",
  label: "loading.tsx",
  description: "待つ間の表示（fallback）",
  runtime: "server",
} as const
const page = {
  id: "page",
  label: "page.tsx",
  description: "描画に約 1.5 秒かかる",
  runtime: "server",
} as const

const scenes: ShortScene[] = [
  {
    id: "no-loading",
    duration: 7000,
    title: "遷移先の描画が遅いと？",
    caption:
      "loading.tsx も <Suspense> もないと、待ちの表示がありません。page の描画が終わるまで、前の画面が残ります。",
    tone: "problem",
    nodes: [layout, { ...loading, description: "なし" }, page],
    metrics: [],
    codeKey: "page",
  },
  {
    id: "wrap",
    duration: 8000,
    title: "page を Suspense で包む",
    caption:
      "loading.tsx を置くと、同じフォルダの layout の内側に <Suspense> が作られ、loading.tsx がその fallback になります。layout は包まれません。",
    tone: "explain",
    nodes: [layout, loading, page],
    metrics: [],
    codeKey: "structure",
  },
  {
    id: "prefetch",
    duration: 8000,
    title: "遷移した直後に表示できる",
    caption:
      "<Link> が画面に入るとプリフェッチされ、静的な loading.tsx の内容を先に受け取れます。クリックするとすぐに待ちの表示へ切り替わります。",
    tone: "explain",
    nodes: [
      layout,
      { ...loading, description: "プリフェッチで先に受け取る" },
      page,
    ],
    metrics: [],
    codeKey: "loading",
  },
  {
    id: "result",
    duration: 7000,
    title: "page 内の Suspense と使い分ける",
    caption:
      "loading.tsx は page 全体を 1 つの待ちの表示に置き換えます。すぐ出せる見出しがあるなら、page の中で遅い部分だけを <Suspense> で囲みます。",
    tone: "solution",
    nodes: [layout, loading, page],
    metrics: [],
    codeKey: "loading",
  },
]

export async function LoadingFileShort() {
  "use cache"
  cacheLife("max")

  const pageCode = `export default async function Page() {
  const report = await getSlowReport() // 約 1.5 秒
  return <Report report={report} />
}`
  const structureCode = `// loading.tsx を置くと、次のように組み立てられる（イメージ）
<Layout>
  <Suspense fallback={<Loading />}>
    <Page />
  </Suspense>
</Layout>`
  const loadingCode = `// page.tsx と同じフォルダに置く
export default function Loading() {
  return <p>レポートを読み込み中…</p>
}`

  const [pageSource, structureSource, loadingSource] = await Promise.allSettled(
    [
      highlightSourceCode("例/page.tsx", pageCode),
      highlightSourceCode("例/組み立て.tsx", structureCode),
      highlightSourceCode("例/loading.tsx", loadingCode),
    ],
  )
  const code = {
    page:
      pageSource.status === "fulfilled" ? (
        <CodeBlock
          key="page"
          source={pageSource.value}
          runtime={{ runtime: "server", basis: "page" }}
          role="Server Component"
          description="描画が終わるまで表示が切り替わらない"
          highlightedLines={[2]}
        />
      ) : null,
    structure:
      structureSource.status === "fulfilled" ? (
        <CodeBlock
          key="structure"
          source={structureSource.value}
          runtime={{ runtime: "server", basis: "loading.tsx" }}
          role="Next.js の組み立て"
          description="layout の内側に Suspense が入る"
          highlightedLines={[3, 4, 5]}
        />
      ) : null,
    loading:
      loadingSource.status === "fulfilled" ? (
        <CodeBlock
          key="loading"
          source={loadingSource.value}
          runtime={{ runtime: "server", basis: "loading.tsx" }}
          role="Server Component"
          description="ファイルを置くだけで用意できる"
          highlightedLines={[2, 3]}
        />
      ) : null,
  }
  return (
    <ShortPlayer label="30秒でわかる loading.tsx" scenes={scenes} code={code} />
  )
}
