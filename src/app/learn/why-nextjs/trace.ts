import type { FlowStep, FlowTrace } from "@/types/flow"

import type { CheckStatus, SiteInspection } from "./inspect-site"

/**
 * このページを支える仕組みと、ブラウザに残る跡の対応（モデル図）。
 * ビルド時の処理はブラウザから観測できないため、公式ドキュメントに沿って示す。
 */
export const initialModel: FlowTrace = {
  id: "initial-model",
  title: "このページを支える仕組み",
  source: "model",
  steps: [
    {
      id: "render",
      from: "next-server",
      to: "server-component",
      label: "ビルド時に本文を描画し、metadata を <head> に入れる",
      detail: "layout.tsx と page.tsx の metadata を組み合わせる",
    },
    {
      id: "deliver",
      from: "next-server",
      to: "browser",
      label: "HTML を返す。フォントは同じサーバーの URL を参照する",
      detail: "next/font がビルド時にフォントを取り込んでいる",
    },
    {
      id: "fonts",
      from: "browser",
      to: "next-server",
      label: "フォントファイルを /_next/static/media から取得する",
    },
    {
      id: "metadata-routes",
      from: "browser",
      to: "route-handler",
      label: "/sitemap.xml と /robots.txt を要求する",
      detail: "sitemap.ts・robots.ts は特別な Route Handler",
    },
  ],
}

function toStepStatus(status: CheckStatus): FlowStep["status"] {
  return status === "ok" ? "success" : "error"
}

function statusText(status: CheckStatus) {
  if (status === "ok") return "確認できた"
  if (status === "mismatch") return "期待と違った"
  return "観測できなかった"
}

/** 「このページを調べる」の結果を、仕組みと跡の対応として再生するためのデータにする */
export function buildInspectionTrace(
  id: string,
  result: SiteInspection,
): FlowTrace {
  const { fonts, metadata, sitemap, robots } = result

  return {
    id,
    title: "このページで確認できた跡",
    source: "measured",
    // 取得時間は並行した取得のもので、操作全体の所要時間ではないため合計を出さない
    hideTotal: true,
    steps: [
      {
        id: "metadata",
        from: "server-component",
        to: "browser",
        label: "metadata: <title>・canonical・og:url",
        detail: `${statusText(metadata.status)}（${metadata.fields.length} 項目）`,
        status: toStepStatus(metadata.status),
      },
      {
        id: "fonts",
        from: "next-server",
        to: "browser",
        label: "next/font: 同じ origin から届いたフォント",
        detail:
          fonts.status === "unobserved"
            ? "フォントの取得記録が見つからなかった"
            : `${statusText(fonts.status)}（${fonts.sameOriginCount} / ${fonts.files.length} 件、Google への取得 ${fonts.googleRequestCount} 件）`,
        status: toStepStatus(fonts.status),
      },
      {
        id: "sitemap",
        from: "browser",
        to: "route-handler",
        label: "sitemap.ts: /sitemap.xml",
        detail: `${statusText(sitemap.status)}。${sitemap.finding}`,
        durationMs: sitemap.fetchMs ?? undefined,
        status: toStepStatus(sitemap.status),
      },
      {
        id: "robots",
        from: "browser",
        to: "route-handler",
        label: "robots.ts: /robots.txt",
        detail: `${statusText(robots.status)}。${robots.finding}`,
        durationMs: robots.fetchMs ?? undefined,
        status: toStepStatus(robots.status),
      },
    ],
  }
}
