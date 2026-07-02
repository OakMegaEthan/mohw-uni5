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
import { ChevronLeft, Save, HelpCircle } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Textarea } from "@/components/ui/textarea"
import { 
  InstitutionEntitySelector, 
  type InstitutionEntity 
} from "@/components/filing/institution-entity-selector"
import type { Hospital } from "@/components/filing/hospital-multi-select"

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

export type ApplicationMode = "single" | "joint"

export interface QuotaFormValues {
  applicationMode: ApplicationMode
  // 主訓機構（單一機構申請時只有一個，聯合申請時也只有一個）
  mainEntity: InstitutionEntity | null
  // 合作機構（聯合申請時才有，可多個）
  partnerEntities: InstitutionEntity[]
  // 容額設定
  prevQuota: string
  isNewApplication: boolean
  quotaLimit: string
  currentQuota: string
  note: string
}

export interface QuotaFormProps {
  mode: "create" | "edit"
  variant?: string
  // 初始值（edit 模式時帶入現有資料）
  initialValues?: Partial<QuotaFormValues>
  // 儲存 / 確認後的回呼
  onSave: (values: QuotaFormValues) => void
  onCancel: () => void
}

export function QuotaForm({
  mode,
  variant = "",
  initialValues,
  onSave,
  onCancel,
}: QuotaFormProps) {
  const isInternalMedicine = variant === "internal-medicine"

  const [applicationMode, setApplicationMode] = useState<ApplicationMode>(
    initialValues?.applicationMode ?? "single"
  )
  
  // 主訓機構（使用陣列方便 InstitutionEntitySelector 操作，但實際只允許一個）
  const [mainEntities, setMainEntities] = useState<InstitutionEntity[]>(
    initialValues?.mainEntity ? [initialValues.mainEntity] : []
  )
  
  // 合作機構（聯合申請時可多個）
  const [partnerEntities, setPartnerEntities] = useState<InstitutionEntity[]>(
    initialValues?.partnerEntities ?? []
  )

  const [isNewApplication, setIsNewApplication] = useState<boolean>(
    initialValues?.isNewApplication ?? mode === "create"
  )
  const [prevQuota, setPrevQuota] = useState(initialValues?.prevQuota ?? "")
  const [quotaLimit, setQuotaLimit] = useState(initialValues?.quotaLimit ?? "")
  const [currentQuota, setCurrentQuota] = useState(initialValues?.currentQuota ?? "")
  const [note, setNote] = useState(initialValues?.note ?? "")

  const mainEntity = mainEntities[0] || null

  const canSave =
    mainEntity !== null &&
    (applicationMode !== "joint" || partnerEntities.length > 0) &&
    !!quotaLimit &&
    Number(quotaLimit) >= 1 &&
    Number(quotaLimit) <= 50 &&
    !!currentQuota &&
    Number(currentQuota) >= 1 &&
    Number(currentQuota) <= 50

  const handleSave = () => {
    onSave({
      applicationMode,
      mainEntity,
      partnerEntities,
      prevQuota,
      isNewApplication,
      quotaLimit,
      currentQuota,
      note,
    })
  }

  const handleApplicationModeChange = (newMode: ApplicationMode) => {
    setApplicationMode(newMode)
    if (newMode === "single") {
      setPartnerEntities([])
    }
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
              認定方式 <span className="text-destructive">*</span>
            </Label>
            {isInternalMedicine ? (
              <div className="max-w-xs">
                <div className="p-4 rounded-lg border-2 border-primary bg-primary/5 text-center">
                  <div className="font-medium text-foreground">單一機構認定</div>
                  <div className="text-sm text-muted-foreground mt-1">由單一機構獨立申請</div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 max-w-lg">
                <button
                  type="button"
                  onClick={() => handleApplicationModeChange("single")}
                  className={`p-4 rounded-lg border-2 text-center transition-colors ${
                    applicationMode === "single"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="font-medium text-foreground">單一機構認定</div>
                  <div className="text-sm text-muted-foreground mt-1">由單一機構獨立申請</div>
                </button>
                <button
                  type="button"
                  onClick={() => handleApplicationModeChange("joint")}
                  className={`p-4 rounded-lg border-2 text-center transition-colors ${
                    applicationMode === "joint"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="font-medium text-foreground">聯合認定</div>
                  <div className="text-sm text-muted-foreground mt-1">主訓機構與合作機構聯合認定</div>
                </button>
              </div>
            )}
          </div>

          {/* ── 主訓機構 ── */}
          <div className="mb-8">
            <InstitutionEntitySelector
              hospitals={AVAILABLE_HOSPITALS}
              entities={mainEntities}
              onEntitiesChange={setMainEntities}
              singleMode={true}
              label="主訓機構"
              triggerLabel="選擇主訓機構"
            />
            <p className="text-sm text-muted-foreground mt-2">
              主訓機構可以是單一醫療機構，或由多個機構合併進行認定
            </p>
          </div>

          {/* ── 合作機構（聯合申請時顯示） ── */}
          {applicationMode === "joint" && !isInternalMedicine && (
            <div className="mb-8">
              <InstitutionEntitySelector
                hospitals={AVAILABLE_HOSPITALS}
                entities={partnerEntities}
                onEntitiesChange={setPartnerEntities}
                singleMode={false}
                label="合作機構"
                triggerLabel="新增合作機構"
              />
            <p className="text-sm text-muted-foreground mt-2">
                可新增多個合作機構，每個合作機構可以是單一醫療機構，或由多個機構合併認定
            </p>
            </div>
          )}

          {/* ── 本年度容額設定 ── */}
          <h2 className="text-lg font-bold text-foreground mt-10 mb-6">本年度容額設定</h2>

          <div className="grid grid-cols-2 gap-x-12 gap-y-6">
            {/* 前年度核定容額 */}
            <div>
              <Label className="text-sm font-medium mb-2 block">
                前年度核定容額
              </Label>
              <div className="flex items-center gap-2 mb-3">
                <Checkbox
                  id="isNewApplication"
                  checked={isNewApplication}
                  onCheckedChange={(checked) => {
                    setIsNewApplication(checked === true)
                    if (checked) setPrevQuota("")
                  }}
                />
                <label
                  htmlFor="isNewApplication"
                  className="text-sm text-muted-foreground cursor-pointer select-none"
                >
                  今年度新申請
                </label>
              </div>
              {isNewApplication ? (
                <div className="bg-muted/50 px-4 py-3 rounded-lg text-muted-foreground italic text-sm">
                  新申請
                </div>
              ) : (
                <Input
                  type="number"
                  min={0}
                  value={prevQuota}
                  onChange={(e) => setPrevQuota(e.target.value)}
                  placeholder="前年度核定容額"
                  className="max-w-[160px]"
                />
              )}
            </div>

            <div>{/* 空白佔位 */}</div>

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
