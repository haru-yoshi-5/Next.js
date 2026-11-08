import { Suspense } from "react"

import { DemoSkeleton } from "@/components/learning/demo-skeleton"
import { LessonPage } from "@/components/learning/lesson-page"
import { dataFetchingLesson } from "@/content/lessons/data-fetching"
import { createLessonMetadata } from "@/lib/lesson-metadata"

import { FetchDemo } from "./fetch-demo"

export const metadata = createLessonMetadata(dataFetchingLesson)

export default function DataFetchingPage() {
  return (
    <LessonPage
      lesson={dataFetchingLesson}
      demo={
        // データ取得を待つ部分だけを Suspense で囲み、解説は先に表示する
        <Suspense
          fallback={<DemoSkeleton label="サーバーでデータを取得しています…" />}
        >
          <FetchDemo />
        </Suspense>
      }
    />
  )
}
