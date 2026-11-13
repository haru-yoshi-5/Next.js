import type { ReactNode } from "react"

import { AiTutorPanel } from "@/components/ai/ai-tutor-panel"
import { AiUnavailableNotice } from "@/components/ai/ai-unavailable-notice"
import { Explanation } from "@/components/learning/explanation"
import { InsideThisPage } from "@/components/learning/inside-this-page"
import { LessonHeader } from "@/components/learning/lesson-header"
import { LiveDemo } from "@/components/learning/live-demo"
import { RelatedLessons } from "@/components/learning/related-lessons"
import { SourceCode } from "@/components/learning/source-code"
import { getLessonNeighbors } from "@/content/curriculum"
import { readAiConfig } from "@/lib/ai/config"
import type { LessonContent } from "@/types/lesson-content"

interface LessonPageProps {
  lesson: LessonContent
  /** 教材ごとの Live Demo（Process Visualizer を含む） */
  demo: ReactNode
}

/**
 * すべての教材ページで共通の構成。
 * タイトル → AI に質問する → 説明 → 詳細解説 → Live Demo / Process Visualizer → Source Code → Inside This Page → 関連教材
 */
export function LessonPage({ lesson, demo }: LessonPageProps) {
  const { current } = getLessonNeighbors(lesson.slug)
  // 教材ページはプリレンダーされるため、AI の設定はビルド時の環境変数で決まる。
  // クライアントへ渡すのは「使えるかどうか」だけで、キーなどの値は渡さない。
  const ai = readAiConfig()

  return (
    <article className="mx-auto flex max-w-6xl flex-col gap-14 px-4 py-8 lg:px-10 lg:py-10">
      <div className="flex flex-col gap-4">
        <LessonHeader lesson={lesson} meta={current} />
        <aside
          aria-label="AI に質問する"
          className={
            ai.status === "ready"
              ? "flex flex-col gap-3 rounded-lg border px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              : "rounded-lg border border-dashed px-4 py-3"
          }
        >
          {ai.status === "ready" ? (
            <>
              <p className="text-sm leading-relaxed text-muted-foreground">
                この教材の内容について、AI に質問できます（AI
                が生成した解説で、誤りを含むことがあります）。
              </p>
              <AiTutorPanel lessonId={lesson.slug} lessonTitle={lesson.title} />
            </>
          ) : (
            <AiUnavailableNotice reason={ai.status} />
          )}
        </aside>
      </div>
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
