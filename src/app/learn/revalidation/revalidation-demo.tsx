import { io } from "next/cache"

import { RevalidationPanel } from "./revalidation-panel"
import { getSharedValue } from "./shared-data"

/** キャッシュの値を読み取って Client Component へ渡す。応答のたびに最新の表示になる */
export async function RevalidationDemo() {
  // ここから先はリクエストのたびに実行する（ビルド時のプリレンダーには含めない）
  await io()

  return <RevalidationPanel value={await getSharedValue()} />
}
