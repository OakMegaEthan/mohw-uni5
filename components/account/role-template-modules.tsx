"use client"

import { useState } from "react"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import {
  MODULE_SECTIONS_BY_LEVEL,
  type PermissionState,
  type PermissionValue,
  type RoleTemplateLevel,
} from "@/lib/mock/role-templates"

interface RoleTemplateModulesProps {
  level: RoleTemplateLevel
  permissions: PermissionState
  onChange: (key: string, value: PermissionValue) => void
}

const PERMISSION_OPTIONS: { value: PermissionValue; label: string }[] = [
  { value: "none", label: "無權限" },
  { value: "view", label: "可檢視" },
  { value: "edit", label: "可編輯" },
]

// 依層級渲染可設定的功能模組區塊
// 模組結構來自共用來源 MODULE_SECTIONS_BY_LEVEL，確保新增 / 編輯頁一致
export function RoleTemplateModules({ level, permissions, onChange }: RoleTemplateModulesProps) {
  // 匯出格式為展示用本地狀態（統計專區）
  const [exportPdf, setExportPdf] = useState(false)
  const [exportWord, setExportWord] = useState(false)

  const sections = MODULE_SECTIONS_BY_LEVEL[level]

  return (
    <div className="space-y-6">
      {sections.map((section) => (
        <div key={section.title} className="space-y-4">
          <h3 className="text-base font-semibold text-foreground border-b pb-2">{section.title}</h3>
          {section.description && (
            <p className="text-sm text-muted-foreground -mt-2 mb-2">{section.description}</p>
          )}

          {section.items.map((item) => (
            <div key={item.id} className="py-3 border-b last:border-0">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <Label className="text-sm font-medium">{item.name}</Label>
                  {item.description && (
                    <p className="text-sm text-muted-foreground mt-0.5">{item.description}</p>
                  )}
                </div>
              </div>
              <RadioGroup
                value={permissions[item.id] ?? "none"}
                onValueChange={(value) => onChange(item.id, value as PermissionValue)}
                className="flex gap-4"
              >
                {PERMISSION_OPTIONS.map((opt) => (
                  <div key={opt.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={opt.value} id={`${item.id}-${opt.value}`} />
                    <Label htmlFor={`${item.id}-${opt.value}`} className="text-sm font-normal cursor-pointer">
                      {opt.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          ))}

          {section.hasExport && (
            <div className="pl-4 space-y-3">
              <Label className="text-sm font-medium">匯出格式權限</Label>
              <div className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="export-pdf"
                    checked={exportPdf}
                    onCheckedChange={(checked) => setExportPdf(checked === true)}
                  />
                  <Label htmlFor="export-pdf" className="text-sm font-normal cursor-pointer">
                    可匯出 PDF
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="export-word"
                    checked={exportWord}
                    onCheckedChange={(checked) => setExportWord(checked === true)}
                  />
                  <Label htmlFor="export-word" className="text-sm font-normal cursor-pointer">
                    可匯出 Word
                  </Label>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
