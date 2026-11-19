import { CodeBlock } from "@/components/learning/code-block"
import {
  ShortPlayer,
  type ShortScene,
} from "@/components/learning/short-player"
import { highlightSourceCode } from "@/lib/source-code"
import { cacheLife } from "next/cache"

function nodes(rejectShown: boolean) {
  return [
    {
      id: "page",
      label: "ページの描画",
      description: rejectShown
        ? "拒否なら代わりの表示"
        : "readSalesReport() を通る",
      runtime: "server",
    },
    {
      id: "action",
      label: "Server Action",
      description: rejectShown
        ? "拒否ならデータなしの戻り値"
        : "readSalesReport() を通る",
      runtime: "server",
    },
    {
      id: "route",
      label: "api/report",
      description: rejectShown
        ? "401 / 403 を返す"
        : "readSalesReport() を通る",
      runtime: "server",
    },
    {
      id: "unguarded",
      label: "api/unguarded",
      description: "確認を忘れ、未ログインでも 200",
      runtime: "server",
    },
  ] as const
}

const scenes: ShortScene[] = [
  {
    id: "entries",
    duration: 7000,
    title: "入口は 1 つではない",
    caption:
      "ページの描画・Server Action・Route Handler は、どれも直接呼び出せます。1 つでも確認を忘れると、データは守れません。",
    tone: "problem",
    nodes: nodes(false),
    metrics: [],
    codeKey: "unguarded",
  },
  {
    id: "dal",
    duration: 8000,
    title: "確認はデータを読む関数に",
    caption:
      "readSalesReport() の中で認証と認可を確かめてから、データソースを読みます。どの入口もこの関数を通れば、同じ基準で判定されます。",
    tone: "explain",
    nodes: nodes(false),
    metrics: [],
    codeKey: "report",
  },
  {
    id: "reject",
    duration: 8000,
    title: "拒否の伝え方は入口ごと",
    caption:
      "Server Component は代わりの表示、Server Action はデータなしの戻り値、Route Handler は 401 と 403 で拒否を伝えます。",
    tone: "explain",
    nodes: nodes(true),
    metrics: [],
    codeKey: "route",
  },
  {
    id: "result",
    duration: 7000,
    title: "Proxy だけに任せない",
    caption:
      "proxy.ts での確認は、素早く振り分けるための補助です。守りの中心は、データを読む関数の中の確認です。",
    tone: "solution",
    nodes: nodes(true),
    metrics: [],
    codeKey: "report",
  },
]

export async function ServerSideAuthShort() {
  "use cache"
  cacheLife("max")

  const unguardedCode = `// 確認を忘れた Route Handler（悪い例）
export async function GET() {
  const figures = await loadSalesFigures() // データソースを直接読む
  return Response.json(figures) // 未ログインでも 200 で数字が返る
}`
  const reportCode = `import "server-only"

export async function readSalesReport() {
  const auth = await getAuthState()
  if (auth.status !== "signed-in") return { kind: "unauthenticated" } as const
  if (!can(auth.user, "report:read")) return { kind: "forbidden" } as const
  const figures = await loadSalesFigures()
  return { kind: "ok", report: toReportDto(figures) } as const
}`
  const routeCode = `export async function GET() {
  const result = await readSalesReport()
  if (result.kind === "unauthenticated") {
    return Response.json({ error: "ログインが必要です" }, { status: 401 })
  }
  if (result.kind === "forbidden") {
    return Response.json({ error: "権限がありません" }, { status: 403 })
  }
  return Response.json(result.report, {
    headers: { "Cache-Control": "private, no-store" },
  })
}`

  const [unguarded, report, route] = await Promise.allSettled([
    highlightSourceCode("例/api/unguarded/route.ts", unguardedCode),
    highlightSourceCode("例/report.ts", reportCode),
    highlightSourceCode("例/api/report/route.ts", routeCode),
  ])
  const code = {
    unguarded:
      unguarded.status === "fulfilled" ? (
        <CodeBlock
          key="unguarded"
          source={unguarded.value}
          runtime={{ runtime: "server", basis: "route.ts" }}
          role="Route Handler"
          description="確認を通らずにデータを読む"
          highlightedLines={[3, 4]}
        />
      ) : null,
    report:
      report.status === "fulfilled" ? (
        <CodeBlock
          key="report"
          source={report.value}
          runtime={{ runtime: "server", basis: "server-only" }}
          role="データを読む関数"
          description="認証 → 認可 → データソースの順"
          highlightedLines={[5, 6, 7]}
        />
      ) : null,
    route:
      route.status === "fulfilled" ? (
        <CodeBlock
          key="route"
          source={route.value}
          runtime={{ runtime: "server", basis: "route.ts" }}
          role="Route Handler"
          description="拒否の理由を HTTP のステータスで伝える"
          highlightedLines={[4, 7]}
        />
      ) : null,
  }
  return (
    <ShortPlayer
      label="30秒でわかる サーバー側での認証"
      scenes={scenes}
      code={code}
    />
  )
}
