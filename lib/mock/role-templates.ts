// 角色模板單一共用來源
// 同時供「角色模板管理頁」（列表 / 新增 / 編輯）與「新增使用者對話框」使用
// 讓角色模板的「層級」設定能真正約束新增使用者時可套用的模板

// 權限值：無權限 / 可檢視 / 可編輯
export type PermissionValue = "none" | "view" | "edit"

export interface PermissionState {
  [key: string]: PermissionValue
}

// 角色模板所屬層級：對應新增使用者頁的「中央 / 醫學會」
export type RoleTemplateLevel = "central" | "society"

export interface RoleTemplate {
  id: string
  name: string
  description: string
  level: RoleTemplateLevel
  isSystem: boolean
  userCount: number
  createdDate: string
  lastModified: string
  permissions: PermissionState
}

// 層級標籤與樣式（供 Badge 呈現）
export const ROLE_TEMPLATE_LEVEL_LABELS: Record<RoleTemplateLevel, string> = {
  central: "中央",
  society: "醫學會",
}

export const ROLE_TEMPLATE_LEVEL_BADGE_CLASS: Record<RoleTemplateLevel, string> = {
  central: "bg-purple-50 text-purple-700 border-purple-200",
  society: "bg-amber-50 text-amber-700 border-amber-200",
}

// 功能模組權限的預設鍵（各模板權限皆以此為準）
const EMPTY_PERMISSIONS: PermissionState = {
  "submission-general": "none",
  "submission-hospital": "none",
  "submission-extra": "none",
  "review-general": "none",
  "review-hospital": "none",
  "review-extra": "none",
  statistics: "none",
  "account-users": "none",
  "account-templates": "none",
  "admin-pending": "none",
  "admin-published": "none",
}

export const ROLE_TEMPLATES: RoleTemplate[] = [
  {
    id: "1",
    name: "一般使用者",
    description: "基本的檢視權限，適用於一般瀏覽者",
    level: "society",
    isSystem: true,
    userCount: 45,
    createdDate: "2025/01/01",
    lastModified: "2025/01/01",
    permissions: {
      ...EMPTY_PERMISSIONS,
      "submission-general": "view",
      "submission-hospital": "view",
      "submission-extra": "view",
      statistics: "view",
    },
  },
  {
    id: "2",
    name: "專科醫學會編輯",
    description: "可填報與編輯各類規範文件，適用於專科醫學會人員",
    level: "society",
    isSystem: true,
    userCount: 28,
    createdDate: "2025/01/01",
    lastModified: "2025/09/15",
    permissions: {
      ...EMPTY_PERMISSIONS,
      "submission-general": "edit",
      "submission-hospital": "edit",
      "submission-extra": "edit",
      statistics: "view",
    },
  },
  {
    id: "3",
    name: "醫策會審查委員",
    description: "可審查各類填報與變更案件，適用於醫策會審查委員",
    level: "central",
    isSystem: true,
    userCount: 12,
    createdDate: "2025/01/01",
    lastModified: "2025/08/20",
    permissions: {
      ...EMPTY_PERMISSIONS,
      "submission-general": "view",
      "submission-hospital": "view",
      "submission-extra": "view",
      "review-general": "edit",
      "review-hospital": "edit",
      "review-extra": "edit",
      statistics: "view",
    },
  },
  {
    id: "4",
    name: "醫事司承辦",
    description: "擁有公告管理與後台操作權限，適用於醫事司承辦人員",
    level: "central",
    isSystem: true,
    userCount: 8,
    createdDate: "2025/01/01",
    lastModified: "2025/10/01",
    permissions: {
      ...EMPTY_PERMISSIONS,
      "submission-general": "view",
      "submission-hospital": "view",
      "submission-extra": "view",
      "review-general": "view",
      "review-hospital": "view",
      "review-extra": "view",
      statistics: "edit",
      "account-users": "view",
      "admin-pending": "edit",
      "admin-published": "edit",
    },
  },
  {
    id: "5",
    name: "系統管理員",
    description: "擁有所有功能的完整權限，適用於系統管理人員",
    level: "central",
    isSystem: true,
    userCount: 3,
    createdDate: "2025/01/01",
    lastModified: "2025/01/01",
    permissions: {
      "submission-general": "edit",
      "submission-hospital": "edit",
      "submission-extra": "edit",
      "review-general": "edit",
      "review-hospital": "edit",
      "review-extra": "edit",
      statistics: "edit",
      "account-users": "edit",
      "account-templates": "edit",
      "admin-pending": "edit",
      "admin-published": "edit",
    },
  },
  {
    id: "6",
    name: "外部審查委員",
    description: "僅可審查特定類型的案件，適用於外部專家",
    level: "society",
    isSystem: false,
    userCount: 15,
    createdDate: "2025/03/10",
    lastModified: "2025/09/28",
    permissions: {
      ...EMPTY_PERMISSIONS,
      "submission-general": "view",
      "review-general": "edit",
    },
  },
]

export function getRoleTemplateById(id: string): RoleTemplate | undefined {
  return ROLE_TEMPLATES.find((template) => template.id === id)
}

export function getRoleTemplatesByLevel(level: RoleTemplateLevel): RoleTemplate[] {
  return ROLE_TEMPLATES.filter((template) => template.level === level)
}
