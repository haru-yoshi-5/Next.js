import {
  BookOpenIcon,
  CodeIcon,
  EyeIcon,
  MousePointerClickIcon,
} from "lucide-react"
import Link from "next/link"

import { HeroFlow } from "@/components/home/hero-flow"
import { LessonCardList } from "@/components/learning/lesson-card-list"
import { buttonVariants } from "@/components/ui/button"
import { getAvailableLessons, lessonHref } from "@/content/curriculum"

const learningSteps = [
  {
    Icon: BookOpenIcon,
    title: "読む",
    text: "機能の目的と、どこで実行されるのかを短く解説します。",
  },
  {
    Icon: MousePointerClickIcon,
    title: "触る",
    text: "本物の Server Action や Suspense で動くデモを操作します。",
  },
  {
    Icon: EyeIcon,
    title: "見る",
    text: "操作の裏で Browser と Server の間に何が起きたかを可視化します。",
  },
  {
    Icon: CodeIcon,
    title: "確かめる",
    text: "表示中のデモを実際に動かしているソースコードをそのまま読みます。",
  },
]

// トップページは完全に静的な Server Component。ビルド時にプリレンダーされる。
export default function HomePage() {
  const lessons = getAvailableLessons()

  return (
    <main id="main-content" className="flex-1">
      <section className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-4 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:px-6 lg:py-24">
        <div className="flex flex-col gap-6">
          <p className="font-mono text-xs tracking-wider text-muted-foreground">
            INTERACTIVE NEXT.JS LEARNING
          </p>
          <h1 className="text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-4xl">
            Next.jsの中で何が起きているか、見えていますか？
          </h1>
          <p className="max-w-xl leading-relaxed text-muted-foreground">
            NextScopeは、実際に動作するNext.jsと処理フローの可視化を通して、Server
            ComponentsやServer
            ActionsなどNext.js特有の仕組みを理解するためのインタラクティブ教材です。
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/learn" className={buttonVariants({ size: "lg" })}>
              学習を始める
            </Link>
            <Link
              href={lessonHref("server-components")}
              className={buttonVariants({ size: "lg", variant: "outline" })}
            >
              Server Components から見る
            </Link>
          </div>
        </div>
        <HeroFlow />
      </section>

      <section aria-labelledby="how-to-learn" className="border-t bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-14 lg:px-6">
          <h2 id="how-to-learn" className="text-lg font-semibold">
            1つの教材で「読む・触る・見る・確かめる」
          </h2>
          <ol className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {learningSteps.map(({ Icon, title, text }, index) => (
              <li key={title} className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-muted-foreground">
                    0{index + 1}
                  </span>
                  <Icon aria-hidden className="size-4" />
                  <h3 className="font-medium">{title}</h3>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {text}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section aria-labelledby="lessons" className="border-t">
        <div className="mx-auto max-w-6xl px-4 py-14 lg:px-6">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-2">
            <h2 id="lessons" className="text-lg font-semibold">
              公開中の教材
            </h2>
            <p className="text-sm text-muted-foreground">
              このサイト自体が、各教材で解説している機能で作られています。
            </p>
          </div>
          <LessonCardList lessons={lessons} />
        </div>
      </section>
    </main>
  )
}
