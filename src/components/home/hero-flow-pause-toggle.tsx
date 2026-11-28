"use client"

import { PauseIcon, PlayIcon } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"

/**
 * トップページのフロー図のアニメーションを止める / 再開するボタン。
 * 止めている間は data-paused を付け、親の figure（group）が CSS でアニメーションを止める。
 * 動きを減らす設定ではアニメーション自体がないため、ボタンも隠す。
 */
export function HeroFlowPauseToggle() {
  const [paused, setPaused] = useState(false)

  return (
    <Button
      variant="ghost"
      size="xs"
      data-paused={paused ? "" : undefined}
      onClick={() => setPaused((value) => !value)}
      className="motion-reduce:hidden"
    >
      {paused ? <PlayIcon aria-hidden /> : <PauseIcon aria-hidden />}
      {paused ? "アニメーションを再生" : "アニメーションを一時停止"}
    </Button>
  )
}
