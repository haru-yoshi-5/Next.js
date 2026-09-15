import { LessonPage } from "@/components/learning/lesson-page"
import { serverActionsLesson } from "@/content/lessons/server-actions"
import { createLessonMetadata } from "@/lib/lesson-metadata"

import { GuestbookList } from "./guestbook-list"
import { NameForm } from "./name-form"

export const metadata = createLessonMetadata(serverActionsLesson)

export default function ServerActionsPage() {
  return (
    <LessonPage
      lesson={serverActionsLesson}
      demo={
        // GuestbookList（Server Component）を Client Component の props として渡す。
        // Server Action の完了後は、更新された一覧が同じ応答に含まれて差し替わる。
        <NameForm list={<GuestbookList />} />
      }
    />
  )
}
