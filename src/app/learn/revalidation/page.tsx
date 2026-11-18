import { Suspense } from "react"

import { DemoSkeleton } from "@/components/learning/demo-skeleton"
import { LessonPage } from "@/components/learning/lesson-page"
import { revalidationLesson } from "@/content/lessons/revalidation"
import { createLessonMetadata } from "@/lib/lesson-metadata"

import { RevalidationDemo } from "./revalidation-demo"
import { RevalidationShort } from "./revalidation-short"

export const metadata = createLessonMetadata(revalidationLesson)

export default function RevalidationPage() {
  return (
    <LessonPage
      lesson={revalidationLesson}
      short={<RevalidationShort key="revalidation-short" />}
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
