import { LessonPage } from "@/components/learning/lesson-page"
import { serverActionsLesson } from "@/content/lessons/server-actions"
import { readAiConfig } from "@/lib/ai/config"
import { getCodeMap, readMappedCode } from "@/lib/learning/code-map"
import { createLessonMetadata } from "@/lib/lesson-metadata"
import { highlightSourceCode, resolveRuntime } from "@/lib/source-code"

import { GuestbookList } from "./guestbook-list"
import { NameForm } from "./name-form"

export const metadata = createLessonMetadata(serverActionsLesson)

async function getXRayEntries() {
  "use cache"

  return Promise.all(
    getCodeMap(serverActionsLesson.slug).map(async (entry) => {
      const file = serverActionsLesson.sourceFiles.find(
        (file) => file.path === entry.path,
      )
      if (!file)
        throw new Error(`教材の公開ソースが見つかりません: ${entry.id}`)
      const { file: code, start, end } = await readMappedCode(entry)
      const source = await highlightSourceCode(entry.path, code)
      return {
        id: entry.id,
        label: entry.label,
        component: entry.component,
        nodes: entry.nodes,
        source: { ...source, lines: source.lines.slice(start, end + 1) },
        runtime: resolveRuntime(source.directive, file),
        firstLine: start + 1,
      }
    }),
  )
}

export default async function ServerActionsPage() {
  const xRayEntries = await getXRayEntries()
  return (
    <LessonPage
      lesson={serverActionsLesson}
      demo={
        // GuestbookList（Server Component）を Client Component の props として渡す。
        // Server Action の完了後は、更新された一覧が同じ応答に含まれて差し替わる。
        <NameForm
          list={<GuestbookList />}
          xRayEntries={xRayEntries}
          isAiAvailable={readAiConfig().status === "ready"}
        />
      }
    />
  )
}
