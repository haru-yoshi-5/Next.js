import "server-only"

import { cacheLife, cacheTag } from "next/cache"

export const REVALIDATION_TAG = "revalidation-demo"

export interface SharedValue {
  /** 関数本体が実行されるたびに変わる ID。変化すればキャッシュが作り直されたと分かる */
  id: string
  /** 関数本体が実行された時刻（エポックミリ秒） */
  generatedAt: number
}

/** タグ付きでキャッシュする値。時間では切れにくくし、失効の操作による変化だけを見えるようにする */
export async function getSharedValue(): Promise<SharedValue> {
  "use cache: remote"
  cacheLife("hours")
  cacheTag(REVALIDATION_TAG)

  await new Promise((resolve) => setTimeout(resolve, 400))
  return { id: crypto.randomUUID().slice(0, 8), generatedAt: Date.now() }
}
