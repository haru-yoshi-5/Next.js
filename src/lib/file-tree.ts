export interface FileTreeFolder<T> {
  kind: "folder"
  name: string
  children: FileTreeNode<T>[]
}

export interface FileTreeFile<T> {
  kind: "file"
  name: string
  data: T
}

export type FileTreeNode<T> = FileTreeFolder<T> | FileTreeFile<T>

/**
 * "src/app/learn/page.tsx" のようなパスの一覧からツリー構造を作る。
 * フォルダ → ファイルの順、同種内は入力順を維持する。
 */
export function buildFileTree<T>(
  entries: { path: string; data: T }[],
): FileTreeNode<T>[] {
  const root: FileTreeFolder<T> = { kind: "folder", name: "", children: [] }

  for (const entry of entries) {
    const segments = entry.path.split("/")
    const fileName = segments.pop()
    if (!fileName) continue

    let current = root
    for (const segment of segments) {
      let folder = current.children.find(
        (child): child is FileTreeFolder<T> =>
          child.kind === "folder" && child.name === segment,
      )
      if (!folder) {
        folder = { kind: "folder", name: segment, children: [] }
        current.children.push(folder)
      }
      current = folder
    }
    current.children.push({ kind: "file", name: fileName, data: entry.data })
  }

  const sortFolder = (folder: FileTreeFolder<T>) => {
    folder.children.sort((a, b) =>
      a.kind === b.kind ? 0 : a.kind === "folder" ? -1 : 1,
    )
    folder.children.forEach((child) => {
      if (child.kind === "folder") sortFolder(child)
    })
  }
  sortFolder(root)

  return root.children
}
