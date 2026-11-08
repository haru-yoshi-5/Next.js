/**
 * 守られたページと、ログイン後の戻り先。
 * Proxy・Server Component・Server Action・ブラウザのどこからも使うため、server-only にしない。
 */

export const BASE_PATH = "/learn/protected-pages"
export const LOGIN_PATH = `${BASE_PATH}/login`

/** 守られたページ。ログイン後に戻ってよいのは、この2つだけ */
export const PROTECTED_PAGES = {
  /** ページ（Server Component）で確かめて守る */
  members: `${BASE_PATH}/members`,
  /** Proxy とページの両方で確かめて守る */
  proxied: `${BASE_PATH}/proxied`,
} as const

export type ProtectedPageKey = keyof typeof PROTECTED_PAGES
export type ProtectedPath = (typeof PROTECTED_PAGES)[ProtectedPageKey]

const ALLOWED_PATHS: readonly string[] = Object.values(PROTECTED_PAGES)

/** 戻り先が指定されていない、または許可されていない場合に戻るページ */
const DEFAULT_RETURN_TO: ProtectedPath = PROTECTED_PAGES.members

function isProtectedPath(value: string): value is ProtectedPath {
  return ALLOWED_PATHS.includes(value)
}

export interface ReturnTo {
  path: ProtectedPath
  /** 値が届いたが、許可リストになかった */
  rejected: boolean
}

/**
 * ログイン後の戻り先（?next= やフォームの値）を確かめる。
 * 外部サイトへ移動させる「オープンリダイレクト」を防ぐため、許可リストと完全に一致する値だけを受け付ける。
 * startsWith() などの前方一致では、似た名前のパス・".."・エンコードした文字を防ぎきれないため使わない。
 */
export function parseReturnTo(value: unknown): ReturnTo {
  if (typeof value === "string" && isProtectedPath(value)) {
    return { path: value, rejected: false }
  }
  const received = typeof value === "string" && value !== ""
  return { path: DEFAULT_RETURN_TO, rejected: received }
}

/** ログインページの URL。戻り先は許可リストの値だけを受け取る */
export function loginHref(returnTo: ProtectedPath): string {
  return `${LOGIN_PATH}?next=${encodeURIComponent(returnTo)}`
}
