import { InfoIcon, TriangleAlertIcon } from "lucide-react"

import { RichText } from "@/components/learning/rich-text"
import { RuntimeBadge } from "@/components/visualizer/runtime-badge"
import { cn } from "@/lib/utils"
import type { ContentBlock } from "@/types/lesson-content"

export function ContentBlocks({ blocks }: { blocks: ContentBlock[] }) {
  return (
    <div className="flex flex-col gap-4">
      {blocks.map((block, index) => (
        <Block key={index} block={block} />
      ))}
    </div>
  )
}

function Block({ block }: { block: ContentBlock }) {
  switch (block.type) {
    case "paragraph":
      return (
        <p className="leading-relaxed text-foreground/90">
          <RichText text={block.text} />
        </p>
      )

    case "list": {
      const List = block.ordered ? "ol" : "ul"
      return (
        <List
          className={cn(
            "flex flex-col gap-1.5 pl-5 leading-relaxed text-foreground/90 marker:text-muted-foreground",
            block.ordered ? "list-decimal" : "list-disc",
          )}
        >
          {block.items.map((item) => (
            <li key={item}>
              <RichText text={item} />
            </li>
          ))}
        </List>
      )
    }

    case "callout": {
      const Icon = block.tone === "caution" ? TriangleAlertIcon : InfoIcon
      return (
        <aside
          className={cn(
            "flex gap-3 rounded-lg border p-4 text-sm",
            block.tone === "caution"
              ? "border-client/30 bg-client-muted/60"
              : "border-flow/25 bg-flow-muted/60",
          )}
        >
          <Icon
            aria-hidden
            className={cn(
              "mt-0.5 size-4 shrink-0",
              block.tone === "caution" ? "text-client" : "text-flow",
            )}
          />
          <div className="flex flex-col gap-1">
            <p className="font-medium">{block.title}</p>
            <p className="leading-relaxed text-foreground/85">
              <RichText text={block.text} />
            </p>
          </div>
        </aside>
      )
    }

    case "comparison":
      return (
        <div className="grid gap-px overflow-hidden rounded-lg border bg-border md:grid-cols-2">
          {block.columns.map((column) => (
            <div
              key={column.title}
              className="flex flex-col gap-3 bg-background p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium">{column.title}</p>
                <RuntimeBadge runtime={column.runtime} />
              </div>
              <ul className="flex list-disc flex-col gap-1.5 pl-5 text-sm leading-relaxed marker:text-muted-foreground">
                {column.items.map((item) => (
                  <li key={item}>
                    <RichText text={item} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )
  }
}
