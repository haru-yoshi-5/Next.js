import { Suspense, version as serverReactVersion } from "react"

import packageJson from "../../../../package.json"

import { ReactPanel } from "./react-panel"
import { ServerStamp, ServerStampFallback } from "./server-stamp"

/**
 * Server Component。
 * - package.json に書いた React の版（宣言した依存）
 * - この Server Component が描画時に読んだ React.version（プリレンダー時の値）
 * を Client Component に渡す。ブラウザで動いている React の版は、ブラウザ側で読む。
 */
export function ReactDemo() {
  return (
    <ReactPanel
      declaredVersion={packageJson.dependencies.react}
      serverVersion={serverReactVersion}
    >
      <Suspense fallback={<ServerStampFallback />}>
        <ServerStamp />
      </Suspense>
    </ReactPanel>
  )
}
