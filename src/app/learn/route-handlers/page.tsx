import { LessonPage } from "@/components/learning/lesson-page"
import { routeHandlersLesson } from "@/content/lessons/route-handlers"
import { createLessonMetadata } from "@/lib/lesson-metadata"

import { RequestPanel } from "./request-panel"
import { RouteHandlersShort } from "./route-handlers-short"

export const metadata = createLessonMetadata(routeHandlersLesson)

// ページ自体はリクエスト時のデータを使わないため、静的に配信される。
// Route Handler は同じフォルダの api/route.ts にあり、page.tsx とは別の URL を持つ。
export default function RouteHandlersPage() {
  return (
    <LessonPage
      lesson={routeHandlersLesson}
      short={<RouteHandlersShort key="route-handlers-short" />}
      demo={<RequestPanel />}
    />
  )
}
