import type { FlowStep, FlowTrace } from "@/types/flow"

import { type DemoPage, RENDER_DELAY_MS } from "./demo-pages"

export interface NavigationMeasurement {
  page: DemoPage
  /** クリックから、待ちの表示に切り替わるまでの時間（ms）。待ちの表示がなければ null */
  waitingMs: number | null
  /** クリックから、page の内容が表示されるまでの時間（ms） */
  contentMs: number
}

const delayLabel = `約${RENDER_DELAY_MS / 1000}秒`

/** 遷移する前に表示する、loading.tsx がある場合の流れの説明 */
export const loadingModel: FlowTrace = {
  id: "loading-model",
  title: "loading.tsx があるページへの遷移",
  source: "model",
  steps: [
    {
      id: "prefetch",
      from: "browser",
      to: "next-server",
      label: "リンクが画面に入ると、遷移先をプリフェッチする",
      detail:
        "loading.tsx の表示など、ビルド時に作った部分を先に受け取っておく",
    },
    {
      id: "click",
      from: "browser",
      to: "next-server",
      label: "<Link> をクリックして遷移を始める",
    },
    {
      id: "fallback",
      from: "next-server",
      to: "browser",
      label: "プリフェッチ済みの loading.tsx をすぐに表示する",
      detail: "layout はそのまま残り、page の部分だけが切り替わる",
    },
    {
      id: "render",
      from: "next-server",
      to: "server-component",
      label: "page.tsx を描画する",
    },
    {
      id: "content",
      from: "server-component",
      to: "browser",
      label: "描画が終わった page に差し替わる",
    },
  ],
}

/** 計測した遷移を Process Visualizer 用のデータにする。時間はクリックからの経過時間 */
export function buildNavigationTrace(
  id: string,
  measurement: NavigationMeasurement,
): FlowTrace {
  const { page, waitingMs, contentMs } = measurement

  const click: FlowStep = {
    id: "click",
    from: "browser",
    to: "next-server",
    label: `<Link> で ${page.href} へ遷移`,
  }
  const render: FlowStep = {
    id: "render",
    from: "next-server",
    to: "server-component",
    label: `page.tsx を描画する（${delayLabel}かかる）`,
  }

  const steps: FlowStep[] = [click]

  if (waitingMs !== null) {
    steps.push({
      id: "fallback",
      from: "next-server",
      to: "browser",
      label:
        page.waitingUi === "loading"
          ? "loading.tsx の表示に切り替わる"
          : "page の見出しと Suspense の fallback に切り替わる",
      detail: "プリフェッチ済みの部分なので、page の描画を待たずに表示できる",
      durationMs: waitingMs,
    })
  }

  steps.push(render, {
    id: "content",
    from: "server-component",
    to: "browser",
    label:
      page.waitingUi === "suspense"
        ? "遅い部分だけが差し替わる"
        : "描画が終わった page に差し替わる",
    detail:
      waitingMs === null
        ? "待ちの表示がないため、ここまで前の画面が表示されたままだった"
        : undefined,
    durationMs: contentMs,
    status: "success",
  })

  return {
    id,
    title: `「${page.label}」への遷移の計測`,
    source: "measured",
    hideTotal: true,
    steps,
  }
}
