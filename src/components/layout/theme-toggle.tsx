"use client"

import { MoonIcon, SunIcon } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="ライト / ダークテーマを切り替える"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      {/* マウント前でも表示が崩れないよう、アイコンの出し分けは CSS で行う */}
      <SunIcon aria-hidden className="dark:hidden" />
      <MoonIcon aria-hidden className="hidden dark:block" />
    </Button>
  )
}
