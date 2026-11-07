import type { FlowTrace } from "@/types/flow"

import { formatKilobytes, type PageInspection } from "./inspect-page"

/** 調べる前に表示する、ページが届くまでの流れ */
export const pageModel: FlowTrace = {
  id: "page-model",
  title: "このページが届くまで",
  source: "model",
  steps: [
    {
      id: "request",
      from: "browser",
      to: "next-server",
      label: "URL にリクエストを送る",
    },
    {
      id: "route",
      from: "next-server",
      to: "server-component",
      label: "URL に合うファイルを選び、外側の layout から組み立てる",
      detail: "ルーティングは Next.js が担当する",
    },
    {
      id: "html",
      from: "server-component",
      to: "browser",
      label: "本文入りの HTML と RSC Payload を返す",
      detail: "React のコンポーネントをサーバーで実行した結果",
    },
    {
      id: "hydrate",
      from: "browser",
      to: "client-component",
      label: "JavaScript を読み込み、ボタンを動かせるようにする",
      detail: "ハイドレーション",
    },
  ],
}

/** 調べた結果を Process Visualizer 用のデータにする */
export function buildInspectionTrace(
  id: string,
  result: PageInspection,
  routeFileCount: number,
): FlowTrace {
  return {
    id,
    title: "このページの HTML を取得し直した結果",
    source: "measured",
    steps: [
      {
        id: "request",
        from: "browser",
        to: "next-server",
        label: `GET ${result.pathname}`,
        detail: `ステータス ${result.status}（HTML を読み終えるまでの時間）`,
        durationMs: result.responseMs,
      },
      {
        id: "route",
        from: "next-server",
        to: "server-component",
        label: `特別なファイル ${routeFileCount} 個を組み合わせて描画`,
        detail:
          "ファイル数は src/app を実際に探した結果。組み立てる処理そのものはブラウザから観測できない",
      },
      {
        id: "html",
        from: "server-component",
        to: "browser",
        label: "本文入りの HTML を返す",
        detail: `HTML ${formatKilobytes(result.htmlBytes)}・JavaScript 実行前の本文 ${result.articleTextLength.toLocaleString()} 文字`,
      },
      {
        id: "payload",
        from: "server-component",
        to: "browser",
        label: "RSC Payload を HTML に埋め込んで送る",
        detail: `self.__next_f の script ${result.rscChunkCount} 個・${formatKilobytes(result.rscBytes)}`,
      },
      {
        id: "hydrate",
        from: "browser",
        to: "client-component",
        label: `JavaScript ${result.scriptCount} ファイルを読み込む`,
        detail: `合計 ${formatKilobytes(result.scriptBytes)}（展開後）。読み込み後にハイドレーションする`,
      },
    ],
  }
}
