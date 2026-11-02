import { LessonPage } from "@/components/learning/lesson-page"
import { staticAndDynamicLesson } from "@/content/lessons/static-and-dynamic"
import { createLessonMetadata } from "@/lib/lesson-metadata"

import { DeliveryDemo } from "./delivery-demo"

export const metadata = createLessonMetadata(staticAndDynamicLesson)

export default function StaticAndDynamicPage() {
  return <LessonPage lesson={staticAndDynamicLesson} demo={<DeliveryDemo />} />
}
