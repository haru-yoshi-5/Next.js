import { Suspense } from "react"

import { DemoSkeleton } from "@/components/learning/demo-skeleton"
import { LessonPage } from "@/components/learning/lesson-page"
import { revalidationLesson } from "@/content/lessons/revalidation"
import { createLessonMetadata } from "@/lib/lesson-metadata"

import { RevalidationDemo } from "./revalidation-demo"

export const metadata = createLessonMetadata(revalidationLesson)

export default function RevalidationPage() {
  return (
    <LessonPage
      lesson={revalidationLesson}
      demo={
        <Suspense
          fallback={<DemoSkeleton label="キャッシュを読み取っています…" />}
        >
          <RevalidationDemo />
        </Suspense>
      }
    />
  )
}
