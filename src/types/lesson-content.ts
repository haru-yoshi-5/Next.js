import type { Runtime } from "@/types/lesson"

/**
 * 教材本文のブロック。
 * 文字列中の `バッククォート` はインラインコードとして表示される。
 */
export type ContentBlock =
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[]; ordered?: boolean }
  | { type: "callout"; tone: "note" | "caution"; title: string; text: string }
  | {
      type: "comparison"
      columns: [ComparisonColumn, ComparisonColumn]
    }

export interface ComparisonColumn {
  runtime: Runtime
  title: string
  items: string[]
}

export interface LessonSection {
  id: string
  title: string
  blocks: ContentBlock[]
}

/** 教材で参照するソースファイル（プロジェクトルートからの相対パス） */
export interface LessonFile {
  path: string
  /** "Server Component" / "Server Action" などの役割 */
  role: string
  description: string
  /**
   * ディレクティブを持たないファイルの実行環境を明示する場合に指定する。
   * 例: "use client" のファイルから import される共通コンポーネントは client になる。
   * ファイル先頭に "use client" / "use server" がある場合はそちらが優先される。
   */
  runtime?: Runtime
  /** runtime を明示した理由（Inside This Page に表示） */
  runtimeReason?: string
}

export interface PageFeature {
  name: string
  description: string
}

export interface LessonContent {
  slug: string
  title: string
  /** タイトル直下の簡潔な説明 */
  lead: string
  /** 「この教材でわかること」 */
  keyPoints: string[]
  /** 詳細解説 */
  sections: LessonSection[]
  demo: {
    description: string
    /** 操作手順 */
    steps: string[]
  }
  /** Source Code タブに表示するファイル */
  sourceFiles: LessonFile[]
  /** Inside This Page */
  inside: {
    files: LessonFile[]
    features: PageFeature[]
  }
  /** 関連教材の slug */
  related: string[]
}
