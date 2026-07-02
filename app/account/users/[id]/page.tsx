"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, User, Shield, History, Save, AlertCircle, Power } from "lucide-react"
import Link from "next/link"
import { RoleTemplateModules } from "@/components/account/role-template-modules"
import {
  getRoleTemplateById,
  getRoleTemplatesByLevel,
  type PermissionState,
  type PermissionValue,
} from "@/lib/mock/role-templates"
import {
  USERS,
  getUserById,
  getUserLevelGroup,
  USER_LEVEL_BADGE_CLASS,
  type UserStatus,
} from "@/lib/mock/users"

// 權限變更歷史（採用目前的功能模組命名）
const permissionHistory = [
  {
    date: "2026/04/10 14:30",
    operator: "張大明",
    action: "新增「填報專區 - 文件填報」編輯權限",
  },
  {
    date: "2026/04/10 14:28",
    operator: "張大明",
    action: "變更「統計專區」匯出權限為「僅 PDF」",
  },
  {
    date: "2026/03/15 10:20",
    operator: "李小華",
    action: "套用角色模板並配置對應權限",
  },
  {
    date: "2026/02/01 09:00",
    operator: "系統管理員",
    action: "建立帳號",
  },
]

export default function UserPermissionPage() {
  const params = useParams<{ id: string }>()
  // 依 id 從共用來源取得使用者，找不到時退回第一筆
  const user = getUserById(params.id) ?? USERS[0]

  // 使用者層級（醫事司 / 醫策會 / 醫學會）對應到模組 / 模板層級（中央 / 醫學會）
  const levelGroup = getUserLevelGroup(user.level)
  const availableTemplates = getRoleTemplatesByLevel(levelGroup)
  const initialTemplate = getRoleTemplateById(user.roleTemplateId)

  const [status, setStatus] = useState<UserStatus>(user.status)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    availableTemplates.some((t) => t.id === user.roleTemplateId) ? user.roleTemplateId : "",
  )
  const [permissions, setPermissions] = useState<PermissionState>(initialTemplate?.permissions ?? {})

  const isActive = status === "active"

  const handleToggleStatus = () => {
    setStatus((prev) => (prev === "active" ? "inactive" : "active"))
  }

  const handleApplyTemplate = () => {
    const template = getRoleTemplateById(selectedTemplateId)
    if (template) {
      setPermissions(template.permissions)
    }
  }

  const handlePermissionChange = (key: string, value: PermissionValue) => {
    setPermissions((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* 返回按鈕 */}
        <Link
          href="/account/users"
          className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          返回使用者列表
        </Link>

        {/* 頁面標題 */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">使用者權限設定</h1>
          <p className="text-sm text-muted-foreground mt-1">設定使用者在系統各功能模組的存取權限與操作範圍</p>
        </div>

        <div className="flex flex-col gap-6">
          {/* 使用者基本資訊 */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                <CardTitle>使用者資訊</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">姓名</p>
                  <p className="font-medium">{user.name}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">帳號</p>
                  <p className="font-medium">{user.email}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">層級</p>
                  <Badge variant="outline" className={USER_LEVEL_BADGE_CLASS[user.level]}>
                    {user.level}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">所屬單位</p>
                  <p className="font-medium">{user.organization}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">帳號狀態</p>
                  <div className="flex items-center gap-3">
                    {isActive ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        啟用中
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                        已停用
                      </Badge>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleToggleStatus}
                      className={
                        isActive
                          ? "text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                          : "text-green-700 hover:text-green-800 hover:bg-green-50 border-green-200"
                      }
                    >
                      <Power className="h-4 w-4 mr-2" />
                      {isActive ? "停用帳號" : "啟用帳號"}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 快速套用角色模板 */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                    <Shield className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
                <div className="flex-1 space-y-3">
                  <div>
                    <p className="text-sm font-medium text-blue-900">快速套用角色模板</p>
                    <p className="text-sm text-blue-700 mt-1">
                      僅顯示適用於「{levelGroup === "central" ? "中央" : "醫學會"}」層級的角色模板，套用後將自動配置對應的權限設定
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                      <SelectTrigger className="w-[220px] bg-white">
                        <SelectValue placeholder="請選擇角色模板" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableTemplates.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button size="sm" variant="outline" className="bg-white" onClick={handleApplyTemplate} disabled={!selectedTemplateId}>
                      套用模板
                    </Button>
                    <Button size="sm" variant="ghost" asChild>
                      <Link href="/account/role-templates">管理模板</Link>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 功能模組權限設定 */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <CardTitle>功能模組權限</CardTitle>
              </div>
              <CardDescription>依使用者層級設定其在各功能模組的操作權限層級與特殊權限</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 權限層級說明 */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="space-y-2 text-sm">
                    <p className="font-medium text-blue-900">權限層級說明</p>
                    <ul className="text-blue-700 space-y-1 text-sm">
                      <li>
                        <span className="font-medium">無權限</span>：無法存取此功能
                      </li>
                      <li>
                        <span className="font-medium">可檢視</span>：僅能瀏覽內容，無法進行任何編輯
                      </li>
                      <li>
                        <span className="font-medium">可編輯</span>
                        ：可建立、編輯內容，但無法進行審查或核准（審查功能在「審查專區」獨立管理）
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <RoleTemplateModules level={levelGroup} permissions={permissions} onChange={handlePermissionChange} />
            </CardContent>
          </Card>

          {/* 權限變更歷史 */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-primary" />
                <CardTitle className="text-base">權限變更歷史</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {permissionHistory.map((record, index) => (
                <div key={index} className="space-y-1 pb-4 border-b last:border-0 last:pb-0">
                  <p className="text-sm font-medium">{record.action}</p>
                  <p className="text-sm text-muted-foreground">
                    {record.date} 由 {record.operator}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* 儲存按鈕 */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" asChild>
              <Link href="/account/users">取消</Link>
            </Button>
            <Button>
              <Save className="h-4 w-4 mr-2" />
              儲存變更
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
