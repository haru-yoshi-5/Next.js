import { CheckIcon } from "lucide-react"
import Link from "next/link"

import { RichText } from "@/components/learning/rich-text"
import { RuntimeBadge } from "@/components/visualizer/runtime-badge"
import type { AvailableLesson } from "@/content/curriculum"
import type { LessonContent } from "@/types/lesson-content"

interface LessonHeaderProps {
  lesson: LessonContent
  meta: AvailableLesson | undefined
}

export function LessonHeader({ lesson, meta }: LessonHeaderProps) {
  return (
    <header className="flex flex-col gap-5 border-b pb-8">
      <nav aria-label="パンくずリスト">
        <ol className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          <li>
            <Link href="/learn" className="hover:text-foreground">
              教材一覧
            </Link>
          </li>
          {meta ? (
            <li className="before:mr-1.5 before:content-['/']">
              <span className="font-mono">{meta.chapter.number}</span>{" "}
              {meta.chapter.title}
            </li>
          ) : null}
          <li
            aria-current="page"
            className="text-foreground before:mr-1.5 before:text-muted-foreground before:content-['/']"
          >
            {lesson.title}
          </li>
        </ol>
      </nav>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {lesson.title}
          </h1>
          <div className="flex gap-1">
            {meta?.runtimes?.map((runtime) => (
              <RuntimeBadge key={runtime} runtime={runtime} />
            ))}
          </div>
        </div>
        <p className="max-w-3xl leading-relaxed text-muted-foreground">
          <RichText text={lesson.lead} />
        </p>
      </div>

      <section
        aria-labelledby="key-points"
        className="rounded-lg border bg-muted/30 p-4"
      >
        <h2 id="key-points" className="mb-2 text-sm font-medium">
          この教材でわかること
        </h2>
        <ul className="grid gap-1.5 text-sm md:grid-cols-3 md:gap-4">
          {lesson.keyPoints.map((point) => (
            <li key={point} className="flex gap-2 leading-relaxed">
              <CheckIcon
                aria-hidden
                className="mt-1 size-3.5 shrink-0 text-flow"
              />
              <span>
                <RichText text={point} />
              </span>
            </li>
          ))}
        </ul>
      </section>
    </header>
  )
}
