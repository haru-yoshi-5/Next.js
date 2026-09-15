import type { ReactNode } from "react"

import { Explanation } from "@/components/learning/explanation"
import { InsideThisPage } from "@/components/learning/inside-this-page"
import { LessonHeader } from "@/components/learning/lesson-header"
import { LiveDemo } from "@/components/learning/live-demo"
import { RelatedLessons } from "@/components/learning/related-lessons"
import { SourceCode } from "@/components/learning/source-code"
import { getLessonNeighbors } from "@/content/curriculum"
import type { LessonContent } from "@/types/lesson-content"

interface LessonPageProps {
  lesson: LessonContent
  /** 教材ごとの Live Demo（Process Visualizer を含む） */
  demo: ReactNode
}

/**
 * すべての教材ページで共通の構成。
 * タイトル → 説明 → 詳細解説 → Live Demo / Process Visualizer → Source Code → Inside This Page → 関連教材
 */
export function LessonPage({ lesson, demo }: LessonPageProps) {
  const { current } = getLessonNeighbors(lesson.slug)

  return (
    <article className="mx-auto flex max-w-6xl flex-col gap-14 px-4 py-8 lg:px-10 lg:py-10">
      <LessonHeader lesson={lesson} meta={current} />
      <Explanation sections={lesson.sections} />
      <LiveDemo description={lesson.demo.description} steps={lesson.demo.steps}>
        {demo}
      </LiveDemo>
      <SourceCode files={lesson.sourceFiles} />
      <InsideThisPage
        files={lesson.inside.files}
        features={lesson.inside.features}
      />
      <RelatedLessons slug={lesson.slug} related={lesson.related} />
    </article>
  )
}
