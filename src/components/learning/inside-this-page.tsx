import { FileCode2Icon, FolderIcon } from "lucide-react"

import { SectionHeading } from "@/components/learning/section-heading"
import { RuntimeBadge } from "@/components/visualizer/runtime-badge"
import { buildFileTree, type FileTreeNode } from "@/lib/file-tree"
import {
  getHighlightedSource,
  type ResolvedRuntime,
  resolveRuntime,
} from "@/lib/source-code"
import type { LessonFile, PageFeature } from "@/types/lesson-content"

interface InsideThisPageProps {
  files: LessonFile[]
  features: PageFeature[]
}

type TreeData = LessonFile & { resolved: ResolvedRuntime }

/**
 * 「今見ているこのページ」がどのファイル・どの Next.js 機能で構成されているかを示す。
 * SERVER / CLIENT の判定は、各ファイルを実際に読み込んでディレクティブから行う。
 */
export async function InsideThisPage({ files, features }: InsideThisPageProps) {
  const sources = await Promise.all(
    files.map((file) => getHighlightedSource(file.path)),
  )
  const entries = files.map((file, index) => ({
    path: file.path.replace(/^src\//, ""),
    data: { ...file, resolved: resolveRuntime(sources[index].directive, file) },
  }))
  const tree = buildFileTree<TreeData>(entries)
  const clientCount = entries.filter(
    (entry) => entry.data.resolved.runtime === "client",
  ).length

  return (
    <section aria-labelledby="inside-this-page">
      <SectionHeading
        id="inside-this-page"
        eyebrow="INSIDE THIS PAGE"
        title="このページ自体の作り"
        description="今見ている教材ページを構成するファイルと、それぞれが実行される場所です。SERVER / CLIENT のバッジは、各ファイル先頭の実際のディレクティブを読み取って判定しています。"
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="rounded-lg border">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/40 px-4 py-2.5 text-xs text-muted-foreground">
            <span className="font-mono">src/</span>
            <span>
              {entries.length} ファイル中、Client は {clientCount} ファイル
            </span>
          </div>
          <div className="overflow-x-auto p-3">
            <FileTree nodes={tree} />
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-medium">
            このページで使っている機能
          </h3>
          <dl className="flex flex-col divide-y rounded-lg border">
            {features.map((feature) => (
              <div key={feature.name} className="flex flex-col gap-1 p-3">
                <dt className="font-mono text-sm">{feature.name}</dt>
                <dd className="text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  )
}

function FileTree({ nodes }: { nodes: FileTreeNode<TreeData>[] }) {
  return (
    <ul className="flex flex-col gap-0.5 border-l border-dashed pl-3 first:border-l-0 first:pl-0">
      {nodes.map((node) =>
        node.kind === "folder" ? (
          <li key={node.name}>
            <p className="flex items-center gap-1.5 py-1 font-mono text-sm text-muted-foreground">
              <FolderIcon aria-hidden className="size-3.5" />
              {node.name}/
            </p>
            <div className="pl-2">
              <FileTree nodes={node.children} />
            </div>
          </li>
        ) : (
          <li
            key={node.name}
            className="flex flex-col gap-1 rounded-md px-2 py-2 hover:bg-muted/40"
          >
            <div className="flex flex-wrap items-center gap-2">
              <FileCode2Icon
                aria-hidden
                className="size-3.5 text-muted-foreground"
              />
              <span className="font-mono text-sm">{node.name}</span>
              <RuntimeBadge
                runtime={node.data.resolved.runtime}
                detail={node.data.role}
              />
            </div>
            <p className="pl-5.5 text-sm leading-relaxed text-muted-foreground">
              {node.data.description}
            </p>
            <p className="pl-5.5 font-mono text-[0.7rem] text-muted-foreground/80">
              判定: {node.data.resolved.basis}
            </p>
          </li>
        ),
      )}
    </ul>
  )
}
