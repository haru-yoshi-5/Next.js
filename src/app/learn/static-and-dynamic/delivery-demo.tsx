import { Suspense } from "react"

import { DeliveryPanel } from "./delivery-panel"
import { RequestOutput, RequestOutputFallback } from "./request-output"
import { ShellOutput } from "./shell-output"

/** 1つのページの中に、静的シェルに入る部分とリクエスト時に実行される部分を並べる */
export function DeliveryDemo() {
  return (
    <DeliveryPanel>
      <div className="grid gap-3 sm:grid-cols-2">
        <ShellOutput />
        <Suspense fallback={<RequestOutputFallback />}>
          <RequestOutput />
        </Suspense>
      </div>
    </DeliveryPanel>
  )
}
