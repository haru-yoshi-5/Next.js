import { Suspense } from "react"

import { DemoSkeleton } from "@/components/learning/demo-skeleton"
import { LessonPage } from "@/components/learning/lesson-page"
import { appRouterLesson } from "@/content/lessons/app-router"
import { createLessonMetadata } from "@/lib/lesson-metadata"

import { RouteDemoPanel } from "./route-demo-panel"
import { AppRouterShort } from "./app-router-short"

export const metadata = createLessonMetadata(appRouterLesson)

/**
 * App Router 教材の本体は page.tsx ではなく layout.tsx に置いている。
 * 解説・Source Code は layout として固定され、Live Demo の中だけが
 * page.tsx / [slug]/page.tsx / not-found.tsx に切り替わる。
 */
export default function AppRouterLessonLayout({
  children,
}: LayoutProps<"/learn/app-router">) {
  return (
    <LessonPage
      lesson={appRouterLesson}
      short={<AppRouterShort key="app-router-short" />}
      demo={
        // RouteDemoPanel は usePathname() を使うため、generateStaticParams にない slug
        // （URL がビルド時に確定しないルート）ではリクエスト時まで fallback を表示する
        <Suspense fallback={<DemoSkeleton label="デモを準備しています…" />}>
          <RouteDemoPanel>{children}</RouteDemoPanel>
        </Suspense>
      }
    />
  )
}
