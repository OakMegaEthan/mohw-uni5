"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ChevronLeft, X, Save, HelpCircle } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import Link from "next/link"
import { Textarea } from "@/components/ui/textarea"
import { HospitalMultiSelect, type Hospital } from "@/components/filing/hospital-multi-select"

// 民國年延長效期計算（以民國 115 年 = 西元 2026 為基準）
export function calculateExtensionDate(years: string): string {
  if (years === "0") return ""
  const baseRocYear = 115
  const extendedYear = baseRocYear + parseInt(years)
  return `${extendedYear}/7/31`
}

export const AVAILABLE_HOSPITALS: Hospital[] = [
  { code: "0401180014", name: "台大醫院", county: "台北市", district: "中正區" },
  { code: "0401190015", name: "台北榮民總醫院", county: "台北市", district: "北投區" },
  { code: "0401200016", name: "三軍總醫院", county: "台北市", district: "內湖區" },
  { code: "0401210017", name: "馬偕紀念醫院", county: "台北市", district: "中山區" },
  { code: "0401220018", name: "新光醫院", county: "台北市", district: "士林區" },
  { code: "0401230019", name: "國泰醫院", county: "台北市", district: "大安區" },
  { code: "0401240020", name: "萬芳醫院", county: "台北市", district: "文山區" },
  { code: "0401250021", name: "亞東醫院", county: "新北市", district: "板橋區" },
  { code: "0401260022", name: "林口長庚醫院", county: "桃園市", district: "龜山區" },
  { code: "0401270023", name: "中山醫學大學附醫", county: "台中市", district: "南區" },
  { code: "0401280024", name: "中國醫藥大學附醫", county: "台中市", district: "北區" },
  { code: "0401290025", name: "台中榮民總醫院", county: "台中市", district: "西屯區" },
  { code: "0401300026", name: "奇美醫院", county: "台南市", district: "永康區" },
  { code: "0401310027", name: "成大醫院", county: "台南市", district: "東區" },
  { code: "0401320028", name: "高雄長庚醫院", county: "高雄市", district: "左營區" },
  { code: "0401330029", name: "高雄榮民總醫院", county: "高雄市", district: "左營區" },
  { code: "0401340030", name: "高雄醫學大學附醫", county: "高雄市", district: "三民區" },
]

export type ApplicationMode = "single" | "joint" | "merged"

export interface QuotaFormValues {
  applicationMode: ApplicationMode
  mainHospitalCodes: string[]
  partnerHospitalCodes: string[]
  extensionYears: string
  quotaLimit: string
  currentQuota: string
  note: string
}

export interface QuotaFormProps {
  mode: "create" | "edit"
  variant?: string
  // 初始值（edit 模式時帶入現有資料）
  initialValues?: Partial<QuotaFormValues>
  // 編輯模式才有的唯讀欄位
  expiry?: string
  prevQuota?: number
  // 儲存 / 確認後的回呼
  onSave: (values: QuotaFormValues) => void
  onCancel: () => void
}

