import { ArrowRightIcon } from "lucide-react"
import Link from "next/link"

import { RuntimeBadge } from "@/components/visualizer/runtime-badge"
import { type AvailableLesson, lessonHref } from "@/content/curriculum"

/** 公開済み教材の一覧。トップページ・関連教材で共用する */
export function LessonCardList({ lessons }: { lessons: AvailableLesson[] }) {
  return (
    <ul className="grid gap-px overflow-hidden rounded-xl border bg-border sm:grid-cols-2">
      {lessons.map((lesson) => (
        <li key={lesson.slug} className="bg-background">
          <Link
            href={lessonHref(lesson.slug)}
            className="group flex h-full flex-col gap-3 p-5 transition-colors outline-none hover:bg-accent/50 focus-visible:bg-accent/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-xs text-muted-foreground">
                {lesson.chapter.number} {lesson.chapter.title}
              </span>
              <span className="flex gap-1">
                {lesson.runtimes?.map((runtime) => (
                  <RuntimeBadge key={runtime} runtime={runtime} />
                ))}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <h3 className="font-medium">{lesson.title}</h3>
              <ArrowRightIcon
                aria-hidden
                className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5"
              />
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {lesson.summary}
            </p>
          </Link>
        </li>
      ))}
    </ul>
  )
}
