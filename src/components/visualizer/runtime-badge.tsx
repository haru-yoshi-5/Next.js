import { MonitorIcon, ServerIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import type { Runtime } from "@/types/lesson"

const runtimeConfig = {
  server: {
    label: "SERVER",
    Icon: ServerIcon,
    className: "border-server/30 bg-server-muted text-server",
  },
  client: {
    label: "CLIENT",
    Icon: MonitorIcon,
    className: "border-client/30 bg-client-muted text-client",
  },
} as const satisfies Record<Runtime, unknown>

interface RuntimeBadgeProps {
  runtime: Runtime
  /** "Server Component" などの補足ラベル */
  detail?: string
  className?: string
}

/**
 * SERVER / CLIENT を色・アイコン・文字の3つで表すバッジ。
 * フックを使わないため、Server / Client どちらのコンポーネントからも利用できる。
 */
export function RuntimeBadge({
  runtime,
  detail,
  className,
}: RuntimeBadgeProps) {
  const { label, Icon, className: tone } = runtimeConfig[runtime]

  return (
    <span
      className={cn(
        "inline-flex min-h-6 max-w-full shrink-0 items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs whitespace-nowrap",
        tone,
        className,
      )}
    >
      <Icon aria-hidden className="size-3.5 shrink-0" />
      <span className="font-mono text-[0.68rem] font-semibold tracking-wider">
        {label}
      </span>
      {detail ? (
        <span className="min-w-0 border-l border-current/25 pl-1.5 whitespace-normal text-foreground/80">
          {detail}
        </span>
      ) : null}
    </span>
  )
}
