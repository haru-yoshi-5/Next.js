import { LessonPage } from "@/components/learning/lesson-page"
import { loadingFileLesson } from "@/content/lessons/loading-file"
import { createLessonMetadata } from "@/lib/lesson-metadata"

import { LoadingDemoPanel } from "./loading-demo-panel"
import { LoadingFileShort } from "./loading-file-short"

export const metadata = createLessonMetadata(loadingFileLesson)

/**
 * loading.tsx 教材の本体は page.tsx ではなく layout.tsx に置いている。
 * 解説・Source Code は layout として残り、Live Demo の枠の中だけが
 * page.tsx / with-loading / without-loading / with-suspense に切り替わる。
 */
export default function LoadingFileLessonLayout({
  children,
}: LayoutProps<"/learn/loading-file">) {
  return (
    <LessonPage
      lesson={loadingFileLesson}
      short={<LoadingFileShort key="loading-file-short" />}
      demo={<LoadingDemoPanel>{children}</LoadingDemoPanel>}
    />
  )
}
