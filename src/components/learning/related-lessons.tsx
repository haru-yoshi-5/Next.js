import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react"
import Link from "next/link"

import { LessonCardList } from "@/components/learning/lesson-card-list"
import { SectionHeading } from "@/components/learning/section-heading"
import {
  getAvailableLessons,
  getLessonNeighbors,
  lessonHref,
} from "@/content/curriculum"

interface RelatedLessonsProps {
  slug: string
  related: string[]
}

export function RelatedLessons({ slug, related }: RelatedLessonsProps) {
  const lessons = getAvailableLessons().filter((lesson) =>
    related.includes(lesson.slug),
  )
  const { previous, next } = getLessonNeighbors(slug)

  return (
    <section aria-labelledby="related-lessons">
      <SectionHeading id="related-lessons" eyebrow="RELATED" title="関連教材" />
      {lessons.length > 0 ? (
        <LessonCardList lessons={lessons} />
      ) : (
        <p className="text-sm text-muted-foreground">
          関連する公開済みの教材はまだありません。
        </p>
      )}

      <nav
        aria-label="前後の教材"
        className="mt-10 grid gap-3 border-t pt-6 sm:grid-cols-2"
      >
        {previous ? (
          <Link
            href={lessonHref(previous.slug)}
            className="flex flex-col gap-1 rounded-lg border p-4 transition-colors outline-none hover:bg-accent/50 focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <ArrowLeftIcon aria-hidden className="size-3" />
              前の教材
            </span>
            <span className="font-medium">{previous.title}</span>
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            href={lessonHref(next.slug)}
            className="flex flex-col items-end gap-1 rounded-lg border p-4 text-right transition-colors outline-none hover:bg-accent/50 focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              次の教材
              <ArrowRightIcon aria-hidden className="size-3" />
            </span>
            <span className="font-medium">{next.title}</span>
          </Link>
        ) : null}
      </nav>
    </section>
  )
}
