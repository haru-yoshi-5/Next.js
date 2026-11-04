import type { NextRequest } from "next/server"

import { measure } from "@/lib/measure"

import { addMessage, listMessages } from "../message-store"

const TEXT_MAX_LENGTH = 30
const LIMIT_DEFAULT = 3
const LIMIT_MAX = 5
/** 受け付ける本文の最大サイズ（バイト） */
const BODY_MAX_BYTES = 1024

/** サーバーで計測した時間を、ブラウザから読める Server-Timing ヘッダーにする */
function serverTiming(timings: Record<string, number>) {
  return Object.entries(timings)
    .map(([name, ms]) => `${name};dur=${ms.toFixed(1)}`)
    .join(", ")
}

function errorResponse(status: number, error: string, startedAt: number) {
  return Response.json(
    { error },
    {
      status,
      headers: {
        "Server-Timing": serverTiming({
          handler: performance.now() - startedAt,
        }),
      },
    },
  )
}

/**
 * 本文をストリームで読み、バイト数が上限を超えた時点で読むのをやめる。
 * 上限を超えた場合は null を返す。上限内の本文だけを文字列に戻す。
 */
async function readBody(request: Request, maxBytes: number) {
  if (!request.body) return ""

  const reader = request.body.getReader()
  const chunks: Uint8Array[] = []
  let totalBytes = 0

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    totalBytes += value.byteLength
    if (totalBytes > maxBytes) {
      // 中止に失敗しても上限を超えたことに変わりはないため、413 を返せるように失敗は無視する
      await reader.cancel().catch(() => undefined)
      return null
    }
    chunks.push(value)
  }

  const bytes = new Uint8Array(totalBytes)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.byteLength
  }
  return new TextDecoder().decode(bytes)
}

function parseLimit(value: string | null) {
  const limit = Number.parseInt(value ?? "", 10)
  if (Number.isNaN(limit)) return LIMIT_DEFAULT
  return Math.min(Math.max(limit, 1), LIMIT_MAX)
}

/** クライアントの入力は信頼せず、必ずサーバー側で検証する */
function validateText(text: string): string | null {
  if (text.length === 0) return "メッセージを入力してください。"
  if ([...text].length > TEXT_MAX_LENGTH) {
    return `メッセージは${TEXT_MAX_LENGTH}文字以内で入力してください。`
  }
  if (/[\u0000-\u001F\u007F]/.test(text)) {
    return "メッセージに使用できない文字が含まれています。"
  }
  return null
}

/** 本文の JSON から text を取り出す。形が違う場合は空文字として扱う */
function readText(payload: unknown) {
  if (typeof payload !== "object" || payload === null) return ""
  if (!("text" in payload) || typeof payload.text !== "string") return ""
  return payload.text.trim()
}

/**
 * GET /learn/route-handlers/api?limit=3
 * request のプロパティ（nextUrl）を読むため、ビルド時にはプリレンダーされず、リクエストのたびに実行される。
 */
export async function GET(request: NextRequest) {
  const startedAt = performance.now()
  const limit = parseLimit(request.nextUrl.searchParams.get("limit"))

  const { result: messages, durationMs: storeMs } = await measure(() =>
    listMessages(limit),
  )

  return Response.json(
    { messages, limit },
    {
      headers: {
        "Server-Timing": serverTiming({
          store: storeMs,
          handler: performance.now() - startedAt,
        }),
      },
    },
  )
}

/**
 * POST /learn/route-handlers/api
 * 本文は { "text": "..." } の JSON。GET 以外のメソッドはキャッシュされない。
 */
export async function POST(request: NextRequest) {
  const startedAt = performance.now()

  // Content-Length が分かる場合は、本文を読む前に断る
  const contentLength = Number(request.headers.get("content-length") ?? 0)
  if (contentLength > BODY_MAX_BYTES) {
    return errorResponse(413, "リクエストの本文が大きすぎます。", startedAt)
  }

  // Content-Length がない・偽っている場合に備えて、読みながらバイト数でも確かめる
  let raw: string | null
  try {
    raw = await readBody(request, BODY_MAX_BYTES)
  } catch (error) {
    // 送信の途中で接続が切れた場合など。詳細はサーバーのログにだけ残す
    console.error(
      "[route-handlers] リクエストの本文を読み取れませんでした",
      error,
    )
    return errorResponse(
      400,
      "リクエストの本文を読み取れませんでした。",
      startedAt,
    )
  }
  if (raw === null) {
    return errorResponse(413, "リクエストの本文が大きすぎます。", startedAt)
  }

  let payload: unknown
  try {
    payload = JSON.parse(raw)
  } catch {
    return errorResponse(
      400,
      "リクエストの本文を JSON として読み取れませんでした。",
      startedAt,
    )
  }

  const text = readText(payload)
  const validationError = validateText(text)
  if (validationError) return errorResponse(400, validationError, startedAt)

  try {
    const { result: message, durationMs: storeMs } = await measure(() =>
      addMessage(text),
    )
    return Response.json(
      { message },
      {
        status: 201,
        headers: {
          "Server-Timing": serverTiming({
            store: storeMs,
            handler: performance.now() - startedAt,
          }),
        },
      },
    )
  } catch (error) {
    // 詳細はサーバーのログにだけ残し、ブラウザには一般的なメッセージを返す
    console.error("[route-handlers] メッセージの保存に失敗しました", error)
    return errorResponse(
      500,
      "保存中にエラーが発生しました。時間をおいて再度お試しください。",
      startedAt,
    )
  }
}

// PUT や DELETE は定義していない。送られてきた場合は Next.js が 405 Method Not Allowed を返す。
