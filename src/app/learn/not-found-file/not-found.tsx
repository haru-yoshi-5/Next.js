import { DemoFrame } from "./demo-frame"

// このフォルダより下で notFound() が呼ばれ、もっと近い not-found.tsx がないときに表示される。
// orders/[id] には not-found.tsx がないため、注文が見つからないとここが使われる。
// どのルートにも一致しない URL には使われない（そちらは app/not-found.tsx）
export default function LessonNotFound() {
  return (
    <DemoFrame
      file="app/learn/not-found-file/not-found.tsx"
      title="ページが見つかりません"
    >
      <p className="leading-relaxed text-muted-foreground">
        notFound() が呼ばれたフォルダに not-found.tsx
        がなかったため、親フォルダにあるこのファイルが表示されています。notFound()
        は、見つかるまで親のフォルダへ順にさかのぼります。
      </p>
    </DemoFrame>
  )
}
