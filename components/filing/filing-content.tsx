"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  FileText,
  Edit3,
  Send,
  ChevronLeft,
  Upload,
  Download,
  Plus,
  Pencil,
  Trash2,
  Check,
  X as XIcon,
} from "lucide-react"
import Link from "next/link"
import { Textarea } from "@/components/ui/textarea"
import { HospitalMultiSelect, type Hospital } from "@/components/filing/hospital-multi-select"
import { filingItemsConfig } from "@/lib/mock/review-outline"
import { quotaNotesStore } from "@/lib/stores/quota-notes-store"

// 從 filingItemsConfig 建立開放狀態查詢表
const filingStatusMap = Object.fromEntries(
  filingItemsConfig.map((item) => [item.id, item.status])
)

const documents = [
  { id: "training-plan", title: "訓練計畫認定基準", status: "需補件", deadline: "2025/03/31" },
  { id: "training-curriculum", title: "訓練課程基準", status: "尚未送出", deadline: "2025/04/30" },
  { id: "evaluation-standards", title: "評核標準與評核表", status: "審查中", deadline: "2025/04/15" },
  { id: "quota-allocation", title: "容額分配原則", status: "通過", deadline: "2025/03/15" },
  { id: "improvement-guide", title: "精進指南", status: "待送件", deadline: "2025/04/30" },
  { id: "screening-principle", title: "甄審原則", status: "通過", deadline: "2025/03/15" },
]

// 可送件的狀態（已有內容但尚未送出）
const submittableStatuses = ["待送件", "需補件", "尚未送出"]

const getStatusStyle = (status: string) => {
  switch (status) {
    case "尚未送出":
      return "text-muted-foreground"
    case "待送件":
      return "text-muted-foreground"
    case "審查中":
      return "text-blue-600"
    case "需補件":
      return "text-orange-600"
    case "通過":
      return "text-green-600"
    default:
      return "text-muted-foreground"
  }
}

const availableHospitals = [
  { code: "0401180014", name: "台大醫院" },
  { code: "0401180015", name: "台北榮民總醫院" },
  { code: "0401180016", name: "三軍總醫院" },
  { code: "0401180017", name: "馬偕紀念醫院" },
  { code: "0401180018", name: "新光醫院" },
  { code: "0401180019", name: "國泰醫院" },
  { code: "0401180020", name: "亞東醫院" },
  { code: "0401180021", name: "慈濟醫院" },
  { code: "0401180022", name: "奇美醫院" },
  { code: "0401180023", name: "成大醫院" },
  { code: "0401180024", name: "高雄長庚醫院" },
  { code: "0401180025", name: "高雄榮民總醫院" },
]

function FilingContentInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const tabParam = searchParams.get("tab")
  const [activeTab, setActiveTab] = useState<string>(
    tabParam === "quota" ? "quota" : "documents"
  )

  // 切換 tab 時同步更新 URL query string
  const handleTabChange = (value: string) => {
    setActiveTab(value)
    const params = new URLSearchParams(Array.from(searchParams.entries()))
    params.set("tab", value)
    router.replace(`/filing?${params.toString()}`, { scroll: false })
  }

  const [showImportDialog, setShowImportDialog] = useState(false)
  const [showSubmitDialog, setShowSubmitDialog] = useState(false)
  const [selectedSubmitIds, setSelectedSubmitIds] = useState<string[]>([])

  const submittableDocs = documents.filter((doc) => {
    const filingOpen = filingStatusMap[doc.id] === "open"
    return filingOpen && submittableStatuses.includes(doc.status)
  })

  const toggleSubmitDoc = (id: string) => {
    setSelectedSubmitIds((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    )
  }

  const handleOpenSubmitDialog = () => {
    // 預設全選可送件文件
    setSelectedSubmitIds(submittableDocs.map((d) => d.id))
    setShowSubmitDialog(true)
  }

  const handleConfirmSubmit = () => {
    setShowSubmitDialog(false)
    setSelectedSubmitIds([])
  }

  // 新增不合格醫院 Dialog state
  const [showAddDisqualifiedDialog, setShowAddDisqualifiedDialog] = useState(false)
  const [selectedDisqualifiedHospital, setSelectedDisqualifiedHospital] = useState<string[]>([])
  const [disqualifiedReason, setDisqualifiedReason] = useState("")

  const disqualifiedHospitals = [
    { code: "0401180014", name: "台大醫院", reason: "不符合教學醫院評鑑合格基準" },
    { code: "0401180016", name: "三軍總醫院", reason: "主專科主治醫師人數不足" },
  ]

  const handleAddDisqualified = () => {
    if (selectedDisqualifiedHospital.length > 0 && disqualifiedReason.trim()) {
      // TODO: 實際新增邏輯
      console.log("新增不合格醫院:", selectedDisqualifiedHospital, disqualifiedReason)
      setShowAddDisqualifiedDialog(false)
      setSelectedDisqualifiedHospital([])
      setDisqualifiedReason("")
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 border-b bg-background">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">容額填報</h1>
          <Link href="/review">
            <Button variant="outline" size="sm" className="gap-1.5">
              <ChevronLeft className="h-4 w-4" />
              返回審查
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="documents">文件填報</TabsTrigger>
            <TabsTrigger value="quota">容額填報</TabsTrigger>
          </TabsList>

          <TabsContent value="documents" className="space-y-6 mt-6">
            {/* Documents Section */}
            <div className="space-y-4">
              {documents.map((doc) => {
                const filingOpen = filingStatusMap[doc.id] === "open"
                const statusStyle = getStatusStyle(doc.status)
                const isSubmittable =
                  filingOpen && submittableStatuses.includes(doc.status)

                return (
                  <Link key={doc.id} href={`/filing/${doc.id}`}>
                    <div className="border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-foreground mb-1">
                            {doc.title}
                          </h3>
                          <div className="flex items-center gap-4 text-sm">
                            <span className={`font-medium ${statusStyle}`}>
                              {doc.status}
                            </span>
                            <span className="text-muted-foreground">
                              期限：{doc.deadline}
                            </span>
                            {!filingOpen && (
                              <span className="text-muted-foreground">
                                （此項目尚未開放填報）
                              </span>
                            )}
                          </div>
                        </div>
                        {isSubmittable && (
                          <FileText className="h-5 w-5 text-blue-600" />
                        )}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>

            {/* Bottom Actions */}
            {activeTab === "documents" && (
              <div className="flex justify-end gap-3 mt-8 pt-6 border-t">
                <Button
                  size="lg"
                  className="gap-2 bg-[#2d3a8c] hover:bg-[#252f73] text-white"
                  disabled={submittableDocs.length === 0}
                  onClick={handleOpenSubmitDialog}
                >
                  <Send className="h-4 w-4" />
                  送件
                  {submittableDocs.length > 0 && (
                    <span className="ml-1 bg-white/20 text-white text-sm px-1.5 py-0.5 rounded-full">
                      {submittableDocs.length}
                    </span>
                  )}
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="quota" className="space-y-6 mt-6">
            {/* Quota Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-foreground">訓練醫院容額清單</h2>
                <Link href="/filing/quota/new">
                  <Button className="gap-1.5 bg-[#2d3a8c] hover:bg-[#252f73] text-white">
                    <Plus className="h-4 w-4" />
                    新增容額
                  </Button>
                </Link>
              </div>

              {/* Quota Hospitals Table */}
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="px-4 py-3 text-left whitespace-nowrap w-16">序號</th>
                      <th className="px-4 py-3 text-left whitespace-nowrap w-32">
                        醫事機構代碼
                      </th>
                      <th className="px-4 py-3 text-left">訓練醫院全銜</th>
                      <th className="px-4 py-3 text-left whitespace-nowrap w-24">
                        醫院所在地
                      </th>
                      <th className="px-4 py-3 text-center whitespace-nowrap w-36">效期</th>
                      <th className="px-4 py-3 text-center whitespace-nowrap">容額</th>
                      <th className="px-4 py-3 text-center whitespace-nowrap w-20">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      {
                        id: 1,
                        code: "0401180014",
                        name: "台大醫院",
                        county: "台北市",
                        expiry: "有效至 2026/7/31",
                        limit: 15,
                      },
                      {
                        id: 2,
                        code: "0401180015",
                        name: "台北榮民總醫院",
                        county: "台北市",
                        expiry: "有效至 2026/7/31",
                        limit: 12,
                      },
                    ].map((hospital) => (
                      <tr key={hospital.id} className="border-t">
                        <td className="px-4 py-4 text-muted-foreground whitespace-nowrap">
                          {hospital.id}
                        </td>
                        <td className="px-4 py-4 text-muted-foreground whitespace-nowrap">
                          {hospital.code}
                        </td>
                        <td className="px-4 py-4 font-medium text-foreground">
                          {hospital.name}
                        </td>
                        <td className="px-4 py-4 text-muted-foreground whitespace-nowrap">
                          {hospital.county}
                        </td>
                        <td className="px-4 py-4 text-center text-muted-foreground whitespace-nowrap">
                          {hospital.expiry}
                        </td>
                        <td className="px-4 py-4 text-center font-medium text-foreground">
                          {hospital.limit}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Disqualified Hospitals Section */}
              <div className="space-y-4 pt-6 border-t">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-foreground">不合格醫院</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => setShowAddDisqualifiedDialog(true)}
                  >
                    <Plus className="h-4 w-4" />
                    新增不合格醫院
                  </Button>
                </div>

                <div className="border rounded-lg">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="px-4 py-3 text-left whitespace-nowrap w-16">序號</th>
                        <th className="px-4 py-3 text-left">醫院名稱</th>
                        <th className="px-4 py-3 text-left">不合格原因</th>
                        <th className="px-4 py-3 text-center whitespace-nowrap w-20">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {disqualifiedHospitals.map((hospital, index) => (
                        <tr key={hospital.code} className="border-t">
                          <td className="px-4 py-4 text-muted-foreground whitespace-nowrap">
                            {index + 1}
                          </td>
                          <td className="px-4 py-4 font-medium text-foreground">
                            {hospital.name}
                          </td>
                          <td className="px-4 py-4 text-muted-foreground">
                            {hospital.reason}
                          </td>
                          <td className="px-4 py-4 text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Submit Dialog */}
      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>確認送件文件</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-96 overflow-y-auto">
            {submittableDocs.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50"
              >
                <Checkbox
                  id={`submit-${doc.id}`}
                  checked={selectedSubmitIds.includes(doc.id)}
                  onCheckedChange={() => toggleSubmitDoc(doc.id)}
                />
                <label
                  htmlFor={`submit-${doc.id}`}
                  className="flex-1 cursor-pointer"
                >
                  <p className="font-medium text-foreground">{doc.title}</p>
                  <p className="text-sm text-muted-foreground">
                    期限：{doc.deadline}
                  </p>
                </label>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowSubmitDialog(false)}
            >
              取消
            </Button>
            <Button
              className="bg-[#2d3a8c] hover:bg-[#252f73] text-white"
              onClick={handleConfirmSubmit}
              disabled={selectedSubmitIds.length === 0}
            >
              確認送件
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 新增不合格醫院 Dialog */}
      <Dialog
        open={showAddDisqualifiedDialog}
        onOpenChange={setShowAddDisqualifiedDialog}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>新增不合格醫院</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-sm text-muted-foreground mb-2 block">
                選擇醫院 <span className="text-destructive">*</span>
              </Label>
              <HospitalMultiSelect
                hospitals={availableHospitals as Hospital[]}
                selected={selectedDisqualifiedHospital}
                onSelect={setSelectedDisqualifiedHospital}
                mode="single"
                triggerLabel="請選擇不合格醫院"
              />
              {selectedDisqualifiedHospital.length > 0 && (
                <div className="mt-2 p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    已選擇：
                    <span className="font-medium text-foreground">
                      {
                        availableHospitals.find(
                          (h) => h.code === selectedDisqualifiedHospital[0]
                        )?.name
                      }
                    </span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    醫事機構代碼：{selectedDisqualifiedHospital[0]}
                  </p>
                </div>
              )}
            </div>
            <div>
              <Label className="text-sm text-muted-foreground mb-2 block">
                不合格原因 <span className="text-destructive">*</span>
              </Label>
              <Textarea
                value={disqualifiedReason}
                onChange={(e) => setDisqualifiedReason(e.target.value)}
                placeholder="請輸入不合格原因說明..."
                className="min-h-[120px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddDisqualifiedDialog(false)
                setSelectedDisqualifiedHospital([])
                setDisqualifiedReason("")
              }}
            >
              取消
            </Button>
            <Button
              className="bg-[#2d3a8c] hover:bg-[#252f73] text-white"
              disabled={
                selectedDisqualifiedHospital.length === 0 ||
                !disqualifiedReason.trim()
              }
              onClick={handleAddDisqualified}
            >
              確認新增
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export function FilingContent() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-muted-foreground">載入中...</div>
        </div>
      }
    >
      <FilingContentInner />
    </Suspense>
  )
}
