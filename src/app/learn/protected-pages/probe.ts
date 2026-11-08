import { PROTECTED_PAGES, type ProtectedPageKey } from "./return-to"

/**
 * 守られたページの URL を、ブラウザから直接取得して応答を調べる（URL を直接開いたときと同じ GET）。
 * cookie はブラウザが自動で付けるため、今のログイン状態で確かめられる。
 *
 * - redirect: "manual" にすると、3xx の応答は中身を読めない opaqueredirect になる。
 *   ステータスの数字は読めないが、「描画の前にリダイレクトされた」ことは分かる
 * - 200 の応答は HTML を最後まで読み、リダイレクトの meta タグと守る内容の目印を探す
 */

export type ProbeOutcome =
  /** Proxy が描画の前に 3xx で応答した */
  | { kind: "proxy-redirect" }
  /** 200 で送り始めた後、ページの中の redirect() が meta タグで移動を伝えた */
  | {
      kind: "page-redirect"
      status: number
      location: string | null
      /** 守る内容が HTML / RSC Payload に入っていた */
      leaked: boolean
    }
  /** 確認を通り、守る内容が届いた */
  | { kind: "content"; status: number; dataMs: number | null }
  /** どちらも見つからなかった（秘密鍵が未設定の場合など） */
  | { kind: "neither"; status: number }

export interface ProbeResult {
  page: ProtectedPageKey
  outcome: ProbeOutcome
  /** リクエストを送ってから、応答を読み終えるまで（ブラウザで計測） */
  roundTripMs: number
}

// next/dist/server/app-render が、ストリーミング中の redirect() で HTML に入れる meta タグ
const PAGE_REDIRECT_META = /<meta[^>]*id="__next-page-redirect"[^>]*>/
const META_URL = /url=([^"]+)"/

/** member-area.tsx の目印。HTML の属性と、RSC Payload（script 内の文字列）の両方で探す */
function containsProtectedContent(html: string, page: ProtectedPageKey) {
  return (
    html.includes(`data-nsc-protected-content="${page}"`) ||
    html.includes(`data-nsc-protected-content\\":\\"${page}`)
  )
}

function readDataMs(html: string): number | null {
  const match = html.match(/data-nsc-data-ms="([\d.]+)"/)
  return match ? Number(match[1]) : null
}

function decodeHtmlAttribute(value: string) {
  return value.replaceAll("&amp;", "&")
}

export async function probeProtectedPage(
  page: ProtectedPageKey,
): Promise<ProbeResult> {
  const startedAt = performance.now()
  const response = await fetch(PROTECTED_PAGES[page], {
    redirect: "manual",
    cache: "no-store",
    credentials: "same-origin",
    headers: { Accept: "text/html" },
  })

  if (response.type === "opaqueredirect") {
    return {
      page,
      outcome: { kind: "proxy-redirect" },
      roundTripMs: performance.now() - startedAt,
    }
  }

  const html = await response.text()
  const roundTripMs = performance.now() - startedAt
  const leaked = containsProtectedContent(html, page)
  const meta = html.match(PAGE_REDIRECT_META)

  if (meta) {
    const url = meta[0].match(META_URL)?.[1]
    return {
      page,
      outcome: {
        kind: "page-redirect",
        status: response.status,
        location: url ? decodeHtmlAttribute(url) : null,
        leaked,
      },
      roundTripMs,
    }
  }
  if (leaked) {
    return {
      page,
      outcome: {
        kind: "content",
        status: response.status,
        dataMs: readDataMs(html),
      },
      roundTripMs,
    }
  }
  return {
    page,
    outcome: { kind: "neither", status: response.status },
    roundTripMs,
  }
}
