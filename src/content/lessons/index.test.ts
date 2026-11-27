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

  it("curriculum.ts の題名と、教材の本文の題名が一致する", () => {
    // 題名は 2 か所に書いてあり、サイドバーと見出し・metadata で表記が割れないようにする
    for (const lesson of getAvailableLessons()) {
      expect(getLessonContent(lesson.slug)?.title, lesson.slug).toBe(
        lesson.title,
      )
    }
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
