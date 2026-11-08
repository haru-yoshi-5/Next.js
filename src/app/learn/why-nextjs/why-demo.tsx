import { whyNextjsLesson } from "@/content/lessons/why-nextjs"
import { siteConfig } from "@/lib/site"

import { WhyPanel } from "./why-panel"

/**
 * Server Component。
 * metadata・sitemap・robots と同じ siteConfig.url から、この教材で期待する値を作って渡す。
 * ブラウザ側は、届いたものがこの値と一致するかを調べる。
 */
export function WhyDemo() {
  const pagePath = `/learn/${whyNextjsLesson.slug}`

  return (
    <WhyPanel
      expected={{
        // Root Layout の title.template（"%s | NextScope"）を通した値
        title: `${whyNextjsLesson.title} | ${siteConfig.name}`,
        pageUrl: new URL(pagePath, siteConfig.url).toString(),
        sitemapUrl: new URL("/sitemap.xml", siteConfig.url).toString(),
      }}
    />
  )
}
