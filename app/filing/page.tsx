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
  HelpCircle,
} from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import Link from "next/link"
import { Textarea } from "@/components/ui/textarea"
import { HospitalMultiSelect, type Hospital } from "@/components/filing/hospital-multi-select"
import { AVAILABLE_HOSPITALS } from "@/components/filing/quota-form"
import { filingItemsConfig } from "@/lib/mock/review-outline"
import { quotaNotesStore } from "@/lib/stores/quota-notes-store"

// 西元年轉民國年，格式 114/7/31
function toRocDate(dateStr: string): string {
  if (!dateStr) return dateStr
  // 支援 "有效至 YYYY/M/D" 和 "N 年 (至 YYYY/M/D)" 和 "YYYY/M/D" 格式
  return dateStr.replace(/(\d{4})(\/\d{1,2}\/\d{1,2})/g, (_, year, rest) => {
    return `${Number(year) - 1911}${rest}`
  })
}

// 從 filingItemsConfig 建立開放狀態查詢表
const filingStatusMap = Object.fromEntries(
  filingItemsConfig.map((item) => [item.id, item.status])
)

const documents = [
  { id: "training-plan", title: "訓練計畫認定基準", status: "需補件", deadline: "114/03/31", latestAnnouncementDate: "114/09/03", latestAnnouncementNumber: "衛部醫字第1141660001號" },
  { id: "training-curriculum", title: "訓練課程基準", status: "尚未送出", deadline: "114/04/30", latestAnnouncementDate: "114/09/03", latestAnnouncementNumber: "衛部醫字第1141660002號" },
  { id: "evaluation-standards", title: "評核標準與評核表", status: "審查中", deadline: "114/04/15", latestAnnouncementDate: "113/10/01", latestAnnouncementNumber: "衛部醫字第1131660015號" },
  { id: "quota-allocation", title: "容額分配原則", status: "通過", deadline: "114/03/15", latestAnnouncementDate: "114/09/03", latestAnnouncementNumber: "衛部醫字第1141660003號" },
  { id: "improvement-guide", title: "精進指南", status: "待送件", deadline: "114/04/30", latestAnnouncementDate: "112/09/25", latestAnnouncementNumber: "衛部醫字第1121660008號" },
  { id: "screening-principle", title: "甄審原則", status: "通過", deadline: "114/03/15", latestAnnouncementDate: "114/09/03", latestAnnouncementNumber: "衛部醫字第1141660004號" },
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

export default function FilingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f5f7fa] p-8 text-center text-muted-foreground">載入中...</div>}>
      <FilingPageContent />
    </Suspense>
  )
}

function FilingPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const tabParam = searchParams.get("tab")
  const variant = searchParams.get("variant") || ""
  const [activeTab, setActiveTab] = useState<string>(
    tabParam === "quota" ? "quota" : "documents"
  )

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
    setSelectedSubmitIds(submittableDocs.map((d) => d.id))
    setShowSubmitDialog(true)
  }

  const handleConfirmSubmit = () => {
    setShowSubmitDialog(false)
    setSelectedSubmitIds([])
  }

  return (
    <div className="min-h-screen bg-[#f5f7fa]">
      <div className="container mx-auto px-6 py-4">
        <h1 className="text-2xl font-bold text-foreground">填報專區</h1>
        <p className="text-base text-muted-foreground mt-1">內科醫學會 - 2025年度</p>
      </div>

      <div className="container mx-auto px-6 pb-8">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="mb-6 h-11">
            <TabsTrigger value="documents" className="text-base px-6">文件填報</TabsTrigger>
            <TabsTrigger value="quota" className="text-base px-6">容額填報</TabsTrigger>
          </TabsList>

          <TabsContent value="documents">
            <div className="bg-card rounded-lg shadow-sm">
              <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-muted/50 border-b text-base font-medium text-muted-foreground">
                <div className="col-span-3">文件名稱</div>
                <div className="col-span-2">最近公告日期</div>
                <div className="col-span-3">最近公告文號</div>
                <div className="col-span-1 text-center">審查狀態</div>
                <div className="col-span-1 text-center">送件期限</div>
                <div className="col-span-2 text-right">操作</div>
              </div>
              <div className="divide-y">
                {documents.map((doc) => {
                  const filingOpen = filingStatusMap[doc.id] === "open"
                  return (
                    <div
                      key={doc.id}
                      className={`grid grid-cols-12 gap-4 px-6 py-5 items-center ${!filingOpen ? "bg-muted/20" : ""}`}
                    >
                      <div className="col-span-3">
                        <span className={`font-medium ${!filingOpen ? "text-muted-foreground" : "text-foreground"}`}>
                          {doc.title}
                        </span>
                      </div>
                      <div className="col-span-2 text-sm text-muted-foreground">
                        {doc.latestAnnouncementDate || "—"}
                      </div>
                      <div className="col-span-3 text-sm text-muted-foreground truncate">
                        {doc.latestAnnouncementNumber || "—"}
                      </div>
                      <div className={`col-span-1 text-center font-medium ${!filingOpen ? "text-muted-foreground/60" : getStatusStyle(doc.status)}`}>
                        {filingOpen ? doc.status : "尚未開放"}
                      </div>
                      <div className="col-span-1 text-center text-sm text-muted-foreground">
                        {filingOpen ? doc.deadline : "—"}
                      </div>
                      <div className="col-span-2 flex justify-end">
                        {filingOpen ? (
                          <Link href={`/filing/${doc.id}?status=${doc.status}`}>
                            {doc.status === "通過" || doc.status === "審查中" ? (
                              <Button size="sm" variant="outline" className="gap-2">
                                <FileText className="h-4 w-4" />
                                {doc.status === "通過" ? "已通過" : "審查中"}
                              </Button>
                            ) : doc.status === "尚未送出" ? (
                              <Button size="sm" className="gap-2 bg-[#2d3a8c] hover:bg-[#252f73] text-white">
                                <Edit3 className="h-4 w-4" />
                                開始填寫
                              </Button>
                            ) : (
                              <Button size="sm" className="gap-2 bg-[#2d3a8c] hover:bg-[#252f73] text-white">
                                <Edit3 className="h-4 w-4" />
                                編輯
                              </Button>
                            )}
                          </Link>
                        ) : (
                          <Link href={`/filing/${doc.id}?status=view`}>
                            <Button size="sm" variant="outline" className="gap-2 text-muted-foreground">
                              <FileText className="h-4 w-4" />
                              檢視前年度
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="quota">
            <FilingPageQuotaTab variant={variant} />
          </TabsContent>
        </Tabs>

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
      </div>

      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>選擇要送件的文件</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <p className="text-base text-muted-foreground mb-4">
              請勾選本次要送出審查的文件。送出後將無法再編輯，直到審查結果出爐。
            </p>
            {submittableDocs.length === 0 ? (
              <p className="text-base text-muted-foreground text-center py-6">目前沒有可送件的文件</p>
            ) : (
              <div className="space-y-2">
                {submittableDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                      selectedSubmitIds.includes(doc.id)
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/40"
                    }`}
                    onClick={() => toggleSubmitDoc(doc.id)}
                  >
                    <Checkbox
                      checked={selectedSubmitIds.includes(doc.id)}
                      onCheckedChange={() => toggleSubmitDoc(doc.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-base">{doc.title}</p>
                      <p className="text-base text-muted-foreground mt-0.5">
                        送件期限：{doc.deadline}　狀態：
                        <span className={getStatusStyle(doc.status)}>{doc.status}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowSubmitDialog(false)}>
              取消
            </Button>
            <Button
              className="gap-2 bg-[#2d3a8c] hover:bg-[#252f73] text-white"
              disabled={selectedSubmitIds.length === 0}
              onClick={handleConfirmSubmit}
            >
              <Send className="h-4 w-4" />
              確認送出 {selectedSubmitIds.length > 0 && `(${selectedSubmitIds.length} 件)`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>匯入檔案</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-base text-muted-foreground mb-3">
                請先下載範例文件，依照格式填寫後再上傳
              </p>
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="h-4 w-4" />
                下載範例文件 (.xlsx)
              </Button>
            </div>
            <div>
              <Label className="text-base font-medium mb-2 block">選擇檔案</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
                <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-base text-muted-foreground">點擊或拖曳檔案至此處上傳</p>
                <p className="text-base text-muted-foreground mt-1">支援 .xlsx, .xls 格式</p>
                <Input type="file" className="hidden" accept=".xlsx,.xls" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImportDialog(false)}>取消</Button>
            <Button className="bg-[#2d3a8c] hover:bg-[#252f73] text-white">上傳</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function FilingPageQuotaTab({ variant }: { variant: string }) {
  const router = useRouter()
  const availableHospitals = AVAILABLE_HOSPITALS
  const isInternalMedicine = variant === "internal-medicine"

  // 匯入 Dialog state
  const [showImportDialog, setShowImportDialog] = useState(false)
  const onOpenImport = () => setShowImportDialog(true)

  // 新增不合格醫院 Dialog state
  const [showAddDisqualifiedDialog, setShowAddDisqualifiedDialog] = useState(false)
  const [selectedDisqualifiedHospital, setSelectedDisqualifiedHospital] = useState<string[]>([])
  const [disqualifiedReason, setDisqualifiedReason] = useState("")
  // 編輯不合格醫院 Dialog state
  const [editingDisqualifiedId, setEditingDisqualifiedId] = useState<number | null>(null)
  const [editDisqualifiedReason, setEditDisqualifiedReason] = useState("")
  // 不合格醫院名單
  const [disqualifiedHospitals, setDisqualifiedHospitals] = useState([
    {
      id: 1,
      code: "0401350031",
      name: "彰化基督教醫院",
      reason: "訓練師資不足，未達評鑑標準",
    },
    {
      id: 2,
      code: "0401360032",
      name: "嘉義長庚醫院",
      reason: "訓練設備待改善，暫不合格",
    },
  ])

  // 新增未申請醫院 Dialog state
  const [showAddNotAppliedDialog, setShowAddNotAppliedDialog] = useState(false)
  const [selectedNotAppliedHospital, setSelectedNotAppliedHospital] = useState<string[]>([])
  const [notAppliedPrevQualification, setNotAppliedPrevQualification] = useState("")
  const [notAppliedReason, setNotAppliedReason] = useState("")
  // 編輯未申請醫院 Dialog state
  const [editingNotAppliedId, setEditingNotAppliedId] = useState<number | null>(null)
  const [editNotAppliedPrevQualification, setEditNotAppliedPrevQualification] = useState("")
  const [editNotAppliedReason, setEditNotAppliedReason] = useState("")
  const [notAppliedHospitals, setNotAppliedHospitals] = useState([
    {
      id: 1,
      code: "0401180021",
      name: "仁愛醫院",
      prevQualification: "具訓練資格",
      reason: "人力異動，暫停訓練計畫申請",
    },
    {
      id: 2,
      code: "0401180022",
      name: "和平醫院",
      prevQualification: "具訓練資格",
      reason: "機構評鑑期間，暫緩申請",
    },
  ])

  // 結核病計畫容額 state（僅 internal-medicine 版型使用）
  const [tbProgramHospitals, setTbProgramHospitals] = useState([
    {
      id: 1,
      code: "0401180014",
      name: "台大醫院",
      quotaLimit: 3,
      currentQuota: 2,
    },
  ])
  const [showAddTbProgramDialog, setShowAddTbProgramDialog] = useState(false)
  const [selectedTbProgramHospital, setSelectedTbProgramHospital] = useState<string[]>([])
  const [tbProgramQuotaLimit, setTbProgramQuotaLimit] = useState("")
  const [tbProgramCurrentQuota, setTbProgramCurrentQuota] = useState("")

  // 送件確認 Dialog state
  const [showSubmitConfirmDialog, setShowSubmitConfirmDialog] = useState(false)

  // 備註區塊 state
  const [manualNotes, setManualNotes] = useState<string[]>([])
  const [newNoteText, setNewNoteText] = useState("")
  const [isAddingNote, setIsAddingNote] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editingText, setEditingText] = useState("")

  // groupId: null = 單獨申請，string = 聯合/合併申請組合識別碼
  // 未來新增聯合申請組合只需指定相同 groupId 即可
  const [hospitals, setHospitals] = useState([
    // ── 單一機構申請 ──
    {
      id: 1,
      code: "0401180014",
      name: "台大醫院",
      county: "台北市",
      district: "中正區",
      expiry: "115/7/31",
      extension: "4 年 (至 119/7/31)",
      limit: 15,
      prevQuota: 5,
      currentQuota: 5,
      groupId: null as string | null,
      isSubRow: false,
      partnerHospitalCodes: [] as string[],
      applicationType: "single" as "single" | "joint" | "merged",
      mergedHospitalCodes: [] as string[],
    },
    {
      id: 2,
      code: "0401190015",
      name: "台北榮民總醫院",
      county: "台北市",
      district: "北投區",
      expiry: "115/7/31",
      extension: "-",
      limit: 12,
      prevQuota: 3,
      currentQuota: 4,
      groupId: null as string | null,
      isSubRow: false,
      partnerHospitalCodes: [] as string[],
      applicationType: "single" as "single" | "joint" | "merged",
      mergedHospitalCodes: [] as string[],
    },
    {
      id: 3,
      code: "0401200016",
      name: "三軍總醫院",
      county: "台北市",
      district: "內湖區",
      expiry: "113/7/31",
      extension: "4 年 (至 117/7/31)",
      limit: 10,
      prevQuota: 2,
      currentQuota: 3,
      groupId: null as string | null,
      isSubRow: false,
      partnerHospitalCodes: [] as string[],
      applicationType: "single" as "single" | "joint" | "merged",
      mergedHospitalCodes: [] as string[],
    },
    {
      id: 4,
      code: "0401280024",
      name: "中國醫藥大學附醫",
      county: "台中市",
      district: "北區",
      expiry: "115/7/31",
      extension: "4 年 (至 119/7/31)",
      limit: 8,
      prevQuota: 2,
      currentQuota: 2,
      groupId: null as string | null,
      isSubRow: false,
      partnerHospitalCodes: [] as string[],
      applicationType: "single" as "single" | "joint" | "merged",
      mergedHospitalCodes: [] as string[],
    },
    // ── 聯合申請 A 組：林口長庚（主）+ 中山醫大附醫 + 萬芳醫院（合作）──
    {
      id: "5.1",
      code: "0401260022",
      name: "林口長庚醫院",
      county: "桃園市",
      district: "龜山區",
      expiry: "115/7/31",
      extension: "4 年 (至 119/7/31)",
      limit: 15,
      prevQuota: 4,
      currentQuota: 5,
      groupId: "group-a",
      isSubRow: false,
      partnerHospitalCodes: ["0401270023", "0401240020"],
      applicationType: "joint" as "single" | "joint" | "merged",
      mergedHospitalCodes: [] as string[],
    },
    {
      id: "5.2",
      code: "0401270023",
      name: "中山醫學大學附醫",
      county: "台中市",
      district: "南區",
      expiry: "",
      extension: "",
      limit: null as number | null,
      prevQuota: null as number | null,
      currentQuota: null as number | null,
      groupId: "group-a",
      isSubRow: true,
      partnerHospitalCodes: [] as string[],
      applicationType: "joint" as "single" | "joint" | "merged",
      mergedHospitalCodes: [] as string[],
    },
    {
      id: "5.3",
      code: "0401240020",
      name: "萬芳醫院",
      county: "台北市",
      district: "文山區",
      expiry: "",
      extension: "",
      limit: null as number | null,
      prevQuota: null as number | null,
      currentQuota: null as number | null,
      groupId: "group-a",
      isSubRow: true,
      partnerHospitalCodes: [] as string[],
      applicationType: "joint" as "single" | "joint" | "merged",
      mergedHospitalCodes: [] as string[],
    },
    // ── 聯合申請 B 組：奇美醫院（主）+ 成大醫院（合作）──
    {
      id: "6.1",
      code: "0401300026",
      name: "奇美醫院",
      county: "台南市",
      district: "永康區",
      expiry: "114/7/31",
      extension: "2 年 (至 116/7/31)",
      limit: 9,
      prevQuota: 3,
      currentQuota: 4,
      groupId: "group-b",
      isSubRow: false,
      partnerHospitalCodes: ["0401310027"],
      applicationType: "joint" as "single" | "joint" | "merged",
      mergedHospitalCodes: [] as string[],
    },
    {
      id: "6.2",
      code: "0401310027",
      name: "成大醫院",
      county: "台南市",
      district: "東區",
      expiry: "",
      extension: "",
      limit: null as number | null,
      prevQuota: null as number | null,
      currentQuota: null as number | null,
      groupId: "group-b",
      isSubRow: true,
      partnerHospitalCodes: [] as string[],
      applicationType: "joint" as "single" | "joint" | "merged",
      mergedHospitalCodes: [] as string[],
    },
    // ── 合併申請：高雄長庚 + 高雄榮總 → 顯示為「高雄聯合訓練中心」──
    {
      id: 7,
      code: "merged-001",
      name: "高雄聯合訓練中心",
      county: "高雄市",
      district: "左營區",
      expiry: "115/7/31",
      extension: "4 年 (至 119/7/31)",
      limit: 18,
      prevQuota: 6,
      currentQuota: 7,
      groupId: null as string | null,
      isSubRow: false,
      partnerHospitalCodes: [] as string[],
      applicationType: "merged" as "single" | "joint" | "merged",
      mergedHospitalCodes: ["0401320028", "0401330029"],
    },
    // ── 單一機構申請（繼續）──
    {
      id: 8,
      code: "0401290025",
      name: "台中榮民總醫院",
      county: "台中市",
      district: "西屯區",
      expiry: "115/7/31",
      extension: "-",
      limit: 11,
      prevQuota: 4,
      currentQuota: 4,
      groupId: null as string | null,
      isSubRow: false,
      partnerHospitalCodes: [] as string[],
      applicationType: "single" as "single" | "joint" | "merged",
      mergedHospitalCodes: [] as string[],
    },
    {
      id: 9,
      code: "0401340030",
      name: "高雄醫學大學附醫",
      county: "高雄市",
      district: "三民區",
      expiry: "114/7/31",
      extension: "4 年 (至 118/7/31)",
      limit: 7,
      prevQuota: 2,
      currentQuota: 3,
      groupId: null as string | null,
      isSubRow: false,
      partnerHospitalCodes: [] as string[],
      applicationType: "single" as "single" | "joint" | "merged",
      mergedHospitalCodes: [] as string[],
    },
  ])

  // 為每個不重複的 groupId 分配一個顏色，方便日後擴充多組聯合申請
  const groupColors: Record<string, string> = {}
  const palette = [
    "border-l-violet-400 bg-violet-50/40",
    "border-l-teal-400 bg-teal-50/40",
    "border-l-orange-400 bg-orange-50/40",
    "border-l-pink-400 bg-pink-50/40",
  ]
  let colorIndex = 0
  for (const h of hospitals) {
    if (h.groupId && !groupColors[h.groupId]) {
      groupColors[h.groupId] = palette[colorIndex % palette.length]
      colorIndex++
    }
  }

  // 統計數字計算
  const mainRows = hospitals.filter((h) => !h.isSubRow)
  const mainTrainingCount = mainRows.filter((h) => !h.groupId).length
  const cooperationCount = mainRows.reduce((acc, h) => acc + (h.partnerHospitalCodes?.length ?? 0), 0)
  const totalApplied = mainRows.length
  const disqualifiedCount = disqualifiedHospitals.length
  const qualifiedCount = totalApplied - disqualifiedCount
  const notAppliedCount = notAppliedHospitals.length

  // 合計（只計主列，不計子列）
  const mainHospitals = hospitals.filter((h) => !h.isSubRow)
  const totalLimit = mainHospitals.reduce((sum, h) => sum + (h.limit ?? 0), 0)
  const totalPrevQuota = mainHospitals.reduce((sum, h) => sum + (h.prevQuota ?? 0), 0)
  const totalCurrentQuota = mainHospitals.reduce((sum, h) => sum + (h.currentQuota ?? 0), 0)

  return (
    <div className="space-y-8">
      {/* 訓練醫院申請家數統計 */}
      <div>
        <h3 className="text-lg font-bold text-foreground mb-4">訓練醫院申請家數</h3>
        <div className="grid grid-cols-3 gap-4">
          {/* 申請家數（含子分類：合格/不合格） */}
          <div className="rounded-lg border border-blue-200 overflow-hidden bg-blue-50 flex">
            {/* 左：申請總數 */}
            <div className="flex-1 px-5 py-4 flex flex-col justify-center">
              <p className="text-sm text-blue-600 mb-1">申請家數</p>
              <p className="text-3xl font-bold text-blue-700">{totalApplied}</p>
              <p className="text-sm text-blue-600/70 mt-1.5">
                {mainTrainingCount} 家主訓、{cooperationCount} 家合作
              </p>
            </div>
            {/* 右：合格/不合格 上下堆疊 */}
            <div className="flex flex-col divide-y divide-blue-200 border-l border-blue-200 w-28">
              <div className="px-4 py-3 bg-green-50/80 flex-1 flex flex-col justify-center">
                <p className="text-sm text-green-600 mb-0.5">合格</p>
                <p className="text-xl font-bold text-green-700">{qualifiedCount}</p>
              </div>
              <div className={`px-4 py-3 flex-1 flex flex-col justify-center ${disqualifiedCount > 0 ? "bg-red-50/80" : "bg-gray-50/60"}`}>
                <p className={`text-sm mb-0.5 ${disqualifiedCount > 0 ? "text-red-600" : "text-gray-500"}`}>不合格</p>
                <p className={`text-xl font-bold ${disqualifiedCount > 0 ? "text-red-700" : "text-gray-400"}`}>{disqualifiedCount}</p>
              </div>
            </div>
          </div>

          {/* 未申請家數 */}
          <div className={`rounded-lg border px-5 py-4 flex flex-col justify-center ${notAppliedCount > 0 ? "bg-amber-50 border-amber-200" : "bg-gray-50 border-gray-100"}`}>
            <p className={`text-sm mb-1 ${notAppliedCount > 0 ? "text-amber-600" : "text-gray-500"}`}>未申請家數</p>
            <p className={`text-3xl font-bold ${notAppliedCount > 0 ? "text-amber-700" : "text-gray-400"}`}>{notAppliedCount}</p>
          </div>

          {/* 佔位 - 保持三欄對齊 */}
          <div></div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">專科醫師訓練醫院認定合格名冊及訓練容量</h2>
        <div className="flex items-center gap-3">
          <Link href={variant ? `/filing/quota/new?variant=${variant}` : "/filing/quota/new"}>
            <Button className="gap-2 bg-[#2d3a8c] hover:bg-[#252f73] text-white">
              <Plus className="h-4 w-4" />
              新增醫院
            </Button>
          </Link>
          <Button
            variant="outline"
            className="gap-2"
            onClick={onOpenImport}
          >
            <Upload className="h-4 w-4" />
            匯入檔案
          </Button>
        </div>
      </div>

      <div className="bg-card rounded-lg shadow-sm overflow-hidden relative">
        {/* 右側漸層陰影提示可橫向滑動 */}
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-card to-transparent z-10" />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="bg-muted/50 border-b text-sm font-medium text-muted-foreground">
                {/* 固定首兩欄：編號 + 醫院名稱 */}
                <th className="px-2 py-2.5 text-left whitespace-nowrap w-10 sticky left-0 bg-muted/50 z-20">編號</th>
                <th className="px-2 py-2.5 text-left whitespace-nowrap min-w-[120px] sticky left-10 bg-muted/50 z-20 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]">醫院名稱</th>
                <th className="px-2 py-2.5 text-left whitespace-nowrap">醫事機構代碼</th>
                <th className="px-2 py-2.5 text-left whitespace-nowrap">所在地</th>
                <th className="px-2 py-2.5 text-center whitespace-nowrap">前年度核定</th>
                <th className="px-2 py-2.5 text-center whitespace-nowrap">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="inline-flex items-center gap-0.5 cursor-default">
                          可收訓容額
                          <HelpCircle className="h-3 w-3 text-muted-foreground/70" />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs text-sm" side="top">
                        係指醫院實際訓練量能，最大訓練容量之容額數
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </th>
                <th className="px-2 py-2.5 text-center whitespace-nowrap">建議分配</th>
                <th className="px-2 py-2.5 text-center whitespace-nowrap">資格效期</th>
                <th className="px-2 py-2.5 text-center whitespace-nowrap">延長效期</th>
                <th className="px-2 py-2.5 text-center whitespace-nowrap">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {hospitals.map((hospital) => {
                const groupStyle = hospital.groupId ? groupColors[hospital.groupId] : ""
                // 移除「有效至」前綴
                const expiryDate = hospital.expiry?.replace("有效至 ", "") || "—"
                return (
                <tr
                  key={hospital.id}
                  className={`hover:bg-muted/30 ${groupStyle ? `border-l-4 ${groupStyle}` : ""}`}
                >
                  {/* 固定首兩欄 */}
                  <td className="px-2 py-3 text-sm text-muted-foreground whitespace-nowrap sticky left-0 bg-card z-10">{hospital.id}</td>
                  <td className="px-2 py-3 text-sm font-medium whitespace-nowrap sticky left-10 bg-card z-10 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.08)]">
                    {hospital.applicationType === "joint" && (
                      <span className="text-muted-foreground mr-1">[聯]</span>
                    )}
                    {hospital.applicationType === "merged" && (
                      <span className="text-muted-foreground mr-1">[併]</span>
                    )}
                    {quotaNotesStore.hospitalNotes[String(hospital.id)] && (
                      <span className="text-destructive mr-0.5" title="此醫院有備註">*</span>
                    )}
                    {hospital.name}
                  </td>
                  <td className="px-2 py-3 text-sm text-muted-foreground whitespace-nowrap">{hospital.code}</td>
                  <td className="px-2 py-3 text-sm whitespace-nowrap">
                    {hospital.county ? (
                      <span className="text-foreground">{hospital.county}</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-2 py-3 text-sm text-center whitespace-nowrap">{hospital.prevQuota}</td>
                  <td className="px-2 py-3 text-sm text-center whitespace-nowrap">{hospital.limit}</td>
                  <td className="px-2 py-3 text-sm text-center whitespace-nowrap">{hospital.currentQuota}</td>
                  <td className="px-2 py-3 text-sm text-center text-muted-foreground whitespace-nowrap">
                    {expiryDate}
                  </td>
                  <td className="px-2 py-3 text-sm text-center text-muted-foreground whitespace-nowrap">
                    {hospital.extension}
                  </td>
                  <td className="px-2 py-3 text-sm text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-2">
                      {!("isSubRow" in hospital && hospital.isSubRow) && (
                        <Link href={`/filing/quota/${hospital.id}`}>
                          <Button variant="link" className="text-primary p-0 h-auto text-sm">
                            編輯
                          </Button>
                        </Link>
                      )}
                      <Button
                        variant="link"
                        className="text-destructive p-0 h-auto hover:text-destructive/80 text-sm"
                        onClick={() => {
                          setHospitals((prev) => {
                            const target = prev.find((h) => h.id === hospital.id)
                            const groupId = target?.groupId
                            return prev.filter((h) =>
                              h.id !== hospital.id &&
                              !(groupId && h.groupId === groupId && h.isSubRow)
                            )
                          })
                        }}
                      >
                        刪除
                      </Button>
                    </div>
                  </td>
                </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="bg-muted/60 border-t-2 border-border">
                <td className="px-2 py-2.5 text-sm font-semibold text-foreground sticky left-0 bg-muted/60 z-10">合計</td>
                <td className="px-2 py-2.5 sticky left-10 bg-muted/60 z-10 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]"></td>
                <td className="px-2 py-2.5"></td>
                <td className="px-2 py-2.5"></td>
                <td className="px-2 py-2.5 text-sm text-center font-bold text-foreground">{totalPrevQuota}</td>
                <td className="px-2 py-2.5 text-sm text-center font-bold text-foreground">{totalLimit}</td>
                <td className="px-2 py-2.5 text-sm text-center font-bold text-foreground">{totalCurrentQuota}</td>
                <td className="px-2 py-2.5"></td>
                <td className="px-2 py-2.5"></td>
                <td className="px-2 py-2.5"></td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* 結核病計畫容額（僅 internal-medicine 版型顯示） */}
      {isInternalMedicine && (
        <div id="tb-program-section">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-foreground">結核病計畫容額</h3>
            <div className="flex items-center gap-3">
              <Button
                className="gap-2 bg-[#2d3a8c] hover:bg-[#252f73] text-white"
                onClick={() => setShowAddTbProgramDialog(true)}
              >
                <Plus className="h-4 w-4" />
                新增醫院
              </Button>
              <Button
                variant="outline"
                className="gap-2"
                onClick={onOpenImport}
              >
                <Upload className="h-4 w-4" />
                匯入名單
              </Button>
            </div>
          </div>

          {/* 新增結核病計畫容額 Dialog */}
          <Dialog open={showAddTbProgramDialog} onOpenChange={setShowAddTbProgramDialog}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>新增結核病計畫容額</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label className="text-sm text-muted-foreground mb-2 block">
                    選擇醫院 <span className="text-destructive">*</span>
                  </Label>
                  <HospitalMultiSelect
                    hospitals={availableHospitals as Hospital[]}
                    selected={selectedTbProgramHospital}
                    onSelect={setSelectedTbProgramHospital}
                    mode="single"
                    triggerLabel="請選擇訓練醫院"
                  />
                  {selectedTbProgramHospital.length > 0 && (
                    <div className="mt-2 p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        已選擇：<span className="font-medium text-foreground">
                          {availableHospitals.find((h) => h.code === selectedTbProgramHospital[0])?.name}
                        </span>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        醫事機構代碼：{selectedTbProgramHospital[0]}
                      </p>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground mb-2 block">
                      可收訓容額 <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      type="number"
                      value={tbProgramQuotaLimit}
                      onChange={(e) => setTbProgramQuotaLimit(e.target.value)}
                      min={1}
                      max={50}
                      placeholder="1~50"
                    />
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground mb-2 block">
                      建議分配容額 <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      type="number"
                      value={tbProgramCurrentQuota}
                      onChange={(e) => setTbProgramCurrentQuota(e.target.value)}
                      min={1}
                      max={50}
                      placeholder="1~50"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddTbProgramDialog(false)
                    setSelectedTbProgramHospital([])
                    setTbProgramQuotaLimit("")
                    setTbProgramCurrentQuota("")
                  }}
                >
                  取消
                </Button>
                <Button
                  className="bg-[#2d3a8c] hover:bg-[#252f73] text-white"
                  disabled={
                    selectedTbProgramHospital.length === 0 ||
                    !tbProgramQuotaLimit ||
                    Number(tbProgramQuotaLimit) < 1 ||
                    Number(tbProgramQuotaLimit) > 50 ||
                    !tbProgramCurrentQuota ||
                    Number(tbProgramCurrentQuota) < 1 ||
                    Number(tbProgramCurrentQuota) > 50
                  }
                  onClick={() => {
                    const hospital = availableHospitals.find(
                      (h) => h.code === selectedTbProgramHospital[0]
                    )
                    if (!hospital) return
                    setTbProgramHospitals((prev) => [
                      ...prev,
                      {
                        id: prev.length + 1,
                        code: hospital.code,
                        name: hospital.name,
                        quotaLimit: Number(tbProgramQuotaLimit),
                        currentQuota: Number(tbProgramCurrentQuota),
                      },
                    ])
                    setShowAddTbProgramDialog(false)
                    setSelectedTbProgramHospital([])
                    setTbProgramQuotaLimit("")
                    setTbProgramCurrentQuota("")
                  }}
                >
                  確認新增
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <div className="bg-card rounded-lg shadow-sm overflow-hidden relative">
            <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-card to-transparent z-10" />
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/50 border-b text-sm font-medium text-muted-foreground">
                    <th className="px-2 py-2.5 text-left whitespace-nowrap w-10 sticky left-0 bg-muted/50 z-20">編號</th>
                    <th className="px-2 py-2.5 text-left whitespace-nowrap min-w-[100px] sticky left-10 bg-muted/50 z-20 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]">醫院名稱</th>
                    <th className="px-2 py-2.5 text-left whitespace-nowrap">醫事機構代碼</th>
                    <th className="px-2 py-2.5 text-center whitespace-nowrap">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="inline-flex items-center gap-0.5 cursor-default">
                              可收訓容額
                              <HelpCircle className="h-3 w-3 text-muted-foreground/70" />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs text-sm" side="top">
                            係指醫院實際訓練量能，最大訓練容量之容額數
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </th>
                    <th className="px-2 py-2.5 text-center whitespace-nowrap">建議分配</th>
                    <th className="px-2 py-2.5 text-center whitespace-nowrap">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {tbProgramHospitals.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                        尚無結核病計畫容額資料，請點選「新增醫院」或「匯入名單」
                      </td>
                    </tr>
                  ) : (
                    tbProgramHospitals.map((hospital) => (
                      <tr key={hospital.id}>
                        <td className="px-2 py-3 text-sm text-muted-foreground whitespace-nowrap sticky left-0 bg-card z-10">{hospital.id}</td>
                        <td className="px-2 py-3 text-sm font-medium whitespace-nowrap sticky left-10 bg-card z-10 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.08)]">{hospital.name}</td>
                        <td className="px-2 py-3 text-sm text-muted-foreground whitespace-nowrap">{hospital.code}</td>
                        <td className="px-2 py-3 text-sm text-center whitespace-nowrap">{hospital.quotaLimit}</td>
                        <td className="px-2 py-3 text-sm text-center whitespace-nowrap">{hospital.currentQuota}</td>
                        <td className="px-2 py-3 text-sm text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              variant="link"
                              className="text-primary p-0 h-auto text-sm"
                              onClick={() => {
                                // TODO: 編輯功能
                              }}
                            >
                              編輯
                            </Button>
                            <Button
                              variant="link"
                              className="text-destructive p-0 h-auto hover:text-destructive/80 text-sm"
                              onClick={() =>
                                setTbProgramHospitals((prev) =>
                                  prev
                                    .filter((h) => h.id !== hospital.id)
                                    .map((h, i) => ({ ...h, id: i + 1 }))
                                )
                              }
                            >
                              刪除
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {tbProgramHospitals.length > 0 && (
                  <tfoot>
                    <tr className="bg-muted/30 border-t">
                      <td className="px-2 py-2.5 text-sm font-semibold text-foreground sticky left-0 bg-muted/30 z-10">合計</td>
                      <td className="px-2 py-2.5 sticky left-10 bg-muted/30 z-10 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]"></td>
                      <td className="px-2 py-2.5"></td>
                      <td className="px-2 py-2.5 text-sm text-center font-bold text-foreground">
                        {tbProgramHospitals.reduce((sum, h) => sum + h.quotaLimit, 0)}
                      </td>
                      <td className="px-2 py-2.5 text-sm text-center font-bold text-foreground">
                        {tbProgramHospitals.reduce((sum, h) => sum + h.currentQuota, 0)}
                      </td>
                      <td />
                    </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>
      )}

      <div id="disqualified-section">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-foreground">不合格醫院名單</h3>
          <div className="flex items-center gap-3">
            <Button
              className="gap-2 bg-[#2d3a8c] hover:bg-[#252f73] text-white"
              onClick={() => setShowAddDisqualifiedDialog(true)}
            >
              <Plus className="h-4 w-4" />
              新增不合格醫院
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              onClick={onOpenImport}
            >
              <Upload className="h-4 w-4" />
              匯入名單
            </Button>
          </div>
        </div>

        {/* 新增不合格醫院 Dialog */}
        <Dialog open={showAddDisqualifiedDialog} onOpenChange={setShowAddDisqualifiedDialog}>
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
                      已選擇：<span className="font-medium text-foreground">
                        {availableHospitals.find((h) => h.code === selectedDisqualifiedHospital[0])?.name}
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
                disabled={selectedDisqualifiedHospital.length === 0 || !disqualifiedReason.trim()}
                onClick={() => {
                  // TODO: 實際新增邏輯
                  setShowAddDisqualifiedDialog(false)
                  setSelectedDisqualifiedHospital([])
                  setDisqualifiedReason("")
                }}
              >
                確認新增
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {/* 編輯不合格醫院 Dialog */}
        <Dialog
          open={editingDisqualifiedId !== null}
          onOpenChange={(open) => {
            if (!open) {
              setEditingDisqualifiedId(null)
              setEditDisqualifiedReason("")
            }
          }}
        >
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>編輯不合格醫院</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {editingDisqualifiedId !== null && (() => {
                const h = disqualifiedHospitals.find((h) => h.id === editingDisqualifiedId)
                if (!h) return null
                return (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm font-medium text-foreground">{h.name}</p>
                    <p className="text-sm text-muted-foreground">醫事機構代碼：{h.code}</p>
                  </div>
                )
              })()}
              <div>
                <Label className="text-sm text-muted-foreground mb-2 block">
                  不合格原因 <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  value={editDisqualifiedReason}
                  onChange={(e) => setEditDisqualifiedReason(e.target.value)}
                  placeholder="請輸入不合格原因說明..."
                  className="min-h-[120px]"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setEditingDisqualifiedId(null)
                  setEditDisqualifiedReason("")
                }}
              >
                取消
              </Button>
              <Button
                className="bg-[#2d3a8c] hover:bg-[#252f73] text-white"
                disabled={!editDisqualifiedReason.trim()}
                onClick={() => {
                  setDisqualifiedHospitals((prev) =>
                    prev.map((h) =>
                      h.id === editingDisqualifiedId
                        ? { ...h, reason: editDisqualifiedReason }
                        : h
                    )
                  )
                  setEditingDisqualifiedId(null)
                  setEditDisqualifiedReason("")
                }}
              >
                儲存
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="bg-card rounded-lg shadow-sm overflow-hidden relative">
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-card to-transparent z-10" />
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/50 border-b text-sm font-medium text-muted-foreground">
                  <th className="px-2 py-2.5 text-left whitespace-nowrap w-10 sticky left-0 bg-muted/50 z-20">編號</th>
                  <th className="px-2 py-2.5 text-left whitespace-nowrap min-w-[100px] sticky left-10 bg-muted/50 z-20 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]">醫院名稱</th>
                  <th className="px-2 py-2.5 text-left whitespace-nowrap">醫事機構代碼</th>
                  <th className="px-2 py-2.5 text-left">不合格原因</th>
                  <th className="px-2 py-2.5 text-center whitespace-nowrap">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {disqualifiedHospitals.map((hospital) => (
                  <tr key={hospital.id}>
                    <td className="px-2 py-3 text-sm text-muted-foreground whitespace-nowrap sticky left-0 bg-card z-10">{hospital.id}</td>
                    <td className="px-2 py-3 text-sm font-medium whitespace-nowrap sticky left-10 bg-card z-10 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.08)]">{hospital.name}</td>
                    <td className="px-2 py-3 text-sm text-muted-foreground whitespace-nowrap">{hospital.code}</td>
                    <td className="px-2 py-3 text-sm text-muted-foreground">{hospital.reason}</td>
                    <td className="px-2 py-3 text-sm text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="link"
                          className="text-primary p-0 h-auto text-sm"
                          onClick={() => {
                            setEditingDisqualifiedId(hospital.id)
                            setEditDisqualifiedReason(hospital.reason)
                          }}
                        >
                          編輯
                        </Button>
                        <Button
                          variant="link"
                          className="text-destructive p-0 h-auto hover:text-destructive/80 text-sm"
                          onClick={() =>
                            setDisqualifiedHospitals((prev) =>
                              prev
                                .filter((h) => h.id !== hospital.id)
                                .map((h, i) => ({ ...h, id: i + 1 }))
                            )
                          }
                        >
                          刪除
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 未申請醫院名單 */}
      <div id="not-applied-section">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-foreground">未申請醫院名單</h3>
          <p className="text-sm text-muted-foreground mt-1">指前一年度為合格訓練醫院，惟本年度未提出申請之醫院。</p>
        </div>
          <div className="flex items-center gap-3 mt-0.5">
            <Button
              className="gap-2 bg-[#2d3a8c] hover:bg-[#252f73] text-white"
              onClick={() => setShowAddNotAppliedDialog(true)}
            >
              <Plus className="h-4 w-4" />
              新增未申請醫院
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              onClick={onOpenImport}
            >
              <Upload className="h-4 w-4" />
              匯入名單
            </Button>
          </div>
        </div>

        {/* 新增未申請醫院 Dialog */}
        <Dialog open={showAddNotAppliedDialog} onOpenChange={setShowAddNotAppliedDialog}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>新增未申請醫院</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label className="text-sm text-muted-foreground mb-2 block">
                  選擇醫院 <span className="text-destructive">*</span>
                </Label>
                <HospitalMultiSelect
                  hospitals={availableHospitals as Hospital[]}
                  selected={selectedNotAppliedHospital}
                  onSelect={setSelectedNotAppliedHospital}
                  mode="single"
                  triggerLabel="請選擇未申請醫院"
                />
                {selectedNotAppliedHospital.length > 0 && (
                  <div className="mt-2 p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      已選擇：<span className="font-medium text-foreground">
                        {availableHospitals.find((h) => h.code === selectedNotAppliedHospital[0])?.name}
                      </span>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      醫事機構代碼：{selectedNotAppliedHospital[0]}
                    </p>
                  </div>
                )}
              </div>
              <div>
                <Label className="text-sm text-muted-foreground mb-2 block">
                  前一年度訓練資格 <span className="text-destructive">*</span>
                </Label>
                <Select value={notAppliedPrevQualification} onValueChange={setNotAppliedPrevQualification}>
                  <SelectTrigger>
                    <SelectValue placeholder="請選擇前一年度訓練資格" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="具訓練資格">具訓練資格</SelectItem>
                    <SelectItem value="不具訓練資格">不具訓練資格</SelectItem>
                    <SelectItem value="初次申請">初次申請</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground mb-2 block">
                  未申請原因 <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  value={notAppliedReason}
                  onChange={(e) => setNotAppliedReason(e.target.value)}
                  placeholder="請輸入未申請原因說明..."
                  className="min-h-[120px]"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddNotAppliedDialog(false)
                  setSelectedNotAppliedHospital([])
                  setNotAppliedPrevQualification("")
                  setNotAppliedReason("")
                }}
              >
                取消
              </Button>
              <Button
                className="bg-[#2d3a8c] hover:bg-[#252f73] text-white"
                disabled={
                  selectedNotAppliedHospital.length === 0 ||
                  !notAppliedPrevQualification ||
                  !notAppliedReason.trim()
                }
                onClick={() => {
                  const hospital = availableHospitals.find(
                    (h) => h.code === selectedNotAppliedHospital[0]
                  )
                  if (!hospital) return
                  setNotAppliedHospitals((prev) => [
                    ...prev,
                    {
                      id: prev.length + 1,
                      code: hospital.code,
                      name: hospital.name,
                      prevQualification: notAppliedPrevQualification,
                      reason: notAppliedReason,
                    },
                  ])
                  setShowAddNotAppliedDialog(false)
                  setSelectedNotAppliedHospital([])
                  setNotAppliedPrevQualification("")
                  setNotAppliedReason("")
                }}
              >
                確認新增
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 編輯未申請醫院 Dialog */}
        <Dialog
          open={editingNotAppliedId !== null}
          onOpenChange={(open) => {
            if (!open) {
              setEditingNotAppliedId(null)
              setEditNotAppliedPrevQualification("")
              setEditNotAppliedReason("")
            }
          }}
        >
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>編輯未申請醫院</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {editingNotAppliedId !== null && (() => {
                const h = notAppliedHospitals.find((h) => h.id === editingNotAppliedId)
                if (!h) return null
                return (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm font-medium text-foreground">{h.name}</p>
                    <p className="text-sm text-muted-foreground">醫事機構代碼：{h.code}</p>
                  </div>
                )
              })()}
              <div>
                <Label className="text-sm text-muted-foreground mb-2 block">
                  前一年度訓練資格 <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={editNotAppliedPrevQualification}
                  onValueChange={setEditNotAppliedPrevQualification}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="請選擇前一年度訓練資格" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="具訓練資格">具訓練資格</SelectItem>
                    <SelectItem value="不具訓練資格">不具訓練資格</SelectItem>
                    <SelectItem value="初次申請">初次申請</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground mb-2 block">
                  未申請原因 <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  value={editNotAppliedReason}
                  onChange={(e) => setEditNotAppliedReason(e.target.value)}
                  placeholder="請輸入未申請原因說明..."
                  className="min-h-[120px]"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setEditingNotAppliedId(null)
                  setEditNotAppliedPrevQualification("")
                  setEditNotAppliedReason("")
                }}
              >
                取消
              </Button>
              <Button
                className="bg-[#2d3a8c] hover:bg-[#252f73] text-white"
                disabled={!editNotAppliedPrevQualification || !editNotAppliedReason.trim()}
                onClick={() => {
                  setNotAppliedHospitals((prev) =>
                    prev.map((h) =>
                      h.id === editingNotAppliedId
                        ? {
                            ...h,
                            prevQualification: editNotAppliedPrevQualification,
                            reason: editNotAppliedReason,
                          }
                        : h
                    )
                  )
                  setEditingNotAppliedId(null)
                  setEditNotAppliedPrevQualification("")
                  setEditNotAppliedReason("")
                }}
              >
                儲存
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="bg-card rounded-lg shadow-sm overflow-hidden relative">
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-card to-transparent z-10" />
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/50 border-b text-sm font-medium text-muted-foreground">
                  <th className="px-2 py-2.5 text-left whitespace-nowrap w-10 sticky left-0 bg-muted/50 z-20">編號</th>
                  <th className="px-2 py-2.5 text-left whitespace-nowrap min-w-[100px] sticky left-10 bg-muted/50 z-20 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]">醫院名稱</th>
                  <th className="px-2 py-2.5 text-left whitespace-nowrap">醫事機構代碼</th>
                  <th className="px-2 py-2.5 text-left whitespace-nowrap">前一年度訓練資格</th>
                  <th className="px-2 py-2.5 text-left">未申請原因</th>
                  <th className="px-2 py-2.5 text-center whitespace-nowrap">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {notAppliedHospitals.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      尚無未申請醫院資料，請點選「新增未申請醫院」或「匯入名單」
                    </td>
                  </tr>
                ) : (
                  notAppliedHospitals.map((hospital) => (
                    <tr key={hospital.id}>
                      <td className="px-2 py-3 text-sm text-muted-foreground whitespace-nowrap sticky left-0 bg-card z-10">{hospital.id}</td>
                      <td className="px-2 py-3 text-sm font-medium whitespace-nowrap sticky left-10 bg-card z-10 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.08)]">{hospital.name}</td>
                      <td className="px-2 py-3 text-sm text-muted-foreground whitespace-nowrap">{hospital.code}</td>
                      <td className="px-2 py-3 whitespace-nowrap">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          hospital.prevQualification === "具訓練資格"
                            ? "bg-green-50 text-green-700"
                            : hospital.prevQualification === "不具訓練資格"
                            ? "bg-red-50 text-red-700"
                            : "bg-gray-100 text-gray-600"
                        }`}>
                          {hospital.prevQualification}
                        </span>
                      </td>
                      <td className="px-2 py-3 text-sm text-muted-foreground">{hospital.reason}</td>
                      <td className="px-2 py-3 text-sm text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="link"
                            className="text-primary p-0 h-auto text-sm"
                            onClick={() => {
                              setEditingNotAppliedId(hospital.id)
                              setEditNotAppliedPrevQualification(hospital.prevQualification)
                              setEditNotAppliedReason(hospital.reason)
                            }}
                          >
                            編輯
                          </Button>
                          <Button
                            variant="link"
                            className="text-destructive p-0 h-auto hover:text-destructive/80 text-sm"
                            onClick={() =>
                              setNotAppliedHospitals((prev) =>
                                prev
                                  .filter((h) => h.id !== hospital.id)
                                  .map((h, i) => ({ ...h, id: i + 1 }))
                              )
                            }
                          >
                            刪除
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 備註區塊 */}
      {(() => {
        // 自動備註 1：從 store 中有備註的非子列醫院
        const hospitalAutoNotes = hospitals
          .filter((h) => !h.isSubRow && quotaNotesStore.hospitalNotes[String(h.id)])
          .map((h) => ({
            type: "hospital" as const,
            hospitalId: String(h.id),
            content: quotaNotesStore.hospitalNotes[String(h.id)],
          }))

        // 自動備註 2：不合格醫院名單 — 每筆產生一則「{醫院名}{不合格原因}」
        const disqualifiedAutoNotes = disqualifiedHospitals.map((h) => ({
          type: "disqualified" as const,
          hospitalId: String(h.id),
          content: `${h.name}${h.reason}`,
        }))

        // 自動備註 3：未申請醫院名單 — 每筆產生一則「{醫院名}未申請原因：{reason}」
        const notAppliedAutoNotes = notAppliedHospitals.map((h) => ({
          type: "notApplied" as const,
          hospitalId: String(h.id),
          content: `${h.name}未申請原因：${h.reason}`,
        }))

        const autoNotes = [...hospitalAutoNotes, ...disqualifiedAutoNotes, ...notAppliedAutoNotes]

        const handleAddNote = () => {
          if (!newNoteText.trim()) return
          const updated = [...manualNotes, newNoteText.trim()]
          setManualNotes(updated)
          setNewNoteText("")
          setIsAddingNote(false)
        }

        const handleDeleteManual = (idx: number) => {
          setManualNotes((prev) => prev.filter((_, i) => i !== idx))
        }

        const handleSaveEdit = (idx: number) => {
          if (!editingText.trim()) return
          setManualNotes((prev) => prev.map((n, i) => (i === idx ? editingText.trim() : n)))
          setEditingIndex(null)
          setEditingText("")
        }

        const totalCount = manualNotes.length + autoNotes.length

        return (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-foreground">備註</h3>
              {!isAddingNote && (
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => setIsAddingNote(true)}
                >
                  <Plus className="h-4 w-4" />
                  新增備註
                </Button>
              )}
            </div>

            <div className="bg-card rounded-lg shadow-sm overflow-hidden">
              {totalCount === 0 && !isAddingNote ? (
                <div className="px-6 py-10 text-center text-base text-muted-foreground">
                  目前沒有備註，點擊「新增備註」手動加入，或在訓練醫院編輯頁面填寫備註後自動帶入。
                </div>
              ) : (
                <div className="divide-y">
                  {/* 手動備註 */}
                  {manualNotes.map((note, idx) => (
                    <div key={idx} className="flex items-start gap-4 px-6 py-4">
                      <span className="text-base font-medium text-muted-foreground w-6 shrink-0 pt-0.5">
                        {idx + 1}.
                      </span>
                      {editingIndex === idx ? (
                        <div className="flex-1 space-y-2">
                          <Textarea
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            className="text-base min-h-[72px]"
                            autoFocus
                          />
                          <div className="flex gap-2 justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1"
                              onClick={() => { setEditingIndex(null); setEditingText("") }}
                            >
                              <XIcon className="h-3.5 w-3.5" />
                              取消
                            </Button>
                            <Button
                              size="sm"
                              className="gap-1 bg-[#2d3a8c] hover:bg-[#252f73] text-white"
                              onClick={() => handleSaveEdit(idx)}
                              disabled={!editingText.trim()}
                            >
                              <Check className="h-3.5 w-3.5" />
                              儲存
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="flex-1 text-base text-foreground whitespace-pre-wrap">{note}</p>
                          <div className="flex items-center gap-1 shrink-0">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1.5 text-muted-foreground hover:text-foreground"
                              onClick={() => { setEditingIndex(idx); setEditingText(note) }}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              編輯
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1.5 text-muted-foreground hover:text-destructive"
                              onClick={() => handleDeleteManual(idx)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              刪除
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}

                  {/* 新增輸入列：序號跟在最後一筆手動備註後 */}
                  {isAddingNote && (
                    <div className="flex items-start gap-4 px-6 py-4 bg-muted/20">
                      <span className="text-base font-medium text-muted-foreground w-6 shrink-0 pt-0.5">
                        {manualNotes.length + 1}.
                      </span>
                      <div className="flex-1 space-y-2">
                        <Textarea
                          value={newNoteText}
                          onChange={(e) => setNewNoteText(e.target.value)}
                          placeholder="輸入備註內容..."
                          className="text-base min-h-[72px]"
                          autoFocus
                        />
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1"
                            onClick={() => { setIsAddingNote(false); setNewNoteText("") }}
                          >
                            <XIcon className="h-3.5 w-3.5" />
                            取消
                          </Button>
                          <Button
                            size="sm"
                            className="gap-1 bg-[#2d3a8c] hover:bg-[#252f73] text-white"
                            onClick={handleAddNote}
                            disabled={!newNoteText.trim()}
                          >
                            <Check className="h-3.5 w-3.5" />
                            確認
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 自動備註（來自各名單自動合併）
                      序號基底 = 手動備註數，不計入 isAddingNote 佔位 */}
                  {autoNotes.length > 0 && (
                    <div className="px-6 py-2 bg-blue-50 border-t border-blue-100 flex items-center gap-2">
                      <span className="text-xs font-medium text-blue-500 uppercase tracking-wide">自動帶入</span>
                    </div>
                  )}
                  {autoNotes.map((item, idx) => {
                    const sourceLabel =
                      item.type === "hospital" ? "訓練醫院備註" :
                      item.type === "disqualified" ? "不合格醫院名單" :
                      "未申請醫院名單"
                    const editHref =
                      item.type === "hospital" ? `/filing/quota/${item.hospitalId}` :
                      item.type === "disqualified" ? `#disqualified-${item.hospitalId}` :
                      `#not-applied-${item.hospitalId}`
                    return (
                      <div key={`${item.type}-${item.hospitalId}`} className="flex items-start gap-4 px-6 py-4 bg-blue-50/30 border-l-2 border-blue-300">
                        <span className="text-base font-medium text-blue-400 w-6 shrink-0 pt-0.5">
                          {manualNotes.length + idx + 1}.
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-base text-foreground whitespace-pre-wrap">{item.content}</p>
                          <span className="text-xs text-blue-400 mt-0.5 block">{sourceLabel}</span>
                        </div>
                        {item.type === "hospital" ? (
                          <Link href={editHref} className="shrink-0">
                            <Button variant="ghost" size="sm" className="gap-1.5 text-blue-400 hover:text-blue-700">
                              <Pencil className="h-3.5 w-3.5" />
                              前往編輯
                            </Button>
                          </Link>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1.5 text-blue-400 hover:text-blue-700 shrink-0"
                            onClick={() => {
                              const el = document.getElementById(
                                item.type === "disqualified"
                                  ? `disqualified-section`
                                  : `not-applied-section`
                              )
                              el?.scrollIntoView({ behavior: "smooth" })
                              if (item.type === "disqualified") {
                                setEditingDisqualifiedId(Number(item.hospitalId))
                                setEditDisqualifiedReason(
                                  disqualifiedHospitals.find((h) => String(h.id) === item.hospitalId)?.reason ?? ""
                                )
                              } else {
                                const h = notAppliedHospitals.find((h) => String(h.id) === item.hospitalId)
                                setEditingNotAppliedId(Number(item.hospitalId))
                                setEditNotAppliedPrevQualification(h?.prevQualification ?? "")
                                setEditNotAppliedReason(h?.reason ?? "")
                              }
                            }}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            前往編輯
                          </Button>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )
      })()}

      <div className="flex justify-end gap-3">
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          匯出 PDF
        </Button>
        <Button variant="outline" className="gap-2">
          暫時儲存
        </Button>
        <Button
          className="gap-2 bg-[#2d3a8c] hover:bg-[#252f73] text-white"
          onClick={() => setShowSubmitConfirmDialog(true)}
        >
          <Send className="h-4 w-4" />
          儲存並送件
        </Button>
      </div>

      {/* 送件確認 Dialog */}
      <Dialog open={showSubmitConfirmDialog} onOpenChange={setShowSubmitConfirmDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>確認送件</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-base text-muted-foreground">
              送件後，容額填報資料將進入審查流程，在審查結果公告前將無法進行修改。
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-base text-amber-700 font-medium mb-2">送件內容確認</p>
              <ul className="text-base text-amber-700 space-y-1">
                <li>申請家數：{totalApplied} 家</li>
                <li>不合格家數：{disqualifiedCount} 家</li>
                <li>備註：{manualNotes.length + hospitals.filter((h) => !h.isSubRow && quotaNotesStore.hospitalNotes[String(h.id)]).length + disqualifiedHospitals.length + notAppliedHospitals.length} 則</li>
              </ul>
            </div>
            <p className="text-base text-muted-foreground">
              請確認以上資料無誤後，點擊「確認送件」完成提交。
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowSubmitConfirmDialog(false)}
            >
              取消
            </Button>
            <Button
              className="bg-[#2d3a8c] hover:bg-[#252f73] text-white gap-2"
              onClick={() => {
                // TODO: 實際送件邏輯
                setShowSubmitConfirmDialog(false)
              }}
            >
              <Send className="h-4 w-4" />
              確認送件
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 匯入檔案 Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>匯入檔案</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-3">
                請先下載範例文件，依照格式填寫後再上傳
              </p>
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="h-4 w-4" />
                下載範例文件 (.xlsx)
              </Button>
            </div>
            <div>
              <Label className="text-sm font-medium mb-2 block">選擇檔案</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
                <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">點擊或拖曳檔案至此處上傳</p>
                <p className="text-sm text-muted-foreground mt-1">支援 .xlsx, .xls 格式</p>
                <Input type="file" className="hidden" accept=".xlsx,.xls" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImportDialog(false)}>取消</Button>
            <Button className="bg-[#2d3a8c] hover:bg-[#252f73] text-white">上傳</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

