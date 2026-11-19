import { CodeBlock } from "@/components/learning/code-block"
import {
  ShortPlayer,
  type ShortScene,
} from "@/components/learning/short-player"
import { highlightSourceCode } from "@/lib/source-code"
import { cacheLife } from "next/cache"

function nodes(method: string, result: string) {
  return [
    {
      id: "fetch",
      label: "fetch()",
      description: `${method} を送る`,
      runtime: "client",
    },
    {
      id: "route",
      label: "route.ts",
      description: result,
      runtime: "server",
    },
  ] as const
}

const scenes: ShortScene[] = [
  {
    id: "get",
    duration: 7000,
    title: "URL で受け付ける API は？",
    caption:
      "route.ts で GET や POST を export すると、その URL の Route Handler になります。",
    tone: "problem",
    nodes: nodes("GET", "200 と JSON を返す"),
    metrics: [],
    codeKey: "get",
  },
  {
    id: "validate",
    duration: 8000,
    title: "入力はサーバーで検証する",
    caption:
      "URL を持つので、画面を経由せず誰でも直接送れます。空の本文を送ると、Route Handler の検証で 400 を返します。",
    tone: "explain",
    nodes: nodes("空の POST", "検証して 400 を返す"),
    metrics: [],
    codeKey: "post",
  },
  {
    id: "method",
    duration: 8000,
    title: "定義していないメソッドは 405",
    caption:
      "route.ts に関数がない PUT を送ると、関数は実行されず、Next.js が 405 Method Not Allowed を返します。",
    tone: "explain",
    nodes: nodes("PUT", "関数がない → 405"),
    metrics: [],
    codeKey: "put",
  },
  {
    id: "result",
    duration: 7000,
    title: "Server Actions と使い分ける",
    caption:
      "公開する API や Webhook は Route Handler、画面からの更新は Server Action が向いています。",
    tone: "solution",
    nodes: nodes("POST", "正しい入力なら 201"),
    metrics: [],
    codeKey: "post",
  },
]

export async function RouteHandlersShort() {
  "use cache"
  cacheLife("max")

  const getCode = `import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const limit = parseLimit(request.nextUrl.searchParams.get("limit"))
  return Response.json({ messages: await listMessages(limit) })
}`
  const postCode = `export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const text = typeof body?.text === "string" ? body.text.trim() : ""
  if (!text) {
    return Response.json({ error: "本文が空です" }, { status: 400 })
  }
  return Response.json(await addMessage(text), { status: 201 })
}`
  const putCode = `// route.ts に PUT 関数はない
const res = await fetch("/learn/route-handlers/api", { method: "PUT" })
res.status // 405`

  const [getSource, postSource, putSource] = await Promise.allSettled([
    highlightSourceCode("例/api/route.ts", getCode),
    highlightSourceCode("例/api/route.ts", postCode),
    highlightSourceCode("例/request-panel.tsx", putCode),
  ])
  const code = {
    get:
      getSource.status === "fulfilled" ? (
        <CodeBlock
          key="get"
          source={getSource.value}
          runtime={{ runtime: "server", basis: "route.ts" }}
          role="Route Handler"
          description="メソッド名の関数を export する"
          highlightedLines={[3, 4, 5]}
        />
      ) : null,
    post:
      postSource.status === "fulfilled" ? (
        <CodeBlock
          key="post"
          source={postSource.value}
          runtime={{ runtime: "server", basis: "route.ts" }}
          role="Route Handler"
          description="本文を確かめてからステータスを決める"
          highlightedLines={[4, 5, 7]}
        />
      ) : null,
    put:
      putSource.status === "fulfilled" ? (
        <CodeBlock
          key="put"
          source={putSource.value}
          runtime={{ runtime: "client", basis: "ブラウザから送信" }}
          role="fetch()"
          description="定義していないメソッドで送る"
          highlightedLines={[2, 3]}
        />
      ) : null,
  }
  return (
    <ShortPlayer
      label="30秒でわかる Route Handlers"
      scenes={scenes}
      code={code}
    />
  )
}
