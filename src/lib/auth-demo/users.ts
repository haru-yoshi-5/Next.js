import "server-only"

/**
 * 認証デモ（Authentication 章の教材）で使う、固定のデモユーザーと権限。
 * サイト全体のログインではない。データベースを使わず、コードの中に定義している。
 */

export type DemoRole = "member" | "admin"

export interface DemoUser {
  id: string
  name: string
  role: DemoRole
}

/** 権限が必要な操作 */
export type DemoPermission = "view-profile" | "publish-announcement"

export const ROLE_LABEL: Record<DemoRole, string> = {
  member: "一般ユーザー",
  admin: "管理者",
}

const DEMO_USERS: readonly DemoUser[] = [
  { id: "member-tanaka", name: "田中", role: "member" },
  { id: "admin-sato", name: "佐藤", role: "admin" },
]

/** ロールごとに許可する操作。認可のルールはここだけに書く */
const PERMISSIONS: Record<DemoRole, readonly DemoPermission[]> = {
  member: ["view-profile"],
  admin: ["view-profile", "publish-announcement"],
}

export function listDemoUsers(): readonly DemoUser[] {
  return DEMO_USERS
}

export function findDemoUser(id: string): DemoUser | null {
  return DEMO_USERS.find((user) => user.id === id) ?? null
}

/** 認可: そのユーザーに操作が許可されているか */
export function can(user: DemoUser, permission: DemoPermission): boolean {
  return PERMISSIONS[user.role].includes(permission)
}
