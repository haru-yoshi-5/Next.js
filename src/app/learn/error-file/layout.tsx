import { LessonPage } from "@/components/learning/lesson-page"
import { errorFileLesson } from "@/content/lessons/error-file"
import { createLessonMetadata } from "@/lib/lesson-metadata"

import { ErrorDemoPanel } from "./error-demo-panel"
import { ErrorFileShort } from "./error-file-short"

export const metadata = createLessonMetadata(errorFileLesson)

/**
 * error.tsx 教材の本体は page.tsx ではなく layout.tsx に置いている。
 * 同じフォルダの error.tsx は layout.tsx を包まないため、page がエラーになっても
 * 解説や Live Demo の枠は残り、枠の中だけが error.tsx に切り替わる。
 */
export default function ErrorFileLessonLayout({
  children,
}: LayoutProps<"/learn/error-file">) {
  return (
    <LessonPage
      lesson={errorFileLesson}
      short={<ErrorFileShort key="error-file-short" />}
      demo={<ErrorDemoPanel>{children}</ErrorDemoPanel>}
    />
  )
}
