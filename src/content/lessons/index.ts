import type { LessonContent } from "@/types/lesson-content"

import { appRouterLesson } from "./app-router"
import { authenticationBasicsLesson } from "./authentication-basics"
import { clientComponentsLesson } from "./client-components"
import { dataFetchingLesson } from "./data-fetching"
import { dynamicRoutesLesson } from "./dynamic-routes"
import { errorFileLesson } from "./error-file"
import { loadingFileLesson } from "./loading-file"
import { nextjsCacheLesson } from "./nextjs-cache"
import { notFoundFileLesson } from "./not-found-file"
import { protectedPagesLesson } from "./protected-pages"
import { reactAndNextjsLesson } from "./react-and-nextjs"
import { revalidationLesson } from "./revalidation"
import { routeHandlersLesson } from "./route-handlers"
import { serverActionsLesson } from "./server-actions"
import { serverClientBoundaryLesson } from "./server-client-boundary"
import { serverComponentsLesson } from "./server-components"
import { serverSideAuthLesson } from "./server-side-auth"
import { staticAndDynamicLesson } from "./static-and-dynamic"
import { streamingLesson } from "./streaming"
import { whatIsNextjsLesson } from "./what-is-nextjs"
import { whyNextjsLesson } from "./why-nextjs"

/**
 * すべての教材の本文データ。
 * サーバー側で教材 ID（slug）から本文を引くために使う（クライアントの申告を信頼しないため）。
 * 教材を追加したときは、ここにも追加する（curriculum.ts との一致はテストで確かめる）。
 */
const lessons: readonly LessonContent[] = [
  whatIsNextjsLesson,
  reactAndNextjsLesson,
  whyNextjsLesson,
  appRouterLesson,
  dynamicRoutesLesson,
  serverComponentsLesson,
  clientComponentsLesson,
  serverClientBoundaryLesson,
  dataFetchingLesson,
  serverActionsLesson,
  routeHandlersLesson,
  streamingLesson,
  staticAndDynamicLesson,
  nextjsCacheLesson,
  revalidationLesson,
  errorFileLesson,
  notFoundFileLesson,
  loadingFileLesson,
  authenticationBasicsLesson,
  serverSideAuthLesson,
  protectedPagesLesson,
]

const lessonsBySlug = new Map(lessons.map((lesson) => [lesson.slug, lesson]))

export function getLessonContent(slug: string): LessonContent | undefined {
  return lessonsBySlug.get(slug)
}

export function getLessonContentSlugs(): string[] {
  return lessons.map((lesson) => lesson.slug)
}
