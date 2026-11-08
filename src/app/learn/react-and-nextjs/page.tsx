import { LessonPage } from "@/components/learning/lesson-page"
import { reactAndNextjsLesson } from "@/content/lessons/react-and-nextjs"
import { createLessonMetadata } from "@/lib/lesson-metadata"

import { ReactDemo } from "./react-demo"

export const metadata = createLessonMetadata(reactAndNextjsLesson)

// デモの ServerStamp だけがリクエスト時に描画され、それ以外はプリレンダーされる
export default function ReactAndNextjsPage() {
  return <LessonPage lesson={reactAndNextjsLesson} demo={<ReactDemo />} />
}
