import { LessonPage } from "@/components/learning/lesson-page"
import { clientComponentsLesson } from "@/content/lessons/client-components"
import { createLessonMetadata } from "@/lib/lesson-metadata"

import { CounterDemo } from "./counter-demo"

export const metadata = createLessonMetadata(clientComponentsLesson)

// Client Components の教材だが、page.tsx 自体は Server Component のまま。
// インタラクションが必要な CounterDemo だけを Client Component にしている。
export default function ClientComponentsPage() {
  return <LessonPage lesson={clientComponentsLesson} demo={<CounterDemo />} />
}
