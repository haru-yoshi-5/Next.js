import { flowNodes } from "@/components/visualizer/flow-nodes"
import { cn } from "@/lib/utils"
import type { FlowNodeId } from "@/types/flow"

export type ProcessNodeState = "idle" | "visited" | "active"

interface ProcessNodeProps {
  id: FlowNodeId
  state: ProcessNodeState
  /**
   * 今のステップの到着側のノードか。aria-current="step" はこのノードだけに付ける。
   * 再生中は出発側も state="active" で強調するが、「今のステップ」は1つにする
   */
  current?: boolean
}

/** Process Visualizer 上のノード（Browser / Next.js Server など） */
export function ProcessNode({ id, state, current = false }: ProcessNodeProps) {
  const { label, description, Icon } = flowNodes[id]

  return (
    <li
      aria-current={current ? "step" : undefined}
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
        // 狭い幅でもノード名を優先して表示するため、視覚的には点だけにする
        <span className="ml-auto flex shrink-0 items-center">
          <span
            aria-hidden
            className="size-2 rounded-full bg-flow motion-safe:animate-pulse"
          />
          <span className="sr-only">処理中</span>
        </span>
      ) : null}
    </li>
  )
}
