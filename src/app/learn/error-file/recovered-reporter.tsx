"use client"

import { useEffect } from "react"

import { useReportDemoEvent } from "./demo-events"

/** 何も描画せず、page の描画に成功して表示されたことを Live Demo の記録に伝える */
export function RecoveredReporter() {
  const report = useReportDemoEvent()

  useEffect(() => {
    report({ kind: "recovered", atMs: performance.now() })
  }, [report])

  return null
}
