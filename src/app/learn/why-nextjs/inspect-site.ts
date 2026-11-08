/**
 * このページに届いたものから、Next.js の仕組みが残した跡を調べる。
 * ここで確かめるのは「出力されていること」までで、検索順位などの効果は測らない。
 */

/** サーバー（Server Component）から渡す、この教材で期待する値 */
export interface ExpectedValues {
  /** <title> に入るはずの文字列 */
  title: string
  /** canonical と og:url に入るはずの絶対 URL */
  pageUrl: string
  /** robots.txt が参照するはずの sitemap の絶対 URL */
  sitemapUrl: string
}

/**
 * - ok: 期待どおりの跡を確認できた
 * - mismatch: 跡はあったが、期待した値と違った
 * - unobserved: 記録や応答が得られず、判断できなかった
 */
export type CheckStatus = "ok" | "mismatch" | "unobserved"

export interface FontCheck {
  status: CheckStatus
  /** 観測できたフォントファイル。sameOrigin はこのページと同じ origin か */
  files: { url: string; sameOrigin: boolean }[]
  /** 同じ origin から届いたフォントファイルの数 */
  sameOriginCount: number
  /** Google Fonts（fonts.googleapis.com / fonts.gstatic.com）への取得の数 */
  googleRequestCount: number
  /** 読み込み済みのフォントファミリー名（next/font が作る代替フォントを除く） */
  loadedFamilies: string[]
}

export interface MetadataField {
  label: string
  actual: string | null
  expected: string
}

export interface MetadataCheck {
  status: CheckStatus
  fields: MetadataField[]
  /** 設定した公開 URL の origin と、今開いているページの origin が違う */
  originDiffers: boolean
}

export interface RouteCheck {
  status: CheckStatus
  path: string
  httpStatus: number | null
  contentType: string | null
  /** 取得にかかった時間（ms）。取れなければ null */
  fetchMs: number | null
  /** 期待した内容を見つけたかの説明 */
  finding: string
}

export interface SiteInspection {
  fonts: FontCheck
  metadata: MetadataCheck
  sitemap: RouteCheck
  robots: RouteCheck
}

const FONT_FILE = /\.(woff2?|ttf|otf)$/i
const GOOGLE_FONT_HOSTS = ["fonts.googleapis.com", "fonts.gstatic.com"]

