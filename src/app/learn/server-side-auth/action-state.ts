import type { FlowTrace } from "@/types/flow"

import type { ReportAccess, SalesReportDTO } from "./report"

/**
 * Server Action が返す state。
 * "use server" のファイルからは async 関数しか export できないため、型と初期値はこのファイルに置く。
 */

/** ユーザーを切り替えた結果。成功した場合はページが描画し直される */
export type SwitchUserState =
  { status: "idle"; message: null } | { status: "error"; message: string }

export const initialSwitchUserState: SwitchUserState = {
  status: "idle",
  message: null,
}

/** Server Action でレポートを読んだ結果 */
export type ReadReportState =
  | { status: "idle"; message: null; report: null; trace: null }
  | {
      status: ReportAccess["status"]
      message: string
      report: SalesReportDTO | null
      trace: FlowTrace
    }
  | { status: "failed"; message: string; report: null; trace: null }

export const initialReadReportState: ReadReportState = {
  status: "idle",
  message: null,
  report: null,
  trace: null,
}
