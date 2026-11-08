import { LoaderIcon } from "lucide-react"
import { Suspense } from "react"

import { LessonPage } from "@/components/learning/lesson-page"
import { authenticationBasicsLesson } from "@/content/lessons/authentication-basics"
import { createLessonMetadata } from "@/lib/lesson-metadata"

import { AuthDemo } from "./auth-demo"

export const metadata = createLessonMetadata(authenticationBasicsLesson)

export default function AuthenticationBasicsPage() {
  return (
    <LessonPage
      lesson={authenticationBasicsLesson}
      demo={
        // AuthDemo は cookie を読むため、リクエストのたびに描画する。
        // <Suspense> で囲み、教材の本文をビルド時の静的な部分に残す。
        <Suspense
          fallback={
            <p
              role="status"
              className="flex items-center gap-2 rounded-xl border px-4 py-6 text-sm text-muted-foreground"
            >
              <LoaderIcon
                aria-hidden
                className="size-4 motion-safe:animate-spin"
              />
              サーバーでセッションを確認しています…
            </p>
          }
        >
          <AuthDemo />
        </Suspense>
      }
    />
  )
}
