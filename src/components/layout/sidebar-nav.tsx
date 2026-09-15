"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { lessonHref } from "@/content/curriculum"
import { cn } from "@/lib/utils"
import type { Chapter } from "@/types/lesson"

interface SidebarNavProps {
  chapters: Chapter[]
  /** モバイルメニューでリンク選択時に閉じるためのコールバック */
  onNavigate?: () => void
}

// 現在のURLに応じてアクティブ表示するため usePathname が必要 → Client Component。
// 章データ自体は Server Component から props で受け取る。
export function SidebarNav({ chapters, onNavigate }: SidebarNavProps) {
  const pathname = usePathname()

  return (
    <nav aria-label="教材ナビゲーション" className="flex flex-col gap-6">
      {chapters.map((chapter) => (
        <section key={chapter.id} aria-labelledby={`nav-${chapter.id}`}>
          <h2
            id={`nav-${chapter.id}`}
            className="mb-2 flex items-baseline gap-2 px-2 text-xs font-medium text-muted-foreground"
          >
            <span className="font-mono">{chapter.number}</span>
            <span>{chapter.title}</span>
          </h2>
          <ul className="flex flex-col gap-0.5">
            {chapter.lessons.map((lesson) => {
              if (lesson.status === "planned") {
                return (
                  <li key={lesson.slug}>
                    <span
                      aria-disabled="true"
                      className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm text-muted-foreground/70"
                    >
                      {lesson.title}
                      <span className="text-[0.65rem]">準備中</span>
                    </span>
                  </li>
                )
              }

              const href = lessonHref(lesson.slug)
              const isActive =
                pathname === href || pathname.startsWith(`${href}/`)

              return (
                <li key={lesson.slug}>
                  <Link
                    href={href}
                    onClick={onNavigate}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "block rounded-md px-2 py-1.5 text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      isActive
                        ? "bg-accent font-medium text-foreground"
                        : "text-foreground/80 hover:bg-accent/60 hover:text-foreground",
                    )}
                  >
                    {lesson.title}
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </nav>
  )
}
