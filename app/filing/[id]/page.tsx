"use client"

import { useState, use, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  Eye,
  Download,
  FileText,
  AlertCircle,
  CheckCircle2,
} from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"

import { TextDiffDisplay } from "@/components/filing/text-diff-display"
import {
  ReviewFeedbackBanner,
  type ReviewFeedback,
} from "@/components/filing/review-feedback-banner"

// Mock data - Previous year content (read-only reference)
const previousYearData = [
  {
    id: "1",
    title: "一、甄審原則",
    content:
      "衛生福利部（以下簡稱本部）為辦理內科專科醫師甄審（以下簡稱專科醫師甄審），特訂定本原則。",
  },
  {
    id: "2",
    title: "二、醫師資格",
    content: `醫師符合下列資格之一者，得參加專科醫師甄審：

（一）依本部一百零一年六月三十日以前公告該年度所定訓練期間，接受畢業後一般醫學（以下簡稱PGY）訓練：於內科專科醫師訓練醫院接受三年以上之內科臨床訓練，且至少連續九個月以上於同一家醫院接受訓練，並取得該院內科專科醫師訓練期滿之證明文件。`,
  },
  {
    id: "3",
    title: "三、訓練醫院資格",
    content: "訓練醫院應符合本部公告之訓練醫院認定基準。",
  },
  {
    id: "2-2",
    title: "2.2 訓練計畫執行架構",
    content: `2.2.1精神科專科醫師訓練計畫由「衛生福利部專科醫師訓練計畫認定會」(Residency Review Committee，以下簡稱RRC)認可之訓練醫院執行，依據核給名額收訓。訓練醫院應有能力提供各樣資源以達到完整的訓練目標。

2.2.2各訓練醫院應有完整之住院醫師訓練計畫書，詳細載明訓練目標、核心課程、師資、教學資源、訓練課程與訓練方式、考評機制等重點，落實執行且持續檢討改進。

2.2.3教育相關人員應均清楚知道訓練計畫的建構精神與施行策略。

2.2.4為達到本計畫訓練之完整目標。`,
  },
]

// Mock data - Current year content with changes (for 待送件/需補件 status)
const currentYearWithChanges = [
  {
    id: "1",
    title: "一、甄審原則",
    content:
      "衛生福利部（以下簡稱本部）為辦理內科專科醫師甄審（以下簡稱專科醫師甄審），特訂定本原則。",
  },
  {
    id: "2",
    title: "二、醫師資格",
    content: `醫師符合下列資格之一者，得參加專科醫師甄審：

（一）依本部一百零一年六月三十日以前公告該年度所定訓練期間，接受畢業後一般醫學（以下簡稱PGY）訓練：於內科專科醫師訓練醫院接受五年以上之內科臨床訓練，且至少連續九個月以上於同一家醫院接受訓練，並取得該院內科專科醫師訓練期滿之證明文件。`,
  },
  {
    id: "3",
    title: "三、訓練醫院資格",
    content: "訓練醫院必須符合本部公告之訓練醫院認定基準。",
  },
  {
    id: "2-2",
    title: "2.2 訓練計畫執行架構",
    content: `2.2.1精神科專科醫師訓練計畫委由「衛生福利部專科醫師訓練計畫認定會」(Residency Review Committee，以下簡稱RRC)認可之訓練醫院執行，依據核給名額收訓。訓練醫院必須有能力提供各樣資源以達到完整的訓練目標。

2.2.2各訓練醫院應有完整之住院醫師訓練計畫書，詳細載明訓練目標、核心課程、師資、教學資源、訓練課程與訓練方式、考評機制等重點，落實執行且持續檢討改進。訓練課程須符合「精神科專科醫師訓練課程基準」(依照衛生福利部最新公告)。

2.2.3教育相關人員應均清楚知道訓練計畫的建構精神與施行策略。

2.2.4為達到本計畫所載訓練之完整目標，不限同一家機構訓練，允許與合作醫院聯合訓練。`,
  },
]

// Mock data - Current year content unchanged (for 尚未送出 status - same as previous year)
const currentYearUnchanged = previousYearData.map((section) => ({
  ...section,
}))

