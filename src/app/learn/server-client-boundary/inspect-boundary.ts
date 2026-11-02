/** Client Component のコードにだけ含まれる目印。クライアント用の JavaScript に入ることを検査で確かめる */
export const CLIENT_CODE_MARKER = "nsc-client-code-1a2b3c4d"

export interface BoundaryInspection {
  /** 応答に含まれていた、props で渡した値の数 */
  publicTokenCount: number
  /** 応答に含まれていた、渡していない値の数 */
  secretTokenCount: number
  /** 読み込んだ JavaScript ファイルの数 */
  scriptCount: number
  clientMarkerCount: number
  serverMarkerCount: number
}

async function fetchText(url: string) {
  const response = await fetch(url, { cache: "no-store" })
  if (!response.ok) {
    throw new Error(`${url} の取得に失敗しました: ${response.status}`)
  }
  return response.text()
}

function countMatches(text: string, pattern: RegExp) {
  return text.match(pattern)?.length ?? 0
}

/**
 * ブラウザに届く内容そのものを検索する。
 * 検索語に16進数の形を使うので、この関数自身やソースコードの表示には一致しない。
 */
export async function inspectBoundary(): Promise<BoundaryInspection> {
  const scriptUrls = [...document.scripts]
    .map((script) => script.src)
    .filter((src) => src.length > 0)

  const [pageResponse, scripts] = await Promise.all([
    fetchText(window.location.pathname),
    Promise.all(scriptUrls.map(fetchText)),
  ])
  const javascript = scripts.join("\n")

  return {
    publicTokenCount: countMatches(pageResponse, /nsc-public-[0-9a-f]{12}/g),
    secretTokenCount: countMatches(pageResponse, /nsc-secret-[0-9a-f]{12}/g),
    scriptCount: scriptUrls.length,
    clientMarkerCount: countMatches(javascript, /nsc-client-code-[0-9a-f]{8}/g),
    serverMarkerCount: countMatches(javascript, /nsc-server-code-[0-9a-f]{8}/g),
  }
}
