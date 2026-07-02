"use client"

import type React from "react"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { ChevronDown, ChevronUp } from "lucide-react"
import { getRoleTemplatesByLevel, getRoleTemplateById } from "@/lib/mock/role-templates"

// 單位選項資料
const organizationOptions = {
  central: [
    { value: "medical-affairs", label: "醫事司" },
    { value: "jct", label: "醫策會" },
    { value: "mohw-other", label: "衛生福利部其他單位" },
  ],
  society: [
    { value: "internal-medicine", label: "台灣內科醫學會" },
    { value: "surgery", label: "台灣外科醫學會" },
    { value: "pediatrics", label: "台灣小兒科醫學會" },
    { value: "obstetrics", label: "台灣婦產科醫學會" },
    { value: "orthopedics", label: "台灣骨科醫學會" },
    { value: "ophthalmology", label: "台灣眼科醫學會" },
    { value: "otolaryngology", label: "台灣耳鼻喉科醫學會" },
    { value: "dermatology", label: "台灣皮膚科醫學會" },
  ],
}

interface AddUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface PermissionState {
  [key: string]: string
}

interface ExportPermissions {
  pdf: boolean
  word: boolean
}

export function AddUserDialog({ open, onOpenChange }: AddUserDialogProps) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [orgLevel, setOrgLevel] = useState<"central" | "society">("central")
  const [organization, setOrganization] = useState("")
  const [roleTemplate, setRoleTemplate] = useState("")
  const [showPermissions, setShowPermissions] = useState(false)
  const [permissions, setPermissions] = useState<PermissionState>({})
  const [exportPermissions, setExportPermissions] = useState<ExportPermissions>({
    pdf: true,
    word: true,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("[v0] Creating user:", {
      name,
      email,
      orgLevel,
      organization,
      roleTemplate,
      permissions,
      exportPermissions,
    })
    // 重置表單
    setName("")
    setEmail("")
    setOrgLevel("central")
    setOrganization("")
    setRoleTemplate("")
    setShowPermissions(false)
    setPermissions({})
    setExportPermissions({ pdf: true, word: true })
    onOpenChange(false)
  }

  // 依所選層級篩選可套用的角色模板（模板的層級限制了它可套用的使用者範圍）
  const availableTemplates = getRoleTemplatesByLevel(orgLevel)

  // 當層級改變時，重置單位選擇；先前選的模板可能不屬於新層級，一併重置模板與權限
  const handleOrgLevelChange = (value: "central" | "society") => {
    setOrgLevel(value)
    setOrganization("")
    setRoleTemplate("")
    setPermissions({})
    setShowPermissions(false)
  }

  const handleRoleTemplateChange = (value: string) => {
    setRoleTemplate(value)
    const template = getRoleTemplateById(value)
    if (template) {
      setPermissions(template.permissions)
    }
  }

  const handlePermissionChange = (key: string, value: string) => {
    setPermissions((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>新增使用者</DialogTitle>
          <DialogDescription>
            建立新的使用者帳號。系統將發送驗證信至指定的 Email 信箱，帳號狀態將為「待啟用」直到使用者完成驗證。
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 基本資訊 */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                姓名 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="請輸入姓名"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="請輸入 Email"
                required
              />
            </div>
          </div>

          {/* 所屬單位 */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>
                層級 <span className="text-red-500">*</span>
              </Label>
              <Select value={orgLevel} onValueChange={handleOrgLevelChange} required>
                <SelectTrigger>
                  <SelectValue placeholder="請選擇層級" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="central">中央</SelectItem>
                  <SelectItem value="society">醫學會</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="organization">
                單位 <span className="text-red-500">*</span>
              </Label>
              <Select value={organization} onValueChange={setOrganization} required>
                <SelectTrigger>
                  <SelectValue placeholder="請選擇單位" />
                </SelectTrigger>
                <SelectContent>
                  {organizationOptions[orgLevel].map((org) => (
                    <SelectItem key={org.value} value={org.value}>
                      {org.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 套用角色模板 */}
          <div className="space-y-2">
            <Label htmlFor="roleTemplate">
              套用角色模板 <span className="text-red-500">*</span>
            </Label>
            <Select value={roleTemplate} onValueChange={handleRoleTemplateChange} required>
              <SelectTrigger>
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
            <p className="text-sm text-muted-foreground">僅顯示適用於「{orgLevel === "central" ? "中央" : "醫學會"}」層級的角色模板。</p>
          </div>

          {/* 展開查看詳細權限 */}
          {roleTemplate && (
            <Collapsible open={showPermissions} onOpenChange={setShowPermissions}>
              <CollapsibleTrigger asChild>
                <Button type="button" variant="outline" className="w-full bg-transparent">
                  {showPermissions ? (
                    <>
                      <ChevronUp className="h-4 w-4 mr-2" />
                      收起權限設定
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4 mr-2" />
                      展開調整權限設定
                    </>
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4 space-y-4">
                <div className="rounded-lg border p-4 space-y-6">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm">功能模組權限設定</h4>
                    <p className="text-xs text-muted-foreground">可在角色模板基礎上進行調整</p>
                  </div>

                  {/* 填報專區 */}
                  <div className="space-y-4">
                    <h5 className="text-sm font-medium">填報專區</h5>
                    <div className="space-y-4 pl-4">
                      <PermissionRadioGroup
                        label="一般填報申請"
                        description="包含：甄審原則、訓練醫院認定基準、訓練課程基準、評核標準、容額分配原則"
                        value={permissions["submission-general"] || "none"}
                        onChange={(value) => handlePermissionChange("submission-general", value)}
                      />
                      <PermissionRadioGroup
                        label="醫院與容額分配填報"
                        value={permissions["submission-hospital"] || "none"}
                        onChange={(value) => handlePermissionChange("submission-hospital", value)}
                      />
                      <PermissionRadioGroup
                        label="外加容額填報"
                        value={permissions["submission-extra"] || "none"}
                        onChange={(value) => handlePermissionChange("submission-extra", value)}
                      />
                    </div>
                  </div>

                  {/* 審查專區 */}
                  <div className="space-y-4">
                    <h5 className="text-sm font-medium">審查專區</h5>
                    <div className="space-y-4 pl-4">
                      <PermissionRadioGroup
                        label="一般填報審查"
                        description="包含：甄審原則、訓練醫院認定基準、訓練課程基準、評核標準、容額分配原則"
                        value={permissions["review-general"] || "none"}
                        onChange={(value) => handlePermissionChange("review-general", value)}
                      />
                      <PermissionRadioGroup
                        label="醫院與容額分配審查"
                        value={permissions["review-hospital"] || "none"}
                        onChange={(value) => handlePermissionChange("review-hospital", value)}
                      />
                      <PermissionRadioGroup
                        label="外加容額審查"
                        value={permissions["review-extra"] || "none"}
                        onChange={(value) => handlePermissionChange("review-extra", value)}
                      />
                    </div>
                  </div>

                  {/* 統計專區 */}
                  <div className="space-y-4">
                    <h5 className="text-sm font-medium">統計專區</h5>
                    <div className="space-y-4 pl-4">
                      <PermissionRadioGroup
                        label="統計資料檢視"
                        value={permissions["statistics"] || "none"}
                        onChange={(value) => handlePermissionChange("statistics", value)}
                      />
                      <div className="space-y-2 pl-4">
                        <Label className="text-sm text-muted-foreground">匯出格式權限</Label>
                        <div className="flex gap-4">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="export-pdf"
                              checked={exportPermissions.pdf}
                              onCheckedChange={(checked) =>
                                setExportPermissions((prev) => ({ ...prev, pdf: checked as boolean }))
                              }
                            />
                            <label htmlFor="export-pdf" className="text-sm cursor-pointer">
                              PDF
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="export-word"
                              checked={exportPermissions.word}
                              onCheckedChange={(checked) =>
                                setExportPermissions((prev) => ({ ...prev, word: checked as boolean }))
                              }
                            />
                            <label htmlFor="export-word" className="text-sm cursor-pointer">
                              Word
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 帳號管理 */}
                  <div className="space-y-4">
                    <h5 className="text-sm font-medium">帳號管理</h5>
                    <div className="space-y-4 pl-4">
                      <PermissionRadioGroup
                        label="使用者管理"
                        value={permissions["account-users"] || "none"}
                        onChange={(value) => handlePermissionChange("account-users", value)}
                      />
                      <PermissionRadioGroup
                        label="角色模板管理"
                        value={permissions["account-templates"] || "none"}
                        onChange={(value) => handlePermissionChange("account-templates", value)}
                      />
                    </div>
                  </div>

                  {/* 後台機能 */}
                  <div className="space-y-4">
                    <h5 className="text-sm font-medium">後台機能</h5>
                    <div className="space-y-4 pl-4">
                      <PermissionRadioGroup
                        label="待發佈管理"
                        value={permissions["admin-pending"] || "none"}
                        onChange={(value) => handlePermissionChange("admin-pending", value)}
                      />
                      <PermissionRadioGroup
                        label="已發佈管理"
                        value={permissions["admin-published"] || "none"}
                        onChange={(value) => handlePermissionChange("admin-published", value)}
                      />
                    </div>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button type="submit">建立帳號</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function PermissionRadioGroup({
  label,
  description,
  value,
  onChange,
}: {
  label: string
  description?: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="space-y-2">
      <div>
        <Label className="text-sm">{label}</Label>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      </div>
      <RadioGroup value={value} onValueChange={onChange} className="flex gap-4">
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="none" id={`${label}-none`} />
          <Label htmlFor={`${label}-none`} className="font-normal cursor-pointer">
            無權限
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="view" id={`${label}-view`} />
          <Label htmlFor={`${label}-view`} className="font-normal cursor-pointer">
            可檢視
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="edit" id={`${label}-edit`} />
          <Label htmlFor={`${label}-edit`} className="font-normal cursor-pointer">
            可編輯
          </Label>
        </div>
      </RadioGroup>
    </div>
  )
}

function PermissionItem({ label, level }: { label: string; level: string }) {
  const getLevelColor = (level: string) => {
    switch (level) {
      case "可編輯":
        return "text-blue-600"
      case "可檢視":
        return "text-green-600"
      case "無權限":
        return "text-gray-400"
      default:
        return "text-foreground"
    }
  }

  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={getLevelColor(level)}>{level}</span>
    </div>
  )
}
