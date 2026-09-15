"use client"

import { usePathname } from "next/navigation"

import { SidebarLinks } from "@/components/layout/sidebar-links"
import type { Chapter } from "@/types/lesson"

interface SidebarNavProps {
  chapters: Chapter[]
  onNavigate?: () => void
}

// 現在の URL に応じてアクティブ表示するため usePathname が必要 → Client Component。
// URL がプリレンダー時に確定しないルートでは suspend するため、呼び出し側で Suspense に包む。
export function SidebarNav({ chapters, onNavigate }: SidebarNavProps) {
  const pathname = usePathname()

  return (
    <SidebarLinks
      chapters={chapters}
      pathname={pathname}
      onNavigate={onNavigate}
    />
  )
}
