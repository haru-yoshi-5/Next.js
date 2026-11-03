export type DemoMethod = "GET" | "POST" | "PUT"

/** デモで呼び出す Route Handler（api/route.ts）の URL */
export const ROUTE_PATH = "/learn/route-handlers/api"

export interface RouteCall {
  method: DemoMethod
  path: string
  /** 送信した本文（ある場合） */
  requestBody?: string
  status: number
  statusText: string
  /** 表示するレスポンスヘッダー */
  headers: { name: string; value: string }[]
  /** 整形したレスポンスの本文 */
  body: string
  /** ブラウザで計測した往復の時間（ms） */
  roundTripMs: number
  /** Server-Timing から読み取った、データの読み書きにかかった時間（ms） */
  storeMs?: number
  /** Server-Timing から読み取った、Route Handler 全体の処理時間（ms） */
  handlerMs?: number
}

// HTTP/2 では statusText が空になるため、デモで返るコードの説明を持っておく
const STATUS_TEXT: Record<number, string> = {
  200: "OK",
  201: "Created",
  400: "Bad Request",
  405: "Method Not Allowed",
  413: "Content Too Large",
  500: "Internal Server Error",
}

const SHOWN_HEADERS = ["content-type", "allow", "server-timing"]

function parseServerTiming(value: string | null) {
  const timings: Record<string, number> = {}
  for (const match of value?.matchAll(/([\w-]+);dur=([\d.]+)/g) ?? []) {
    timings[match[1]] = Number(match[2])
  }
  return timings
}

function formatBody(text: string) {
  if (text.length === 0) return "（本文なし）"
  try {
    return JSON.stringify(JSON.parse(text), null, 2)
  } catch {
    return text
  }
}

/** Route Handler に本物の HTTP リクエストを送り、レスポンスの内容を記録する */
export async function callRoute(
  method: DemoMethod,
  text?: string,
): Promise<RouteCall> {
  const path = method === "GET" ? `${ROUTE_PATH}?limit=3` : ROUTE_PATH
  const requestBody =
    method === "POST" ? JSON.stringify({ text: text ?? "" }) : undefined

  const startedAt = performance.now()
  const response = await fetch(path, {
    method,
    cache: "no-store",
    headers: requestBody ? { "Content-Type": "application/json" } : undefined,
    body: requestBody,
  })
  const responseText = await response.text()
  const roundTripMs = performance.now() - startedAt

  const timings = parseServerTiming(response.headers.get("server-timing"))

  return {
    method,
    path,
    requestBody,
    status: response.status,
    statusText: STATUS_TEXT[response.status] ?? response.statusText,
    headers: SHOWN_HEADERS.flatMap((name) => {
      const value = response.headers.get(name)
      return value ? [{ name, value }] : []
    }),
    body: formatBody(responseText),
    roundTripMs,
    storeMs: timings.store,
    handlerMs: timings.handler,
  }
}
