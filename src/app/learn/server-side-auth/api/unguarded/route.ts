import { connection } from "next/server"

import { loadSalesFigures } from "../../sales-data"
import { serverTiming } from "../server-timing"

/**
 * GET /learn/server-side-auth/api/unguarded
 * 【悪い例】認証と認可の確認を忘れた Route Handler。
 * 教材ページの画面では確認していても、この URL を直接呼べば、誰にでも売上の数字を返してしまう。
 * データソースを直接読み、確認を済ませる readSalesReport() を通っていないことが原因。
 */
export async function GET() {
  // デモで毎回の実行を計測するため、ビルド時のプリレンダーを止めてリクエストのたびに実行させる
  await connection()
  const startedAt = performance.now()

  try {
    const rows = await loadSalesFigures()
    const dataMs = performance.now() - startedAt

    return Response.json(
      {
        report: {
          title: "月別の売上（デモ用の架空の数字）",
          rows,
          total: rows.reduce((sum, row) => sum + row.amount, 0),
        },
      },
      {
        headers: {
          "Cache-Control": "private, no-store",
          "Server-Timing": serverTiming({
            data: dataMs,
            handler: performance.now() - startedAt,
          }),
        },
      },
    )
  } catch (error) {
    console.error("[server-side-auth] レポートの読み取りに失敗しました", error)
    return Response.json(
      {
        error: "処理中にエラーが発生しました。時間をおいて再度お試しください。",
      },
      { status: 500 },
    )
  }
}
