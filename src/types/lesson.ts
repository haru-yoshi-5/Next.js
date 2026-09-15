/** コードが実行される環境 */
export type Runtime = "server" | "client"

export type LessonStatus = "available" | "planned"

export interface CurriculumLesson {
  slug: string
  title: string
  status: LessonStatus
  /** 教材カード等に表示する1文の要約（公開済み教材のみ） */
  summary?: string
  /** その教材の主役となる実行環境 */
  runtimes?: Runtime[]
}

export interface Chapter {
  id: string
  /** 表示用の章番号（"01" など） */
  number: string
  title: string
  lessons: CurriculumLesson[]
}
