// Process Visualizer の記録（FlowTrace）を、AI Runtime Detective で AI に送る最小限の要約に変換する。
// サーバー（記録の発行・検証）とブラウザ（送る内容の表示）の両方から使うため、秘密の値や node: のモジュールは読み込まない。
import type {
  FlowNodeId,
  FlowStepEvidence,
  FlowStepStatus,
  FlowTrace,
} from "@/types/flow"

/** 要約の形の版。形を変えたら上げる（古い署名付きの要約を受け付けないようにする） */
const TRACE_SUMMARY_VERSION = 1
/** 要約に入れるステップの最大数 */
const TRACE_SUMMARY_MAX_STEPS = 12
/** ステップの表示名の最大文字数 */
const LABEL_MAX_LENGTH = 80
/** 所要時間として受け付ける最大値（ミリ秒） */
const DURATION_MAX_MS = 600_000
/** ブラウザからの申告として受け付ける最大値（ミリ秒） */
const BROWSER_REPORT_MAX_MS = 120_000

const FLOW_NODE_IDS: readonly FlowNodeId[] = [
  "browser",
  "client-component",
  "next-server",
  "proxy",
  "server-component",
  "server-action",
  "route-handler",
  "cache",
  "data-source",
]

/** AI に送る 1 ステップ分の要約。フォームの入力値などが入りうる detail は含めない */
export interface TraceStepSummary {
  /** サーバーが記録した順番（0 から）。時計がずれるため、時刻の差では順番を決めない */
  order: number
  id: string
  from: FlowNodeId
  to: FlowNodeId
  label: string
  evidence: FlowStepEvidence
  status: FlowStepStatus
  /** サーバーで計測した所要時間（ミリ秒）。observed のステップだけが持つ */
  durationMs: number | null
}

/** AI に送る実行記録の要約。サーバーが作って署名し、ブラウザはそのまま送り返す */
export interface TraceSummary {
  version: typeof TRACE_SUMMARY_VERSION
  lessonId: string
  traceId: string
  title: string
  steps: TraceStepSummary[]
}

/**
 * ブラウザで計測した値。改ざんできるため署名の対象にせず、「ブラウザからの申告」として区別して扱う
 */
export interface BrowserReport {
  /** フォームを送信してから、Server Action の応答を受け取るまで（ミリ秒） */
  roundTripMs: number
}

/** Server Action が記録と一緒に返す、「この実行を AI で解説」に使う材料 */
export interface RuntimeExplainTicket {
  summary: TraceSummary
  /** 要約のハッシュ・教材 ID・実行 ID・匿名のセッション ID に対する署名 */
  token: string
}

const roundDuration = (ms: number) => Math.round(ms * 10) / 10

/**
 * 決まったキーの順番で組み立て直す。
 * 署名するときと検証するときで、JSON の文字列（ハッシュ）が一致するようにする
 */
function canonicalize(summary: TraceSummary): TraceSummary {
  return {
    version: summary.version,
    lessonId: summary.lessonId,
    traceId: summary.traceId,
    title: summary.title,
    steps: summary.steps.map((step) => ({
      order: step.order,
      id: step.id,
      from: step.from,
      to: step.to,
      label: step.label,
      evidence: step.evidence,
      status: step.status,
      durationMs: step.durationMs,
    })),
  }
}

/** ハッシュの対象にする文字列 */
export function serializeTraceSummary(summary: TraceSummary) {
  return JSON.stringify(canonicalize(summary))
}

/**
 * FlowTrace を、AI に送る要約に変換する（サーバーで実行する）。
 * - 観測の区分はステップごとに決める。区分のないステップと、source が model の記録は conceptual
 * - 所要時間は observed のステップだけに残す（計測していない時間を AI に渡さない）
 * - detail は入力値を含むことがあるため送らない
 */
