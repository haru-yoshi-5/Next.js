import { articlePath } from "./articles"

/**
 * - complete: 完成した HTML がそのまま届いた（ビルド時にプリレンダーした値）
 * - shell-then-article: App Shell が先に届き、記事が続きとして届いた
 * - shell-then-not-found: App Shell が先に届き、notFound() の結果が続きとして届いた
 * - unknown: 上のどれにも当てはまらなかった
 */
export type Delivery =
  "complete" | "shell-then-article" | "shell-then-not-found" | "unknown"

export interface ArticleMeasurement {
  /** 入力した値 */
  value: string
  path: string
  status: number
  delivery: Delivery
  /** 取得を始めてから、最初のデータが届くまでの時間（ms） */
  firstChunkMs: number
  /** 取得を始めてから、記事または notFound() の結果が届くまでの時間（ms） */
  resultAtMs: number | null
  /** 取得を始めてから、応答をすべて受け取るまでの時間（ms） */
  totalMs: number
  /** 表示するレスポンスヘッダー */
  headers: { name: string; value: string }[]
}

// HTML の属性だけに一致させる。RSC Payload の中では " がエスケープされるので一致しない
const SHELL_FALLBACK = /data-nsc-article-fallback="/
const ARTICLE = /data-nsc-article-id="/
// ストリーミング中に notFound() が呼ばれると、Next.js がこの meta を加える
const NOINDEX = /<meta name="robots" content="noindex"/

const SHOWN_HEADERS = [
  "x-nextjs-cache",
  "x-nextjs-postponed",
  "x-vercel-cache",
  "cache-control",
]

function classify(
  hasShell: boolean,
  hasArticle: boolean,
  hasNoindex: boolean,
): Delivery {
  if (hasArticle && !hasShell) return "complete"
  if (hasArticle && hasShell) return "shell-then-article"
  if (hasNoindex && hasShell) return "shell-then-not-found"
  return "unknown"
}

/** 記事ページを取得し、応答を読み進めながら、App Shell と記事が届いた時間を記録する */
export async function measureArticle(
  value: string,
): Promise<ArticleMeasurement> {
  const path = articlePath(value)
  const startedAt = performance.now()
  const response = await fetch(path, { cache: "no-store" })
  if (!response.body) throw new Error("応答の本文がありません")

  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader()
  let html = ""
  let firstChunkMs: number | null = null
  let resultAtMs: number | null = null

  while (true) {
    const { done, value: chunk } = await reader.read()
    if (done) break
    html += chunk

    const atMs = performance.now() - startedAt
    firstChunkMs ??= atMs
    if (resultAtMs === null && (ARTICLE.test(html) || NOINDEX.test(html))) {
      resultAtMs = atMs
    }
  }
  const totalMs = performance.now() - startedAt

  return {
    value,
    path,
    status: response.status,
    delivery: classify(
      SHELL_FALLBACK.test(html),
      ARTICLE.test(html),
      NOINDEX.test(html),
    ),
    firstChunkMs: firstChunkMs ?? totalMs,
    resultAtMs,
    totalMs,
    headers: SHOWN_HEADERS.flatMap((name) => {
      const headerValue = response.headers.get(name)
      return headerValue ? [{ name, value: headerValue }] : []
    }),
  }
}
