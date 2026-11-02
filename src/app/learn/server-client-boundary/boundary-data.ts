import "server-only"

/** サーバー専用のコードにだけ含まれる目印。クライアント用の JavaScript に入らないことを検査で確かめる */
export const SERVER_CODE_MARKER = "nsc-server-code-5e6f7a8b"

export interface BoundaryRecord {
  /** Server Component が実行されるたびに変わる ID */
  renderId: string
  /** props で Client Component へ渡す値 */
  publicToken: string
  /** Client Component へ渡さない値 */
  internalNote: string
  createdAt: Date
  tags: Set<string>
  scores: Map<string, number>
}

/** 検索で見分けられるように、前置きとランダムな16進数12桁で値を作る */
function createToken(prefix: string) {
  return `${prefix}-${crypto.randomUUID().replaceAll("-", "").slice(0, 12)}`
}

/** データベースの代わりに、リクエストごとの値を作る */
export async function readBoundaryRecord(): Promise<BoundaryRecord> {
  await new Promise((resolve) => setTimeout(resolve, 200))

  return {
    renderId: crypto.randomUUID().slice(0, 8),
    publicToken: createToken("nsc-public"),
    internalNote: createToken("nsc-secret"),
    createdAt: new Date(),
    tags: new Set(["server", "client"]),
    scores: new Map([["props", 1]]),
  }
}
