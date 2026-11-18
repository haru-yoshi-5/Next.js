import { Suspense } from "react"

import { DemoSkeleton } from "@/components/learning/demo-skeleton"
import { LessonPage } from "@/components/learning/lesson-page"
import { streamingLesson } from "@/content/lessons/streaming"
import { createLessonMetadata } from "@/lib/lesson-metadata"

import { StreamingDemo } from "./streaming-demo"
import { StreamingShort } from "./streaming-short"

export const metadata = createLessonMetadata(streamingLesson)

export default function StreamingPage({
  searchParams,
}: PageProps<"/learn/streaming">) {
  return (
    <LessonPage
      lesson={streamingLesson}
      short={<StreamingShort key="streaming-short" />}
      demo={
        // searchParams はリクエスト時にしか分からないため、読む部分を Suspense の内側に置く
        <Suspense
          fallback={<DemoSkeleton label="ストリーミングを開始しています…" />}
        >
          <StreamingDemo searchParams={searchParams} />
        </Suspense>
      }
    />
  )
}
