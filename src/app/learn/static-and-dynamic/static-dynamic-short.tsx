import { CodeBlock } from "@/components/learning/code-block"
import {
  ShortPlayer,
  type ShortScene,
} from "@/components/learning/short-player"
import { highlightSourceCode } from "@/lib/source-code"
import { cacheLife } from "next/cache"

function nodes(partial: boolean) {
  return [
    {
      id: "shell-id",
      label: "シェルID",
      description: partial
        ? "use cache で静的シェルに保存"
        : "リクエストごとに実行",
      runtime: "server",
    },
    {
      id: "fallback",
      label: "fallback",
      description: partial ? "静的シェルに入る" : "リクエストごとに実行",
      runtime: "server",
    },
    {
      id: "request-id",
      label: "リクエストID",
      description: partial
        ? "io() の後、リクエスト時に実行"
        : "リクエストごとに実行",
      runtime: "server",
    },
  ] as const
}

function metrics(atRequest: number) {
  return [
    {
      id: "request",
      label: "リクエスト時に実行する部分",
      value: atRequest,
      unit: "個",
    },
  ]
}

const scenes: ShortScene[] = [
  {
    id: "route",
    duration: 7000,
    title: "ルート全体が Dynamic？",
    caption:
      "以前のモデルでは、cookies() を 1 回読むだけで、ルート全体がリクエストのたびに描画されました。",
    tone: "problem",
    nodes: nodes(false),
    metrics: metrics(3),
    codeKey: "legacy",
  },
  {
    id: "shell",
    duration: 8000,
    title: "作れる部分は静的シェルへ",
    caption:
      "Cache Components では、ビルド時に作れる部分が静的シェルになります。use cache の値や Suspense の fallback も入ります。",
    tone: "explain",
    nodes: nodes(true),
    metrics: metrics(1),
    codeKey: "shell",
  },
  {
    id: "request",
    duration: 8000,
    title: "リクエスト時に回すもの",
    caption:
      "cookies()・headers()・searchParams、io() より後の処理、キャッシュしていない取得は、Suspense の内側でリクエスト時に実行します。",
    tone: "explain",
    nodes: nodes(true),
    metrics: metrics(1),
    codeKey: "request",
  },
  {
    id: "result",
    duration: 7000,
    title: "○ と ◐ を読む",
    caption:
      "next build の ○ は静的シェルで完結するルート、◐ は静的シェルにリクエスト時の部分が続くルートです。1 つのページの中で混ぜられます。",
    tone: "solution",
    nodes: nodes(true),
    metrics: metrics(1),
    codeKey: "build",
  },
]

export async function StaticDynamicShort() {
  "use cache"
  cacheLife("max")

  const legacyCode = `import { cookies } from "next/headers"

// 以前のモデル（説明用）: cookies() を 1 回読むと、ルート全体が動的になる
export default async function Page() {
  const theme = (await cookies()).get("theme")?.value
  return (
    <main data-theme={theme}>
      <ShellId />
      <RequestId />
    </main>
  )
}`
  const shellCode = `import { cacheLife } from "next/cache"

export async function ShellId() {
  "use cache"
  cacheLife("max")
  return <p>シェルID: {crypto.randomUUID()}</p>
}`
  const requestCode = `import { io } from "next/cache"

export async function RequestId() {
  await io()
  return <p>リクエストID: {crypto.randomUUID()}</p>
}

// page では <Suspense> の内側に置く
<Suspense fallback={<p>準備中…</p>}>
  <RequestId />
</Suspense>`
  const buildCode = `Route (app)
├ ○ /learn/what-is-nextjs
├ ◐ /learn/static-and-dynamic

○  (Static)             prerendered as static content
◐  (Partial Prerender)  prerendered as static HTML with dynamic server-streamed content`

  const [legacy, shell, request, build] = await Promise.allSettled([
    highlightSourceCode("例/page.tsx", legacyCode),
    highlightSourceCode("例/shell-id.tsx", shellCode),
    highlightSourceCode("例/request-id.tsx", requestCode),
    highlightSourceCode("例/next-build.txt", buildCode),
  ])
  const code = {
    legacy:
      legacy.status === "fulfilled" ? (
        <CodeBlock
          key="legacy"
          source={legacy.value}
          runtime={{ runtime: "server", basis: "page" }}
          role="以前のモデル"
          description="cookies() を読んだだけでルート全体が動的になる"
          highlightedLines={[3, 5]}
        />
      ) : null,
    shell:
      shell.status === "fulfilled" ? (
        <CodeBlock
          key="shell"
          source={shell.value}
          runtime={{ runtime: "server", basis: "use cache" }}
          role="静的シェル"
          description="ビルド時の結果を保存する"
          highlightedLines={[4, 5]}
        />
      ) : null,
    request:
      request.status === "fulfilled" ? (
        <CodeBlock
          key="request"
          source={request.value}
          runtime={{ runtime: "server", basis: "io()" }}
          role="リクエスト時"
          description="io() より後はリクエストごとに実行"
          highlightedLines={[4, 9, 10, 11]}
        />
      ) : null,
    build:
      build.status === "fulfilled" ? (
        <CodeBlock
          key="build"
          source={build.value}
          runtime={{ runtime: "server", basis: "next build" }}
          role="ビルドの出力"
          description="ルートごとの配信のされ方"
          highlightedLines={[2, 3]}
        />
      ) : null,
  }
  return (
    <ShortPlayer
      label="30秒でわかる Static と Dynamic"
      metricNote="図の例の部分の数"
      scenes={scenes}
      code={code}
    />
  )
}
