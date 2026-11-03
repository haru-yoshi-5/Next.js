import "server-only"

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export interface Author {
  name: string
  role: string
}

export interface Post {
  id: string
  title: string
}

/**
 * データベースや外部 API の代わりとなるデータ取得関数。
 * 2つの関数はお互いの結果を使わないため、同時に開始できる。
 */
export async function getAuthor(): Promise<Author> {
  // 実際の問い合わせを想定した待ち時間
  await wait(400)
  return { name: "Aoi Tanaka", role: "Frontend Engineer" }
}

export async function getPosts(): Promise<Post[]> {
  await wait(600)
  return [
    { id: "p1", title: "Server Components の読み方" },
    { id: "p2", title: "Suspense の境界を決める" },
    { id: "p3", title: "キャッシュする範囲を考える" },
  ]
}
