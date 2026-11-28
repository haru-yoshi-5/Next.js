"use client"

import { PauseIcon, PlayIcon } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"

/**
 * トップページのフロー図のアニメーションを止める / 再開するボタン。
 * 止めている間は data-paused を付け、親の figure（group）が CSS でアニメーションを止める。
 * 動きを減らす設定ではアニメーション自体がないため、HeroFlow 側で置き場所ごと隠す。
 */
export function HeroFlowPauseToggle() {
  const [paused, setPaused] = useState(false)
  const [Icon, label] = paused
    ? [PlayIcon, "アニメーションを再生"]
    : [PauseIcon, "アニメーションを一時停止"]

  return (
    <Button
      variant="ghost"
      size="xs"
      data-paused={paused ? "" : undefined}
      onClick={() => setPaused((value) => !value)}
    >
      <Icon aria-hidden />
      {label}
    </Button>
  )
}
