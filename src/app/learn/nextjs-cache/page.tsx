import { Suspense } from "react"

import { DemoSkeleton } from "@/components/learning/demo-skeleton"
import { LessonPage } from "@/components/learning/lesson-page"
import { nextjsCacheLesson } from "@/content/lessons/nextjs-cache"
import { createLessonMetadata } from "@/lib/lesson-metadata"

import { CacheDemo } from "./cache-demo"
import { CacheShort } from "./cache-short"

export const metadata = createLessonMetadata(nextjsCacheLesson)

export default function NextjsCachePage() {
  return (
    <LessonPage
      lesson={nextjsCacheLesson}
      short={<CacheShort key="cache-short" />}
      demo={
        <Suspense
          fallback={
            <DemoSkeleton label="サーバーでデータを読み取っています…" />
          }
        >
          <CacheDemo />
        </Suspense>
      }
    />
  )
}
