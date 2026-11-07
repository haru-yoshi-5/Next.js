import "server-only"

import { access } from "node:fs/promises"
import path from "node:path"

import { cacheLife } from "next/cache"

/** このページの URL（/learn/what-is-nextjs）の区切り。フォルダ名と1対1で対応する */
const ROUTE_SEGMENTS = ["learn", "what-is-nextjs"]

/**
 * フォルダごとに探す特別なファイル。
 * 公式ドキュメントの Component hierarchy と同じ、外側 → 内側の順に並べている。
 */
const SPECIAL_FILES = [
  "layout.tsx",
  "template.tsx",
  "error.tsx",
  "loading.tsx",
  "not-found.tsx",
]

export interface RouteFolder {
  /** "src/app/learn" など */
  folder: string
  /** このフォルダが受け持つ URL（"/learn" など） */
  urlPath: string
  /** 見つかった特別なファイル（外側 → 内側の順） */
  files: string[]
}

async function exists(filePath: string) {
  try {
    await access(filePath)
    return true
  } catch {
    return false
  }
}

/**
 * この URL を表示するときに Next.js が使うファイルを、src/app から実際に探す。
 *
 * - URL の区切りごとに、対応するフォルダの特別なファイルを調べる
 * - page.tsx は URL の最後のフォルダのものだけが使われる
 * - "use cache" によりビルド時に一度だけ実行され、結果が静的シェルに含まれる
 */
export async function findRouteFiles(): Promise<RouteFolder[]> {
  "use cache"
  cacheLife("max")

  const appDir = path.join(process.cwd(), "src", "app")
  const folders = [
    [],
    ...ROUTE_SEGMENTS.map((_, index) => ROUTE_SEGMENTS.slice(0, index + 1)),
  ]

  return Promise.all(
    folders.map(async (segments, index) => {
      const isLast = index === folders.length - 1
      const candidates = isLast ? [...SPECIAL_FILES, "page.tsx"] : SPECIAL_FILES
      const found = await Promise.all(
        candidates.map(async (name) =>
          (await exists(path.join(appDir, ...segments, name))) ? name : null,
        ),
      )

      return {
        folder: ["src/app", ...segments].join("/"),
        urlPath: `/${segments.join("/")}`,
        files: found.filter((name): name is string => name !== null),
      }
    }),
  )
}