export function summarizeTrace(
  lessonId: string,
  trace: FlowTrace,
): TraceSummary {
  return canonicalize({
    version: TRACE_SUMMARY_VERSION,
    lessonId,
    traceId: trace.id,
    title: trace.title,
    steps: trace.steps.slice(0, TRACE_SUMMARY_MAX_STEPS).map((step, order) => {
      const evidence: FlowStepEvidence =
        trace.source === "measured" && step.evidence === "observed"
          ? "observed"
          : "conceptual"
      return {
        order,
        id: step.id,
        from: step.from,
        to: step.to,
        label: step.label.slice(0, LABEL_MAX_LENGTH),
        evidence,
        status: step.status ?? "success",
        durationMs:
          evidence === "observed" &&
          step.durationMs !== undefined &&
          Number.isFinite(step.durationMs)
            ? roundDuration(step.durationMs)
            : null,
      }
    }),
  })
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

const STEP_ID = /^[a-z0-9-]{1,32}$/
const TRACE_ID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
/** 改行とタブを含む制御文字 */
const CONTROL_CHARACTERS = /[\u0000-\u001F\u007F]/

function isText(value: unknown, maxLength: number): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= maxLength &&
    !CONTROL_CHARACTERS.test(value)
  )
}

function parseStep(value: unknown, order: number): TraceStepSummary | null {
  if (!isRecord(value)) return null
  const { id, from, to, label, evidence, status, durationMs } = value
  if (value.order !== order) return null
  if (typeof id !== "string" || !STEP_ID.test(id)) return null
  if (!FLOW_NODE_IDS.includes(from as FlowNodeId)) return null
  if (!FLOW_NODE_IDS.includes(to as FlowNodeId)) return null
  if (!isText(label, LABEL_MAX_LENGTH)) return null
  if (evidence !== "observed" && evidence !== "conceptual") return null
  if (status !== "success" && status !== "error") return null
  if (durationMs !== null) {
    if (
      evidence !== "observed" ||
      typeof durationMs !== "number" ||
      !Number.isFinite(durationMs) ||
      durationMs < 0 ||
      durationMs > DURATION_MAX_MS
    ) {
      return null
    }
  }
  return {
    order,
    id,
    from: from as FlowNodeId,
    to: to as FlowNodeId,
    label,
    evidence,
    status,
    durationMs: durationMs as number | null,
  }
}

/**
 * ブラウザから送り返された要約の形を確かめる（サーバーで実行する）。
 * 形が正しくても内容は信頼できないため、このあと署名とハッシュで改ざんがないことを確かめる
 */
export function parseTraceSummary(value: unknown): TraceSummary | null {
  if (!isRecord(value)) return null
  const { version, lessonId, traceId, title, steps } = value
  if (version !== TRACE_SUMMARY_VERSION) return null
  if (typeof lessonId !== "string" || !STEP_ID.test(lessonId)) return null
  if (typeof traceId !== "string" || !TRACE_ID.test(traceId)) return null
  if (!isText(title, LABEL_MAX_LENGTH)) return null
  if (
    !Array.isArray(steps) ||
    steps.length === 0 ||
    steps.length > TRACE_SUMMARY_MAX_STEPS
  ) {
    return null
  }

  const parsedSteps: TraceStepSummary[] = []
  for (const [order, step] of steps.entries()) {
    const parsed = parseStep(step, order)
    if (!parsed) return null
    parsedSteps.push(parsed)
  }

  return canonicalize({
    version: TRACE_SUMMARY_VERSION,
    lessonId,
    traceId,
    title,
    steps: parsedSteps,
  })
}

/** ブラウザからの申告を確かめる。形が正しくなければ、申告はなかったものとして扱う */
export function parseBrowserReport(value: unknown): BrowserReport | null {
  if (!isRecord(value)) return null
  const { roundTripMs } = value
  if (
    typeof roundTripMs !== "number" ||
    !Number.isFinite(roundTripMs) ||
    roundTripMs < 0 ||
    roundTripMs > BROWSER_REPORT_MAX_MS
  ) {
    return null
  }
  return { roundTripMs: Math.round(roundTripMs) }
}
