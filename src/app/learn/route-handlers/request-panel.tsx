"use client"

import { CircleAlertIcon, LoaderIcon } from "lucide-react"
import { type FormEvent, useState } from "react"

import { DemoLayout } from "@/components/learning/demo-layout"
import { Button } from "@/components/ui/button"
import { ProcessVisualizer } from "@/components/visualizer/process-visualizer"
import type { FlowTrace } from "@/types/flow"

import { callRoute, type DemoMethod, type RouteCall } from "./call-route"
import { ResponseView } from "./response-view"
import { buildRouteTrace, routeModel } from "./trace"

type RequestStatus = "idle" | "loading" | "error"

// 入力・クリック・fetch の状態を扱うため Client Component。
// リクエストを受け取って処理するのは api/route.ts の Route Handler。
export function RequestPanel() {
  const [status, setStatus] = useState<RequestStatus>("idle")
  const [call, setCall] = useState<RouteCall | null>(null)
  const [trace, setTrace] = useState<FlowTrace>(routeModel)
  const [text, setText] = useState("")

  async function send(method: DemoMethod) {
    setStatus("loading")
    const sentText = text
    try {
      const result = await callRoute(method, sentText)
      setCall(result)
      setTrace(buildRouteTrace(crypto.randomUUID(), result))
      // 応答を待つ間に書き始めた次のメッセージは消さない
      if (method === "POST" && result.status === 201) {
        setText((current) => (current === sentText ? "" : current))
      }
      setStatus("idle")
    } catch (error) {
      console.error("[route-handlers] リクエストに失敗しました", error)
      setStatus("error")
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void send("POST")
  }

  const isLoading = status === "loading"

  return (
    <DemoLayout
      runtime="client"
      runtimeDetail="fetch() を送る UI"
      demo={
        <div className="flex flex-col gap-5">
          <section className="flex flex-col gap-2">
            <h4 className="text-sm font-medium">一覧を取得する</h4>
            <Button
              variant="outline"
              disabled={isLoading}
              onClick={() => void send("GET")}
              className="self-start"
            >
              GET を送る
            </Button>
          </section>

          <form
            onSubmit={handleSubmit}
            noValidate
            className="flex flex-col gap-2 border-t pt-4"
          >
            <label htmlFor="route-message" className="text-sm font-medium">
              メッセージを追加する
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                id="route-message"
                value={text}
                onChange={(event) => setText(event.target.value)}
                autoComplete="off"
                aria-describedby="route-message-hint"
                className="h-9 min-w-0 flex-1 rounded-lg border bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40"
              />
              <Button type="submit" variant="outline" disabled={isLoading}>
                POST を送る
              </Button>
            </div>
            <p
              id="route-message-hint"
              className="text-xs leading-relaxed text-muted-foreground"
            >
              30文字以内。検証は Route Handler
              で行うため、空欄のままでも送信できます。
            </p>
          </form>

          <section className="flex flex-col gap-2 border-t pt-4">
            <h4 className="text-sm font-medium">
              定義していないメソッドを送る
            </h4>
            <Button
              variant="outline"
              disabled={isLoading}
              onClick={() => void send("PUT")}
              className="self-start"
            >
              PUT を送る
            </Button>
          </section>

          <div className="flex flex-col gap-2 border-t pt-4">
            <RequestStatusMessage status={status} hasCall={call !== null} />
            {call ? <ResponseView call={call} /> : null}
          </div>
        </div>
      }
      visualizer={
        <ProcessVisualizer
          nodes={[
            "browser",
            "client-component",
            "next-server",
            "route-handler",
            "data-source",
          ]}
          trace={trace}
          emptyMessage="リクエストを送ると、処理がここに表示されます"
        />
      }
    />
  )
}

function RequestStatusMessage({
  status,
  hasCall,
}: {
  status: RequestStatus
  hasCall: boolean
}) {
  if (status === "error") {
    return (
      <p
        role="alert"
        className="flex items-center gap-1.5 text-sm text-destructive"
      >
        <CircleAlertIcon aria-hidden className="size-4" />
        リクエストを送れませんでした。通信状況を確認して、もう一度お試しください。
      </p>
    )
  }

  return (
    <p
      role="status"
      className="flex items-center gap-1.5 text-sm text-muted-foreground"
    >
      {status === "loading" ? (
        <>
          <LoaderIcon aria-hidden className="size-4 motion-safe:animate-spin" />
          応答を待っています…
        </>
      ) : hasCall ? (
        "最後に届いたレスポンス"
      ) : (
        "まだリクエストを送っていません。"
      )}
    </p>
  )
}
