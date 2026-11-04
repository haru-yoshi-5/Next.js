import {
  PROXY_HEADER,
  type ProxyDecision,
  RENDERED_FILE_ATTR,
} from "./demo-data"

export interface NotFoundMeasurement {
  path: string
  /** HTTP ステータスコード */
  status: number
  /** <meta name="robots" content="noindex"> が含まれていたか */
  noindex: boolean
  /** proxy.ts の判断。proxy を通らなかった場合は null */
  proxy: ProxyDecision | null
  /** 応答をすべて受け取るまでの時間（ms） */
  totalMs: number
  /** ブラウザで実際に表示されたファイル。確かめられなかった場合は null */
  renderedFile: string | null
}

const NOINDEX = /<meta name="robots" content="noindex"/
/** 表示されたファイルを待つ上限 */
const RENDER_TIMEOUT_MS = 10_000

function toProxyDecision(value: string | null): ProxyDecision | null {
  return value === "found" || value === "missing" ? value : null
}

/** ページを取得し、ステータス・noindex・proxy の判断を調べる */
async function inspectResponse(path: string) {
  const startedAt = performance.now()
  const response = await fetch(path, { cache: "no-store" })
  const html = await response.text()
  return {
    status: response.status,
    noindex: NOINDEX.test(html),
    proxy: toProxyDecision(response.headers.get(PROXY_HEADER)),
    totalMs: performance.now() - startedAt,
  }
}

/**
 * ページを見えない iframe で開き、実際に表示されたファイルを DOM の目印から調べる。
 * ストリーミングで届く not-found.tsx は HTML の本文に含まれず、ブラウザでの描画後に現れるため、
 * 取得した HTML を検索するだけでは分からない。
 */
function findRenderedFile(path: string): Promise<string | null> {
  return new Promise((resolve) => {
    const iframe = document.createElement("iframe")
    iframe.title = "表示されたファイルを調べるための非表示のフレーム"
    iframe.tabIndex = -1
    iframe.setAttribute("aria-hidden", "true")
    iframe.style.cssText =
      "position:fixed;left:-10000px;top:0;width:1024px;height:768px;visibility:hidden;pointer-events:none"

    const startedAt = performance.now()
    const timer = window.setInterval(() => {
      let file: string | null = null
      try {
        file =
          iframe.contentDocument
            ?.querySelector(`[${RENDERED_FILE_ATTR}]`)
            ?.getAttribute(RENDERED_FILE_ATTR) ?? null
      } catch {
        // 同じオリジンなので通常は起きない。読めなければ見つからなかったものとして扱う
      }
      if (file || performance.now() - startedAt > RENDER_TIMEOUT_MS) {
        window.clearInterval(timer)
        iframe.remove()
        resolve(file)
      }
    }, 100)

    iframe.src = path
    document.body.append(iframe)
  })
}

export async function measureNotFound(
  path: string,
): Promise<NotFoundMeasurement> {
  const response = await inspectResponse(path)
  const renderedFile = await findRenderedFile(path)
  return { path, ...response, renderedFile }
}
