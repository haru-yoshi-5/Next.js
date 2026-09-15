import { flowNodes } from "@/components/visualizer/flow-nodes"
import { cn } from "@/lib/utils"
import type { FlowNodeId } from "@/types/flow"

export type ProcessNodeState = "idle" | "visited" | "active"

interface ProcessNodeProps {
  id: FlowNodeId
  state: ProcessNodeState
}

/** Process Visualizer 上のノード（Browser / Next.js Server など） */
export function ProcessNode({ id, state }: ProcessNodeProps) {
  const { label, description, Icon } = flowNodes[id]

  return (
    <li
      aria-current={state === "active" ? "step" : undefined}
      className={cn(
        "flex min-w-0 items-center gap-2.5 rounded-lg border px-3 py-2 transition-colors duration-300",
        state === "active" &&
          "border-flow bg-flow-muted shadow-[0_0_0_3px] shadow-flow/15",
        state === "visited" && "border-flow/30",
        state === "idle" && "text-muted-foreground",
      )}
      title={description}
    >
      <Icon
        aria-hidden
        className={cn(
          "size-4 shrink-0",
          state === "active" ? "text-flow" : "text-muted-foreground",
        )}
      />
      <span className="truncate text-sm font-medium">{label}</span>
      {state === "active" ? (
        <span className="ml-auto flex items-center gap-1.5 text-[0.65rem] font-medium text-flow">
          <span
            aria-hidden
            className="size-1.5 rounded-full bg-flow motion-safe:animate-pulse"
          />
          処理中
        </span>
      ) : null}
    </li>
  )
}
