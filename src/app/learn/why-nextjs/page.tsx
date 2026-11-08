import { LessonPage } from "@/components/learning/lesson-page"
import { whyNextjsLesson } from "@/content/lessons/why-nextjs"
import { createLessonMetadata } from "@/lib/lesson-metadata"

import { WhyDemo } from "./why-demo"

export const metadata = createLessonMetadata(whyNextjsLesson)

// ページ全体がプリレンダーされる。デモはブラウザに届いたものを調べるだけ
export default function WhyNextjsPage() {
  return <LessonPage lesson={whyNextjsLesson} demo={<WhyDemo />} />
}
