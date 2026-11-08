import type { ReactNode } from "react"

interface StampCardProps {
  title: string
  icon: ReactNode
  rows: { label: string; value: string }[]
}

/** 生成された値を表示する枠。Server Component からのみ使う */
export function StampCard({ title, icon, rows }: StampCardProps) {
  return (
    <section className="flex min-w-0 flex-col rounded-lg border">
      <h3 className="flex items-center gap-1.5 border-b px-3 py-2 text-sm font-medium">
        {icon}
        {title}
      </h3>
      <dl className="flex flex-col gap-2 px-3 py-3 text-sm">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex flex-wrap justify-between gap-x-3"
          >
            <dt className="text-muted-foreground">{row.label}</dt>
            <dd className="font-mono break-all tabular-nums">{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
