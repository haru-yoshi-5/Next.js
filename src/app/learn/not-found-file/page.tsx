import { LessonPage } from "@/components/learning/lesson-page"
import { notFoundFileLesson } from "@/content/lessons/not-found-file"
import { createLessonMetadata } from "@/lib/lesson-metadata"

import { NotFoundPanel } from "./not-found-panel"

export const metadata = createLessonMetadata(notFoundFileLesson)

// 教材ページ自体はリクエスト時のデータを使わないため、静的に配信される。
// デモのページは同じフォルダの items/・orders/ にあり、Live Demo から取得する。
export default function NotFoundFileLessonPage() {
  return <LessonPage lesson={notFoundFileLesson} demo={<NotFoundPanel />} />
}