// Mock review feedback - larger content for testing
const mockReviewFeedback: ReviewFeedback = {
  reviewDate: "114/03/10",
  meetingTitle: "114年度第一次專科醫師訓練計畫審查會議",
  comments: [
    "第 2.1 條專任醫師人數建議調整為 5 位，以符合新法規要求",
    "第 3.2 條訓練時數說明過於簡略，請補充具體課程安排",
    "建議新增第 4.3 條關於緊急應變的說明",
  ],
  fullContent: `一、會議時間：114年3月10日（星期一）上午10時

二、會議地點：衛生福利部第一會議室

三、主席：○○○部長
    紀錄：○○○

四、出席人員：（略）

五、審查意見：

（一）關於訓練計畫認定基準部分：
    1. 第 2.1 條專任醫師人數建議調整為 5 位，以符合新法規要求。依據衛生福利部最新公告之「專科醫師訓練醫院認定基準」第三條規定，訓練醫院應有五位以上之專任主治醫師，方符合訓練醫院之基本條件。
    
    2. 第 3.2 條訓練時數說明過於簡略，請補充具體課程安排。建議明列各項核心課程之訓練時數、訓練方式及評核標準，以利受訓學員及訓練醫院有所依循。

（二）關於訓練課程規劃部分：
    1. 建議新增第 4.3 條關於緊急應變的說明，包含但不限於：
       - 重大傳染病疫情之應變措施
       - 大量傷患事件之處置流程
       - 緊急醫療救護系統之整合運作
    
    2. 第 5.1 條師資培育計畫宜更具體，建議增列：
       - 師資培訓課程之規劃
       - 教學品質評估機制
       - 師資持續進修之規定

（三）其他建議事項：
    1. 請確認各條文之用語是否與現行法規一致。
    2. 建議增列名詞解釋章節，以利閱讀理解。
    3. 請於修正後一個月內重新送審。

六、散會：上午12時30分`,
}

const historicalVersions = [
  { year: "2024", title: "內科醫學會 訓練醫院認定基準" },
  { year: "2023", title: "內科醫學會 訓練醫院認定基準" },
  { year: "2022", title: "內科醫學會 訓練醫院認定基準" },
]

