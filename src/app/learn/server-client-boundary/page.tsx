import { Suspense } from "react"

import { DemoSkeleton } from "@/components/learning/demo-skeleton"
import { LessonPage } from "@/components/learning/lesson-page"
import { serverClientBoundaryLesson } from "@/content/lessons/server-client-boundary"
import { createLessonMetadata } from "@/lib/lesson-metadata"

import { BoundaryDemo } from "./boundary-demo"

export const metadata = createLessonMetadata(serverClientBoundaryLesson)

export default function ServerClientBoundaryPage() {
  return (
    <LessonPage
      lesson={serverClientBoundaryLesson}
      demo={
        <Suspense
          fallback={<DemoSkeleton label="サーバーで値を準備しています…" />}
        >
          <BoundaryDemo />
        </Suspense>
      }
    />
  )
}
