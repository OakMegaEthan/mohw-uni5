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
  ChevronDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import Link from "next/link"
import { Textarea } from "@/components/ui/textarea"
import { HospitalMultiSelect, type Hospital } from "@/components/filing/hospital-multi-select"
import { AVAILABLE_HOSPITALS } from "@/components/filing/quota-form"
import { filingItemsConfig } from "@/lib/mock/review-outline"
import { quotaNotesStore } from "@/lib/stores/quota-notes-store"
import {
  ReviewFeedbackBanner,
  type ReviewFeedback,
} from "@/components/filing/review-feedback-banner"
import { FILING_DOCUMENTS, getFilingStatusLabel } from "@/lib/mock/filing-documents"
import { toast } from "sonner"
import { MultiFileUpload, type UploadedFile } from "@/components/filing/multi-file-upload"
import {
  MOCK_OUTCOME_REPORT_RETURN,
  OUTCOME_REPORT_SUB_CONFIG,
  QUOTA_FILING_STAGES,
  QUOTA_FILING_STAGE_UNIT,
  isQuotaFilingEditable,
  type OutcomeReportSubStatus,
  type QuotaFilingStage,
} from "@/lib/mock/quota-filing-stage"

// 容額填報檢視（由醫學會填報）。原為 app/filing 的容額 tab，拆分為獨立路由後移至此。
// 階段感知與退件處理見後續重構；此檔為拆分階段的忠實搬移。
const MOCK_QUOTA_REVIEW_FEEDBACK: ReviewFeedback = {
  reviewDate: "114/04/15",
  meetingTitle: "114年度第一次訓練容額審查會議",
  comments: [
    "台大醫院申請容額 15 名，建議依前年度訓練成效調降至 12 名",
    "高雄聯合訓練中心為合併機構，請補充各機構分配容額說明",
    "三軍總醫院資格效期起始年度有誤，請重新確認並更正",
  ],
  fullContent: `一、會議時間：114年4月15日（星期二）上午10時

二、會議地點：衛生福利部第三會議室

三、主席：○○○司長
    紀錄：○○○

四、出席人員：（略）

五、審查意見：

（一）關於容額申請數量部分：
    1. 台大醫院本次申請容額 15 名，惟依其前年度訓練成效評估，師資及設備量能評估建議調降為 12 名，請申請機構重新評估後再行送件。

    2. 高雄聯合訓練中心係由高雄榮民總醫院及高雄醫學大學附設中和紀念醫院合併組成，本次申請總容額 18 名，請補充說明兩機構之間的容額分配方式及聯合訓練運作架構，以利審查。

（二）關於資格效期部分：
    1. 三軍總醫院所填資格效期起始年度為 113 年，惟依本部存檔資料，其資格認定係自 112 年起生效，請重新確認並更正後再行送件。

（三）補件期限：
    請於 114 年 5 月 15 日前完成修正並重新送件，逾期視同放棄本次申請資格。

六、散會：上午12時`,
}

// 西元年轉民國年，格式 114/7/31
function toRocDate(dateStr: string): string {
  if (!dateStr) return dateStr
  // 支援 "有效至 YYYY/M/D" 和 "N 年 (至 YYYY/M/D)" 和 "YYYY/M/D" 格式
  return dateStr.replace(/(\d{4})(\/\d{1,2}\/\d{1,2})/g, (_, year, rest) => {
    return `${Number(year) - 1911}${rest}`
  })
}

