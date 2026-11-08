import type { Metadata } from "next"

import { siteConfig } from "@/lib/site"

type OpenGraph = NonNullable<Metadata["openGraph"]>

/** サイト共通の Open Graph 画像（`src/app/opengraph-image.tsx`）の情報 */
export const siteOgImage = {
  url: "/opengraph-image",
  alt: "NextScope — See what happens inside Next.js",
  width: 1200,
  height: 630,
  type: "image/png",
} as const

/**
 * すべてのページで共有する Open Graph の値。
 * metadata はセグメントごとに浅くマージされ、子で `openGraph` を定義すると
 * 親の `openGraph`（ルートの opengraph-image から付く画像も含む）がまるごと置き換わる。
 * そのため、子で `openGraph` を定義するときはこの値を展開して引き継ぐ。
 */
export const sharedOpenGraph = {
  siteName: siteConfig.name,
  locale: "ja_JP",
} satisfies OpenGraph
