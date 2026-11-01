/**
 * Server Action（invalidate）が返す state と、ブラウザと共有する定数。
 * "use server" のファイルからは async 関数しか export できないため、このファイルに置く。
 */
export const invalidateMethods = [
  "updateTag",
  "revalidateTag",
  "revalidatePath",
] as const

export type InvalidateMethod = (typeof invalidateMethods)[number]

export function isInvalidateMethod(value: unknown): value is InvalidateMethod {
  return invalidateMethods.some((method) => method === value)
}

export type InvalidateState =
  | { status: "idle"; message: null }
  | { status: "error"; message: string }
  | {
      status: "success"
      message: string
      /** 操作ごとに一意 */
      operationId: string
      method: InvalidateMethod
      /** 失効させる前に読み取った生成ID */
      beforeId: string
    }

export const initialInvalidateState: InvalidateState = {
  status: "idle",
  message: null,
}
