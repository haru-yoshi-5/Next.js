export interface PageInspection {
  /** 取得したパス */
  pathname: string
  status: number
  /** リクエストを送ってから HTML を読み終えるまで（ms） */
  responseMs: number
  htmlBytes: number
  /** JavaScript を実行する前の HTML に入っていた見出し */
  heading: string | null
  /** JavaScript を実行する前の HTML に入っていた本文の文字数（空白を除く） */
  articleTextLength: number
  /** HTML に埋め込まれた RSC Payload（self.__next_f）の script 要素の数 */
  rscChunkCount: number
  rscBytes: number
  /** HTML が読み込みを指示している JavaScript ファイルの数 */
  scriptCount: number
  scriptBytes: number
}

const encoder = new TextEncoder()

function byteLength(text: string) {
  return encoder.encode(text).length
}

async function fetchText(url: string) {
  const response = await fetch(url, { cache: "no-store" })
  if (!response.ok) {
    throw new Error(`${url} の取得に失敗しました: ${response.status}`)
  }
  return { status: response.status, text: await response.text() }
}

/**
 * このページの HTML を取得し直し、ブラウザが受け取った内容を数える。
 * DOMParser で作った文書では script が実行されないため、
 * 「JavaScript を実行する前の HTML」に何が入っていたかを調べられる。
 */
export async function inspectPage(): Promise<PageInspection> {
  const pathname = window.location.pathname
  const startedAt = performance.now()
  const page = await fetchText(pathname)
  const responseMs = Math.round(performance.now() - startedAt)

  const doc = new DOMParser().parseFromString(page.text, "text/html")

  const rscChunks = [...doc.querySelectorAll("script:not([src])")]
    .map((script) => script.textContent ?? "")
    .filter((text) => text.includes("self.__next_f"))

  const scriptUrls = [
    ...new Set(
      [...doc.querySelectorAll<HTMLScriptElement>("script[src]")]
        .map((script) => script.getAttribute("src"))
        .filter((src): src is string => src !== null && src.length > 0)
        .map((src) => new URL(src, window.location.href).href),
    ),
  ]
  const scripts = await Promise.all(scriptUrls.map(fetchText))

  return {
    pathname,
    status: page.status,
    responseMs,
    htmlBytes: byteLength(page.text),
    heading: doc.querySelector("article h1")?.textContent?.trim() || null,
    articleTextLength: (
      doc.querySelector("article")?.textContent ?? ""
    ).replace(/\s+/g, "").length,
    rscChunkCount: rscChunks.length,
    rscBytes: rscChunks.reduce((sum, text) => sum + byteLength(text), 0),
    scriptCount: scriptUrls.length,
    scriptBytes: scripts.reduce(
      (sum, script) => sum + byteLength(script.text),
      0,
    ),
  }
}

/** 1024 で割った KB を小数1桁で返す */
export function formatKilobytes(bytes: number) {
  return `${(bytes / 1024).toFixed(1)} KB`
}
