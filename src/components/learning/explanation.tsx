import { ContentBlocks } from "@/components/learning/content-blocks"
import { SectionHeading } from "@/components/learning/section-heading"
import type { LessonSection } from "@/types/lesson-content"

export function Explanation({ sections }: { sections: LessonSection[] }) {
  return (
    <section aria-labelledby="explanation">
      <SectionHeading id="explanation" eyebrow="EXPLANATION" title="詳細解説" />
      <div className="flex max-w-3xl flex-col gap-10">
        {sections.map((section) => (
          <section key={section.id} aria-labelledby={section.id}>
            <h3 id={section.id} className="mb-3 font-semibold">
              {section.title}
            </h3>
            <ContentBlocks blocks={section.blocks} />
          </section>
        ))}
      </div>
    </section>
  )
}
