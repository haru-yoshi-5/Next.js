/** 有効な記事の番号は 1〜ARTICLE_COUNT */
export const ARTICLE_COUNT = 100

/** generateStaticParams でビルド時にプリレンダーする番号 */
export const PRERENDERED_IDS = ["1", "2", "3"]

/** デモの記事ページの URL */
export function articlePath(id: string) {
  return `/learn/dynamic-routes/articles/${encodeURIComponent(id)}`
}

export interface Article {
  id: string
  title: string
  /** generateStaticParams に含まれる番号かどうか */
  prerendered: boolean
}

/**
 * URL の値は誰でも自由に入力できるため、形式と範囲を確かめてから使う。
 * 「1〜100 の整数（先頭に 0 を付けない）」以外は存在しない記事として扱う。
 */
export function findArticle(id: string): Article | null {
  if (!/^[1-9]\d{0,2}$/.test(id)) return null
  if (Number(id) > ARTICLE_COUNT) return null
  return {
    id,
    title: `サンプル記事 ${id}`,
    prerendered: PRERENDERED_IDS.includes(id),
  }
}
