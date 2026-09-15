import "server-only"

import { readFile } from "node:fs/promises"
import path from "node:path"

import { cacheLife } from "next/cache"
import { type BundledLanguage, codeToTokens } from "shiki"

import type { Runtime } from "@/types/lesson"
import type { LessonFile } from "@/types/lesson-content"

export interface CodeToken {
  content: string
  color?: string
  darkColor?: string
  fontStyle?: "italic"
}

export type Directive = "use client" | "use server" | null

export interface HighlightedSource {
  path: string
  fileName: string
  lines: CodeToken[][]
  directive: Directive
}

const SOURCE_PREFIX = "src/"

const languageByExtension: Record<string, BundledLanguage> = {
  ".ts": "typescript",
  ".tsx": "tsx",
  ".css": "css",
}

/**
 * src/ 配下以外のファイルは読み込まない。
 * パスの起点を静的に "src" へ固定することで、バンドラーのファイルトレース範囲も src/ に限定される。
 */
function resolveSourcePath(relativePath: string) {
  const withinSrc = path.posix.normalize(
    relativePath.replace(/\\/g, "/").slice(SOURCE_PREFIX.length),
  )
  if (
    !relativePath.startsWith(SOURCE_PREFIX) ||
    withinSrc.startsWith("..") ||
    path.posix.isAbsolute(withinSrc)
  ) {
    throw new Error(`src/ 以外のファイルは表示できません: ${relativePath}`)
  }
  return path.join(process.cwd(), "src", withinSrc)
}

/**
 * ファイル先頭（コメント・空行を除く最初の文）のディレクティブを読み取る。
 * "use client" / "use server" はファイルの先頭にある場合のみ有効なため、同じ規則で判定する。
 */
export function detectDirective(code: string): Directive {
  const withoutComments = code
    .replace(/^﻿/, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== "" && !line.startsWith("//"))

  const match = withoutComments[0]?.match(/^(["'])(use client|use server)\1;?$/)
  return match ? (match[2] as Exclude<Directive, null>) : null
}

/**
 * 実際のソースファイルを読み込み、シンタックスハイライト済みのトークンを返す。
 *
 * - "use cache" によりビルド時（プリレンダー時）に一度だけ実行され、結果が静的シェルに含まれる。
 * - 表示用のコードを別に持たず実装ファイルそのものを読むため、デモと表示内容がズレない。
 * - トークンをデータとして返し JSX で描画するので、dangerouslySetInnerHTML を使わない。
 */
export async function getHighlightedSource(
  relativePath: string,
): Promise<HighlightedSource> {
  "use cache"
  cacheLife("max")

  const code = (await readFile(resolveSourcePath(relativePath), "utf8"))
    .replace(/\r\n/g, "\n")
    .trimEnd()
  const lang = languageByExtension[path.extname(relativePath)] ?? "tsx"

  const { tokens } = await codeToTokens(code, {
    lang,
    themes: { light: "github-light", dark: "github-dark" },
  })

  return {
    path: relativePath,
    fileName: path.basename(relativePath),
    directive: detectDirective(code),
    lines: tokens.map((line) =>
      line.map((token) => ({
        content: token.content,
        color: token.htmlStyle?.color ?? token.color,
        darkColor: token.htmlStyle?.["--shiki-dark"],
        fontStyle:
          token.htmlStyle?.["font-style"] === "italic" ? "italic" : undefined,
      })),
    ),
  }
}

export interface ResolvedRuntime {
  runtime: Runtime
  /** 判定の根拠（UI に表示する） */
  basis: string
}

/** ディレクティブと教材データから、ファイルの実行環境を決める */
export function resolveRuntime(
  directive: Directive,
  file: Pick<LessonFile, "runtime" | "runtimeReason">,
): ResolvedRuntime {
  if (directive === "use client") {
    return { runtime: "client", basis: 'ファイル先頭の "use client"' }
  }
  if (directive === "use server") {
    return {
      runtime: "server",
      basis: 'ファイル先頭の "use server"（Server Functions）',
    }
  }
  if (file.runtime) {
    return {
      runtime: file.runtime,
      basis: file.runtimeReason ?? "教材データで指定",
    }
  }
  return {
    runtime: "server",
    basis: "ディレクティブなし（App Router では既定で Server）",
  }
}
