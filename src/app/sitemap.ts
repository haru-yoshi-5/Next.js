import type { MetadataRoute } from "next"

import { getAvailableLessons, lessonHref } from "@/content/curriculum"
import { siteConfig } from "@/lib/site"

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = ["/", "/learn"]
  const lessonRoutes = getAvailableLessons().map((lesson) =>
    lessonHref(lesson.slug),
  )

  return [...staticRoutes, ...lessonRoutes].map((route) => ({
    url: new URL(route, siteConfig.url).toString(),
  }))
}
