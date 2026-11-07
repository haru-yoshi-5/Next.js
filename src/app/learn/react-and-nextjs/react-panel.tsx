"use client"

import {
  CircleAlertIcon,
  LoaderIcon,
  MinusIcon,
  PlusIcon,
  RefreshCwIcon,
  RotateCcwIcon,
} from "lucide-react"
import { useRouter } from "next/navigation"
import {
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  useTransition,
  version as browserReactVersion,
} from "react"

import { DemoLayout } from "@/components/learning/demo-layout"
import { Button } from "@/components/ui/button"
import { ProcessVisualizer } from "@/components/visualizer/process-visualizer"

import {
  formatBytes,
  type RscObservation,
  type RscObserver,
  startRscObserver,
} from "./observe-rsc"
import { buildRefreshTrace, initialModel, type RefreshSnapshot } from "./trace"

interface ReactPanelProps {
  /** package.json に書いた React の版 */
  declaredVersion: string
  /** Server Component が描画時に読んだ React.version */
  serverVersion: string
  /** Server Component（ServerStamp）が描画した部分 */
  children: ReactNode
}

type RefreshState =
  | { status: "idle" }
  | { status: "loading"; before: RefreshSnapshot }
  | { status: "error" }
  | {
      status: "done"
      id: string
      before: RefreshSnapshot
      after: RefreshSnapshot
      rsc: RscObservation
    }

const subscribeNothing = () => () => {}

/** 更新が反映された後、サーバー生成IDが変わるのを待つ上限 */
const ID_TIMEOUT_MS = 3000

function readServerId(container: HTMLElement | null) {
  return (
    container
      ?.querySelector("[data-nsc-server-id]")
      ?.getAttribute("data-nsc-server-id") ?? null
  )
}

/**
 * ブラウザで動いている React の版。
 * サーバーでの描画（SSR）とハイドレーション中は null を返し、ブラウザで描画し直したときに値を返す。
 * render 中にそのまま読むと、SSR の値をブラウザの値と取り違えるため。
 */
function useBrowserReactVersion() {
  return useSyncExternalStore(
    subscribeNothing,
    () => browserReactVersion,
    () => null,
  )
}

