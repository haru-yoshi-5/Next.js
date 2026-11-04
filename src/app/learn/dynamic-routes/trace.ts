import type { FlowStep, FlowTrace } from "@/types/flow"

import type { ArticleMeasurement } from "./measure-article"

const formatMs = (ms: number) => `${Math.round(ms).toLocaleString("ja-JP")} ms`

/** 取得する前に表示する、Dynamic Route の配信の流れの説明 */
export const articleModel: FlowTrace = {
  id: "article-model",
  title: "articles/[id] へのリクエスト",
  source: "model",
  steps: [
    {
      id: "build",
      from: "next-server",
      to: "server-component",
      label: "ビルド時に generateStaticParams の値でプリレンダー",
      detail:
        "1〜3 は完成した HTML、それ以外の値に使う App Shell も1つ作っておく",
    },
    {
      id: "request",
      from: "browser",
      to: "next-server",
      label: "GET /learn/dynamic-routes/articles/[id]",
    },
    {
      id: "complete",
      from: "next-server",
      to: "browser",
      label: "プリレンダーした値なら、完成した HTML を返す",
    },
    {
      id: "shell",
      from: "next-server",
      to: "browser",
      label: "それ以外の値なら、App Shell を先に返す",
      detail: "await params で止まる部分は loading.tsx の表示になっている",
    },
    {
      id: "render",
      from: "next-server",
      to: "server-component",
      label: "params を渡して page.tsx を実行",
    },
    {
      id: "stream",
      from: "server-component",
      to: "browser",
      label: "記事、または notFound() の結果を続きとして送る",
      detail: "ステータスは送信済みのため 200 のまま変わらない",
    },
  ],
}

/** 計測した結果を Process Visualizer 用のデータにする。時間は取得開始からの経過時間 */
export function buildArticleTrace(
  id: string,
  measurement: ArticleMeasurement,
): FlowTrace {
  const request: FlowStep = {
    id: "request",
    from: "browser",
    to: "next-server",
    label: `GET ${measurement.path}`,
  }
  const base = {
    id,
    title: `値「${measurement.value}」の配信の計測`,
    source: "measured" as const,
    hideTotal: true,
  }

  if (measurement.delivery === "complete") {
    return {
      ...base,
      steps: [
        request,
        {
          id: "complete",
          from: "next-server",
          to: "browser",
          label: `${measurement.status}: 完成した HTML が届く`,
          detail: "記事が最初の応答に含まれていた",
          durationMs: measurement.firstChunkMs,
          status: "success",
        },
      ],
    }
  }

  if (measurement.delivery === "unknown") {
    return {
      ...base,
      steps: [
        request,
        {
          id: "response",
          from: "next-server",
          to: "browser",
          label: `${measurement.status}: 応答が届く`,
          detail: `記事も notFound() の結果も見つからなかった（合計 ${formatMs(measurement.totalMs)}）`,
          durationMs: measurement.firstChunkMs,
          status: "error",
        },
      ],
    }
  }

  const isArticle = measurement.delivery === "shell-then-article"

  return {
    ...base,
    steps: [
      request,
      {
        id: "shell",
        from: "next-server",
        to: "browser",
        label: `${measurement.status}: App Shell が先に届く`,
        detail: "loading.tsx の表示が含まれていた",
        durationMs: measurement.firstChunkMs,
      },
      {
        id: "render",
        from: "next-server",
        to: "server-component",
        label: "params を渡して page.tsx を実行",
      },
      {
        id: "stream",
        from: "server-component",
        to: "browser",
        label: isArticle
          ? "記事が続きとして届く"
          : "notFound() の結果が続きとして届く",
        detail: isArticle
          ? undefined
          : 'ステータスは 200 のまま。<meta name="robots" content="noindex"> が加わった',
        durationMs: measurement.resultAtMs ?? measurement.totalMs,
        status: isArticle ? "success" : "error",
      },
    ],
  }
}
