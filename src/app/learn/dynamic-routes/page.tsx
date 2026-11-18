import { LessonPage } from "@/components/learning/lesson-page"
import { dynamicRoutesLesson } from "@/content/lessons/dynamic-routes"
import { createLessonMetadata } from "@/lib/lesson-metadata"

import { ArticlePanel } from "./article-panel"
import { DynamicRoutesShort } from "./dynamic-routes-short"

export const metadata = createLessonMetadata(dynamicRoutesLesson)

// 教材ページ自体はリクエスト時のデータを使わないため、静的に配信される。
// Dynamic Route は同じフォルダの articles/[id]/page.tsx にあり、Live Demo から取得する。
export default function DynamicRoutesPage() {
  return (
    <LessonPage
      lesson={dynamicRoutesLesson}
      short={<DynamicRoutesShort key="dynamic-routes-short" />}
      demo={<ArticlePanel />}
    />
  )
}
