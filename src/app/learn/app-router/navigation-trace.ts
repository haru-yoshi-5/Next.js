import type { FlowStep, FlowTrace } from "@/types/flow"

export interface NavigationRecord {
  id: string
  from: string
  to: string
  /** 遷移先でマッチすると想定されるファイル */
  targetFile: string
  /** link: <Link> のクリック / history: ブラウザの戻る・進む */
  trigger: "link" | "history"
}

/**
 * <Link> によるクライアントナビゲーションを Process Visualizer 用のデータにする。
 * クリックと URL の変化はブラウザで実際に観測した値だが、
 * サーバーとの RSC Payload のやり取りは観測できないため source は "model" とする。
 */
export function buildNavigationTrace(
  record: NavigationRecord,
  arrived: boolean,
): FlowTrace {
  const steps: FlowStep[] = [
    record.trigger === "link"
      ? {
          id: "click",
          from: "browser",
          to: "client-component",
          label: `<Link href="${record.to}"> をクリック`,
          detail: "ブラウザはページ全体の再読み込みを行わない",
        }
      : {
          id: "history",
          from: "browser",
          to: "client-component",
          label: "ブラウザの戻る / 進む",
          detail: `履歴から ${record.to} へ移動。ページ全体の再読み込みは行わない`,
        },
    {
      id: "request",
      from: "client-component",
      to: "next-server",
      label: "移動先の RSC Payload を取得",
      detail: "表示中のリンクはプリフェッチ済みのため、その結果を再利用できる",
    },
    {
      id: "render",
      from: "next-server",
      to: "server-component",
      label: `${record.targetFile} を描画`,
      detail: "変化したセグメント（layout の children）だけが対象になる",
    },
    {
      id: "response",
      from: "next-server",
      to: "browser",
      label: "変化したセグメントの描画結果を返す",
    },
  ]

  if (arrived) {
    steps.push({
      id: "swap",
      from: "browser",
      to: "client-component",
      label: "children の部分だけを差し替え",
      detail: `URL: ${record.from} → ${record.to}。layout.tsx は再マウントされない`,
    })
  }

  return {
    id: record.id,
    title: "<Link> によるページ遷移",
    source: "model",
    live: !arrived,
    steps,
  }
}
