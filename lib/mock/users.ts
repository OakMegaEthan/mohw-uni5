// 使用者管理單一共用來源
// 供「使用者列表」與「使用者權限設定編輯頁」共用
// 使用者層級（醫事司 / 醫策會 / 醫學會）對應到角色模板 / 功能模組的層級（中央 / 醫學會）

import type { RoleTemplateLevel } from "@/lib/mock/role-templates"

// 使用者所屬層級
export type UserLevel = "醫事司" | "醫策會" | "醫學會"

// 帳號狀態
export type UserStatus = "active" | "inactive"

export interface ManagedUser {
  id: string
  name: string
  email: string
  level: UserLevel
  organization: string
  status: UserStatus
  lastLogin: string
  // 目前套用的角色模板 id（對應 ROLE_TEMPLATES）
  roleTemplateId: string
}

// 層級對應的 Badge 樣式
export const USER_LEVEL_BADGE_CLASS: Record<UserLevel, string> = {
  醫事司: "bg-purple-50 text-purple-700 border-purple-200",
  醫策會: "bg-blue-50 text-blue-700 border-blue-200",
  醫學會: "bg-amber-50 text-amber-700 border-amber-200",
}

// 層級預設排序順序：醫事司 -> 醫策會 -> 醫學會
export const USER_LEVEL_SORT_ORDER: Record<UserLevel, number> = {
  醫事司: 0,
  醫策會: 1,
  醫學會: 2,
}

// 使用者層級 -> 角色模板 / 功能模組層級
// 醫事司、醫策會屬中央；醫學會屬醫學會
export function getUserLevelGroup(level: UserLevel): RoleTemplateLevel {
  return level === "醫學會" ? "society" : "central"
}

export const USERS: ManagedUser[] = [
  {
    id: "1",
    name: "王小明",
    email: "wang.xiaoming@mohw.gov.tw",
    level: "醫事司",
    organization: "衛生福利部醫事司",
    status: "active",
    lastLogin: "2026/04/22 09:30",
    roleTemplateId: "4",
  },
  {
    id: "2",
    name: "李小華",
    email: "li.xiaohua@tjcha.org.tw",
    level: "醫策會",
    organization: "財團法人醫院評鑑暨醫療品質策進會",
    status: "active",
    lastLogin: "2026/04/21 14:20",
    roleTemplateId: "3",
  },
  {
    id: "3",
    name: "張大明",
    email: "zhang.daming@ima.org.tw",
    level: "醫學會",
    organization: "中華民國內科醫學會",
    status: "active",
    lastLogin: "2026/04/22 08:15",
    roleTemplateId: "2",
  },
  {
    id: "5",
    name: "林志明",
    email: "lin.zhiming@surgery.org.tw",
    level: "醫學會",
    organization: "台灣外科醫學會",
    status: "active",
    lastLogin: "2026/04/20 11:30",
    roleTemplateId: "1",
  },
  {
    id: "7",
    name: "吳淑芬",
    email: "wu.shufen@tjcha.org.tw",
    level: "醫策會",
    organization: "財團法人醫院評鑑暨醫療品質策進會",
    status: "inactive",
    lastLogin: "2026/03/28 16:45",
    roleTemplateId: "3",
  },
]

export function getUserById(id: string): ManagedUser | undefined {
  return USERS.find((user) => user.id === id)
}

export function getSortedUsers(): ManagedUser[] {
  return [...USERS].sort(
    (a, b) => (USER_LEVEL_SORT_ORDER[a.level] ?? 99) - (USER_LEVEL_SORT_ORDER[b.level] ?? 99),
  )
}
