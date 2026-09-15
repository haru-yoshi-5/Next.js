import { Suspense } from "react"

import { DemoSkeleton } from "@/components/learning/demo-skeleton"
import { LessonPage } from "@/components/learning/lesson-page"
import { serverComponentsLesson } from "@/content/lessons/server-components"
import { createLessonMetadata } from "@/lib/lesson-metadata"

import { ServerSnapshot } from "./server-snapshot"

export const metadata = createLessonMetadata(serverComponentsLesson)

// "use client" を書いていないので、page.tsx は Server Component。
// 解説文や Source Code はビルド時にプリレンダーされ、ブラウザ用の JavaScript を必要としない。
export default function ServerComponentsPage() {
  return (
    <LessonPage
      lesson={serverComponentsLesson}
      demo={
        // リクエストごとに実行する部分だけを Suspense で囲む。
        // fallback はプリレンダーされた静的シェルに含まれ、完成した結果が後から届く。
        <Suspense
          fallback={<DemoSkeleton label="サーバーでデータを取得しています…" />}
        >
          <ServerSnapshot />
        </Suspense>
      }
    />
  )
}
