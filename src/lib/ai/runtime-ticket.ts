import "server-only"

import { cookies } from "next/headers"

import {
  type RuntimeExplainTicket,
  summarizeTrace,
} from "@/lib/tracing/adapter"
import type { FlowTrace } from "@/types/flow"

import { readAiConfig } from "./config"
import {
  createSession,
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_PATH,
  SESSION_MAX_AGE_SECONDS,
  verifySessionCookie,
} from "./identity"
import { isRuntimeExplainLesson } from "./runtime-lessons"
import { issueTraceToken } from "./trace-token"

/**
 * 「この実行を AI で解説」に使うチケット（要約と署名）を作る。Server Action の中で呼ぶ。
 * - AI 機能が使えない教材・設定では null を返す（デモはそのまま動かす）
 * - 匿名 Cookie がなければ、ここで発行する（実行記録をこの利用者に結び付けるため）
 * - この関数では AI の API を呼ばない。呼ぶのは、利用者がボタンを押したときだけ
 */
export async function issueRuntimeExplainTicket(
  lessonId: string,
  trace: FlowTrace,
): Promise<RuntimeExplainTicket | null> {
  if (!isRuntimeExplainLesson(lessonId)) return null
  const ai = readAiConfig()
  if (ai.status !== "ready") return null
  const { hashSecret } = ai.config

  try {
    const cookieStore = await cookies()
    let sessionId = verifySessionCookie(
      hashSecret,
      cookieStore.get(SESSION_COOKIE_NAME)?.value,
    )
    if (!sessionId) {
      const session = createSession(hashSecret)
      sessionId = session.id
      cookieStore.set(SESSION_COOKIE_NAME, session.cookieValue, {
        path: SESSION_COOKIE_PATH,
        maxAge: SESSION_MAX_AGE_SECONDS,
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      })
    }

    const summary = summarizeTrace(lessonId, trace)
    const token = await issueTraceToken({
      secret: hashSecret,
      sessionId,
      summary,
      now: new Date(),
    })
    return { summary, token }
  } catch (error) {
    // 解説の準備に失敗しても、デモの結果は返す
    console.error("[runtime-ticket] 実行記録の署名に失敗しました", error)
    return null
  }
}
