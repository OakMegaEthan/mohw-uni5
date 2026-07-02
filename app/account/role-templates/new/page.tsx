"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Save } from "lucide-react"
import Link from "next/link"
import { RoleTemplateModules } from "@/components/account/role-template-modules"
import {
  ROLE_TEMPLATE_LEVEL_LABELS,
  type PermissionState,
  type PermissionValue,
  type RoleTemplateLevel,
} from "@/lib/mock/role-templates"

export default function NewRoleTemplatePage() {
  const [level, setLevel] = useState<RoleTemplateLevel>("central")
  const [permissions, setPermissions] = useState<PermissionState>({})

  // 切換層級時，各層級可設定的模組不同，重置已設定的權限避免殘留無效組合
  const handleLevelChange = (value: RoleTemplateLevel) => {
    setLevel(value)
    setPermissions({})
  }

  const handlePermissionChange = (key: string, value: PermissionValue) => {
    setPermissions((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* 返回連結 */}
        <Link
          href="/account/role-templates"
          className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          返回角色模板管理
        </Link>

        {/* 頁面標題 */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">新增角色模板</h1>
            <p className="text-sm text-muted-foreground mt-1">建立新的角色權限模板</p>
          </div>
          <div className="flex gap-2">
            <Link href="/account/role-templates">
              <Button variant="outline">取消</Button>
            </Link>
            <Button>
              <Save className="h-4 w-4 mr-2" />
              儲存模板
            </Button>
          </div>
        </div>

        {/* 基本資訊 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>基本資訊</CardTitle>
            <CardDescription>設定角色模板的名稱與說明</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                角色名稱 <span className="text-red-500">*</span>
              </Label>
              <Input id="name" placeholder="例如：專科醫學會編輯" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="level">
                層級 <span className="text-red-500">*</span>
              </Label>
              <Select value={level} onValueChange={(value) => handleLevelChange(value as RoleTemplateLevel)}>
                <SelectTrigger id="level" className="w-60">
                  <SelectValue placeholder="請選擇層級" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="central">{ROLE_TEMPLATE_LEVEL_LABELS.central}</SelectItem>
                  <SelectItem value="society">{ROLE_TEMPLATE_LEVEL_LABELS.society}</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                層級決定此模板可套用的使用者範圍，並影響下方可設定的功能模組。
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">角色說明</Label>
              <Textarea id="description" placeholder="描述此角色的用途與適用對象..." rows={3} />
            </div>
          </CardContent>
        </Card>

        {/* 功能模組權限 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>功能模組權限</CardTitle>
            <CardDescription>依所選層級設定此角色在各功能模組的操作權限</CardDescription>
          </CardHeader>
          <CardContent>
            <RoleTemplateModules level={level} permissions={permissions} onChange={handlePermissionChange} />
          </CardContent>
        </Card>

        {/* 底部操作按鈕 */}
        <div className="flex justify-end gap-2">
          <Link href="/account/role-templates">
            <Button variant="outline">取消</Button>
          </Link>
          <Button>
            <Save className="h-4 w-4 mr-2" />
            儲存模板
          </Button>
        </div>
      </div>
    </div>
  )
}
