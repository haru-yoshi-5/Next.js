import "server-only"

import { cookies } from "next/headers"

import { type AuthState, getAuthState } from "@/lib/auth-demo/dal"
import { can } from "@/lib/auth-demo/users"
import { measure } from "@/lib/measure"
import type { FlowTrace } from "@/types/flow"

import { loadSalesFigures, type MonthlySales } from "./sales-data"
import { buildServerEntryTrace, type ServerEntry } from "./trace"

/** 画面や API に渡してよい形にした売上レポート（DTO） */
export interface SalesReportDTO {
  title: string
  rows: MonthlySales[]
  total: number
}

/** レポートを読もうとした結果 */
export type ReportAccess =
  | {
      status: "unconfigured" | "unauthenticated" | "forbidden"
      auth: AuthState
      /** 認証（セッションの検証）にかかった時間 */
      authMs: number
    }
  | {
      status: "ok"
      auth: AuthState
      authMs: number
      report: SalesReportDTO
      /** データソースの読み取りにかかった時間 */
      dataMs: number
    }

/**
 * 売上レポートを読む。認証と認可の確認は、データを読むこの関数の中で行う。
 * Server Component・Server Action・Route Handler のどこから呼んでも、同じ確認を通る。
 * 拒否の伝え方（代わりの表示・戻り値・ステータスコード）は、呼び出した側が決める。
 */
export async function readSalesReport(): Promise<ReportAccess> {
  // 認証: cookie のセッションから「誰か」を確かめる
  const { result: auth, durationMs: authMs } = await measure(getAuthState)
  if (auth.status === "unconfigured") {
    return { status: "unconfigured", auth, authMs }
  }
  if (auth.status !== "authenticated") {
    return { status: "unauthenticated", auth, authMs }
  }

  // 認可: 確かめた相手に、レポートを見る権限があるか
  if (!can(auth.viewer, "view-sales-report")) {
    return { status: "forbidden", auth, authMs }
  }

  // 確認を通った場合だけ、データソースを読む
  const { result: rows, durationMs: dataMs } = await measure(loadSalesFigures)
  return {
    status: "ok",
    auth,
    authMs,
    dataMs,
    report: {
      title: "月別の売上（デモ用の架空の数字）",
      rows,
      total: rows.reduce((sum, row) => sum + row.amount, 0),
    },
  }
}

/**
 * readSalesReport() を呼び、Process Visualizer 用に処理の記録も作る（デモの計測のための包み）。
 * Server Component と Server Action から使う。
 */
export async function readSalesReportWithTrace(
  entry: ServerEntry,
): Promise<{ access: ReportAccess; trace: FlowTrace }> {
  // 先に cookie を読み、後の時刻の取得と ID の生成（crypto.randomUUID）をリクエスト時の処理にする。
  // 秘密鍵が未設定の場合、readSalesReport() は cookie を読まずに終わるため、ここで読んでおく
  await cookies()
  const startedAt = performance.now()
  const access = await readSalesReport()

  return {
    access,
    trace: buildServerEntryTrace({
      id: crypto.randomUUID(),
      entry,
      access,
      totalMs: performance.now() - startedAt,
    }),
  }
}
