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
  { code: "0401180026", name: "高醫附設醫院", county: "高雄市", district: "前金區" },
  { code: "0401180027", name: "中國醫藥大學附醫", county: "台中市", district: "北區" },
  { code: "0401180028", name: "中山醫學大學附設醫院", county: "台中市", district: "南區" },
  { code: "0401180029", name: "彰化基督教醫院", county: "彰化縣", district: "彰化市" },
  { code: "0401180030", name: "台大雲林分院", county: "雲林縣", district: "斗六市" },
]

export default function NewQuotaPage() {
  const router = useRouter()
  const [applicationMode, setApplicationMode] = useState<"single" | "joint" | "merged">("single")
  const [selectedMainHospitals, setSelectedMainHospitals] = useState<string[]>([])
  const [selectedPartnerHospitals, setSelectedPartnerHospitals] = useState<string[]>([])
  const [extensionYears, setExtensionYears] = useState("0")
  const [quotaLimit, setQuotaLimit] = useState("")
  const [currentQuota, setCurrentQuota] = useState("")
  const [note, setNote] = useState("")

  const removeMainHospital = (hospitalCode: string) => {
    setSelectedMainHospitals((prev) => prev.filter((code) => code !== hospitalCode))
  }

  const removePartnerHospital = (hospitalCode: string) => {
    setSelectedPartnerHospitals((prev) => prev.filter((code) => code !== hospitalCode))
  }

  const getHospitalName = (code: string) => {
    return availableHospitals.find((h) => h.code === code)?.name || code
  }

  const handleSave = () => {
    router.push("/filing?tab=quota")
  }

  const canSave =
    selectedMainHospitals.length > 0 &&
    (applicationMode !== "joint" || selectedPartnerHospitals.length > 0) &&
    quotaLimit &&
    Number(quotaLimit) >= 1 && Number(quotaLimit) <= 50 &&
    currentQuota &&
    Number(currentQuota) >= 1 && Number(currentQuota) <= 50

  return (
    <div className="min-h-screen bg-[#f5f7fa]">
      <div className="bg-muted/30 border-b">
        <div className="container mx-auto px-6 py-3">
          <p className="text-sm text-muted-foreground">首頁 / 填報專區 / 新增醫院容額</p>
        </div>
      </div>

      <div className="container mx-auto px-6 pt-6">
        <Link
          href="/filing"
          className="inline-flex items-center text-primary hover:underline text-sm"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          返回填報專區
        </Link>
      </div>

      <div className="container mx-auto px-6 py-4">
        <h1 className="text-2xl font-bold text-foreground">新增醫院容額</h1>
      </div>

      <div className="container mx-auto px-6 pb-8">
        <div className="max-w-6xl space-y-6">
          <div className="bg-card rounded-lg p-6 shadow-sm">
            <h2 className="font-semibold text-foreground mb-4">申請方式</h2>
            <div className="grid grid-cols-3 gap-4">
              <button
                type="button"
                onClick={() => {
                  setApplicationMode("single")
                  setSelectedMainHospitals([])
                  setSelectedPartnerHospitals([])
                }}
                className={`p-5 rounded-lg border-2 text-left transition-colors ${
                  applicationMode === "single"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className="font-medium text-foreground text-lg">單一機構申請</div>
                <div className="text-sm text-muted-foreground mt-1">僅由一間醫院獨立申請容額</div>
              </button>
              <button
                type="button"
                onClick={() => {
                  setApplicationMode("joint")
                  setSelectedMainHospitals([])
                  setSelectedPartnerHospitals([])
                }}
                className={`p-5 rounded-lg border-2 text-left transition-colors ${
                  applicationMode === "joint"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className="font-medium text-foreground text-lg">聯合申請</div>
                <div className="text-sm text-muted-foreground mt-1">
                  主訓醫院與合作醫院聯合申請
                </div>
              </button>
              <button
                type="button"
                onClick={() => {
                  setApplicationMode("merged")
                  setSelectedMainHospitals([])
                  setSelectedPartnerHospitals([])
                }}
                className={`p-5 rounded-lg border-2 text-left transition-colors ${
                  applicationMode === "merged"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className="font-medium text-foreground text-lg">合併申請</div>
                <div className="text-sm text-muted-foreground mt-1">
                  合併評鑑的醫院合併進行容額申請
                </div>
              </button>
            </div>
          </div>

          <div className="bg-card rounded-lg p-6 shadow-sm">
            <h2 className="font-semibold text-foreground mb-4">
              {applicationMode === "merged" ? "合併申請機構" : "主訓醫院"}
              {" "}<span className="text-destructive">*</span>
              {(applicationMode === "joint" || applicationMode === "merged") && (
                <span className="text-sm font-normal text-muted-foreground ml-2">（可多選）</span>
              )}
            </h2>
            
            <HospitalMultiSelect
              hospitals={availableHospitals}
              selected={selectedMainHospitals}
              onSelect={setSelectedMainHospitals}
              mode={applicationMode === "single" ? "single" : "multiple"}
              triggerLabel={applicationMode === "merged" ? "請選擇合併申請機構" : "請選擇主訓醫院"}
            />

            {selectedMainHospitals.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
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

          {applicationMode === "joint" && (
            <div className="bg-card rounded-lg p-6 shadow-sm">
              <h2 className="font-semibold text-foreground mb-4">
                合作醫院 <span className="text-destructive">*</span>
                <span className="text-sm font-normal text-muted-foreground ml-2">（可多選）</span>
              </h2>

              <HospitalMultiSelect
                hospitals={availableHospitals.filter((h) => !selectedMainHospitals.includes(h.code))}
                selected={selectedPartnerHospitals}
                onSelect={setSelectedPartnerHospitals}
                mode="multiple"
                triggerLabel="請選擇合作醫院"
              />

              {selectedPartnerHospitals.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
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

          <div className="bg-card rounded-lg p-6 shadow-sm">
            <h2 className="font-semibold text-foreground mb-4">基本資訊與容額設定</h2>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <Label className="text-sm text-muted-foreground mb-2 block">效期</Label>
                <div className="bg-muted/50 px-4 py-3 rounded-lg text-foreground">
                  有效至 2026/7/31
                </div>
              </div>

              <div>
                <Label className="text-sm text-muted-foreground mb-2 block">容額效期</Label>
                <div className="flex items-center gap-3">
                  <Select value={extensionYears} onValueChange={setExtensionYears}>
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0 年</SelectItem>
                      <SelectItem value="1">1 年</SelectItem>
                      <SelectItem value="2">2 年</SelectItem>
                      <SelectItem value="3">3 年</SelectItem>
                      <SelectItem value="4">4 年</SelectItem>
                    </SelectContent>
                  </Select>
                  {extensionYears !== "0" && (
                    <span className="text-sm text-muted-foreground">
                      (至 {2026 + parseInt(extensionYears)}/7/31)
                    </span>
                  )}
                </div>
              </div>

              <div>
                <Label className="text-sm text-muted-foreground mb-2 block">
                  容額上限 <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="number"
                  value={quotaLimit}
                  onChange={(e) => setQuotaLimit(e.target.value)}
                  placeholder="請輸入容額上限"
                  min={1}
                  max={50}
                />
                <p className="text-sm text-muted-foreground mt-1">請輸入 1 ~ 50 之間的數值</p>
              </div>

              <div>
                <Label className="text-sm text-muted-foreground mb-2 block">
                  本年度擬核定容額 <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="number"
                  value={currentQuota}
                  onChange={(e) => setCurrentQuota(e.target.value)}
                  placeholder="請輸入容額"
                  min={1}
                  max={50}
                />
                <p className="text-sm text-muted-foreground mt-1">請輸入 1 ~ 50 之間的數值</p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg p-6 shadow-sm">
            <h2 className="font-semibold text-foreground mb-4">備註</h2>
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

          <div className="flex items-center justify-end gap-3 pt-4">
            <Link href="/filing">
              <Button variant="outline">取消</Button>
            </Link>
            <Button
              className="gap-2 bg-[#2d3a8c] hover:bg-[#252f73] text-white"
              onClick={handleSave}
              disabled={!canSave}
            >
              <Save className="h-4 w-4" />
              儲存變更
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

