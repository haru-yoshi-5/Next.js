import { CodeBlock } from "@/components/learning/code-block"
import { CodeTabs } from "@/components/learning/code-tabs"
import { SectionHeading } from "@/components/learning/section-heading"
import { getHighlightedSource, resolveRuntime } from "@/lib/source-code"
import type { LessonFile } from "@/types/lesson-content"

/** Live Demo を実際に動かしているファイルをそのまま表示する */
export async function SourceCode({ files }: { files: LessonFile[] }) {
  const sources = await Promise.all(
    files.map((file) => getHighlightedSource(file.path)),
  )

  // 同じ名前のファイル（route.ts など）が複数あるときは、親フォルダも付けて区別する
  const nameCounts = new Map<string, number>()
  for (const source of sources) {
    nameCounts.set(source.fileName, (nameCounts.get(source.fileName) ?? 0) + 1)
  }
  const tabLabel = (path: string, fileName: string) =>
    (nameCounts.get(fileName) ?? 0) > 1
      ? path.split("/").slice(-2).join("/")
      : fileName

  const items = files.map((file, index) => {
    const source = sources[index]
    const runtime = resolveRuntime(source.directive, file)
    return {
      value: file.path,
      label: tabLabel(file.path, source.fileName),
      runtime: runtime.runtime,
      content: (
        <CodeBlock
          source={source}
          runtime={runtime}
          role={file.role}
          description={file.description}
        />
      ),
    }
  })

  return (
    <section aria-labelledby="source-code">
      <SectionHeading
        id="source-code"
        eyebrow="SOURCE CODE"
        title="このデモを動かしているコード"
        description="説明用のサンプルではなく、上の Live Demo を実際に動かしているファイルをビルド時に読み込んで表示しています。"
      />
      <CodeTabs items={items} />
    </section>
  )
}
