import { CodeBlock } from "@/components/learning/code-block"
import {
  ShortPlayer,
  type ShortScene,
} from "@/components/learning/short-player"
import { highlightSourceCode } from "@/lib/source-code"
import { cacheLife } from "next/cache"

function nodes(cached: boolean) {
  return [
    {
      id: "first",
      label: "1 回目の呼び出し",
      description: cached ? "本体を実行して結果を保存" : "本体を実行",
      runtime: "server",
    },
    {
      id: "second",
      label: "2 回目の呼び出し",
      description: cached ? "保存した結果を再利用" : "本体をもう一度実行",
      runtime: "server",
    },
  ] as const
}

function metrics(runs: number) {
  return [{ id: "runs", label: "本体を実行した回数", value: runs, unit: "回" }]
}

const scenes: ShortScene[] = [
  {
    id: "no-cache",
    duration: 7000,
    title: "毎回作り直す？",
    caption:
      "時間のかかる処理を、呼び出しのたびに実行しています。同じ入力なら、結果も同じはずです。",
    tone: "problem",
    nodes: nodes(false),
    metrics: metrics(2),
    codeKey: "plain",
  },
  {
    id: "use-cache",
    duration: 8000,
    title: "use cache で再利用する",
    caption:
      '関数の先頭に "use cache" を書くと、最初の結果が保存されます。キャッシュキーは、ビルド ID・関数の ID・引数から自動で作られます。',
    tone: "explain",
    nodes: nodes(true),
    metrics: metrics(1),
    codeKey: "cached",
  },
  {
    id: "life",
    duration: 8000,
    title: "cacheLife で有効期間を決める",
    caption:
      "stale はブラウザが確認せず使う時間。revalidate を過ぎると古い結果を返しつつ裏で作り直し、expire を過ぎてアクセスがないと次は新しい結果を待ちます。",
    tone: "explain",
    nodes: nodes(true),
    metrics: metrics(1),
    codeKey: "cached",
  },
  {
    id: "result",
    duration: 7000,
    title: "中で cookies() は読めない",
    caption:
      "キャッシュは利用者をまたいで共有されます。中で cookies() や headers() は読まず、外で読んだ値を引数で渡します。",
    tone: "solution",
    nodes: nodes(true),
    metrics: metrics(1),
    codeKey: "argument",
  },
]

export async function CacheShort() {
  "use cache"
  cacheLife("max")

  const plainCode = `export async function getReport() {
  // 時間のかかる集計（呼び出しのたびに実行される）
  return await buildReport()
}`
  const cachedCode = `import { cacheLife } from "next/cache"

export async function getReport() {
  "use cache"
  cacheLife({ stale: 30, revalidate: 60, expire: 120 })
  return await buildReport()
}`
  const argumentCode = `import { cookies } from "next/headers"

export default async function Page() {
  const locale = (await cookies()).get("locale")?.value ?? "ja"
  const report = await getReport(locale) // 必要な値だけを引数で渡す
  return <Report report={report} />
}`

  const [plain, cached, argument] = await Promise.allSettled([
    highlightSourceCode("例/report.ts", plainCode),
    highlightSourceCode("例/report.ts", cachedCode),
    highlightSourceCode("例/page.tsx", argumentCode),
  ])
  const code = {
    plain:
      plain.status === "fulfilled" ? (
        <CodeBlock
          key="plain"
          source={plain.value}
          runtime={{ runtime: "server", basis: "ディレクティブなし" }}
          role="サーバーの関数"
          description="キャッシュしない場合"
          highlightedLines={[2, 3]}
        />
      ) : null,
    cached:
      cached.status === "fulfilled" ? (
        <CodeBlock
          key="cached"
          source={cached.value}
          runtime={{ runtime: "server", basis: "use cache" }}
          role="キャッシュする関数"
          description="結果を保存し、同じ入力で再利用する"
          highlightedLines={[4, 5]}
        />
      ) : null,
    argument:
      argument.status === "fulfilled" ? (
        <CodeBlock
          key="argument"
          source={argument.value}
          runtime={{ runtime: "server", basis: "page" }}
          role="Server Component"
          description="cookies() はキャッシュの外で読む"
          highlightedLines={[4, 5]}
        />
      ) : null,
  }
  return (
    <ShortPlayer
      label="30秒でわかる use cache"
      metricNote="図の例で 2 回呼び出したとき"
      scenes={scenes}
      code={code}
    />
  )
}
