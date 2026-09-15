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

  const items = files.map((file, index) => {
    const source = sources[index]
    const runtime = resolveRuntime(source.directive, file)
    return {
      value: file.path,
      label: source.fileName,
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
