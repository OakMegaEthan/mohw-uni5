"use client"

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

export type ChangeMethod = "change" | "no-change"

interface DocumentChangeChoiceProps {
  value: ChangeMethod
  onChange: (value: ChangeMethod) => void
  title?: string
  changeLabel?: string
  changeDescription?: string
  noChangeLabel?: string
  noChangeDescription?: string
  disabled?: boolean
}

/**
 * 本年度文件處理方式選擇（變更／不變更）。
 * 由版型 A（逐條編輯）沿用而來的共用互動，供上傳版型 B/C 共用，行為一致：
 * 先讓使用者選擇是否變更，再由父層依此決定上傳區是否啟用與送出按鈕狀態。
 */
export function DocumentChangeChoice({
  value,
  onChange,
  title = "本年度文件處理方式",
  changeLabel = "變更文件",
  changeDescription = "上傳本年度新版文件與修正對照表",
  noChangeLabel = "不變更",
  noChangeDescription = "沿用前年度文件，本年度無須上傳",
  disabled = false,
}: DocumentChangeChoiceProps) {
  return (
    <div className="rounded-lg bg-card p-6">
      <h3 className="mb-4 font-medium text-foreground">{title}</h3>
      <RadioGroup value={value} onValueChange={(v) => onChange(v as ChangeMethod)} disabled={disabled}>
        <div
          className={`mb-3 flex items-start gap-3 rounded-lg border-2 p-4 ${
            value === "change" ? "border-primary bg-primary/5" : "border-border"
          }`}
        >
          <RadioGroupItem value="change" id="doc-change" className="mt-1" />
          <Label htmlFor="doc-change" className="cursor-pointer">
            <span className="block text-base font-medium text-foreground">{changeLabel}</span>
            <span className="mt-0.5 block text-sm font-normal text-muted-foreground">{changeDescription}</span>
          </Label>
        </div>
        <div
          className={`flex items-start gap-3 rounded-lg border-2 p-4 ${
            value === "no-change" ? "border-primary bg-primary/5" : "border-border"
          }`}
        >
          <RadioGroupItem value="no-change" id="doc-no-change" className="mt-1" />
          <Label htmlFor="doc-no-change" className="cursor-pointer">
            <span className="block text-base font-medium text-foreground">{noChangeLabel}</span>
            <span className="mt-0.5 block text-sm font-normal text-muted-foreground">{noChangeDescription}</span>
          </Label>
        </div>
      </RadioGroup>
    </div>
  )
}