// カウンターの state とボタンの操作を扱うため Client Component。
// ServerStamp の出力はサーバーで作られ、children として受け取るだけ。
export function ReactPanel({
  declaredVersion,
  serverVersion,
  children,
}: ReactPanelProps) {
  const router = useRouter()
  const browserVersion = useBrowserReactVersion()
  const [count, setCount] = useState(0)
  const [refresh, setRefresh] = useState<RefreshState>({ status: "idle" })
  const [isPending, startTransition] = useTransition()
  const serverAreaRef = useRef<HTMLDivElement>(null)
  const rscObserverRef = useRef<RscObserver | null>(null)

  // ServerStamp が描画したサーバー生成IDを、DOM の変化から読む。
  // Suspense の fallback が表示されている間は null になる。
  const subscribeServerArea = useCallback((onChange: () => void) => {
    const container = serverAreaRef.current
    if (!container) return () => {}
    const observer = new MutationObserver(onChange)
    observer.observe(container, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["data-nsc-server-id"],
    })
    return () => observer.disconnect()
  }, [])
  const serverId = useSyncExternalStore(
    subscribeServerArea,
    () => readServerId(serverAreaRef.current),
    () => null,
  )

  // 更新の途中でアンマウントされたら、観測を止めて記録を手放す。
  // 完了判定の Effect の cleanup で止めると、依存値が変わるたびに観測が止まるため分ける
  useEffect(() => {
    return () => {
      rscObserverRef.current?.dispose()
      rscObserverRef.current = null
    }
  }, [])

  function refreshServer() {
    // 通信の観測は、更新を始める直前に登録する。前回の観測が残っていれば止める
    rscObserverRef.current?.dispose()
    rscObserverRef.current = startRscObserver()
    setRefresh({ status: "loading", before: { count, serverId } })
    // Next.js のルーターがサーバーへ RSC Payload を要求し、React が結果を反映する
    startTransition(() => router.refresh())
  }

  // transition が終わった後、サーバー生成IDが変わったら完了とする。
  // 期限までに変わらなければエラーにする。通信の観測は別に締め切る
  useEffect(() => {
    if (refresh.status !== "loading" || isPending) return

    const { before } = refresh
    const rscObserver = rscObserverRef.current

    if (serverId !== null && serverId !== before.serverId) {
      let ignore = false
      const after: RefreshSnapshot = { count, serverId }
      rscObserver?.stop().then((rsc) => {
        if (ignore) return
        setRefresh({
          status: "done",
          id: crypto.randomUUID(),
          before,
          after,
          rsc,
        })
      })
      return () => {
        ignore = true
      }
    }

    const timer = setTimeout(() => {
      void rscObserver?.stop()
      setRefresh({ status: "error" })
    }, ID_TIMEOUT_MS)
    return () => clearTimeout(timer)
  }, [refresh, isPending, serverId, count])

  const isRefreshing = refresh.status === "loading"
  const isWaitingServer = serverId === null && !isRefreshing
  const trace =
    refresh.status === "done"
      ? buildRefreshTrace(
          refresh.id,
          refresh.before,
          refresh.after,
          refresh.rsc,
        )
      : initialModel

  return (
    <DemoLayout
      runtime="client"
      runtimeDetail="カウンターと更新ボタン"
      demo={
        <div className="flex flex-col gap-5">
          <VersionSection
            declaredVersion={declaredVersion}
            serverVersion={serverVersion}
            browserVersion={browserVersion}
          />

          <section className="flex flex-col gap-3 border-t pt-4">
            <div className="flex flex-col gap-1">
              <h3 className="text-sm font-medium">
                ② サーバーの表示が変わっても、state は残る
              </h3>
              <p className="text-xs leading-relaxed text-muted-foreground">
                カウンターの値は React の state
                です。サーバーの表示を更新すると、Next.js
                がサーバーから新しい結果を取り寄せ、React
                がそれを画面に反映します。
              </p>
            </div>

            <div ref={serverAreaRef}>{children}</div>

            <div className="flex flex-wrap items-center gap-3 rounded-lg border px-3 py-2">
              <p className="text-sm">
                カウンター
                <output
                  aria-live="polite"
                  className="ml-2 inline-block min-w-8 text-center font-mono text-lg tabular-nums"
                >
                  {count}
                </output>
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon-sm"
                  aria-label="1 減らす"
                  disabled={isRefreshing}
                  onClick={() => setCount((value) => value - 1)}
                >
                  <MinusIcon aria-hidden />
                </Button>
                <Button
                  variant="outline"
                  size="icon-sm"
                  aria-label="1 増やす"
                  disabled={isRefreshing}
                  onClick={() => setCount((value) => value + 1)}
                >
                  <PlusIcon aria-hidden />
                </Button>
              </div>
            </div>

            <Button
              disabled={isRefreshing || isWaitingServer}
              onClick={refreshServer}
              className="self-start"
            >
              {isRefreshing ? (
                <LoaderIcon aria-hidden className="motion-safe:animate-spin" />
              ) : (
                <RefreshCwIcon aria-hidden />
              )}
              サーバーの表示を更新
            </Button>

            <RefreshResult
              refresh={refresh}
              isWaitingServer={isWaitingServer}
              onRetry={refreshServer}
            />
          </section>
        </div>
      }
      visualizer={
        <ProcessVisualizer
          nodes={[
            "browser",
            "client-component",
            "next-server",
            "server-component",
          ]}
          trace={trace}
          emptyMessage="「サーバーの表示を更新」を押すと、観測した値で再生されます"
        />
      }
    />
  )
}

function VersionSection({
  declaredVersion,
  serverVersion,
  browserVersion,
}: {
  declaredVersion: string
  serverVersion: string
  browserVersion: string | null
}) {
  const rows = [
    { label: "package.json に書いた版", value: declaredVersion },
    { label: "Server Component が読んだ版", value: serverVersion },
    { label: "ブラウザで動いている版", value: browserVersion ?? "確認中…" },
  ]

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-medium">① 実際に動いている React</h3>
        <p className="text-xs leading-relaxed text-muted-foreground">
          どれも{" "}
          <code className="font-mono">
            import {"{ version }"} from &quot;react&quot;
          </code>{" "}
          で読める <code className="font-mono">React.version</code>{" "}
          の値です（package.json
          の版を除く）。サーバー側はプリレンダー時に読んだ値です。
        </p>
      </div>
      <dl className="flex flex-col gap-1.5 rounded-lg border px-3 py-2 text-sm">
        {rows.map((row) => (
          <div key={row.label} className="flex flex-col gap-0.5">
            <dt className="text-xs text-muted-foreground">{row.label}</dt>
            <dd className="font-mono text-xs break-all">{row.value}</dd>
          </div>
        ))}
      </dl>
      <p
        role="status"
        className="text-xs leading-relaxed text-muted-foreground"
      >
        {versionMessage(declaredVersion, serverVersion, browserVersion)}
      </p>
    </section>
  )
}

