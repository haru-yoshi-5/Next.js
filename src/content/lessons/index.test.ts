import { describe, expect, it } from "vitest"

import { getAvailableLessons } from "@/content/curriculum"

import { getLessonContent, getLessonContentSlugs } from "./index"

describe("教材データの一覧", () => {
  it("curriculum.ts の公開中の教材と、同じ slug がそろっている", () => {
    const curriculumSlugs = getAvailableLessons()
      .map((lesson) => lesson.slug)
      .sort()
    expect(getLessonContentSlugs().sort()).toEqual(curriculumSlugs)
  })

  it("slug から教材の本文を引ける", () => {
    expect(getLessonContent("server-components")?.title).toBe(
      "Server Components",
    )
  })

  it("存在しない slug には undefined を返す", () => {
    expect(getLessonContent("no-such-lesson")).toBeUndefined()
  })
})
