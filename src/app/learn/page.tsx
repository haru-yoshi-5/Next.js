import type { Metadata } from "next"
import Link from "next/link"

import { RuntimeBadge } from "@/components/visualizer/runtime-badge"
import { curriculum, lessonHref } from "@/content/curriculum"

export const metadata: Metadata = {
  title: "教材一覧",
  description:
    "App Router、Server Components、Client Components、Server Actions、Streaming など、Next.js の仕組みを動くデモで学べる教材の一覧です。",
}

export default function LearnIndexPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 lg:px-10">
      <header className="mb-10 flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">教材一覧</h1>
        <p className="text-muted-foreground">
          公開中の教材から順番に読むのがおすすめです。「準備中」の教材は今後追加予定です。
        </p>
      </header>

      <div className="flex flex-col gap-10">
        {curriculum.map((chapter) => (
          <section key={chapter.id} aria-labelledby={`chapter-${chapter.id}`}>
            <h2
              id={`chapter-${chapter.id}`}
              className="mb-3 flex items-baseline gap-3 border-b pb-2"
            >
              <span className="font-mono text-sm text-muted-foreground">
                {chapter.number}
              </span>
              <span className="font-semibold">{chapter.title}</span>
            </h2>
            <ul className="flex flex-col">
              {chapter.lessons.map((lesson) => (
                <li
                  key={lesson.slug}
                  className="flex flex-col gap-1 border-b border-dashed py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                >
                  {lesson.status === "available" ? (
                    <div className="flex flex-col gap-1">
                      <Link
                        href={lessonHref(lesson.slug)}
                        className="w-fit rounded-sm font-medium underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {lesson.title}
                      </Link>
                      <p className="text-sm text-muted-foreground">
                        {lesson.summary}
                      </p>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">
                      {lesson.title}
                    </span>
                  )}
                  <div className="flex shrink-0 gap-1">
                    {lesson.status === "available" ? (
                      lesson.runtimes?.map((runtime) => (
                        <RuntimeBadge key={runtime} runtime={runtime} />
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        準備中
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}
