"use client"

import { useEffect } from "react"

import { useStreamTimeline } from "./stream-timeline"

interface ArrivalReporterProps {
  id: string
  label: string
  /** サーバーで計測した、リクエスト開始からの経過時間 */
  serverMs: number
}

/**
 * 画面には何も描画しない Client Component。
 * ストリーミングされたチャンクがブラウザで表示（ハイドレーション）されたことを
 * Process Visualizer に知らせる。
 */
export function ArrivalReporter({ id, label, serverMs }: ArrivalReporterProps) {
  const { reportArrival } = useStreamTimeline()

  useEffect(() => {
    reportArrival({ id, label, serverMs })
  }, [id, label, serverMs, reportArrival])

  return null
}
