import "server-only"

import { getAvailableLessons, lessonHref } from "@/content/curriculum"
import type { ContentBlock, LessonContent } from "@/types/lesson-content"

/** モデルに渡す教材の内容の最大文字数（無料枠の使用量を抑える） */
export const LESSON_CONTEXT_MAX_LENGTH = 6000

export interface LessonReference {
  slug: string
  title: string
  href: string
}

function blockToText(block: ContentBlock): string {
  switch (block.type) {
    case "paragraph":
      return block.text
    case "list":
      return block.items
        .map((item, index) =>
          block.ordered ? `${index + 1}. ${item}` : `- ${item}`,
        )
        .join("\n")
    case "callout":
      return `【${block.title}】${block.text}`
    case "comparison":
      return block.columns
        .map(
          (column) =>
            `${column.title}（${column.runtime === "server" ? "サーバー" : "クライアント"}）:\n${column.items
              .map((item) => `- ${item}`)
              .join("\n")}`,
        )
        .join("\n")
  }
}

/**
 * 教材の本文データから、モデルに渡す教材の内容を組み立てる。
 * 使うのは公開している教材の本文だけで、ソースコードや利用者の入力は含めない。
 */
export function buildLessonContext(lesson: LessonContent) {
  const parts = [
    `教材: ${lesson.title}（ID: ${lesson.slug}）`,
    `概要: ${lesson.lead}`,
    `この教材でわかること:\n${lesson.keyPoints.map((point) => `- ${point}`).join("\n")}`,
    ...lesson.sections.map(
      (section) =>
        `## ${section.title}\n${section.blocks.map(blockToText).join("\n")}`,
    ),
    `## Live Demo\n${lesson.demo.description}\n${lesson.demo.steps
      .map((step, index) => `${index + 1}. ${step}`)
      .join("\n")}`,
  ]
  const text = parts.join("\n\n")
  return text.length > LESSON_CONTEXT_MAX_LENGTH
    ? `${text.slice(0, LESSON_CONTEXT_MAX_LENGTH)}\n（以下省略）`
    : text
}

/**
 * 回答と一緒に返す参照先。モデルには作らせず、公開中の教材だけからサーバーで決める。
 * 開いている教材と、その教材の関連教材（related）を返す。
 */
export function buildLessonReferences(
  lesson: LessonContent,
): LessonReference[] {
  const available = new Map(
    getAvailableLessons().map((item) => [item.slug, item.title]),
  )
  return [lesson.slug, ...lesson.related].flatMap((slug) => {
    const title = available.get(slug)
    return title ? [{ slug, title, href: lessonHref(slug) }] : []
  })
}
