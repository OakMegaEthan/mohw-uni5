"use client"

import { useState } from "react"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  FileText,
  Edit3,
  Send,
  ChevronLeft,
  Upload,
  Download,
  Plus,
  ChevronDown,
} from "lucide-react"
import Link from "next/link"
import { filingItemsConfig } from "@/lib/mock/review-outline"

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

export default function FilingPage() {
  const [activeTab, setActiveTab] = useState<string>("documents")
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

  return (
    <div className="min-h-screen bg-[#f5f7fa]">
      <div className="container mx-auto px-6 py-4">
        <h1 className="text-2xl font-bold text-foreground">填報專區</h1>
        <p className="text-base text-muted-foreground mt-1">內科醫學會 - 2025年度</p>
      </div>

      <div className="container mx-auto px-6 pb-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6 h-11">
            <TabsTrigger value="documents" className="text-base px-6">文件填報</TabsTrigger>
            <TabsTrigger value="quota" className="text-base px-6">容額填報</TabsTrigger>
          </TabsList>

          <TabsContent value="documents">
            <div className="bg-card rounded-lg shadow-sm">
              <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-muted/50 border-b text-base font-medium text-muted-foreground">
                <div className="col-span-5">文件名稱</div>
                <div className="col-span-2 text-center">審查狀態</div>
                <div className="col-span-2 text-center">送件期限</div>
                <div className="col-span-3 text-right">操作</div>
              </div>

              <div className="divide-y">
                {documents.map((doc) => {
                  const filingOpen = filingStatusMap[doc.id] === "open"
                  return (
                    <div
                      key={doc.id}
                      className={`grid grid-cols-12 gap-4 px-6 py-5 items-center ${!filingOpen ? "bg-muted/20" : ""}`}
                    >
                      <div className="col-span-5">
                        <span className={`font-medium ${!filingOpen ? "text-muted-foreground" : "text-foreground"}`}>
                          {doc.title}
                        </span>
                      </div>

                      <div className={`col-span-2 text-center font-medium ${!filingOpen ? "text-muted-foreground/60" : getStatusStyle(doc.status)}`}>
                        {filingOpen ? doc.status : "尚未開放"}
                      </div>

                      <div className="col-span-2 text-center text-base text-muted-foreground">
                        {filingOpen ? doc.deadline : "—"}
                      </div>

                      <div className="col-span-3 flex justify-end">
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
            <QuotaFilingSection
              availableHospitals={availableHospitals}
              onOpenImport={() => setShowImportDialog(true)}
            />
          </TabsContent>
        </Tabs>

        {activeTab === "documents" && (
          <div className="flex justify-end gap-3 mt-8 pt-6 border-t">
            <Button variant="outline" size="lg" className="gap-2">
              <Download className="h-4 w-4" />
              儲存草稿
            </Button>
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

      {/* 送件確認 Dialog */}
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
                <p className="text-base text-muted-foreground">
                  點擊或拖曳檔案至此處上傳
                </p>
                <p className="text-base text-muted-foreground mt-1">
                  支援 .xlsx, .xls 格式
                </p>
                <Input
                  type="file"
                  className="hidden"
                  accept=".xlsx,.xls"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImportDialog(false)}>
              取消
            </Button>
            <Button className="bg-[#2d3a8c] hover:bg-[#252f73] text-white">
              上傳
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function QuotaFilingSection({
  availableHospitals,
  onOpenImport,
}: {
  availableHospitals: { code: string; name: string }[]
  onOpenImport: () => void
}) {
  // groupId: null = 單獨申請，string = 聯合申請組合識別碼
  // 未來新增聯合申請組合只需指定相同 groupId 即可
  const hospitals = [
    {
      id: 1,
      code: "0401180014",
      name: "台大醫院",
      county: "台北���",
      district: "中山區",
      status: "效期屆滿",
      statusColor: "bg-yellow-100 text-yellow-700",
      expiry: "有效至 2026/7/31",
      extension: "4 年 (至 2030/7/31)",
      limit: 15,
      prevQuota: 5,
      currentQuota: 5,
      groupId: null,
      isSubRow: false,
    },
    {
      id: 2,
      code: "0401180015",
      name: "榮民總醫院",
      county: "台北市",
      district: "北投區",
      status: "新申請",
      statusColor: "bg-blue-100 text-blue-700",
      expiry: "有效至 2026/7/31",
      extension: "-",
      limit: 12,
      prevQuota: 3,
      currentQuota: 4,
      groupId: null,
      isSubRow: false,
    },
    {
      id: 3,
      code: "0401180016",
      name: "長庚醫院",
      county: "台北市",
      district: "內湖區",
      status: "效期屆滿",
      statusColor: "bg-yellow-100 text-yellow-700",
      expiry: "有效至 2024/7/31",
      extension: "4 年 (至 2028/7/31)",
      limit: 10,
      prevQuota: 2,
      currentQuota: 3,
      groupId: null,
      isSubRow: false,
    },
    {
      id: 4,
      code: "0401180017",
      name: "中國醫藥大學附醫",
      county: "台中市",
      district: "北區",
      status: "效期屆滿",
      statusColor: "bg-yellow-100 text-yellow-700",
      expiry: "有效至 2026/7/31",
      extension: "4 年 (至 2030/7/31)",
      limit: 8,
      prevQuota: 2,
      currentQuota: 2,
      groupId: null,
      isSubRow: false,
    },
    {
      id: "5.1",
      code: "0401180018",
      name: "聯合申請 (仁愛院區)",
      county: "台北市",
      district: "大安區",
      status: "效期屆滿",
      statusColor: "bg-yellow-100 text-yellow-700",
      expiry: "有效至 2026/7/31",
      extension: "4 年 (至 2030/7/31)",
      limit: 15,
      prevQuota: 4,
      currentQuota: 5,
      groupId: "group-a",
      isSubRow: false,
    },
    {
      id: "5.2",
      code: "0401180019",
      name: "聯合申請 (和平院區)",
      county: "台北市",
      district: "中正區",
      status: "",
      statusColor: "",
      expiry: "",
      extension: "",
      limit: null,
      prevQuota: null,
      currentQuota: null,
      groupId: "group-a",
      isSubRow: true,
    },
  ]

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

  const disqualifiedHospitals = [
    {
      id: 1,
      code: "0401180020",
      name: "新光醫院",
      reason: "未符合訓練醫院認證基準第3條：專任主治醫師人數不足",
    },
  ]

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">訓練醫院名單與容額分配</h2>
        <div className="flex items-center gap-3">
          <Link href="/filing/quota/new">
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

      <div className="bg-card rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px]">
            <thead>
              <tr className="bg-muted/50 border-b text-base font-medium text-muted-foreground">
                <th className="px-4 py-3 text-left whitespace-nowrap w-12">序號</th>
                <th className="px-4 py-3 text-left whitespace-nowrap w-36">醫事機構代碼</th>
                <th className="px-4 py-3 text-left whitespace-nowrap">主訓醫院</th>
                <th className="px-4 py-3 text-left whitespace-nowrap w-28">縣市 / 行政區</th>
                <th className="px-4 py-3 text-center whitespace-nowrap w-24">狀態</th>
                <th className="px-4 py-3 text-center whitespace-nowrap w-36">效期</th>
                <th className="px-4 py-3 text-center whitespace-nowrap w-40">延長效期</th>
                <th className="px-4 py-3 text-center whitespace-nowrap w-20">容額上限</th>
                <th className="px-4 py-3 text-center whitespace-nowrap w-28">前年度核定容額</th>
                <th className="px-4 py-3 text-center whitespace-nowrap w-24">本年度容額</th>
                <th className="px-4 py-3 text-center whitespace-nowrap w-16">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {hospitals.map((hospital) => {
                const groupStyle = hospital.groupId ? groupColors[hospital.groupId] : ""
                return (
                <tr
                  key={hospital.id}
                  className={`hover:bg-muted/30 ${groupStyle ? `border-l-4 ${groupStyle}` : ""}`}
                >
                  <td className="px-4 py-4 text-muted-foreground whitespace-nowrap">{hospital.id}</td>
                  <td className="px-4 py-4 text-muted-foreground whitespace-nowrap">{hospital.code}</td>
                  <td className="px-4 py-4 font-medium whitespace-nowrap">
                    {hospital.groupId && (
                      <span className="text-muted-foreground mr-1">[聯合]</span>
                    )}
                    {hospital.name}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    {hospital.county ? (
                      <div>
                        <span className="text-foreground">{hospital.county}</span>
                        {hospital.district && (
                          <span className="text-muted-foreground ml-1">{hospital.district}</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-center whitespace-nowrap">
                    {hospital.status && (
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-base font-medium ${hospital.statusColor}`}
                      >
                        {hospital.status}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-center text-muted-foreground whitespace-nowrap">
                    {hospital.expiry}
                  </td>
                  <td className="px-4 py-4 text-center text-muted-foreground whitespace-nowrap">
                    {hospital.extension}
                  </td>
                  <td className="px-4 py-4 text-center whitespace-nowrap">{hospital.limit}</td>
                  <td className="px-4 py-4 text-center whitespace-nowrap">{hospital.prevQuota}</td>
                  <td className="px-4 py-4 text-center whitespace-nowrap">{hospital.currentQuota}</td>
                  <td className="px-4 py-4 text-center whitespace-nowrap">
                    {!("isSubRow" in hospital && hospital.isSubRow) && (
                      <Link href={`/filing/quota/${hospital.id}`}>
                        <Button variant="link" className="text-primary p-0 h-auto">
                          編輯
                        </Button>
                      </Link>
                    )}
                  </td>
                </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-foreground">不合格醫院名單</h3>
          <div className="flex items-center gap-3">
            <Button className="gap-2 bg-[#2d3a8c] hover:bg-[#252f73] text-white">
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
        <div className="bg-card rounded-lg shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/50 border-b text-base font-medium text-muted-foreground">
                <th className="px-4 py-3 text-left">序號</th>
                <th className="px-4 py-3 text-left">醫事機構代碼</th>
                <th className="px-4 py-3 text-left">主訓醫院</th>
                <th className="px-4 py-3 text-left">不合格原因</th>
                <th className="px-4 py-3 text-center">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {disqualifiedHospitals.map((hospital) => (
                <tr key={hospital.id}>
                  <td className="px-4 py-4 text-muted-foreground">{hospital.id}</td>
                  <td className="px-4 py-4 text-muted-foreground">{hospital.code}</td>
                  <td className="px-4 py-4 font-medium">{hospital.name}</td>
                  <td className="px-4 py-4 text-muted-foreground">{hospital.reason}</td>
                  <td className="px-4 py-4 text-center">
                    <Button variant="link" className="text-primary p-0 h-auto">
                      編輯
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              匯出檔案
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <FileText className="h-4 w-4 mr-2" />
              匯出 Word 檔
            </DropdownMenuItem>
            <DropdownMenuItem>
              <FileText className="h-4 w-4 mr-2" />
              匯出 PDF 檔
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

