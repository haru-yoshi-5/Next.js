import type { ReactNode } from "react"

import { RichText } from "@/components/learning/rich-text"
import { SectionHeading } from "@/components/learning/section-heading"

interface LiveDemoProps {
  description: string
  steps: string[]
  children: ReactNode
}

/** Live Demo セクションの枠。デモ本体（と Process Visualizer）は children で受け取る */
export function LiveDemo({ description, steps, children }: LiveDemoProps) {
  return (
    <section aria-labelledby="live-demo">
      <SectionHeading
        id="live-demo"
        eyebrow="LIVE DEMO"
        title="動かして、裏側を見る"
        description={description}
      />
      <ol className="mb-5 flex flex-col gap-1 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:gap-x-6">
        {steps.map((step, index) => (
          <li key={step} className="flex gap-2">
            <span className="font-mono text-foreground">{index + 1}.</span>
            <span>
              <RichText text={step} />
            </span>
          </li>
        ))}
      </ol>
      {children}
    </section>
  )
}