export function QuotaFilingView({
  variant,
  stage,
  returnedFrom,
  reportStatus,
}: {
  variant: string
  stage: QuotaFilingStage
  returnedFrom: QuotaFilingStage | null
  reportStatus: OutcomeReportSubStatus
}) {
  const router = useRouter()
  const availableHospitals = AVAILABLE_HOSPITALS
  const isInternalMedicine = variant === "internal-medicine"

  // 容額成果報告：案件進待公告後解鎖，醫學會上傳補件送醫事司
  const showOutcomeReport = stage === "待公告" || stage === "已公告"
  const reportEditable = reportStatus === "待上傳" || reportStatus === "退回補件"
  const [reportFiles, setReportFiles] = useState<UploadedFile[]>(
    reportStatus === "待上傳"
      ? []
      : [
          { id: "or-1", name: "容額成果報告_審查細節.pdf", size: "2.6 MB" },
          { id: "or-2", name: "容額成果報告_附件_訓練醫院明細.xlsx", size: "1.1 MB" },
        ],
  )
  const handleUploadReport = () =>
    setReportFiles((prev) => [
      ...prev,
      { id: `or-${Date.now()}`, name: `容額成果報告_附件${prev.length + 1}.pdf`, size: "1.8 MB" },
    ])
  const handleRemoveReport = (id: string) => setReportFiles((prev) => prev.filter((f) => f.id !== id))
  const handleSubmitReport = () => {
    if (reportFiles.length === 0) return
    toast.success("容額成果報告已送出，待醫事司確認")
  }

  // 由階段推導既有的唯讀／退件旗標，沿用元件內既有的 disabled={isSubmitted} plumbing：
  //   退件（returnedFrom 有值）→ 可編輯、顯示退件橫幅
  //   待送件 → 可編輯
  //   其餘審查/待公告/已公告階段 → 唯讀
  const isReturned = returnedFrom !== null
  const isSubmitted = !isQuotaFilingEditable(stage, isReturned)

  // 匯入 Dialog state
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [importMode, setImportMode] = useState<"append" | "replace" | null>(null)
  const onOpenImport = () => {
    setImportMode(null)
    setShowImportDialog(true)
  }
  const onCloseImport = () => {
    setShowImportDialog(false)
    setImportMode(null)
  }

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
    // ── 單一機構申請（含長名稱、含括號委託經營）──
    {
      id: 1,
      code: "0401180014",
      name: "高雄市立小港醫院(委託財團法人私立高雄醫學大學經營)",
      county: "高雄市",
      district: "小港區",
      expiryStartYear: "115",
      expiryEndYear: "115",
      limit: 15,
      prevQuota: 5,
      currentQuota: 5,
      groupId: null as string | null,
      isSubRow: false,
      partnerHospitalCodes: [] as string[],
      applicationType: "single" as "single" | "joint",
      mergedHospitalCodes: [] as string[],
    },
    {
      id: 2,
      code: "0401190015",
      name: "新北市立土城醫院(委託長庚醫療財團法人興建經營)",
      county: "新北市",
      district: "土城區",
      expiryStartYear: "115",
      expiryEndYear: "115",
      limit: 12,
      prevQuota: 3,
      currentQuota: 4,
      groupId: null as string | null,
      isSubRow: false,
      partnerHospitalCodes: [] as string[],
      applicationType: "single" as "single" | "joint",
      mergedHospitalCodes: [] as string[],
    },
    // ── 單一機構申請（主體為合併機構）──
    {
      id: 3,
      code: "merged-001",
      name: "長庚醫療財團法人林口長庚紀念醫院及其台北長庚紀念醫院",
      county: "桃園市",
      district: "龜山區",
      expiryStartYear: "115",
      expiryEndYear: "115",
      limit: 18,
      prevQuota: 6,
      currentQuota: 7,
      groupId: null as string | null,
      isSubRow: false,
      partnerHospitalCodes: [] as string[],
      applicationType: "single" as "single" | "joint",
      mergedHospitalCodes: ["0401260022", "0401270023"],
    },
    // ── 聯合申請 A 組（最複雜情境）──
    //   主訓：合併機構（馬偕＋淡水馬偕）
    //   合作①：單一機構（亞東紀念醫院）
    //   合作②：合併機構（新竹臺大分院生醫醫院＋竹東院區）
    {
      id: 4,
      code: "merged-002",
      name: "台灣基督長老教會馬偕醫療財團法人馬偕紀念醫院及其淡水馬偕紀念醫院",
      county: "台北市",
      district: "中山區",
      expiryStartYear: "115",
      expiryEndYear: "115",
      limit: 16,
      prevQuota: 4,
      currentQuota: 5,
      groupId: "group-a",
      isSubRow: false,
      partnerHospitalCodes: ["0401240020", "merged-003"],
      applicationType: "joint" as "single" | "joint",
      mergedHospitalCodes: ["0401280024", "0401290025"],
    },
    {
      id: "4.1",
      code: "0401240020",
      name: "醫療財團法人徐元智先生醫藥基金會亞東紀念醫院",
      county: "新北市",
      district: "板橋區",
      expiryStartYear: "115",
      expiryEndYear: "115",
      limit: null as number | null,
      prevQuota: null as number | null,
      currentQuota: null as number | null,
      groupId: "group-a",
      isSubRow: true,
      partnerHospitalCodes: [] as string[],
      applicationType: "joint" as "single" | "joint",
      mergedHospitalCodes: [] as string[],
    },
    {
      id: "4.2",
      code: "merged-003",
      name: "國立臺灣大學醫學院附設醫院新竹臺大分院生醫醫院及其竹東院區",
      county: "新竹市",
      district: "東區",
      expiryStartYear: "115",
      expiryEndYear: "115",
      limit: null as number | null,
      prevQuota: null as number | null,
      currentQuota: null as number | null,
      groupId: "group-a",
      isSubRow: true,
      partnerHospitalCodes: [] as string[],
      applicationType: "joint" as "single" | "joint",
      mergedHospitalCodes: ["0401300026", "0401310027"],
    },
    // ── 聯合申請 B 組：奇美（主）+ 成大（合作，皆單一機構）──
    {
      id: 5,
      code: "0401320028",
      name: "奇美醫療財團法人奇美醫院",
      county: "台南市",
      district: "永康區",
      expiryStartYear: "114",
      expiryEndYear: "116",
      limit: 9,
      prevQuota: 3,
      currentQuota: 4,
      groupId: "group-b",
      isSubRow: false,
      partnerHospitalCodes: ["0401330029"],
      applicationType: "joint" as "single" | "joint",
      mergedHospitalCodes: [] as string[],
    },
    {
      id: "5.1",
      code: "0401330029",
      name: "國立成功大學醫學院附設醫院",
      county: "台南市",
      district: "東區",
      expiryStartYear: "114",
      expiryEndYear: "116",
      limit: null as number | null,
      prevQuota: null as number | null,
      currentQuota: null as number | null,
      groupId: "group-b",
      isSubRow: true,
      partnerHospitalCodes: [] as string[],
      applicationType: "joint" as "single" | "joint",
      mergedHospitalCodes: [] as string[],
    },
    // ── 單一機構申請（短名稱）──
    {
      id: 6,
      code: "0401200016",
      name: "三軍總醫院",
      county: "台北市",
      district: "內湖區",
      expiryStartYear: "113",
      expiryEndYear: "115",
      limit: 10,
      prevQuota: 2,
      currentQuota: 3,
      groupId: null as string | null,
      isSubRow: false,
      partnerHospitalCodes: [] as string[],
      applicationType: "single" as "single" | "joint",
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

  // 將 hospitals 依「區塊」拆分：單一/合併機構各為一塊，聯合申請的主列＋子列視為同一塊
  // 排序操作以區塊為單位，確保聯合申請群組整組一起移動、不會錯位
  const buildBlocks = (rows: typeof hospitals) => {
    const blocks: (typeof hospitals)[] = []
    let i = 0
    while (i < rows.length) {
      const row = rows[i]
      if (row.groupId && !row.isSubRow) {
        const block = [row]
        let j = i + 1
        while (j < rows.length && rows[j].groupId === row.groupId && rows[j].isSubRow) {
          block.push(rows[j])
          j++
        }
        blocks.push(block)
        i = j
      } else {
        blocks.push([row])
        i++
      }
    }
    return blocks
  }

  // 區塊領頭列的 id 依顯示順序排列，用於判斷某列是否位於第一／最後一個區塊
  const orderedBlockLeadIds = buildBlocks(hospitals).map((b) => String(b[0].id))

  const moveMainBlock = (id: string | number, direction: "up" | "down") => {
    setHospitals((prev) => {
      const blocks = buildBlocks(prev)
      const idx = blocks.findIndex((b) => String(b[0].id) === String(id))
      if (idx === -1) return prev
      const target = direction === "up" ? idx - 1 : idx + 1
      if (target < 0 || target >= blocks.length) return prev
      const next = [...blocks]
      ;[next[idx], next[target]] = [next[target], next[idx]]
      return next.flat()
    })
  }

  // 不合格／未申請名單為單純清單，移動後重新編號 id（id 同時作為序號）
  const moveRowByIndex = <T extends { id: number }>(
    arr: T[],
    id: number,
    direction: "up" | "down"
  ): T[] => {
    const idx = arr.findIndex((h) => h.id === id)
    const target = direction === "up" ? idx - 1 : idx + 1
    if (idx === -1 || target < 0 || target >= arr.length) return arr
    const next = [...arr]
    ;[next[idx], next[target]] = [next[target], next[idx]]
    return next.map((h, i) => ({ ...h, id: i + 1 }))
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
      {/* 階段進度指示器：呈現案件在容額填報生命週期的位置 */}
      <div className="rounded-lg border bg-card px-6 py-4">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
          {QUOTA_FILING_STAGES.map((s, i) => {
            const currentIndex = QUOTA_FILING_STAGES.indexOf(stage)
            const isCurrent = !isReturned && s === stage
            const isPast = !isReturned && i < currentIndex
            const params = new URLSearchParams({ stage: s })
            if (variant) params.set("variant", variant)
            return (
              <div key={s} className="flex items-center gap-2">
                {/* 可點擊切換階段：原型無案件列表可進入，故以此作為各階段的檢視入口 */}
                <Link
                  href={`/filing/quota-filing?${params.toString()}`}
                  className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                    isCurrent
                      ? "bg-[#2d3a8c] text-white"
                      : isPast
                        ? "bg-blue-50 text-blue-600 hover:bg-blue-100"
                        : "bg-muted text-muted-foreground hover:bg-muted-foreground/20"
                  }`}
                >
                  {s}
                </Link>
                {i < QUOTA_FILING_STAGES.length - 1 && <span className="text-muted-foreground/50">→</span>}
              </div>
            )
          })}
          {isReturned ? (
            <span className="ml-1 inline-flex items-center rounded-full bg-orange-100 px-3 py-1 text-sm font-medium text-orange-700">
              退件補正中
            </span>
          ) : (
            <Link
              href={`/filing/quota-filing?returnedFrom=${encodeURIComponent(stage === "待送件" ? "醫策會初審" : stage)}${
                variant ? `&variant=${variant}` : ""
              }`}
              className="ml-1 inline-flex items-center rounded-full border border-orange-200 px-3 py-1 text-sm font-medium text-orange-700 transition-colors hover:bg-orange-50"
            >
              檢視退件狀態
            </Link>
          )}
        </div>
      </div>

      {/* 退件橫幅：顯示退回來源與續審規則 */}
      {isReturned && returnedFrom && (
        <div className="space-y-3">
          <div className="rounded-lg border border-orange-200 bg-orange-50 px-4 py-3">
            <p className="text-sm text-orange-800">
              本案由<span className="mx-1 font-medium">{QUOTA_FILING_STAGE_UNIT[returnedFrom]}</span>
              於「{returnedFrom}」階段退回。補正後重新送件，案件將回到該階段續審，不重走先前已通過的階段。
            </p>
          </div>
          <ReviewFeedbackBanner feedback={MOCK_QUOTA_REVIEW_FEEDBACK} />
        </div>
      )}

      {/* 容額成果報告：待公告後解鎖。RRC 審查後的審查細節補充，直接送醫事司確認歸檔 */}
      {showOutcomeReport && (
        <div className="rounded-lg border border-blue-200 bg-blue-50/40 px-6 py-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-lg font-bold text-foreground">容額成果報告</h3>
            <div className="flex flex-wrap items-center gap-2">
              {/* 原型：無實際送件流程，提供各子狀態的檢視入口 */}
              {(Object.keys(OUTCOME_REPORT_SUB_CONFIG) as OutcomeReportSubStatus[]).map((s) => {
                const params = new URLSearchParams({ stage, report: s })
                if (variant) params.set("variant", variant)
                const active = s === reportStatus
                return (
                  <Link
                    key={s}
                    href={`/filing/quota-filing?${params.toString()}`}
                    className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium transition-colors ${
                      active
                        ? OUTCOME_REPORT_SUB_CONFIG[s].color
                        : "border-transparent text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {OUTCOME_REPORT_SUB_CONFIG[s].label}
                  </Link>
                )
              })}
            </div>
          </div>
          <p className="mb-4 text-sm text-muted-foreground">
            本案已進入待公告，請上傳容額成果報告（RRC 審查後之審查細節補充資料），送出後由醫事司確認歸檔。
            此作業不影響公告進度。
          </p>

          {/* 退回補件意見：醫事司於容額成果報告審查頁填寫的單則意見，直接內嵌呈現。
              有別於案件層級的退件（附審查會議紀錄全文，另以 ReviewFeedbackBanner 呈現）。 */}
          {reportStatus === "退回補件" && (
            <div className="mb-4 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3">
              <div className="mb-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="text-sm font-medium text-orange-800">
                  {MOCK_OUTCOME_REPORT_RETURN.reviewer}退回補件
                </span>
                <span className="text-sm text-orange-700">
                  退回日期：{MOCK_OUTCOME_REPORT_RETURN.returnedDate}
                </span>
              </div>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-orange-800">
                {MOCK_OUTCOME_REPORT_RETURN.comment}
              </p>
              <p className="mt-2 text-sm text-orange-700">請依上述意見補齊後，重新上傳並送出。</p>
            </div>
          )}

          <MultiFileUpload
            files={reportFiles}
            onUpload={reportEditable ? handleUploadReport : undefined}
            onRemove={reportEditable ? handleRemoveReport : undefined}
            uploadLabel="選擇成果報告檔案"
            emptyState="尚未上傳容額成果報告"
          />

          {reportEditable && (
            <div className="mt-4 flex justify-end">
              <Button
                className="gap-2 bg-[#2d3a8c] hover:bg-[#252f73] text-white"
                disabled={reportFiles.length === 0}
                onClick={handleSubmitReport}
              >
                <Send className="h-4 w-4" />
                {reportStatus === "退回補件" ? "重新送出" : "送出成果報告"}
              </Button>
            </div>
          )}
        </div>
      )}

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

          {/* 建議分配容額上限 */}
          {(() => {
            const QUOTA_LIMIT = 120
            const usedQuota = totalCurrentQuota
            const remaining = QUOTA_LIMIT - usedQuota
            const usedPercent = Math.min(100, Math.round((usedQuota / QUOTA_LIMIT) * 100))
            const isOver = remaining < 0
            const isNearLimit = !isOver && remaining <= 10
            return (
              <div className={`rounded-lg border px-5 py-4 flex flex-col justify-between gap-3 ${isOver ? "bg-red-50 border-red-200" : isNearLimit ? "bg-amber-50 border-amber-200" : "bg-card border-border"}`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm text-muted-foreground mb-0.5">建議分配容額</p>
                    <div className="flex items-baseline gap-1.5">
                      <span className={`text-2xl font-bold ${isOver ? "text-red-700" : isNearLimit ? "text-amber-700" : "text-foreground"}`}>
                        {usedQuota}
                      </span>
                      <span className="text-sm text-muted-foreground">/ {QUOTA_LIMIT} 名</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-muted-foreground mb-0.5">剩餘可分配</p>
                    <p className={`text-xl font-bold ${isOver ? "text-red-600" : isNearLimit ? "text-amber-600" : "text-foreground"}`}>
                      {isOver ? `超出 ${Math.abs(remaining)}` : remaining}
                      {!isOver && <span className="text-sm font-normal text-muted-foreground ml-0.5">名</span>}
                    </p>
                  </div>
                </div>
                {/* 進度條 */}
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${isOver ? "bg-red-500" : isNearLimit ? "bg-amber-400" : "bg-primary"}`}
                    style={{ width: `${usedPercent}%` }}
                  />
                </div>
              </div>
            )
          })()}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">專科醫師訓練醫院認定合格名冊及訓練容量</h2>
        <div className="flex items-center gap-3">
          <Link href={variant ? `/filing/quota/new?variant=${variant}` : "/filing/quota/new"} className={isSubmitted ? "pointer-events-none" : ""}>
            <Button disabled={isSubmitted} className="gap-2 bg-[#2d3a8c] hover:bg-[#252f73] text-white">
              <Plus className="h-4 w-4" />
              新增醫院
            </Button>
          </Link>
          <Button
            disabled={isSubmitted}
            variant="outline"
            className="gap-2"
            onClick={onOpenImport}
          >
            <Upload className="h-4 w-4" />
            匯入名單
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
                <th className="px-2 py-2.5 text-left whitespace-nowrap min-w-[240px] sticky left-10 bg-muted/50 z-20 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]">醫院名稱</th>
                <th className="px-2 py-2.5 text-left whitespace-nowrap">類別</th>
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
                <th className="px-2 py-2.5 text-center whitespace-nowrap">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {hospitals.map((hospital) => {
                const groupStyle = hospital.groupId ? groupColors[hospital.groupId] : ""
                // 組合資格效期：起始年度/08/01 - 結束年度/07/31
                const expiryRange = hospital.expiryStartYear && hospital.expiryEndYear
                  ? `${hospital.expiryStartYear}/08/01 - ${hospital.expiryEndYear}/07/31`
                  : "—"
                return (
                <tr
                  key={hospital.id}
                  className={`hover:bg-muted/30 ${groupStyle ? `border-l-4 ${groupStyle}` : ""}`}
                >
                  {/* 固定首兩欄 */}
                  <td className="px-2 py-3 text-sm text-muted-foreground whitespace-nowrap sticky left-0 bg-card z-10">{hospital.id}</td>
                  <td className="px-2 py-3 text-sm font-medium align-top sticky left-10 bg-card z-10 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.08)] min-w-[240px] max-w-[360px]">
                    <span className={`leading-snug break-words block ${hospital.isSubRow ? "pl-5" : ""}`}>
                      {quotaNotesStore.hospitalNotes[String(hospital.id)] && (
                        <span className="text-destructive mr-0.5" title="此醫院有備註">*</span>
                      )}
                      {hospital.name}
                    </span>
                  </td>
                  <td className="px-2 py-3 align-top">
                    <div className="flex flex-col items-start gap-1">
                      {hospital.applicationType === "joint" && !hospital.isSubRow && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 whitespace-nowrap">主訓機構</span>
                      )}
                      {hospital.applicationType === "joint" && hospital.isSubRow && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 whitespace-nowrap">合作機構</span>
                      )}
                      {hospital.applicationType === "single" && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground whitespace-nowrap">單一機構</span>
                      )}
                      {hospital.mergedHospitalCodes.length > 0 && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap">合併認定</span>
                      )}
                    </div>
                  </td>
                  <td className="px-2 py-3 text-sm whitespace-nowrap align-top">
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
                    {expiryRange}
                  </td>
                  <td className="px-2 py-3 text-sm text-center whitespace-nowrap align-top">
                    <div className="flex items-center justify-center gap-1">
                      {!hospital.isSubRow && (() => {
                        const pos = orderedBlockLeadIds.indexOf(String(hospital.id))
                        const isFirst = pos === 0
                        const isLast = pos === orderedBlockLeadIds.length - 1
                        return (
                          <div className="flex items-center mr-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              disabled={isSubmitted || isFirst}
                              className="h-7 w-7 text-muted-foreground hover:text-foreground"
                              aria-label="上移"
                              onClick={() => moveMainBlock(hospital.id, "up")}
                            >
                              <ArrowUp className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              disabled={isSubmitted || isLast}
                              className="h-7 w-7 text-muted-foreground hover:text-foreground"
                              aria-label="下移"
                              onClick={() => moveMainBlock(hospital.id, "down")}
                            >
                              <ArrowDown className="h-4 w-4" />
                            </Button>
                          </div>
                        )
                      })()}
                      {!("isSubRow" in hospital && hospital.isSubRow) && (
                        <Link href={`/filing/quota/${hospital.id}`} className={isSubmitted ? "pointer-events-none" : ""}>
                          <Button disabled={isSubmitted} variant="link" className="text-primary p-0 h-auto text-sm">
                            編輯
                          </Button>
                        </Link>
                      )}
                      <Button
                        disabled={isSubmitted}
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
                      <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                        尚無結核病計畫容額資料，請點選「新增醫院」或「匯入名單」
                      </td>
                    </tr>
                  ) : (
                    tbProgramHospitals.map((hospital) => (
                      <tr key={hospital.id}>
                        <td className="px-2 py-3 text-sm text-muted-foreground whitespace-nowrap sticky left-0 bg-card z-10">{hospital.id}</td>
                        <td className="px-2 py-3 text-sm font-medium whitespace-nowrap sticky left-10 bg-card z-10 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.08)]">{hospital.name}</td>
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
              disabled={isSubmitted}
              className="gap-2 bg-[#2d3a8c] hover:bg-[#252f73] text-white"
              onClick={() => setShowAddDisqualifiedDialog(true)}
            >
              <Plus className="h-4 w-4" />
              新增不合格醫院
            </Button>
            <Button
              disabled={isSubmitted}
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
                  <th className="px-2 py-2.5 text-left">不合格原因</th>
                  <th className="px-2 py-2.5 text-center whitespace-nowrap">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {disqualifiedHospitals.map((hospital) => (
                  <tr key={hospital.id}>
                    <td className="px-2 py-3 text-sm text-muted-foreground whitespace-nowrap sticky left-0 bg-card z-10">{hospital.id}</td>
                    <td className="px-2 py-3 text-sm font-medium whitespace-nowrap sticky left-10 bg-card z-10 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.08)]">{hospital.name}</td>
                    <td className="px-2 py-3 text-sm text-muted-foreground">{hospital.reason}</td>
                    <td className="px-2 py-3 text-sm text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <div className="flex items-center mr-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            disabled={isSubmitted || hospital.id === 1}
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            aria-label="上移"
                            onClick={() => setDisqualifiedHospitals((prev) => moveRowByIndex(prev, hospital.id, "up"))}
                          >
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            disabled={isSubmitted || hospital.id === disqualifiedHospitals.length}
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            aria-label="下移"
                            onClick={() => setDisqualifiedHospitals((prev) => moveRowByIndex(prev, hospital.id, "down"))}
                          >
                            <ArrowDown className="h-4 w-4" />
                          </Button>
                        </div>
                        <Button
                          disabled={isSubmitted}
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
                          disabled={isSubmitted}
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
          <p className="text-sm text-muted-foreground mt-1">係指前一年度為合格訓練醫院，惟本年度未提出申請之醫院。</p>
        </div>
          <div className="flex items-center gap-3 mt-0.5">
            <Button
              disabled={isSubmitted}
              className="gap-2 bg-[#2d3a8c] hover:bg-[#252f73] text-white"
              onClick={() => setShowAddNotAppliedDialog(true)}
            >
              <Plus className="h-4 w-4" />
              新增未申請醫院
            </Button>
            <Button
              disabled={isSubmitted}
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
                  <th className="px-2 py-2.5 text-left whitespace-nowrap">前一年度訓練資格</th>
                  <th className="px-2 py-2.5 text-left">未申請原因</th>
                  <th className="px-2 py-2.5 text-center whitespace-nowrap">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {notAppliedHospitals.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                      尚無未申請醫院資料，請點選「新增未申請醫院」或「匯入名單」
                    </td>
                  </tr>
                ) : (
                  notAppliedHospitals.map((hospital) => (
                    <tr key={hospital.id}>
                      <td className="px-2 py-3 text-sm text-muted-foreground whitespace-nowrap sticky left-0 bg-card z-10">{hospital.id}</td>
                      <td className="px-2 py-3 text-sm font-medium whitespace-nowrap sticky left-10 bg-card z-10 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.08)]">{hospital.name}</td>
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
                        <div className="flex items-center justify-center gap-1">
                          <div className="flex items-center mr-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              disabled={isSubmitted || hospital.id === 1}
                              className="h-7 w-7 text-muted-foreground hover:text-foreground"
                              aria-label="上移"
                              onClick={() => setNotAppliedHospitals((prev) => moveRowByIndex(prev, hospital.id, "up"))}
                            >
                              <ArrowUp className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              disabled={isSubmitted || hospital.id === notAppliedHospitals.length}
                              className="h-7 w-7 text-muted-foreground hover:text-foreground"
                              aria-label="下移"
                              onClick={() => setNotAppliedHospitals((prev) => moveRowByIndex(prev, hospital.id, "down"))}
                            >
                              <ArrowDown className="h-4 w-4" />
                            </Button>
                          </div>
                          <Button
                            disabled={isSubmitted}
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
                            disabled={isSubmitted}
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
                          <Link href={editHref} className={`shrink-0 ${isSubmitted ? "pointer-events-none" : ""}`}>
                            <Button disabled={isSubmitted} variant="ghost" size="sm" className="gap-1.5 text-blue-400 hover:text-blue-700">
                              <Pencil className="h-3.5 w-3.5" />
                              前往編輯
                            </Button>
                          </Link>
                        ) : (
                          <Button
                            disabled={isSubmitted}
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-1.5">
              <Download className="h-4 w-4" />
              匯出 PDF
              <ChevronDown className="h-3.5 w-3.5 ml-0.5 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuItem className="gap-2 cursor-pointer">
              <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex flex-col">
                <span>認定合格名冊及訓練容量</span>
                <span className="text-xs text-muted-foreground">含備註</span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2 cursor-pointer">
              <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex flex-col">
                <span>不合格醫院名單</span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2 cursor-pointer">
              <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex flex-col">
                <span>未申請醫院名單</span>
              </div>
            </DropdownMenuItem>
            {isInternalMedicine && (
              <DropdownMenuItem className="gap-2 cursor-pointer">
                <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex flex-col">
                  <span>結核病計畫醫院名單</span>
                </div>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 cursor-pointer">
              <Download className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex flex-col">
                <span>全部下載</span>
                <span className="text-xs text-muted-foreground">
                  {isInternalMedicine ? "同時下載全部四份 PDF" : "同時下載全部三份 PDF"}
                </span>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        {!isSubmitted && (
          <Button variant="outline" className="gap-2">
            暫時儲存
          </Button>
        )}
        {isSubmitted ? (
          <Button disabled className="gap-2">
            <Send className="h-4 w-4" />
            {stage === "待公告" ? "待公告" : stage === "已公告" ? "已公告" : "審查中"}
          </Button>
        ) : (
          <Button
            className="gap-2 bg-[#2d3a8c] hover:bg-[#252f73] text-white"
            onClick={() => setShowSubmitConfirmDialog(true)}
          >
            <Send className="h-4 w-4" />
            {isReturned ? "重新送件" : "儲存並送件"}
          </Button>
        )}
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

      {/* 匯入名單 Dialog */}
      <Dialog open={showImportDialog} onOpenChange={(open) => { if (!open) onCloseImport() }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>匯入名單</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-4">
            {/* 步驟一：選擇匯入方式 */}
            <div>
              <Label className="text-base font-medium mb-3 block">匯入方式</Label>
              <RadioGroup
                value={importMode ?? ""}
                onValueChange={(v) => setImportMode(v as "append" | "replace")}
                className="space-y-2.5"
              >
                <label className={`flex items-start gap-3 rounded-lg border p-4 cursor-pointer transition-colors ${importMode === "append" ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}>
                  <RadioGroupItem value="append" id="quota-import-append" className="mt-0.5 shrink-0" />
                  <div>
                    <div className="text-base font-medium">附加至現有資料</div>
                    <div className="text-sm text-muted-foreground mt-0.5">將檔案中的紀錄新增至目前名單末尾，現有資料不受影響</div>
                  </div>
                </label>
                <label className={`flex items-start gap-3 rounded-lg border p-4 cursor-pointer transition-colors ${importMode === "replace" ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}>
                  <RadioGroupItem value="replace" id="quota-import-replace" className="mt-0.5 shrink-0" />
                  <div>
                    <div className="text-base font-medium">覆蓋現有資料</div>
                    <div className="text-sm text-muted-foreground mt-0.5">以檔案內容完整取代目前名單，現有資料將全部清除</div>
                  </div>
                </label>
              </RadioGroup>
            </div>

            {/* 步驟二：上傳區域（選擇匯入方式後才顯示） */}
            {importMode && (
              <div className="space-y-4 pt-1 border-t">
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
                  <Label className="text-base font-medium mb-2 block">選擇檔案</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-base text-muted-foreground">點擊或拖曳檔案至此處上傳</p>
                    <p className="text-sm text-muted-foreground mt-1">支援 .xlsx, .xls 格式</p>
                    <Input type="file" className="hidden" accept=".xlsx,.xls" />
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={onCloseImport}>取消</Button>
            <Button
              disabled={!importMode}
              className="bg-[#2d3a8c] hover:bg-[#252f73] text-white disabled:opacity-50"
            >
              上傳
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

