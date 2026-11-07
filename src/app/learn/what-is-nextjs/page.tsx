import { LessonPage } from "@/components/learning/lesson-page"
import { whatIsNextjsLesson } from "@/content/lessons/what-is-nextjs"
import { createLessonMetadata } from "@/lib/lesson-metadata"

import { AnatomyDemo } from "./anatomy-demo"

export const metadata = createLessonMetadata(whatIsNextjsLesson)

// このページ自体が「Next.js が行う仕事」の調査対象。
// デモで使うファイル一覧はプリレンダー時に求めてキャッシュするため、ページ全体が静的に生成される。
export default function WhatIsNextjsPage() {
  return <LessonPage lesson={whatIsNextjsLesson} demo={<AnatomyDemo />} />
}
