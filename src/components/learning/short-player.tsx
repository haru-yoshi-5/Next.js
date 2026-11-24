"use client"

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react"
import {
  animate,
  motion,
  useMotionValue,
  useTransform,
  type AnimationPlaybackControls,
} from "motion/react"
import {
  PauseIcon,
  PlayIcon,
  RotateCcwIcon,
  SkipBackIcon,
  SkipForwardIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { RuntimeBadge } from "@/components/visualizer/runtime-badge"
import type { Runtime } from "@/types/lesson"

const tones = {
  problem: { label: "課題", className: "border-destructive/50" },
  explain: {
    label: "解説",
    className: "border-blue-600/45 dark:border-blue-400/45",
  },
  solution: { label: "まとめ", className: "border-server/50" },
}

interface ShortNode {
  id: string
  label: string
  description: string
  runtime: Runtime
}

interface ShortMetric {
  id: string
  label: string
  value: number
  unit: string
}

export interface ShortScene {
  id: string
  duration: number
  title: string
  caption: string
  tone: keyof typeof tones
  nodes: readonly ShortNode[]
  metrics: readonly ShortMetric[]
  codeKey: string
}

type CodeSlots = Record<string, ReactNode>

function hasUniqueIds(items: readonly { id: string }[]) {
  return new Set(items.map(({ id }) => id)).size === items.length
}

function isValidScene(
  scene: ShortScene | undefined,
  code: CodeSlots,
): scene is ShortScene {
  return Boolean(
    scene &&
    typeof scene.id === "string" &&
    scene.id.trim() &&
    typeof scene.title === "string" &&
    scene.title.trim() &&
    typeof scene.caption === "string" &&
    scene.caption.trim() &&
    Object.hasOwn(tones, scene.tone) &&
    Number.isFinite(scene.duration) &&
    scene.duration > 0 &&
    scene.duration <= 2_147_483_647 &&
    typeof scene.codeKey === "string" &&
    Object.hasOwn(code, scene.codeKey) &&
    code[scene.codeKey] != null &&
    Array.isArray(scene.nodes) &&
    scene.nodes.length > 0 &&
    scene.nodes.every(
      (node: ShortNode) =>
        node &&
        typeof node.id === "string" &&
        node.id.trim() &&
        typeof node.label === "string" &&
        node.label.trim() &&
        typeof node.description === "string" &&
        (node.runtime === "server" || node.runtime === "client"),
    ) &&
    hasUniqueIds(scene.nodes) &&
    Array.isArray(scene.metrics) &&
    scene.metrics.every(
      (metric: ShortMetric) =>
        metric &&
        typeof metric.id === "string" &&
        metric.id.trim() &&
        typeof metric.label === "string" &&
        metric.label.trim() &&
        Number.isSafeInteger(metric.value) &&
        metric.value >= 0 &&
        typeof metric.unit === "string",
    ) &&
    hasUniqueIds(scene.metrics),
  )
}

interface TransitionState {
  animated: boolean
  playing: boolean
}

/** 手動操作は即時反映し、自動送りの補間は再生と同じ操作で一時停止する。 */
function useTransitionValue(
  target: number,
  { animated, playing }: TransitionState,
) {
  const value = useMotionValue(target)
  const animation = useRef<AnimationPlaybackControls | null>(null)

  useEffect(() => {
    if (!animated || value.get() === target) {
      value.jump(target)
      return
    }

    const controls = animate(value, target, {
      duration: 0.65,
      ease: "easeInOut",
      autoplay: false,
    })
    animation.current = controls
    return () => {
      controls.stop()
      animation.current = null
    }
  }, [animated, target, value])

  useEffect(() => {
    if (playing) animation.current?.play()
    else animation.current?.pause()
  }, [animated, playing, target])

  return value
}

function DiagramNode({
  node,
  transition,
}: {
  node: ShortNode
  transition: TransitionState
}) {
  const position = useTransitionValue(
    node.runtime === "client" ? 1 : 0,
    transition,
  )
  const x = useTransform(position, [0, 1], ["0%", "100%"])
  return (
    <motion.li className="w-1/2 px-2" style={{ x }} data-short-node={node.id}>
      <div className="rounded-md border bg-card p-2 sm:px-3">
        <p className="font-mono text-xs font-semibold wrap-anywhere sm:text-sm">
          {node.label}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">{node.description}</p>
        <span className="sr-only">
          {node.runtime === "server" ? "Server 側" : "Client 側"}
        </span>
      </div>
    </motion.li>
  )
}

/**
 * 全場面のうち最も高いものに合わせて、場所を確保するための見えない要素。
 * 本物の要素と同じグリッドのマスに重ねて置く。場面が変わっても高さが変わらず、下の操作ボタンが動かない。
 * 文字は CSS の content で描き、DOM の文字にも支援技術にも出さない（本物の文言と重複させない）。
 */
function Reserve({
  text,
  className = "",
}: {
  text: string
  className?: string
}) {
  return (
    <span
      aria-hidden
      data-reserve={text}
      className={`invisible col-start-1 row-start-1 block before:content-[attr(data-reserve)] ${className}`}
    />
  )
}

function ReservedNodes({ nodes }: { nodes: readonly ShortNode[] }) {
  return (
    <div
      aria-hidden
      className="invisible col-start-1 row-start-1 flex flex-col gap-2 pb-2"
    >
      {nodes.map((node) => (
        <div key={node.id} className="w-1/2 px-2">
          <div className="rounded-md border p-2 sm:px-3">
            <Reserve
              text={node.label}
              className="font-mono text-xs font-semibold wrap-anywhere sm:text-sm"
            />
            <Reserve text={node.description} className="mt-1 text-xs" />
          </div>
        </div>
      ))}
    </div>
  )
}

/** 数値のバッジの行。数値の桁でバッジの幅が変わり、折り返す行数が場面で変わるため場所を確保する */
function ReservedMetrics({ metrics }: { metrics: readonly ShortMetric[] }) {
  return (
    <div
      aria-hidden
      className="invisible col-start-1 row-start-1 flex flex-wrap gap-2"
    >
      {metrics.map((metric) => (
        <p
          key={metric.id}
          className="rounded-md px-2.5 py-1.5 text-xs sm:text-sm"
        >
          <span
            data-reserve={`${metric.label} `}
            className="whitespace-pre-wrap before:content-[attr(data-reserve)]"
          />
          <strong
            data-reserve={String(metric.value)}
            className="text-base tabular-nums before:content-[attr(data-reserve)]"
          />
          <span
            data-reserve={` ${metric.unit}`}
            className="whitespace-pre-wrap before:content-[attr(data-reserve)]"
          />
        </p>
      ))}
    </div>
  )
}

function MetricBadge({
  metric,
  transition,
}: {
  metric: ShortMetric
  transition: TransitionState
}) {
  const value = useTransitionValue(metric.value, transition)
  const integer = useTransform(value, Math.round)
  return (
    <p className="rounded-md bg-muted px-2.5 py-1.5 text-xs sm:text-sm">
      {metric.label}{" "}
      <motion.strong aria-hidden className="text-base tabular-nums">
        {integer}
      </motion.strong>
      <strong className="sr-only">{metric.value}</strong> {metric.unit}
    </p>
  )
}

export function ShortPlayer({
  label,
  scenes,
  code,
  metricNote,
}: {
  label: string
  scenes: readonly ShortScene[]
  code: CodeSlots
  metricNote?: string
}) {
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(true)
  const [revision, setRevision] = useState(0)
  const [motionAllowed, setMotionAllowed] = useState(false)
  const [animated, setAnimated] = useState(false)
  const [announcement, setAnnouncement] = useState("")
  const remaining = useRef<number | null>(null)
  const discardRemaining = useRef(false)
  const codePanel = useRef<HTMLDivElement>(null)
  const current = index < scenes.length ? index : 0
  const scene = scenes[current]
  const valid =
    isValidScene(scene, code) &&
    scenes.filter((entry) => entry?.id === scene.id).length === 1
  const canPlay = motionAllowed && valid
  const running = playing && canPlay
  const transition = { animated: animated && motionAllowed, playing: running }

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)")
    const update = () => {
      setMotionAllowed(!media.matches)
      if (media.matches) {
        setPlaying(false)
        setAnimated(false)
      }
    }
    update()
    media.addEventListener("change", update)
    return () => media.removeEventListener("change", update)
  }, [])

  useEffect(() => {
    if (!running) return
    discardRemaining.current = false
    const duration = remaining.current ?? scene.duration
    const started = Date.now()
    let elapsed = false
    const timer = window.setTimeout(() => {
      elapsed = true
      remaining.current = null
      const next = (current + 1) % scenes.length
      const nextScene = scenes[next]
      if (
        !isValidScene(nextScene, code) ||
        scenes.filter((entry) => entry?.id === nextScene.id).length !== 1
      ) {
        setPlaying(false)
      }
      setAnimated(true)
      setIndex(next)
      setRevision((value) => value + 1)
    }, duration)
    return () => {
      window.clearTimeout(timer)
      if (!elapsed && !discardRemaining.current)
        remaining.current = Math.max(0, duration - (Date.now() - started))
      discardRemaining.current = false
    }
  }, [running, scene, current, scenes, code, revision])

  // 場面が変わったら、コード欄の中だけを強調行が見える位置までスクロールする。
  // 欄の高さは固定なので、下のほうの強調行は動かさないと見えない。ページ全体は動かさない。
  // 描画の前に位置を決め、先頭が一瞬見えてから動くちらつきを防ぐ
  useLayoutEffect(() => {
    const panel = codePanel.current
    if (!panel) return
    const highlighted = panel.querySelectorAll("[data-highlighted]")
    const first = highlighted[0]
    const last = highlighted[highlighted.length - 1]
    if (!first || !last) {
      panel.scrollTop = 0
      return
    }
    const panelTop = panel.getBoundingClientRect().top - panel.scrollTop
    const firstTop = first.getBoundingClientRect().top - panelTop
    const lastBottom = last.getBoundingClientRect().bottom - panelTop
    const margin = 8
    // 最後の強調行が収まる最小の位置。ただし最初の強調行は必ず見える範囲に残す
    const needed = lastBottom + margin - panel.clientHeight
    panel.scrollTop = Math.max(0, Math.min(needed, firstTop - margin))
  }, [current, revision, valid])

  if (!scenes.length) return null

  function move(next: number, restart = false) {
    discardRemaining.current = true
    remaining.current = null
    const target = (next + scenes.length) % scenes.length
    const targetScene = scenes[target]
    setRevision((value) => value + 1)
    setAnimated(false)
    setPlaying(restart && motionAllowed && isValidScene(targetScene, code))
    setIndex(target)
    setAnnouncement(
      typeof targetScene?.title === "string"
        ? targetScene.title
        : "場面を表示できません",
    )
  }

  // 高さを確保する対象。壊れた場面と id が重複する場面は表示しないので含めない（key の重複も防ぐ）
  const reserved = scenes.filter(
    (entry) =>
      isValidScene(entry, code) &&
      scenes.filter((other) => other?.id === entry.id).length === 1,
  )
  const tone = valid ? tones[scene.tone] : null
  const caption =
    typeof scene?.caption === "string" && scene.caption.trim()
      ? scene.caption
      : "この場面の説明はありません。"
  return (
    <section
      aria-label={label}
      className={`min-w-0 rounded-xl border-2 ${tone?.className ?? "border-border"} bg-card p-4 sm:p-6`}
    >
      <div className="flex min-h-16 flex-wrap items-start justify-between gap-x-3">
        <div>
          <p className="text-xs font-semibold text-muted-foreground">
            図解ショート · {current + 1} / {scenes.length}
            {tone ? ` · ${tone.label}` : ""}
          </p>
          {valid && (
            <div className="mt-1 grid grid-cols-[minmax(0,1fr)] text-xl font-bold wrap-break-word">
              <h2 className="col-start-1 row-start-1">{scene.title}</h2>
              {reserved.map((entry) => (
                <Reserve key={entry.id} text={entry.title} />
              ))}
            </div>
          )}
        </div>
        {/* 数値のない場面でも場所は残し、見出しの高さを場面ごとに変えない */}
        {valid &&
          metricNote &&
          reserved.some((entry) => entry.metrics.length > 0) &&
          (scene.metrics.length > 0 ? (
            <span className="text-xs text-muted-foreground">{metricNote}</span>
          ) : (
            <Reserve text={metricNote} className="text-xs" />
          ))}
      </div>
      {valid ? (
        <>
          <div className="grid min-h-10 grid-cols-[minmax(0,1fr)] wrap-break-word">
            <div className="col-start-1 row-start-1 flex flex-wrap gap-2">
              {scene.metrics.map((metric) => (
                <MetricBadge
                  key={metric.id}
                  metric={metric}
                  transition={transition}
                />
              ))}
            </div>
            {reserved.map((entry) => (
              <ReservedMetrics key={entry.id} metrics={entry.metrics} />
            ))}
          </div>
          <div
            className="relative isolate mt-4 overflow-hidden rounded-lg border"
            role="group"
            aria-label="部品と境界の図"
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 -z-10 grid grid-cols-2"
            >
              <div className="border-r border-dashed border-server/45 bg-server-muted/45" />
              <div className="bg-client-muted/45" />
            </div>
            <div className="grid grid-cols-2 py-2 text-center">
              <div>
                <RuntimeBadge runtime="server" />
              </div>
              <div>
                <RuntimeBadge runtime="client" />
              </div>
            </div>
            <div className="grid grid-cols-[minmax(0,1fr)] wrap-break-word">
              <ul className="col-start-1 row-start-1 flex flex-col gap-2 pb-2">
                {scene.nodes.map((node) => (
                  <DiagramNode
                    key={node.id}
                    node={node}
                    transition={transition}
                  />
                ))}
              </ul>
              {reserved.map((entry) => (
                <ReservedNodes key={entry.id} nodes={entry.nodes} />
              ))}
            </div>
          </div>
          <div className="my-4 grid min-h-[4.5rem] grid-cols-[minmax(0,1fr)] text-sm leading-relaxed wrap-break-word sm:min-h-10">
            <p className="col-start-1 row-start-1">{caption}</p>
            {reserved.map((entry) => (
              <Reserve key={entry.id} text={entry.caption} />
            ))}
          </div>
          {/* 幅が狭く高さも固定なので、この欄の中だけ長い行を折り返す。
              行番号は 1 行目に付き、続きの行は 2 文字下げて別の行と見分けられるようにする */}
          <div
            ref={codePanel}
            className="h-64 min-w-0 space-y-2 overflow-auto rounded-lg [&_code]:min-w-0 [&_code>span>span:last-child]:min-w-0 [&_code>span>span:last-child]:pl-[2ch] [&_code>span>span:last-child]:-indent-[2ch] [&_code>span>span:last-child]:wrap-anywhere [&_pre]:whitespace-pre-wrap"
            aria-label="この場面のコード例"
            role="group"
            onFocusCapture={() => setPlaying(false)}
          >
            {code[scene.codeKey]}
          </div>
        </>
      ) : (
        <p className="mb-4 min-h-[28rem] text-sm leading-relaxed">{caption}</p>
      )}
      <div
        className="mt-4 flex flex-wrap gap-2"
        role="group"
        aria-label="再生操作"
      >
        <Button variant="outline" onClick={() => move(current - 1)}>
          <SkipBackIcon aria-hidden />
          前へ
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            setPlaying(!running)
            setAnnouncement(running ? "一時停止しました" : "再生します")
          }}
          disabled={!canPlay}
        >
          {running ? <PauseIcon aria-hidden /> : <PlayIcon aria-hidden />}
          {running ? "一時停止" : "再生"}
        </Button>
        <Button variant="outline" onClick={() => move(current + 1)}>
          次へ
          <SkipForwardIcon aria-hidden />
        </Button>
        <Button variant="outline" onClick={() => move(0, true)}>
          <RotateCcwIcon aria-hidden />
          もう一度
        </Button>
      </div>
      <p className="mt-2 min-h-4 text-xs text-muted-foreground">
        {!motionAllowed &&
          "動きを減らす設定では、前後のボタンで場面を切り替えられます。"}
      </p>
      <span className="sr-only" aria-live="polite">
        {announcement}
      </span>
    </section>
  )
}