export function QuotaForm({
  mode,
  variant = "",
  initialValues,
  expiry,
  prevQuota,
  onSave,
  onCancel,
}: QuotaFormProps) {
  const isInternalMedicine = variant === "internal-medicine"

  const [applicationMode, setApplicationMode] = useState<ApplicationMode>(
    initialValues?.applicationMode ?? "single"
  )
  const [selectedMainHospitals, setSelectedMainHospitals] = useState<string[]>(
    initialValues?.mainHospitalCodes ?? []
  )
  const [selectedPartnerHospitals, setSelectedPartnerHospitals] = useState<string[]>(
    initialValues?.partnerHospitalCodes ?? []
  )
  const [extensionYears, setExtensionYears] = useState(initialValues?.extensionYears ?? "0")
  const [quotaLimit, setQuotaLimit] = useState(initialValues?.quotaLimit ?? "")
  const [currentQuota, setCurrentQuota] = useState(initialValues?.currentQuota ?? "")
  const [note, setNote] = useState(initialValues?.note ?? "")

  const getHospitalName = (code: string) =>
    AVAILABLE_HOSPITALS.find((h) => h.code === code)?.name || code

  const canSave =
    selectedMainHospitals.length > 0 &&
    (applicationMode !== "joint" || selectedPartnerHospitals.length > 0) &&
    !!quotaLimit &&
    Number(quotaLimit) >= 1 &&
    Number(quotaLimit) <= 50 &&
    !!currentQuota &&
    Number(currentQuota) >= 1 &&
    Number(currentQuota) <= 50

  const handleSave = () => {
    onSave({
      applicationMode,
      mainHospitalCodes: selectedMainHospitals,
      partnerHospitalCodes: selectedPartnerHospitals,
      extensionYears,
      quotaLimit,
      currentQuota,
      note,
    })
  }

  const isCreate = mode === "create"
  const pageTitle = isCreate ? "新增訓練醫院容額" : "容額分配編輯"
  const breadcrumb = isCreate ? "新增訓練醫院容額" : "編輯容額分配"
  const saveLabel = isCreate ? "確認新增" : "儲存變更"

  return (
    <div className="min-h-screen bg-[#f5f7fa]">
      <div className="container mx-auto px-6 pt-6">
        {/* 麵包屑 */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center text-primary hover:underline"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            返回列表
          </button>
          <span>|</span>
          <span>{breadcrumb}</span>
        </div>

        <h1 className="text-2xl font-bold text-foreground mb-6">
          {pageTitle}
          {isInternalMedicine && (
            <span className="ml-3 text-base font-normal text-muted-foreground">
              （內科醫學會 - 結核病計畫）
            </span>
          )}
        </h1>
      </div>

      <div className="container mx-auto px-6 pb-8">
        <div className="bg-card rounded-lg p-8 max-w-4xl">

          {/* ── 申請方式 ── */}
          <div className="mb-8">
            <Label className="text-sm font-medium mb-3 block">
              申請方式 <span className="text-destructive">*</span>
            </Label>
            {isInternalMedicine ? (
              <div className="max-w-xs">
                <div className="p-4 rounded-lg border-2 border-primary bg-primary/5 text-center">
                  <div className="font-medium text-foreground">單一機構申請</div>
                  <div className="text-sm text-muted-foreground mt-1">僅由一間醫院申請</div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3 max-w-2xl">
                {(
                  [
                    {
                      value: "single" as ApplicationMode,
                      label: "單一機構申請",
                      desc: "僅由一間醫院申請",
                      clear: true,
                    },
                    {
                      value: "joint" as ApplicationMode,
                      label: "聯合申請",
                      desc: "主訓與合作醫院聯合",
                      clear: false,
                    },
                    {
                      value: "merged" as ApplicationMode,
                      label: "合併申請",
                      desc: "合併評鑑的醫院合併申請",
                      clear: true,
                    },
                  ] as { value: ApplicationMode; label: string; desc: string; clear: boolean }[]
                ).map(({ value, label, desc, clear }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      setApplicationMode(value)
                      if (clear) setSelectedPartnerHospitals([])
                    }}
                    className={`p-4 rounded-lg border-2 text-center transition-colors ${
                      applicationMode === value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="font-medium text-foreground">{label}</div>
                    <div className="text-sm text-muted-foreground mt-1">{desc}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── 基本資訊與容額設定 ── */}
          <h2 className="text-lg font-bold text-foreground mb-6">基本資訊與容額設定</h2>

          <div className="grid grid-cols-2 gap-x-12 gap-y-6">
            {/* 主訓醫院 / 合併申請機構 */}
            <div className="col-span-2">
              <Label className="text-sm text-muted-foreground mb-2 block">
                {applicationMode === "merged" ? "合併申請機構" : "主訓醫院"}{" "}
                <span className="text-destructive">*</span>
                {(applicationMode === "joint" || applicationMode === "merged") && (
                  <span className="text-sm font-normal text-muted-foreground ml-2">（可多選）</span>
                )}
              </Label>
              <HospitalMultiSelect
                hospitals={AVAILABLE_HOSPITALS}
                selected={selectedMainHospitals}
                onSelect={setSelectedMainHospitals}
                mode={isInternalMedicine || applicationMode === "single" ? "single" : "multiple"}
                triggerLabel={
                  applicationMode === "merged" ? "請選擇合併申請機構" : "請選擇主訓醫院"
                }
              />
              {selectedMainHospitals.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {selectedMainHospitals.map((code) => (
                    <div
                      key={code}
                      className="inline-flex items-center gap-1 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-sm"
                    >
                      {getHospitalName(code)}
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedMainHospitals((prev) => prev.filter((c) => c !== code))
                        }
                        className="hover:bg-primary/20 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 資格效期 */}
            <div>
              <Label className="text-sm text-muted-foreground mb-2 block">資格效期</Label>
              {isCreate ? (
                <div className="bg-muted/50 px-4 py-3 rounded-lg text-muted-foreground italic text-sm">
                  新申請（待審核後核定）
                </div>
              ) : (
                <div className="bg-muted/50 px-4 py-3 rounded-lg text-foreground text-sm">
                  {expiry}
                </div>
              )}
            </div>

            {/* 延長效期 */}
            <div>
              <Label className="text-sm text-muted-foreground mb-2 block">延長效期</Label>
              <div className="flex items-center gap-3">
                <Select value={extensionYears} onValueChange={setExtensionYears}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">不延長</SelectItem>
                    <SelectItem value="1">1 年</SelectItem>
                    <SelectItem value="2">2 年</SelectItem>
                    <SelectItem value="3">3 年</SelectItem>
                    <SelectItem value="4">4 年</SelectItem>
                  </SelectContent>
                </Select>
                {extensionYears !== "0" && (
                  <span className="text-muted-foreground text-sm">
                    (至 {calculateExtensionDate(extensionYears)})
                  </span>
                )}
              </div>
            </div>

            {/* 前年度核定容額 */}
            <div>
              <Label className="text-sm text-muted-foreground mb-2 block">前年度核定容額</Label>
              {isCreate ? (
                <div className="bg-muted/50 px-4 py-3 rounded-lg text-muted-foreground italic text-sm">
                  新申請
                </div>
              ) : (
                <div className="bg-muted/50 px-4 py-3 rounded-lg text-foreground text-sm">
                  {prevQuota} 名
                </div>
              )}
            </div>
          </div>

          {/* 合作醫院（聯合申請 + 非 internal-medicine） */}
          {applicationMode === "joint" && !isInternalMedicine && (
            <div className="mt-8">
              <Label className="text-sm font-medium mb-3 block">
                合作醫院 <span className="text-destructive">*</span>
                <span className="text-muted-foreground font-normal ml-1">（可多選）</span>
              </Label>
              <HospitalMultiSelect
                hospitals={AVAILABLE_HOSPITALS.filter(
                  (h) => !selectedMainHospitals.includes(h.code)
                )}
                selected={selectedPartnerHospitals}
                onSelect={setSelectedPartnerHospitals}
                mode="multiple"
                triggerLabel="請選擇合作醫院"
              />
              {selectedPartnerHospitals.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {selectedPartnerHospitals.map((code) => (
                    <div
                      key={code}
                      className="inline-flex items-center gap-1 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-sm"
                    >
                      {getHospitalName(code)}
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedPartnerHospitals((prev) => prev.filter((c) => c !== code))
                        }
                        className="hover:bg-primary/20 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── 本年度容額設定 ── */}
          <h2 className="text-lg font-bold text-foreground mt-10 mb-6">本年度容額設定</h2>

          <div className="grid grid-cols-2 gap-x-12 gap-y-6">
            <div>
              <Label className="text-sm text-muted-foreground mb-2 flex items-center gap-1">
                可收訓容額 <span className="text-destructive">*</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/70 cursor-default" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs text-sm" side="top">
                      係指醫院實際訓練量能，最大訓練容量之容額數
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <Input
                type="number"
                value={quotaLimit}
                onChange={(e) => setQuotaLimit(e.target.value)}
                className="max-w-32"
                min={1}
                max={50}
              />
              <p className="text-sm text-muted-foreground mt-2">請輸入 1 ~ 50 之間的數值</p>
            </div>

            <div>
              <Label className="text-sm text-muted-foreground mb-2 block">
                建議分配容額 <span className="text-destructive">*</span>
              </Label>
              <Input
                type="number"
                value={currentQuota}
                onChange={(e) => setCurrentQuota(e.target.value)}
                className="max-w-32"
                min={1}
                max={50}
              />
              <p className="text-sm text-muted-foreground mt-2">請輸入 1 ~ 50 之間的數值</p>
            </div>
          </div>

          {/* ── 備註 ── */}
          <div className="mt-10">
            <h2 className="text-lg font-bold text-foreground mb-4">備註</h2>
            <Label className="text-sm text-muted-foreground mb-2 block">
              備註內容（選填）
            </Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="輸入此訓練醫院的特殊說明，將自動彙整至填報頁面備註區塊"
              className="text-base min-h-[100px]"
            />
          </div>

          {/* ── 底部操作按鈕 ── */}
          <div className="flex items-center justify-end gap-3 mt-10 pt-6 border-t">
            <Button variant="outline" onClick={onCancel}>
              取消
            </Button>
            <Button
              className="gap-2 bg-[#2d3a8c] hover:bg-[#252f73] text-white"
              disabled={!canSave}
              onClick={handleSave}
            >
              <Save className="h-4 w-4" />
              {saveLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
