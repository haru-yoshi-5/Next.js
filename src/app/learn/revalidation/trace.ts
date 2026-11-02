import type { FlowTrace } from "@/types/flow"

import type { InvalidateMethod } from "./action-state"

const methodSteps: Record<InvalidateMethod, { label: string; detail: string }> =
  {
    updateTag: {
      label: 'updateTag("revalidation-demo")',
      detail: "タグの付いたキャッシュをすぐに期限切れにする",
    },
    revalidateTag: {
      label: 'revalidateTag("revalidation-demo", "max")',
      detail: "タグの付いたキャッシュを古いものとして印を付ける",
    },
    revalidatePath: {
      label: 'revalidatePath("/learn/revalidation")',
      detail: "パスに結び付いたキャッシュを無効にする",
    },
  }

interface RevalidationTraceInput {
  operationId: string
  method: InvalidateMethod
  /** ボタンを押した時点で画面に表示していた生成ID */
  displayedId: string
  /** Server Action が失効させる前に読み取った生成ID */
  actionReadId: string
  /** 応答を受け取った時点で画面に表示した生成ID */
  afterId: string
}

/** 失効の操作と、応答時点の生成IDを Process Visualizer 用のデータにする */
export function buildRevalidationTrace({
  operationId,
  method,
  displayedId,
  actionReadId,
  afterId,
}: RevalidationTraceInput): FlowTrace {
  const changed = displayedId !== afterId

  return {
    id: operationId,
    title: `${method} の実行結果`,
    source: "measured",
    steps: [
      {
        id: "submit",
        from: "client-component",
        to: "next-server",
        label: "ボタンから Server Action を呼び出す（POST）",
        detail: `画面の id: ${displayedId}`,
      },
      {
        id: "invoke",
        from: "next-server",
        to: "server-action",
        label: "invalidate(prevState, formData) を実行",
      },
      {
        id: "before",
        from: "server-action",
        to: "cache",
        label: "失効前の値を読み取る",
        detail:
          actionReadId === displayedId
            ? `id: ${actionReadId}`
            : `id: ${actionReadId}（Server Action が読み取った時点で、画面の値と異なっていた）`,
      },
      {
        id: "invalidate",
        from: "server-action",
        to: "cache",
        ...methodSteps[method],
      },
      {
        id: "result",
        from: "server-component",
        to: "client-component",
        label: changed ? "画面の値が新しくなった" : "画面の値は変わっていない",
        detail: changed
          ? `id: ${displayedId} → ${afterId}`
          : `id: ${afterId} のまま。「もう一度読み取る」で確認できる`,
      },
    ],
  }
}

interface RereadTraceInput {
  rereadId: string
  beforeId: string
  afterId: string
}

/** 再読み取りの結果を、失効の操作とは別の記録として Process Visualizer 用のデータにする */
export function buildRereadTrace({
  rereadId,
  beforeId,
  afterId,
}: RereadTraceInput): FlowTrace {
  const changed = beforeId !== afterId

  return {
    id: rereadId,
    title: "再読み取りの結果",
    source: "measured",
    steps: [
      {
        id: "refresh",
        from: "client-component",
        to: "next-server",
        label: "router.refresh() でサーバーへ再リクエストする",
      },
      {
        id: "read",
        from: "cache",
        to: "server-component",
        label: "現在のキャッシュの値を読み取る",
      },
      {
        id: "result",
        from: "server-component",
        to: "client-component",
        label: changed ? "画面の値が変わった" : "画面の値は変わっていない",
        detail: changed
          ? `id: ${beforeId} → ${afterId}（他の人の操作の場合もある）`
          : `id: ${afterId} のまま`,
      },
    ],
  }
}

/** 操作前に表示する、古い値を返しながら更新する流れの説明 */
export const staleWhileRevalidateModel: FlowTrace = {
  id: "stale-while-revalidate-model",
  title: 'revalidateTag(tag, "max") の考え方',
  source: "model",
  steps: [
    {
      id: "mark",
      from: "server-action",
      to: "cache",
      label: "キャッシュに古い印を付ける",
      detail: "この時点では作り直さない",
    },
    {
      id: "request",
      from: "browser",
      to: "next-server",
      label: "次のリクエストが届く",
    },
    {
      id: "stale",
      from: "cache",
      to: "next-server",
      label: "古い値をすぐに返す",
      detail: "利用者を待たせない",
    },
    {
      id: "refill",
      from: "next-server",
      to: "data-source",
      label: "裏側で新しい値を作る",
    },
    {
      id: "save",
      from: "data-source",
      to: "cache",
      label: "以後のリクエストには新しい値を返す",
    },
  ],
}
