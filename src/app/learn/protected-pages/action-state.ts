/**
 * Server Action が返す state。
 * "use server" のファイルからは async 関数しか export できないため、型と初期値はこのファイルに置く。
 * 成功した場合はリダイレクトや描画し直しで結果が表れるため、失敗したときのメッセージだけを持つ。
 */
export interface AuthActionState {
  error: string | null
}

export const initialAuthActionState: AuthActionState = { error: null }
