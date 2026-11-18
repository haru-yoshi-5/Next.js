import { CodeBlock } from "@/components/learning/code-block"
import {
  ShortPlayer,
  type ShortScene,
} from "@/components/learning/short-player"
import { highlightSourceCode } from "@/lib/source-code"
import { cacheLife } from "next/cache"

function nodes(streamed: boolean) {
  return [
    {
      id: "header",
      label: "Header",
      description: streamed ? "シェルとして先に届く" : "すぐ作れる",
      runtime: "server",
    },
    {
      id: "profile",
      label: "ProfileSection",
      description: streamed ? "約 1 秒後に届く" : "約 1 秒かかる",
      runtime: "server",
    },
    {
      id: "activity",
      label: "ActivitySection",
      description: streamed ? "約 2 秒後に届く" : "約 2 秒かかる",
      runtime: "server",
    },
  ] as const
}

function metrics(waiting: number) {
  return [
    {
      id: "waiting",
      label: "最初の表示の前に待つ部分",
      value: waiting,
      unit: "個",
    },
  ]
}

const scenes: ShortScene[] = [
  {
    id: "blocking",
    duration: 7000,
    title: "一番遅い部分を待つ？",
    caption:
      "Streaming がなければ、一番遅いデータ取得が終わるまで何も送れません。すぐ作れる Header も、遅い部分を待つことになります。",
    tone: "problem",
    nodes: nodes(false),
    metrics: metrics(2),
    codeKey: "blocking",
  },
  {
    id: "shell",
    duration: 8000,
    title: "シェルを先に送る",
    caption:
      "<Suspense> で囲むと、Header と fallback を含むシェルを先に送ります。中身は、描画が終わった時点で同じ応答の続きとして届きます。",
    tone: "explain",
    nodes: nodes(true),
    metrics: metrics(0),
    codeKey: "suspense",
  },
  {
    id: "siblings",
    duration: 8000,
    title: "境界ごとに届く",
    caption:
      "Profile と Activity は別々の境界なので、互いを待ちません。全部が届くまでは 1 + 2 = 3 秒ではなく、約 2 秒です。",
    tone: "explain",
    nodes: nodes(true),
    metrics: metrics(0),
    codeKey: "suspense",
  },
  {
    id: "result",
    duration: 7000,
    title: "loading.tsx と使い分ける",
    caption:
      "loading.tsx は、page 全体を自動で Suspense に包む手軽な方法です。すぐ出せる内容があるなら、遅い部分だけを <Suspense> で囲みます。",
    tone: "solution",
    nodes: nodes(true),
    metrics: metrics(0),
    codeKey: "loading",
  },
]

export async function StreamingShort() {
  "use cache"
  cacheLife("max")

  const blockingCode = `// Suspense がない場合（説明用）
export default function Page() {
  return (
    <>
      <Header />
      <ProfileSection /> {/* 約 1 秒 */}
      <ActivitySection /> {/* 約 2 秒 */}
    </>
  )
}`
  const suspenseCode = `import { Suspense } from "react"

export default function Page() {
  return (
    <>
      <Header />
      <Suspense fallback={<p>Profile を読み込み中…</p>}>
        <ProfileSection />
      </Suspense>
      <Suspense fallback={<p>Activity を読み込み中…</p>}>
        <ActivitySection />
      </Suspense>
    </>
  )
}`
  const loadingCode = `// page.tsx と同じフォルダに置くと、page 全体を Suspense で包む
export default function Loading() {
  return <p>読み込み中…</p>
}`

  const [blocking, suspense, loading] = await Promise.allSettled([
    highlightSourceCode("例/page.tsx", blockingCode),
    highlightSourceCode("例/page.tsx", suspenseCode),
    highlightSourceCode("例/loading.tsx", loadingCode),
  ])
  const code = {
    blocking:
      blocking.status === "fulfilled" ? (
        <CodeBlock
          key="blocking"
          source={blocking.value}
          runtime={{ runtime: "server", basis: "page" }}
          role="Server Component"
          description="遅い部分がページ全体の表示を止める"
          highlightedLines={[6, 7]}
        />
      ) : null,
    suspense:
      suspense.status === "fulfilled" ? (
        <CodeBlock
          key="suspense"
          source={suspense.value}
          runtime={{ runtime: "server", basis: "page" }}
          role="Server Component"
          description="Suspense の境界が分割点になる"
          highlightedLines={[7, 10]}
        />
      ) : null,
    loading:
      loading.status === "fulfilled" ? (
        <CodeBlock
          key="loading"
          source={loading.value}
          runtime={{ runtime: "server", basis: "loading.tsx" }}
          role="Server Component"
          description="ページ全体のスケルトンを手軽に出す"
          highlightedLines={[1, 2]}
        />
      ) : null,
  }
  return (
    <ShortPlayer
      label="30秒でわかる Streaming"
      metricNote="図の例の部分の数"
      scenes={scenes}
      code={code}
    />
  )
}
