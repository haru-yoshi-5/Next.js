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
/** 応答（本文まで）を待つ上限 */
const FETCH_TIMEOUT_MS = 10_000
/** 表示されたファイルを待つ上限 */
const RENDER_TIMEOUT_MS = 10_000

function toProxyDecision(value: string | null): ProxyDecision | null {
  return value === "found" || value === "missing" ? value : null
}

/** 応答が時間内に届かなかったことを表すエラーか */
export function isTimeoutError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "TimeoutError"
}

/** ページを取得し、ステータス・noindex・proxy の判断を調べる */
async function inspectResponse(path: string, signal: AbortSignal) {
  // 中止（画面からの離脱）と時間制限のどちらでも止まるようにする。
  // fetch に渡したシグナルは本文の受信（response.text()）にも効く
  const fetchSignal = AbortSignal.any([
    signal,
    AbortSignal.timeout(FETCH_TIMEOUT_MS),
  ])
  const startedAt = performance.now()
  const response = await fetch(path, { cache: "no-store", signal: fetchSignal })
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
function findRenderedFile(
  path: string,
  signal: AbortSignal,
): Promise<string | null> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(signal.reason)
      return
    }

    const iframe = document.createElement("iframe")
    iframe.title = "表示されたファイルを調べるための非表示のフレーム"
    iframe.tabIndex = -1
    iframe.setAttribute("aria-hidden", "true")
    iframe.style.cssText =
      "position:fixed;left:-10000px;top:0;width:1024px;height:768px;visibility:hidden;pointer-events:none"

    const startedAt = performance.now()
    // タイマーと iframe を片付ける。成功・時間切れ・中止のどれでも呼ぶ
    const cleanup = () => {
      window.clearInterval(timer)
      iframe.remove()
      signal.removeEventListener("abort", onAbort)
    }
    const onAbort = () => {
      cleanup()
      reject(signal.reason)
    }

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
        cleanup()
        resolve(file)
      }
    }, 100)

    signal.addEventListener("abort", onAbort)
    iframe.src = path
    document.body.append(iframe)
  })
}

/**
 * ページを取得して調べる。signal を中止すると、取得・iframe での確認を止めて後片付けする。
 * 応答が時間内に届かない場合は TimeoutError（isTimeoutError で判定）で失敗する。
 */
export async function measureNotFound(
  path: string,
  signal: AbortSignal,
): Promise<NotFoundMeasurement> {
  const response = await inspectResponse(path, signal)
  const renderedFile = await findRenderedFile(path, signal)
  return { path, ...response, renderedFile }
}
