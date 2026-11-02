"use server"

import { revalidatePath, revalidateTag, updateTag } from "next/cache"

import { type InvalidateState, isInvalidateMethod } from "./action-state"
import { getSharedValue, REVALIDATION_TAG } from "./shared-data"

/** 値を生成してから次の失効を受け付けるまでの時間 */
const COOLDOWN_MS = 5_000
const COOLDOWN_MESSAGE =
  "値の生成または直前の操作から5秒以内のため、実行しませんでした。少し待って再度お試しください。"

/**
 * このインスタンスで最後に失効を受け付けた時刻。
 * 共有の保存先がないので、インスタンスをまたぐ同時の要求までは止められない。
 */
let lastAcceptedAt = 0

/** クライアントから届く値は信頼せず、許可した方法だけを実行する */
export async function invalidate(
  _previousState: InvalidateState,
  formData: FormData,
): Promise<InvalidateState> {
  const method = formData.get("method")
  if (!isInvalidateMethod(method)) {
    return { status: "error", message: "不明な操作です。" }
  }

  try {
    const { id: actionReadId, generatedAt } = await getSharedValue()

    // 生成時刻は共有キャッシュの値なので、インスタンスをまたいで再生成の頻度を抑えられる。
    // 同時に届いた要求は同じ生成時刻を読むため、確認と記録を await を挟まずに行って1件だけ通す
    const now = Date.now()
    if (now - generatedAt < COOLDOWN_MS || now - lastAcceptedAt < COOLDOWN_MS) {
      return { status: "error", message: COOLDOWN_MESSAGE }
    }
    lastAcceptedAt = now

    if (method === "updateTag") {
      updateTag(REVALIDATION_TAG)
    } else if (method === "revalidateTag") {
      revalidateTag(REVALIDATION_TAG, "max")
    } else {
      revalidatePath("/learn/revalidation")
    }

    return {
      status: "success",
      message: `${method} を実行しました。`,
      operationId: crypto.randomUUID(),
      method,
      actionReadId,
    }
  } catch (error) {
    // 詳細はサーバーのログにだけ残し、ブラウザには一般的なメッセージを返す
    console.error("[invalidate] キャッシュの失効に失敗しました", error)
    return {
      status: "error",
      message: "処理に失敗しました。時間をおいて再度お試しください。",
    }
  }
}
