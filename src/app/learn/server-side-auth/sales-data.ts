import "server-only"

/**
 * デモのデータソース（データベースの代わり）。数字は架空のもの。
 * この関数は認証・認可を確かめない。そのため、画面やAPIからは直接呼ばず、
 * 確認を済ませる report.ts の readSalesReport() を通して読む。
 */

export interface MonthlySales {
  month: string
  /** 売上（円） */
  amount: number
}

const SALES: readonly MonthlySales[] = [
  { month: "8月", amount: 1_240_000 },
  { month: "9月", amount: 1_380_000 },
  { month: "10月", amount: 1_510_000 },
]

export async function loadSalesFigures(): Promise<MonthlySales[]> {
  return SALES.map((row) => ({ ...row }))
}
