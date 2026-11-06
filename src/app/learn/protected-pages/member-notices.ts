import "server-only"

import { requireViewer, type ViewerDTO } from "@/lib/auth-demo/dal"
import { measure } from "@/lib/measure"

import { loginHref, type ProtectedPath } from "./return-to"

/** 画面に渡してよい形にした、会員向けのお知らせ（DTO） */
export interface MemberNoticeDTO {
  id: string
  title: string
  body: string
}

export type MemberArea =
  | { status: "unconfigured" }
  | {
      status: "ok"
      viewer: ViewerDTO
      notices: MemberNoticeDTO[]
      /** データソースの読み取りにかかった時間（サーバーで計測） */
      dataMs: number
    }

/**
 * データソース。確認をしないため export せず、readMemberArea() からだけ読む。
 * データベースを使わない教材なので、固定の架空のお知らせを返す。
 */
async function loadMemberNotices(): Promise<MemberNoticeDTO[]> {
  return [
    {
      id: "notice-1",
      title: "会員向けの勉強会（デモ用の架空のお知らせ）",
      body: "次回は Proxy とページでの確認の違いを扱います。",
    },
    {
      id: "notice-2",
      title: "教材の先行公開（デモ用の架空のお知らせ）",
      body: "ログインした人だけが読める、という想定の文章です。",
    },
  ]
}

/**
 * 守られたページの中身を読む。認証の確認は、データを読むこの関数の中で行う。
 * 未ログインなら requireViewer() がログインページへリダイレクトし、データソースは読まない。
 *
 * returnTo はログイン後に戻るページ。許可リストの値（ProtectedPath）だけを受け取る。
 */
export async function readMemberArea(
  returnTo: ProtectedPath,
): Promise<MemberArea> {
  const required = await requireViewer(loginHref(returnTo))
  if (required.status === "unconfigured") return { status: "unconfigured" }

  // 確認を通った場合だけ、データソースを読む
  const { result: notices, durationMs: dataMs } =
    await measure(loadMemberNotices)
  return { status: "ok", viewer: required.viewer, notices, dataMs }
}
