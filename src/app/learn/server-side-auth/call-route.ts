/** デモで呼び出す Route Handler */
export type RouteKind = "guarded" | "unguarded"

export const ROUTE_PATHS: Record<RouteKind, string> = {
  guarded: "/learn/server-side-auth/api/report",
  unguarded: "/learn/server-side-auth/api/unguarded",
}

export interface RouteCall {
  kind: RouteKind
  path: string
  status: number
  statusText: string
  /** 整形したレスポンスの本文 */
  body: string
  /** ブラウザで計測した往復の時間（ms） */
  roundTripMs: number
  /** Server-Timing から読み取った、認証の確認にかかった時間（ms） */
  authMs?: number
  /** Server-Timing から読み取った、データソースの読み取りにかかった時間（ms） */
  dataMs?: number
  /** Server-Timing から読み取った、Route Handler 全体の処理時間（ms） */
  handlerMs?: number
}

// HTTP/2 では statusText が空になるため、デモで返るコードの説明を持っておく
export const STATUS_TEXT: Record<number, string> = {
  200: "OK",
  401: "Unauthorized",
  403: "Forbidden",
  500: "Internal Server Error",
  503: "Service Unavailable",
}

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

/**
 * Route Handler に本物の GET リクエストを送る。
 * 同じオリジンへの fetch なので、ブラウザがセッションの cookie を自動で付ける。
 * cookie は HttpOnly のため、このコードからは中身を読めない。
 */
export async function callRoute(kind: RouteKind): Promise<RouteCall> {
  const path = ROUTE_PATHS[kind]
  const startedAt = performance.now()
  const response = await fetch(path, { cache: "no-store" })
  const text = await response.text()
  const roundTripMs = performance.now() - startedAt
  const timings = parseServerTiming(response.headers.get("server-timing"))

  return {
    kind,
    path,
    status: response.status,
    statusText: STATUS_TEXT[response.status] ?? response.statusText,
    body: formatBody(text),
    roundTripMs,
    authMs: timings.auth,
    dataMs: timings.data,
    handlerMs: timings.handler,
  }
}
