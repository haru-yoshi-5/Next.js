import {
  ArrowRightIcon,
  CheckIcon,
  CircleDashedIcon,
  LoaderIcon,
  RadioTowerIcon,
  XIcon,
} from "lucide-react"

import { flowNodes } from "@/components/visualizer/flow-nodes"
import { cn } from "@/lib/utils"
import type { FlowStep } from "@/types/flow"

export type ProcessEdgeState = "pending" | "active" | "done"

interface ProcessEdgeProps {
  step: FlowStep
  index: number
  state: ProcessEdgeState
}

function formatDuration(ms: number) {
  return ms >= 1000 ? `${(ms / 1000).toFixed(2)} s` : `${Math.round(ms)} ms`
}

/** ノード間の処理1件（from → to）を表す行 */
export function ProcessEdge({ step, index, state }: ProcessEdgeProps) {
  const from = flowNodes[step.from]
  const to = flowNodes[step.to]
  const crossesNetwork = from.runtime !== to.runtime
  const isError = step.status === "error"

  return (
    <li
      aria-current={state === "active" ? "step" : undefined}
      className={cn(
        "grid grid-cols-[1.5rem_minmax(0,1fr)_auto] gap-x-3 rounded-lg px-2 py-2 transition-[opacity,background-color] duration-300",
        state === "pending" && "opacity-35",
        state === "active" && "bg-flow-muted",
        state === "active" && isError && "bg-destructive/10",
      )}
    >
      <span className="flex h-5 items-center justify-center">
        <StepIcon state={state} isError={isError} />
      </span>

      <div className="flex min-w-0 flex-col gap-0.5">
        <p className="flex flex-wrap items-center gap-x-1.5 font-mono text-[0.7rem] text-muted-foreground">
          <span className="sr-only">ステップ {index + 1}:</span>
          <span>{from.label}</span>
          <ArrowRightIcon aria-hidden className="size-3" />
          <span className="sr-only">から</span>
          <span>{to.label}</span>
          {crossesNetwork ? (
            <span className="inline-flex items-center gap-1 rounded border px-1 text-[0.6rem]">
              <RadioTowerIcon aria-hidden className="size-2.5" />
              ネットワーク
            </span>
          ) : null}
        </p>
        <p
          className={cn(
            "text-sm leading-snug font-medium",
            isError && "text-destructive",
          )}
        >
          {step.label}
        </p>
        {step.detail ? (
          <p className="text-xs leading-relaxed text-muted-foreground">
            {step.detail}
          </p>
        ) : null}
      </div>

      <span className="pt-0.5 text-right font-mono text-xs text-muted-foreground tabular-nums">
        {step.durationMs !== undefined && state !== "pending"
          ? formatDuration(step.durationMs)
          : null}
      </span>
    </li>
  )
}

function StepIcon({
  state,
  isError,
}: {
  state: ProcessEdgeState
  isError: boolean
}) {
  if (state === "pending") {
    return (
      <CircleDashedIcon aria-hidden className="size-4 text-muted-foreground" />
    )
  }
  if (isError) {
    return <XIcon aria-hidden className="size-4 text-destructive" />
  }
  if (state === "active") {
    return (
      <LoaderIcon
        aria-hidden
        className="size-4 text-flow motion-safe:animate-spin"
      />
    )
  }
  return <CheckIcon aria-hidden className="size-4 text-server" />
}

export { formatDuration }
