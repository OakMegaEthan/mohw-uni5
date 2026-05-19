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
import { ChevronLeft, X, Save } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Textarea } from "@/components/ui/textarea"
import { HospitalMultiSelect, type Hospital } from "@/components/filing/hospital-multi-select"
import { quotaNotesStore } from "@/lib/stores/quota-notes-store"

const availableHospitals: Hospital[] = [
  { code: "0401180014", name: "台大醫院", county: "台北市", district: "中山區" },
  { code: "0401180015", name: "台北榮民總醫院", county: "台北市", district: "北投區" },
  { code: "0401180016", name: "三軍總醫院", county: "台北市", district: "內湖區" },
  { code: "0401180017", name: "馬偕紀念醫院", county: "台北市", district: "中山區" },
  { code: "0401180018", name: "新光醫院", county: "台北市", district: "信義區" },
  { code: "0401180019", name: "國泰醫院", county: "台北市", district: "大安區" },
  { code: "0401180020", name: "亞東醫院", county: "新北市", district: "板橋區" },
  { code: "0401180021", name: "慈濟醫院", county: "新北市", district: "新店區" },
  { code: "0401180022", name: "奇美醫院", county: "台南市", district: "東區" },
  { code: "0401180023", name: "成大醫院", county: "台南市", district: "東區" },
  { code: "0401180024", name: "高雄長庚醫院", county: "高雄市", district: "左營區" },
  { code: "0401180025", name: "高雄榮民總醫院", county: "高雄市", district: "左營區" },
]

