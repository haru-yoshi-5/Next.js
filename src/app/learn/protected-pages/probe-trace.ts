import type { FlowStep, FlowTrace } from "@/types/flow"

import type { ProbeResult } from "./probe"
import { PROTECTED_PAGES, type ProtectedPageKey } from "./return-to"

export const PAGE_LABEL: Record<ProtectedPageKey, string> = {
  members: "会員ページ（ページで確認）",
  proxied: "会員ページ（Proxy でも確認）",
}

const formatMs = (ms: number) => `${Math.round(ms).toLocaleString("ja-JP")} ms`

/**
 * ブラウザで取得した応答（ProbeResult）から、Process Visualizer 用のデータを組み立てる。
 * ステップの分かれ目は応答の中身（3xx・meta タグ・目印）から判定し、サーバー内部の順序は
 * page.tsx・proxy.ts の実装に沿って並べる。
 */
export function buildProbeTrace(id: string, result: ProbeResult): FlowTrace {
  const { page, outcome } = result
  const roundTrip = `往復 ${formatMs(result.roundTripMs)}（ブラウザで計測）`
  const title = `${PAGE_LABEL[page]}を直接取得`

  const steps: FlowStep[] = [
    {
      id: "request",
      from: "browser",
      to: "next-server",
      label: `GET ${PROTECTED_PAGES[page]}`,
      detail:
        "URL を直接開いたときと同じリクエスト。cookie はブラウザが自動で付ける",
    },
  ]

  // エラー応答からは、Proxy・描画のどこで失敗したかが分からないため、途中の処理は並べない
  if (outcome.kind === "http-error") {
    steps.push({
      id: "http-error",
      from: "next-server",
      to: "browser",
      label: `${outcome.status} のエラー応答が返った`,
      detail: `どこで失敗したかは、この応答からは分からない。守られているかも判定しない。${roundTrip}`,
      status: "error",
    })
    return { id, title, source: "measured", steps, hideTotal: true }
  }

  if (page === "proxied" && outcome.kind === "unconfigured") {
    steps.push(
      {
        id: "proxy",
        from: "next-server",
        to: "proxy",
        label: "proxy.ts: 秘密鍵が未設定のため、cookie を確かめない",
        detail: "ページに未設定の案内が出たことから判定",
      },
      {
        id: "proxy-pass",
        from: "proxy",
        to: "server-component",
        label: "確かめずにページの描画へ渡す",
      },
    )
  } else if (page === "proxied") {
    steps.push({
      id: "proxy",
      from: "next-server",
      to: "proxy",
      label: "proxy.ts が cookie の署名と期限を確かめる",
      detail: "ページを描画する前に動く。ユーザーの存在やデータは確かめない",
    })
    if (outcome.kind === "proxy-redirect") {
      steps.push({
        id: "proxy-redirect",
        from: "proxy",
        to: "browser",
        label: "3xx でログインページへリダイレクト（ページは描画しない）",
        detail: roundTrip,
        status: "error",
      })
      return { id, title, source: "measured", steps, hideTotal: true }
    }
    steps.push({
      id: "proxy-pass",
      from: "proxy",
      to: "server-component",
      label: "署名が有効なので通す → ページの描画へ",
    })
  } else {
    steps.push({
      id: "render",
      from: "next-server",
      to: "server-component",
      label: "ページの描画を始める（このページでは Proxy は動かない）",
    })
  }

  // members ページには Proxy がないため、ここで proxy-redirect になることはない
  if (outcome.kind === "proxy-redirect") {
    return { id, title, source: "measured", steps, hideTotal: true }
  }

  steps.push({
    id: "shell",
    from: "server-component",
    to: "browser",
    label: `見出しと fallback（静的な部分）を ${outcome.status} で送り始める`,
    detail: "送り始めた後は、ステータスを変えられない",
  })

  switch (outcome.kind) {
    case "page-redirect":
      steps.push({
        id: "page-redirect",
        from: "server-component",
        to: "browser",
        label:
          "readMemberArea(): 未ログイン → redirect()。meta タグで移動を伝える",
        detail: `ステータスは ${outcome.status} のまま。${outcome.leaked ? "守る内容が HTML に入っていた" : "お知らせは読まず、HTML にも入っていない"}。${roundTrip}`,
        status: "error",
      })
      break
    case "content":
      steps.push(
        {
          id: "read",
          from: "server-component",
          to: "data-source",
          label: "readMemberArea(): 確認を通ってから、お知らせを読む",
          ...(outcome.dataMs === null ? {} : { durationMs: outcome.dataMs }),
        },
        {
          id: "content",
          from: "server-component",
          to: "browser",
          label: "お知らせを描画して、同じ応答の続きで送る",
          detail: roundTrip,
        },
      )
      break
    case "unconfigured":
      steps.push({
        id: "unconfigured",
        from: "server-component",
        to: "browser",
        label:
          "readMemberArea(): 秘密鍵が未設定 → 確認せずに案内を表示（お知らせは読まない）",
        detail: roundTrip,
      })
      break
    case "neither":
      steps.push({
        id: "neither",
        from: "server-component",
        to: "browser",
        label: "守る内容もリダイレクトもない応答（想定していない応答）",
        detail: roundTrip,
      })
      break
  }

  return { id, title, source: "measured", steps, hideTotal: true }
}