export default function FilingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const searchParams = useSearchParams()
  const status = searchParams.get("status") || "待審查"

  // 根據狀態決定初始資料：尚未送出 = 未修改（與前一年相同），其他 = 已有修改
  const isUnfilled = status === "尚未送出"
  const initialData = isUnfilled ? currentYearUnchanged : currentYearWithChanges

  const [documentMethod, setDocumentMethod] = useState<string>(isUnfilled ? "no-change" : "change")
  const [showVersionDialog, setShowVersionDialog] = useState(false)
  const [expandedSections, setExpandedSections] = useState<string[]>(["1", "2", "3", "2-2"])
  const [activeTab, setActiveTab] = useState<string>("current")
  
  // Current year editable content
  const [currentYearContent, setCurrentYearContent] = useState<Record<string, string>>(
    initialData.reduce((acc, section) => {
      acc[section.id] = section.content
      return acc
    }, {} as Record<string, string>)
  )

  // Revision notes per section
  const [revisionNotes, setRevisionNotes] = useState<Record<string, string>>({})
  
  const hasReviewComments = status === "需補件"
  const isReadOnly = status === "通過" || status === "審查中"
  const isReviewInProgress = status === "審查中"
  const isPreviousYearOnly = status === "view"
  const showDocumentMethodChoice = status === "待送件" || status === "尚未送出"

  const getDocumentTitle = () => {
    const titles: Record<string, string> = {
      "training-plan": "訓練計畫認定基準",
      "training-curriculum": "訓練課程基準",
      "evaluation-standards": "評核標準與評核表",
      "quota-allocation": "容額分配原則",
      "improvement-guide": "精進指南",
      "screening-principle": "甄審原則",
    }
    return titles[id] || id
  }

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((s) => s !== sectionId)
        : [...prev, sectionId]
    )
  }

  const updateContent = (sectionId: string, content: string) => {
    setCurrentYearContent((prev) => ({
      ...prev,
      [sectionId]: content,
    }))
  }

  const updateRevisionNote = (sectionId: string, note: string) => {
    setRevisionNotes((prev) => ({
      ...prev,
      [sectionId]: note,
    }))
  }

  // Get previous year content for a section
  const getPreviousYearContent = (sectionId: string) => {
    const section = previousYearData.find((s) => s.id === sectionId)
    return section?.content || ""
  }

  // Check if a section has changes
  const sectionHasChanges = (sectionId: string) => {
    const prevContent = getPreviousYearContent(sectionId)
    const currContent = currentYearContent[sectionId] || ""
    return prevContent !== currContent
  }

  // Compute stats
  const stats = useMemo(() => {
    const sectionsWithChanges = initialData.filter((s) => sectionHasChanges(s.id))
    const notesFilledCount = sectionsWithChanges.filter((s) => {
      const note = revisionNotes[s.id] || ""
      return note && note.trim() !== ""
    }).length
    return {
      totalChanges: sectionsWithChanges.length,
      notesFilled: notesFilledCount,
      pending: sectionsWithChanges.length - notesFilledCount,
    }
    }, [currentYearContent, revisionNotes, initialData])

  return (
    <div className="min-h-screen bg-[#f5f7fa]">
      <div className="bg-[#1e2a5e] text-white/70 text-sm py-2">
        <div className="container mx-auto px-6">
          規範文件管理 / 專科醫師訓練管理系統
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

        <div className="flex items-center justify-between mt-4 mb-6">
          <h1 className="text-2xl font-bold text-foreground">
            內科專科醫師{getDocumentTitle()} - {isPreviousYearOnly ? "113年度核定內容" : "114年度文件填報"}
          </h1>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setShowVersionDialog(true)}
              className="text-primary border-primary hover:bg-primary/5"
            >
              其他年度版本
            </Button>
          </div>
        </div>
      </div>

      {/* Review Feedback Banner - Sticky below nav */}
      {hasReviewComments && (
        <div className="sticky top-16 z-40 bg-[#f5f7fa] pt-2 pb-4 shadow-sm">
          <div className="container mx-auto px-6">
            <ReviewFeedbackBanner feedback={mockReviewFeedback} />
          </div>
        </div>
      )}

      <div className="container mx-auto px-6 pb-8">

        <div className="space-y-6">
          {isPreviousYearOnly && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-amber-700">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <span className="font-medium">
                  本年度填報尚未開放，以下顯示 113 年度已核定內容供參考
                </span>
              </div>
            </div>
          )}

          {isReviewInProgress && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-blue-700">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <span className="font-medium">
                  此文件已送件，目前審查中，僅供查看
                </span>
              </div>
            </div>
          )}

          {isReadOnly && !isReviewInProgress && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-green-700">
                <span className="h-5 w-5 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-bold">
                  V
                </span>
                <span className="font-medium">
                  此文件已通過審查，僅供查看及匯出
                </span>
              </div>
            </div>
          )}

          {!isPreviousYearOnly && showDocumentMethodChoice && (
            <div className="bg-card rounded-lg p-6">
              <h3 className="font-medium text-foreground mb-4">
                本年度文件處理方式
              </h3>
              <RadioGroup value={documentMethod} onValueChange={setDocumentMethod}>
                <div
                  className={`flex items-center space-x-3 p-4 rounded-lg border-2 mb-3 ${
                    documentMethod === "change"
                      ? "border-primary bg-primary/5"
                      : "border-border"
                  }`}
                >
                  <RadioGroupItem value="change" id="change" />
                  <Label htmlFor="change" className="cursor-pointer">
                    變更文件
                  </Label>
                </div>
                <div
                  className={`flex items-center space-x-3 p-4 rounded-lg border-2 ${
                    documentMethod === "no-change"
                      ? "border-primary bg-primary/5"
                      : "border-border"
                  }`}
                >
                  <RadioGroupItem value="no-change" id="no-change" />
                  <Label htmlFor="no-change" className="cursor-pointer">
                    不變更
                  </Label>
                </div>
              </RadioGroup>
            </div>
          )}

          

          {/* Unified Note Option - Only show when editing */}
          {!isReadOnly && !isPreviousYearOnly && documentMethod === "change" && stats.totalChanges > 1 && (
          {/* Stats Bar - Only show when editing */}
          {!isReadOnly && !isPreviousYearOnly && documentMethod === "change" && stats.totalChanges > 0 && (
            <div className="flex items-center gap-4 text-sm">
              <span className="text-muted-foreground">
                修訂狀態：
              </span>
              <span className="flex items-center gap-1.5 text-foreground">
                共 <span className="font-medium">{stats.totalChanges}</span> 處修訂
              </span>
              <span className="flex items-center gap-1.5 text-green-600">
                <CheckCircle2 className="h-4 w-4" />
                已填說明 {stats.notesFilled}
              </span>
              {stats.pending > 0 && (
                <span className="flex items-center gap-1.5 text-amber-600">
                  <AlertCircle className="h-4 w-4" />
                  待填說明 {stats.pending}
                </span>
              )}
            </div>
          )}

          {/* Tab Switching: Previous Year (Read-only) vs Current Year (Editable) */}
          <div className="bg-card rounded-lg">
            <Tabs value={isPreviousYearOnly ? "previous" : activeTab} onValueChange={isPreviousYearOnly ? undefined : setActiveTab}>
              <div className="border-b px-4">
                <TabsList className="h-12 bg-transparent p-0 gap-4">
                  {!isPreviousYearOnly && (
                    <TabsTrigger
                      value="current"
                      className="relative h-12 rounded-none border-b-2 border-transparent px-4 pb-3 pt-2 font-medium text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none bg-transparent"
                    >
                      {isReadOnly ? "114 年度 (已送件)" : "114 年度 (編輯中)"}
                    </TabsTrigger>
                  )}
                  <TabsTrigger
                    value="previous"
                    className="relative h-12 rounded-none border-b-2 border-transparent px-4 pb-3 pt-2 font-medium text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none bg-transparent"
                  >
                    113 年度 {isPreviousYearOnly ? "(核定內容)" : "(參考)"}
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Current Year Tab - Editable with Diff Display and Inline Notes */}
              <TabsContent value="current" className="p-6 mt-0">
                <div className="space-y-6">
                  {initialData.map((section) => {
                    const prevContent = getPreviousYearContent(section.id)
                    const currContent = currentYearContent[section.id] || ""
                    const hasChanges = prevContent !== currContent

                    return (
                      <Collapsible
                        key={section.id}
                        open={expandedSections.includes(section.id)}
                        onOpenChange={() => toggleSection(section.id)}
                      >
                        <div className="border rounded-lg border-border">
                          <CollapsibleTrigger className="w-full">
                            <div className="flex items-center justify-between px-4 py-3 hover:bg-muted/50">
                              <div className="flex items-center gap-2">
                                {expandedSections.includes(section.id) ? (
                                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                )}
                                <span className="font-medium">{section.title}</span>
                                {hasChanges ? (
                                  <span className="ml-2 px-2 py-0.5 text-sm bg-amber-100 text-amber-700 rounded">
                                    已修訂
                                  </span>
                                ) : documentMethod === "change" && !isReadOnly ? (
                                  <span className="ml-2 px-2 py-0.5 text-sm bg-gray-100 text-gray-500 rounded">
                                    未修正
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="px-4 pb-4">
                              {/* Two-column layout: Content + Revision Note */}
                              <div className={`grid gap-4 ${hasChanges && !isReadOnly && documentMethod === "change" ? "grid-cols-[1fr,280px]" : "grid-cols-1"}`}>
                                {/* Left: Content Area */}
                                <div className="space-y-4">
                                  {/* Editable Textarea */}
                                  <Textarea
                                    value={currContent}
                                    onChange={(e) =>
                                      updateContent(section.id, e.target.value)
                                    }
                                    className={`min-h-32 border-2 ${
                                      isReadOnly
                                        ? "bg-muted/50 border-border"
                                        : "border-primary/30 focus:border-primary"
                                    }`}
                                    placeholder="請輸入內容..."
                                    disabled={
                                      isReadOnly ||
                                      (showDocumentMethodChoice &&
                                        documentMethod === "no-change")
                                    }
                                    readOnly={isReadOnly}
                                  />

                                  {/* Diff Display */}
                                  {hasChanges && (
                                    <div className="p-4 bg-muted/30 rounded-lg border">
                                      <div className="text-sm text-muted-foreground mb-2 flex items-center gap-4">
                                        <span>變更預覽：</span>
                                        <span className="flex items-center gap-1">
                                          <span className="inline-block w-3 h-3 bg-red-100 border border-red-200 rounded-sm" />
                                          刪除
                                        </span>
                                        <span className="flex items-center gap-1">
                                          <span className="inline-block w-3 h-3 bg-green-100 border border-green-200 rounded-sm" />
                                          新增
                                        </span>
                                      </div>
                                      <TextDiffDisplay
                                        oldText={prevContent}
                                        newText={currContent}
                                      />
                                    </div>
                                  )}
                                </div>

                                {/* Right: Revision Note (inline, scrolls with content) */}
                                {hasChanges && !isReadOnly && documentMethod === "change" && (
                                    <div className="space-y-2">
                                      <span className="text-sm font-medium text-muted-foreground">
                                        修訂說明 <span className="text-destructive">*</span>
                                      </span>
                                      <Textarea
                                        value={revisionNotes[section.id] || ""}
                                        onChange={(e) =>
                                          updateRevisionNote(section.id, e.target.value)
                                        }
                                        placeholder="請說明此處修訂原因..."
                                        className="min-h-28 text-sm resize-none"
                                      />
                                      {!revisionNotes[section.id] && (
                                        <p className="text-sm text-amber-600 flex items-center gap-1">
                                          <AlertCircle className="h-3 w-3" />
                                          此處修訂尚未填寫說明
                                        </p>
                                      )}
                                    </div>
                                    {applyUnifiedNote ? (
                                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 text-sm text-blue-800">
                                        <p className="text-sm text-blue-600 mb-1">使用統一說明：</p>
                                        {unifiedNote || <span className="text-blue-400">（尚未填寫）</span>}
                                      </div>
                                    ) : (
                                      <Textarea
                                        value={revisionNotes[section.id] || ""}
                                        onChange={(e) =>
                                          updateRevisionNote(section.id, e.target.value)
                                        }
                                        placeholder="請說明此處修訂原因..."
                                        className="min-h-28 text-sm resize-none"
                                      />
                                    )}
                                    {!applyUnifiedNote && !noteIsFilled && (
                                      <p className="text-sm text-amber-600 flex items-center gap-1">
                                        <AlertCircle className="h-3 w-3" />
                                        此處修訂尚未填寫說明
                                      </p>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </CollapsibleContent>
                        </div>
                      </Collapsible>
                    )
                  })}
                </div>
              </TabsContent>

              {/* Previous Year Tab - Read-only */}
              <TabsContent value="previous" className="p-6 mt-0">
                <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100 flex items-center justify-between">
                  <p className="text-sm text-blue-800">
                    此為 113 年度已核定內容，僅供參考，無法編輯。
                  </p>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-1 bg-white">
                        <Download className="h-4 w-4" />
                        下載前次檔案
                        <ChevronDown className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <FileText className="h-4 w-4 mr-2" />
                        下載 Word 檔
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <FileText className="h-4 w-4 mr-2" />
                        下載 PDF 檔
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="space-y-4">
                  {previousYearData.map((section) => (
                    <Collapsible
                      key={section.id}
                      open={expandedSections.includes(section.id)}
                      onOpenChange={() => toggleSection(section.id)}
                    >
                      <div className="border rounded-lg border-border bg-muted/20">
                        <CollapsibleTrigger className="w-full">
                          <div className="flex items-center justify-between px-4 py-3 hover:bg-muted/50">
                            <div className="flex items-center gap-2">
                              {expandedSections.includes(section.id) ? (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              )}
                              <span className="font-medium text-muted-foreground">
                                {section.title}
                              </span>
                            </div>
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="px-4 pb-4">
                            <div className="p-4 bg-muted/30 rounded-lg text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
                              {section.content}
                            </div>
                          </div>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            <Button variant="outline">返回</Button>
            {!isPreviousYearOnly && (
              <Button variant="outline" className="gap-1.5">
                <FileText className="h-4 w-4" />
                匯出 PDF
              </Button>
            )}
            {!isReadOnly && !isPreviousYearOnly && (
              <Button className="bg-[#2d3a8c] hover:bg-[#252f73] text-white">
                儲存草稿
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Historical Versions Dialog */}
      <Dialog open={showVersionDialog} onOpenChange={setShowVersionDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>歷年版本</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {historicalVersions.map((version) => (
              <div
                key={version.year}
                className="flex items-center justify-between py-3 border-b last:border-0"
              >
                <div>
                  <div className="font-medium">{version.year}年度</div>
                  <div className="text-sm text-muted-foreground">
                    {version.title}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    預覽
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-1">
                        下載
                        <ChevronDown className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <FileText className="h-4 w-4 mr-2" />
                        Word 檔
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <FileText className="h-4 w-4 mr-2" />
                        PDF 檔
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-center pt-2">
            <Button
              onClick={() => setShowVersionDialog(false)}
              className="bg-[#2d3a8c] hover:bg-[#252f73] text-white"
            >
              關閉
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
