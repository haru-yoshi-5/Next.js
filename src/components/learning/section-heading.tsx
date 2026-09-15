interface SectionHeadingProps {
  id: string
  /** "LIVE DEMO" などの英字ラベル */
  eyebrow: string
  title: string
  description?: string
}

export function SectionHeading({
  id,
  eyebrow,
  title,
  description,
}: SectionHeadingProps) {
  return (
    <header className="mb-5 flex flex-col gap-1.5">
      <p className="font-mono text-xs tracking-wider text-muted-foreground">
        {eyebrow}
      </p>
      <h2 id={id} className="text-xl font-semibold tracking-tight">
        {title}
      </h2>
      {description ? (
        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      ) : null}
    </header>
  )
}
