import "server-only"

export interface ServerSnapshotData {
  /** サーバーで取得した時刻（JST） */
  fetchedAt: string
  nodeVersion: string
  platform: string
  memoryMb: number
  /** このサーバープロセスが起動してから取得した回数 */
  fetchCount: number
}

const timeFormatter = new Intl.DateTimeFormat("ja-JP", {
  timeZone: "Asia/Tokyo",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  fractionalSecondDigits: 3,
})

// サーバープロセスのメモリ上にだけ存在する値。ブラウザからは直接読めない。
let fetchCount = 0

/**
 * データベースや外部 API の代わりとなるデータ取得関数。
 * Node.js のプロセス情報など、サーバーでしか取得できない値を返す。
 *
 * `import "server-only"` により、Client Component から import するとビルドエラーになる。
 */
export async function getServerSnapshot(): Promise<ServerSnapshotData> {
  // 実際のデータベース問い合わせを想定した待ち時間
  await new Promise((resolve) => setTimeout(resolve, 400))
  fetchCount += 1

  return {
    fetchedAt: timeFormatter.format(new Date()),
    nodeVersion: process.version,
    platform: `${process.platform} / ${process.arch}`,
    memoryMb: Math.round(process.memoryUsage().rss / 1024 / 1024),
    fetchCount,
  }
}
