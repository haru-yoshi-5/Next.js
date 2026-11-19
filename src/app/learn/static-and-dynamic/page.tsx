import { LessonPage } from "@/components/learning/lesson-page"
import { staticAndDynamicLesson } from "@/content/lessons/static-and-dynamic"
import { createLessonMetadata } from "@/lib/lesson-metadata"

import { DeliveryDemo } from "./delivery-demo"
import { StaticDynamicShort } from "./static-dynamic-short"

export const metadata = createLessonMetadata(staticAndDynamicLesson)

export default function StaticAndDynamicPage() {
  return (
    <LessonPage
      lesson={staticAndDynamicLesson}
      short={<StaticDynamicShort key="static-dynamic-short" />}
      demo={<DeliveryDemo />}
    />
  )
}
