import { AnatomyPanel } from "./anatomy-panel"
import { findRouteFiles } from "./route-files"

/**
 * サーバーで src/app を調べ、その結果だけを Client Component に渡す。
 * ファイルを読む処理（node:fs）はブラウザに届かない。
 */
export async function AnatomyDemo() {
  const routeFolders = await findRouteFiles()

  return <AnatomyPanel routeFolders={routeFolders} />
}
