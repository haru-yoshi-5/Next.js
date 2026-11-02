export interface DeliveryMeasurement {
  shellId: string
  /** 取得を始めてから静的シェルの値が届くまでの時間（ms） */
  shellAtMs: number
  requestId: string
  /** 取得を始めてからリクエスト時の値が届くまでの時間（ms） */
  requestAtMs: number
}

// HTML の属性だけに一致させる。Source Code 欄の表示では " がエスケープされるので一致しない
const SHELL_ID = /data-nsc-shell-id="([0-9a-f]{8})"/
const REQUEST_ID = /data-nsc-request-id="([0-9a-f]{8})"/

interface Arrival {
  id: string
  atMs: number
}

function findArrival(
  html: string,
  pattern: RegExp,
  atMs: number,
): Arrival | null {
  const id = html.match(pattern)?.[1]
  return id ? { id, atMs } : null
}

/** このページを取得し直し、応答を読み進めながら、それぞれの値が届いた時間を記録する */
export async function measureDelivery(): Promise<DeliveryMeasurement> {
  const startedAt = performance.now()
  const response = await fetch(window.location.pathname, { cache: "no-store" })
  if (!response.ok || !response.body) {
    throw new Error(`ページの取得に失敗しました: ${response.status}`)
  }

  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader()
  let html = ""
  let shell: Arrival | null = null
  let request: Arrival | null = null

  while (!shell || !request) {
    const { done, value } = await reader.read()
    if (done) break
    html += value

    const atMs = performance.now() - startedAt
    shell ??= findArrival(html, SHELL_ID, atMs)
    request ??= findArrival(html, REQUEST_ID, atMs)
  }
  await reader.cancel()

  if (!shell || !request) {
    throw new Error("応答の中に計測する値が見つかりませんでした")
  }

  return {
    shellId: shell.id,
    shellAtMs: shell.atMs,
    requestId: request.id,
    requestAtMs: request.atMs,
  }
}
