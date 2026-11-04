"use client"

import { createContext, useContext } from "react"

/**
 * - outage: 一時的な障害を起こした
 * - error: error.tsx が表示された
 * - retry / reset: error.tsx のボタンが押された
 * - recovered: page の描画に成功した
 */
export type DemoEventKind = "outage" | "error" | "retry" | "reset" | "recovered"

export interface DemoEvent {
  kind: DemoEventKind
  /** performance.now() と同じ基準の時刻 */
  atMs: number
  digest?: string
  message?: string
}

/**
 * error.tsx と page の中の Client Component から、layout のパネルへ出来事を伝える。
 * パネルは layout にあるため、error.tsx に切り替わっても記録が消えない。
 */
export const DemoEventsContext = createContext<(event: DemoEvent) => void>(
  () => {},
)

export function useReportDemoEvent() {
  return useContext(DemoEventsContext)
}