function versionMessage(
  declaredVersion: string,
  serverVersion: string,
  browserVersion: string | null,
) {
  if (browserVersion === null) return "ブラウザの React の版を確認しています…"
  if (browserVersion === serverVersion && serverVersion !== declaredVersion) {
    return "サーバーとブラウザでは同じ React が動いていて、package.json の版とは違います。App Router は、Next.js に同梱された React を使うためです。"
  }
  if (browserVersion === serverVersion) {
    return "サーバーとブラウザで、package.json と同じ版の React が動いています。"
  }
  return "サーバーとブラウザで、React の版が違います。"
}

function RefreshResult({
  refresh,
  isWaitingServer,
  onRetry,
}: {
  refresh: RefreshState
  /** 最初のサーバー生成IDがまだ表示されていない */
  isWaitingServer: boolean
  onRetry: () => void
}) {
  if (refresh.status === "error") {
    return (
      <div role="alert" className="flex flex-col items-start gap-2">
        <p className="flex items-center gap-1.5 text-sm text-destructive">
          <CircleAlertIcon aria-hidden className="size-4 shrink-0" />
          サーバー生成IDの変化を確認できませんでした。もう一度更新してください。
        </p>
        <Button
          variant="ghost"
          size="sm"
          disabled={isWaitingServer}
          onClick={onRetry}
        >
          <RotateCcwIcon aria-hidden />
          もう一度更新する
        </Button>
      </div>
    )
  }

  if (refresh.status !== "done") {
    return (
      <p role="status" className="text-sm text-muted-foreground">
        {refresh.status === "loading"
          ? "サーバーの表示を更新しています…"
          : isWaitingServer
            ? "サーバーの部分が表示されるのを待っています…"
            : "カウンターを何回か押してから、サーバーの表示を更新してみましょう。"}
      </p>
    )
  }

  const { before, after, rsc } = refresh
  const kept = before.count === after.count

  return (
    <div role="status" className="flex flex-col gap-3">
      <p className="text-sm">
        {kept
          ? `サーバー生成IDは変わり、カウンターは ${after.count} のまま残りました。`
          : `サーバー生成IDは変わりました。カウンターは ${before.count} から ${after.count} に変わっています。`}
      </p>
      <section className="flex flex-col gap-1.5">
        <h4 className="text-xs font-medium text-muted-foreground">
          更新の前と後
        </h4>
        <dl className="flex flex-col gap-1 text-sm">
          <ResultRow
            label="サーバー生成ID"
            value={`${before.serverId ?? "なし"} → ${after.serverId ?? "なし"}`}
          />
          <ResultRow
            label="カウンター（React の state）"
            value={`${before.count} → ${after.count}`}
          />
        </dl>
      </section>
      <section className="flex flex-col gap-1.5">
        <h4 className="text-xs font-medium text-muted-foreground">
          参考: 観測した RSC Payload の取得（候補）
        </h4>
        <RscCandidates rsc={rsc} />
      </section>
    </div>
  )
}

function RscCandidates({ rsc }: { rsc: RscObservation }) {
  if (!rsc.observed) {
    return (
      <p className="text-sm text-muted-foreground">
        このブラウザでは Resource Timing
        を使えないため、候補を観測できませんでした。
      </p>
    )
  }

  return (
    <>
      <dl className="flex flex-col gap-1 text-sm">
        <ResultRow
          label="観測期間内に記録された候補"
          value={`${rsc.candidates.length} 件`}
        />
        {rsc.candidates.map((candidate, index) => (
          <ResultRow
            key={index}
            label={`${index + 1} 件目（時間 / 圧縮 / 展開後）`}
            value={`${candidate.fetchMs === null ? "取得できず" : `${candidate.fetchMs} ms`} / ${formatBytes(candidate.encodedBytes)} / ${formatBytes(candidate.decodedBytes)}`}
          />
        ))}
      </dl>
      {rsc.candidates.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          観測期間内に、候補は記録されませんでした。
        </p>
      ) : null}
      <p className="text-xs leading-relaxed text-muted-foreground">
        更新を始める直前から、画面への反映が終わって少し後までの間に、ブラウザの
        Resource Timing に記録された、このページへの{" "}
        <code className="font-mono">_rsc</code>{" "}
        付きの取得です。1回の更新で複数の取得が行われることがあり、ヘッダーまでは確認できないため候補として表示します。ほかのページへのリンクの先読みもやり直されますが、ここでは数えていません。DevTools
        の Network でも確かめられます。
      </p>
    </>
  )
}

function ResultRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap justify-between gap-x-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-mono break-all tabular-nums">{value}</dd>
    </div>
  )
}