function inspectFonts(): FontCheck {
  const entries = performance.getEntriesByType("resource")
  const files: FontCheck["files"] = []
  let googleRequestCount = 0

  for (const entry of entries) {
    const url = new URL(entry.name)
    if (GOOGLE_FONT_HOSTS.includes(url.hostname)) googleRequestCount++
    // initiatorType は「何が要求したか」なので使わず、URL の拡張子で判定する
    if (FONT_FILE.test(url.pathname)) {
      const sameOrigin = url.origin === window.location.origin
      // 同じ origin ならパスだけを表示する
      files.push({ url: sameOrigin ? url.pathname : url.href, sameOrigin })
    }
  }

  const sameOriginCount = files.filter((file) => file.sameOrigin).length
  const loadedFamilies = [
    ...new Set(
      [...document.fonts]
        .filter((face) => face.status === "loaded")
        .map((face) => face.family.replace(/^["']|["']$/g, ""))
        // next/font はレイアウトのずれを抑えるため「〇〇 Fallback」という代替フォントも作る
        .filter((family) => !family.endsWith(" Fallback")),
    ),
  ]

  return {
    // フォントの記録が1件もなければ、配信元を判断できない
    status:
      files.length === 0
        ? "unobserved"
        : sameOriginCount === files.length && googleRequestCount === 0
          ? "ok"
          : "mismatch",
    files,
    sameOriginCount,
    googleRequestCount,
    loadedFamilies,
  }
}

function readMeta(selector: string, attribute: string) {
  return document.head.querySelector(selector)?.getAttribute(attribute) ?? null
}

function inspectMetadata(expected: ExpectedValues): MetadataCheck {
  const fields: MetadataField[] = [
    {
      label: "<title>",
      actual: document.title || null,
      expected: expected.title,
    },
    {
      label: "canonical",
      actual: readMeta('link[rel="canonical"]', "href"),
      expected: expected.pageUrl,
    },
    {
      label: "og:url",
      actual: readMeta('meta[property="og:url"]', "content"),
      expected: expected.pageUrl,
    },
  ]
  const originDiffers =
    new URL(expected.pageUrl).origin !== window.location.origin

  return {
    status: fields.every((field) => field.actual === field.expected)
      ? "ok"
      : "mismatch",
    fields,
    originDiffers,
  }
}

async function fetchText(path: string) {
  const startedAt = performance.now()
  const response = await fetch(path, { cache: "no-store" })
  const text = await response.text()
  return {
    response,
    text,
    fetchMs: Math.round(performance.now() - startedAt),
  }
}

async function inspectSitemap(expected: ExpectedValues): Promise<RouteCheck> {
  const path = "/sitemap.xml"
  try {
    const { response, text, fetchMs } = await fetchText(path)
    const base = {
      path,
      httpStatus: response.status,
      contentType: response.headers.get("content-type"),
      fetchMs,
    }
    if (!response.ok) {
      return { ...base, status: "unobserved", finding: "応答がエラーでした" }
    }

    const xml = new DOMParser().parseFromString(text, "application/xml")
    if (xml.querySelector("parsererror")) {
      return {
        ...base,
        status: "mismatch",
        finding: "XML として読めませんでした",
      }
    }
    const locs = [...xml.getElementsByTagName("loc")].map(
      (loc) => loc.textContent?.trim() ?? "",
    )
    const found = locs.includes(expected.pageUrl)
    return {
      ...base,
      status: found ? "ok" : "mismatch",
      finding: found
        ? `${locs.length} 件の URL の中に、この教材の URL がありました`
        : `${locs.length} 件の URL の中に、この教材の URL がありませんでした`,
    }
  } catch {
    return {
      path,
      status: "unobserved",
      httpStatus: null,
      contentType: null,
      fetchMs: null,
      finding: "取得できませんでした",
    }
  }
}

async function inspectRobots(expected: ExpectedValues): Promise<RouteCheck> {
  const path = "/robots.txt"
  try {
    const { response, text, fetchMs } = await fetchText(path)
    const base = {
      path,
      httpStatus: response.status,
      contentType: response.headers.get("content-type"),
      fetchMs,
    }
    if (!response.ok) {
      return { ...base, status: "unobserved", finding: "応答がエラーでした" }
    }

    const sitemaps = text
      .split("\n")
      .map((line) => line.match(/^sitemap:\s*(\S+)/i)?.[1])
      .filter((url): url is string => url !== undefined)
    const found = sitemaps.includes(expected.sitemapUrl)
    return {
      ...base,
      status: found ? "ok" : "mismatch",
      finding: found
        ? "Sitemap の行で、このサイトの sitemap を参照していました"
        : sitemaps.length === 0
          ? "Sitemap の行がありませんでした"
          : `Sitemap の行が、別の URL（${sitemaps.join("、")}）を参照していました`,
    }
  } catch {
    return {
      path,
      status: "unobserved",
      httpStatus: null,
      contentType: null,
      fetchMs: null,
      finding: "取得できませんでした",
    }
  }
}

/** フォントの読み込みを待ってから、3つの跡をまとめて調べる */
export async function inspectSite(
  expected: ExpectedValues,
): Promise<SiteInspection> {
  await document.fonts.ready
  const [sitemap, robots] = await Promise.all([
    inspectSitemap(expected),
    inspectRobots(expected),
  ])
  return {
    fonts: inspectFonts(),
    metadata: inspectMetadata(expected),
    sitemap,
    robots,
  }
}
