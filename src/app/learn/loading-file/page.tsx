import { DemoView } from "./demo-view"

// /learn/loading-file にアクセスしたときに、layout.tsx の children として表示される。
export default function LoadingFileIndexPage() {
  return (
    <DemoView file="app/learn/loading-file/page.tsx" title="デモの入口">
      {/* data-nsc-demo-index は Live Demo が入口の表示を見つけるための目印 */}
      <p
        data-nsc-demo-index=""
        className="text-sm leading-relaxed text-muted-foreground"
      >
        上のリンクを押すと、この枠の中だけが遷移先の page.tsx
        に切り替わります。どのページも描画に約1.5秒かかります。待っている間に何が表示されるかを比べましょう。
      </p>
    </DemoView>
  )
}
