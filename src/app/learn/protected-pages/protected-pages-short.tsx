import { CodeBlock } from "@/components/learning/code-block"
import {
  ShortPlayer,
  type ShortScene,
} from "@/components/learning/short-player"
import { highlightSourceCode } from "@/lib/source-code"
import { cacheLife } from "next/cache"

const proxy = {
  id: "proxy",
  label: "proxy.ts",
  description: "描画の前に cookie を確かめる",
  runtime: "server",
} as const
const page = {
  id: "page",
  label: "会員ページ",
  description: "ユーザーの存在まで確かめる",
  runtime: "server",
} as const
const login = {
  id: "login",
  label: "ログインページ",
  description: "?next= の戻り先を確かめる",
  runtime: "server",
} as const

const scenes: ShortScene[] = [
  {
    id: "where",
    duration: 7000,
    title: "未ログインの人をどう止める？",
    caption:
      "ログインした人だけが見られるページでは、未ログインの人をログインページへ移動させます。止める場所は、ページの中と Proxy の 2 つです。",
    tone: "problem",
    nodes: [proxy, page, login],
    metrics: [],
    codeKey: "page",
  },
  {
    id: "page",
    duration: 8000,
    title: "ページの中で redirect()",
    caption:
      "readMemberArea() の中で確かめ、通らなければ redirect() します。確認 → データの取得 → 描画の順にして、確認より前に守る内容を描画しません。",
    tone: "explain",
    nodes: [proxy, { ...page, description: "確認してから描画する" }, login],
    metrics: [],
    codeKey: "page",
  },
  {
    id: "proxy",
    duration: 8000,
    title: "Proxy で描画の前に振り分ける",
    caption:
      "proxy.ts は、描画の前に cookie の署名と期限だけを確かめ、通らなければ 307 で移動させます。補助なので、ページの中の確認は省きません。",
    tone: "explain",
    nodes: [proxy, page, login],
    metrics: [],
    codeKey: "proxy",
  },
  {
    id: "next",
    duration: 7000,
    title: "戻り先は許可リストで",
    caption:
      "ログイン後の戻り先 ?next= は誰でも書き換えられます。許可リストと完全に一致する値だけを受け付け、それ以外は既定のページに戻します。",
    tone: "solution",
    nodes: [proxy, page, login],
    metrics: [],
    codeKey: "next",
  },
]

export async function ProtectedPagesShort() {
  "use cache"
  cacheLife("max")

  const pageCode = `export default function MemberPage() {
  return (
    <Suspense fallback={<p>確認しています…</p>}>
      <MemberNotices />
    </Suspense>
  )
}

async function MemberNotices() {
  // 引数はログイン後の戻り先。未ログインなら中で redirect()
  const area = await readMemberArea("/learn/protected-pages/members")
  return <NoticeList notices={area.notices} />
}`
  const proxyCode = `export async function proxy(request: NextRequest) {
  const session = await verifySession(request.cookies.get("session")?.value)
  if (!session) {
    const login = new URL("/learn/protected-pages/login", request.url)
    login.searchParams.set("next", request.nextUrl.pathname)
    return NextResponse.redirect(login) // 307
  }
  return NextResponse.next()
}`
  const nextCode = `const ALLOWED_NEXT = new Set([
  "/learn/protected-pages/members",
  "/learn/protected-pages/proxied",
])

export function safeNext(value: unknown) {
  // 前方一致ではなく、完全に一致する値だけを受け付ける
  return typeof value === "string" && ALLOWED_NEXT.has(value)
    ? value
    : "/learn/protected-pages/members" // 既定の戻り先
}`

  const [pageSource, proxySource, nextSource] = await Promise.allSettled([
    highlightSourceCode("例/members/page.tsx", pageCode),
    highlightSourceCode("例/proxy.ts", proxyCode),
    highlightSourceCode("例/safe-next.ts", nextCode),
  ])
  const code = {
    page:
      pageSource.status === "fulfilled" ? (
        <CodeBlock
          key="page"
          source={pageSource.value}
          runtime={{ runtime: "server", basis: "page" }}
          role="Server Component"
          description="確認をしてから守る内容を描画する"
          highlightedLines={[11, 12]}
        />
      ) : null,
    proxy:
      proxySource.status === "fulfilled" ? (
        <CodeBlock
          key="proxy"
          source={proxySource.value}
          runtime={{ runtime: "server", basis: "proxy.ts" }}
          role="Proxy"
          description="cookie だけで素早く振り分ける"
          highlightedLines={[2, 6]}
        />
      ) : null,
    next:
      nextSource.status === "fulfilled" ? (
        <CodeBlock
          key="next"
          source={nextSource.value}
          runtime={{ runtime: "server", basis: "server-only" }}
          role="サーバーの関数"
          description="オープンリダイレクトを防ぐ"
          highlightedLines={[8, 9, 10]}
        />
      ) : null,
  }
  return (
    <ShortPlayer
      label="30秒でわかる 保護されたページ"
      scenes={scenes}
      code={code}
    />
  )
}
