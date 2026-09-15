import type { Metadata } from "next"

import { siteConfig } from "@/lib/site"
import type { LessonContent } from "@/types/lesson-content"

/** 教材データから各教材ページの metadata を生成する */
export function createLessonMetadata(lesson: LessonContent): Metadata {
  return {
    title: lesson.title,
    description: lesson.lead,
    alternates: { canonical: `/learn/${lesson.slug}` },
    openGraph: {
      type: "article",
      title: `${lesson.title} | ${siteConfig.name}`,
      description: lesson.lead,
      url: `/learn/${lesson.slug}`,
    },
  }
}