export default function NewQuotaPage() {
  const router = useRouter()
  const [applicationMode, setApplicationMode] = useState<"single" | "joint">("single")
  const [selectedMainHospitals, setSelectedMainHospitals] = useState<string[]>([])
  const [selectedPartnerHospitals, setSelectedPartnerHospitals] = useState<string[]>([])
  const [extensionYears, setExtensionYears] = useState("0")
  const [quotaLimit, setQuotaLimit] = useState("")
  const [currentQuota, setCurrentQuota] = useState("")
  const [note, setNote] = useState("")

  const calculateExtensionDate = (years: string) => {
    if (years === "0") return ""
    const baseYear = 2026
    const extendedYear = baseYear + parseInt(years)
    return `${extendedYear}/7/31`
  }

  const getHospitalName = (code: string) => {
    return availableHospitals.find((h) => h.code === code)?.name || code
  }

  const removeMainHospital = (code: string) => {
    setSelectedMainHospitals((prev) => prev.filter((c) => c !== code))
  }

  const removePartnerHospital = (code: string) => {
    setSelectedPartnerHospitals((prev) => prev.filter((c) => c !== code))
  }

  const canSave =
    selectedMainHospitals.length > 0 &&
    (applicationMode !== "joint" || selectedPartnerHospitals.length > 0) &&
    !!quotaLimit && Number(quotaLimit) >= 1 && Number(quotaLimit) <= 50 &&
    !!currentQuota && Number(currentQuota) >= 1 && Number(currentQuota) <= 50

  const handleSave = () => {
    const newId = `new-${Date.now()}`
    if (note.trim()) {
      quotaNotesStore.hospitalNotes[newId] = note.trim()
    }
    router.push("/filing?tab=quota")
  }

  return (
    <div className="min-h-screen bg-[#f5f7fa]">
      <div className="container mx-auto px-6 pt-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <Link
            href="/filing?tab=quota"
            className="inline-flex items-center text-primary hover:underline"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            返回列表
          </Link>
          <span>|</span>
          <span>新增訓練醫院容額</span>
        </div>

        <h1 className="text-2xl font-bold text-foreground mb-6">
          新增訓練醫院容額
        </h1>
      </div>

      <div className="container mx-auto px-6 pb-8">
        <div className="bg-card rounded-lg p-8 max-w-4xl">
          {/* 申請方式 */}
          <div className="mb-8">
            <Label className="text-sm font-medium mb-3 block">
              申請方式 <span className="text-destructive">*</span>
            </Label>
            <div className="grid grid-cols-2 gap-3 max-w-md">
              <button
                type="button"
                onClick={() => {
                  setApplicationMode("single")
                  setSelectedPartnerHospitals([])
                }}
                className={`p-4 rounded-lg border-2 text-center transition-colors ${
                  applicationMode === "single"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className="font-medium text-foreground">單一機構申請</div>
                <div className="text-sm text-muted-foreground mt-1">僅由一間醫院申請</div>
              </button>
              <button
                type="button"
                onClick={() => setApplicationMode("joint")}
                className={`p-4 rounded-lg border-2 text-center transition-colors ${
                  applicationMode === "joint"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className="font-medium text-foreground">聯合申請</div>
                <div className="text-sm text-muted-foreground mt-1">主訓與合作醫院聯合</div>
              </button>
            </div>
          </div>

          <h2 className="text-lg font-bold text-foreground mb-6">基本資訊與容額設定</h2>

          <div className="grid grid-cols-2 gap-x-12 gap-y-6">
            {/* 主訓醫院 — 橫跨兩欄 */}
            <div className="col-span-2">
              <Label className="text-sm text-muted-foreground mb-2 block">
                主訓醫院 <span className="text-destructive">*</span>
                {applicationMode === "joint" && (
                  <span className="text-sm font-normal text-muted-foreground ml-2">（可多選）</span>
                )}
              </Label>
              <HospitalMultiSelect
                hospitals={availableHospitals}
                selected={selectedMainHospitals}
                onSelect={setSelectedMainHospitals}
                mode={applicationMode === "joint" ? "multiple" : "single"}
                triggerLabel="請選擇主訓醫院"
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
                        onClick={() => removeMainHospital(code)}
                        className="hover:bg-primary/20 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 效期（新增時為空，顯示提示） */}
            <div>
              <Label className="text-sm text-muted-foreground mb-2 block">效期</Label>
              <div className="bg-muted/50 px-4 py-3 rounded-lg text-muted-foreground italic">
                新申請（待審核後核定）
              </div>
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
                  <span className="text-muted-foreground">
                    (至 {calculateExtensionDate(extensionYears)})
                  </span>
                )}
              </div>
            </div>

            {/* 前年度核定容額（新增時為空） */}
            <div>
              <Label className="text-sm text-muted-foreground mb-2 block">前年度核定容額</Label>
              <div className="bg-muted/50 px-4 py-3 rounded-lg text-muted-foreground italic">
                新申請
              </div>
            </div>
          </div>

          {/* 合作醫院（聯合申請時顯示） */}
          {applicationMode === "joint" && (
            <div className="mt-8">
              <Label className="text-sm font-medium mb-3 block">
                合作醫院 <span className="text-destructive">*</span>
                <span className="text-muted-foreground font-normal ml-1">（可多選）</span>
              </Label>
              <HospitalMultiSelect
                hospitals={availableHospitals.filter((h) => !selectedMainHospitals.includes(h.code))}
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
                        onClick={() => removePartnerHospital(code)}
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

          {/* 本年度容額設定 */}
          <h2 className="text-lg font-bold text-foreground mt-10 mb-6">本年度容額設定</h2>

          <div className="grid grid-cols-2 gap-x-12 gap-y-6">
            <div>
              <Label className="text-sm text-muted-foreground mb-2 block">
                容額上限 <span className="text-destructive">*</span>
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
                本年度擬核定容額 <span className="text-destructive">*</span>
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

          {/* 備註 */}
          <div className="mt-10">
            <h2 className="text-lg font-bold text-foreground mb-4">備註</h2>
            <div>
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
          </div>

          <div className="flex items-center justify-end gap-3 mt-10 pt-6 border-t">
            <Link href="/filing?tab=quota">
              <Button variant="outline">取消</Button>
            </Link>
            <Button
              className="gap-2 bg-[#2d3a8c] hover:bg-[#252f73] text-white"
              disabled={!canSave}
              onClick={handleSave}
            >
              <Save className="h-4 w-4" />
              確認新增
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
