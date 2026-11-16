import "server-only"

import { readSourceCode } from "@/lib/source-code"
import type { FlowNodeId } from "@/types/flow"

export interface CodeMapEntry {
  id: string
  label: string
  component: string
  path: string
  first: string
  nodes: FlowNodeId[]
}

const serverActionsDirectory = "src/app/learn/server-actions"

const codeMap: Readonly<Record<string, readonly CodeMapEntry[]>> = {
  "server-actions": [
    {
      id: "submit-button",
      label: "保存するボタン",
      component: "NameForm",
      path: `${serverActionsDirectory}/name-form.tsx`,
      first: "async function saveNameWithTiming(",
      nodes: ["client-component"],
    },
    {
      id: "save-result",
      label: "保存結果のメッセージ",
      component: "saveName（Server Action）",
      path: `${serverActionsDirectory}/actions.ts`,
      first: "export async function saveName(",
      nodes: ["server-action"],
    },
    {
      id: "guestbook-list",
      label: "保存された名前の一覧",
      component: "GuestbookList",
      path: `${serverActionsDirectory}/guestbook-list.tsx`,
      first: "export async function GuestbookList() {",
      nodes: ["server-component", "cache"],
    },
  ],
}

export function getCodeMap(lessonId: string): readonly CodeMapEntry[] {
  return Object.hasOwn(codeMap, lessonId) ? codeMap[lessonId] : []
}

export async function readMappedCode(entry: CodeMapEntry) {
  const file = await readSourceCode(entry.path)
  const lines = file.split("\n")
  const start = lines.indexOf(entry.first)
  // 登録対象はトップレベルの関数。整形済みの閉じ括弧は行頭にある。
  const end = lines.indexOf("}", start + 1)
  if (start < 0 || end <= start || lines.lastIndexOf(entry.first) !== start) {
    throw new Error(`コード断片の範囲を特定できません: ${entry.id}`)
  }
  const code = lines.slice(start, end + 1).join("\n")
  if (code.length > 6000) {
    throw new Error(`コード断片が長すぎます: ${entry.id}`)
  }
  return { file, code, start, end }
}
