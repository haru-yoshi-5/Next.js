import { LessonPage } from "@/components/learning/lesson-page"
import { protectedPagesLesson } from "@/content/lessons/protected-pages"
import { createLessonMetadata } from "@/lib/lesson-metadata"

import { GuardDemoPanel } from "./guard-demo-panel"

export const metadata = createLessonMetadata(protectedPagesLesson)

/**
 * 保護されたページ教材の本体は page.tsx ではなく layout.tsx に置いている。
 * 解説・Source Code は layout として残り、Live Demo の枠の中だけが
 * 入口・ログイン・会員ページに切り替わる。
 *
 * この layout では認証を確かめない。layout はページを移動しても描画し直されず、
 * 子のページの描画も止められないため、確認はそれぞれのページの中で行う。
 */
export default function ProtectedPagesLessonLayout({
  children,
}: LayoutProps<"/learn/protected-pages">) {
  return (
    <LessonPage
      lesson={protectedPagesLesson}
      demo={<GuardDemoPanel>{children}</GuardDemoPanel>}
    />
  )
}
