import { unstable_rethrow } from "next/navigation"
import { connection } from "next/server"

import { readSalesReport } from "../../report"
import { serverTiming } from "../server-timing"

/** 利用者ごとに内容が変わるため、ブラウザや途中のサーバーに保存させない */
const PRIVATE_HEADERS = { "Cache-Control": "private, no-store" }

/**
 * GET /learn/server-side-auth/api/report
 * Route Handler は公開された API と同じで、画面を通らずに直接呼び出せる。
 * そのため、ページと同じ readSalesReport() で認証と認可を確かめ、結果をステータスコードで返す。
 * 利用者ごとに結果が変わるため、connection() でビルド時のプリレンダーを止め、リクエストのたびに実行させる。
 * （秘密鍵が未設定の場合は cookie を読まずに終わるため、cookie の読み取りだけに頼らない）
 */
export async function GET() {
  await connection()
  const startedAt = performance.now()

  try {
    const access = await readSalesReport()
    const timings: Record<string, number> = { auth: access.authMs }
    if (access.status === "ok") timings.data = access.dataMs

    const respond = (status: number, body: unknown) =>
      Response.json(body, {
        status,
        headers: {
          ...PRIVATE_HEADERS,
          "Server-Timing": serverTiming({
            ...timings,
            handler: performance.now() - startedAt,
          }),
        },
      })

    switch (access.status) {
      case "unconfigured":
        return respond(503, {
          error: "認証デモの秘密鍵が設定されていないため、確認できません。",
        })
      // 認証の失敗: 誰か分からない
      case "unauthenticated":
        return respond(401, { error: "ログインが必要です。" })
      // 認可の失敗: 誰かは分かったが、権限がない
      case "forbidden":
        return respond(403, { error: "このレポートを見る権限がありません。" })
      case "ok":
        return respond(200, { report: access.report })
    }
  } catch (error) {
    // ビルド時に cookies() がプリレンダーを中断する場合など、Next.js 内部のエラーは投げ直して任せる
    unstable_rethrow(error)
    // 詳細はサーバーのログにだけ残し、ブラウザには一般的なメッセージを返す
    console.error("[server-side-auth] レポートの読み取りに失敗しました", error)
    return Response.json(
      {
        error: "処理中にエラーが発生しました。時間をおいて再度お試しください。",
      },
      { status: 500, headers: PRIVATE_HEADERS },
    )
  }
}
