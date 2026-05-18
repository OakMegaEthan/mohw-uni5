"use client"

import { useState, use } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  Download,
  Upload,
  FileText,
  Trash2,
  FileIcon,
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

import { TextDiffDisplay } from "@/components/filing/text-diff-display"
import { getDocumentTypes, getStagesForDocumentType, getSocieties } from "@/lib/mock/review-submissions"

// Mock data - this would come from the filing submission
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

// Current year submitted content (from filing)
const currentYearData = [
  {
    id: "1",
    title: "一、甄審原則",
    content:
      "衛生福利部（以下簡稱本部）為辦理內科專科醫師甄審（以下簡稱專科醫師甄審），特訂定本原則。",
    revisionNote: "",
  },
  {
    id: "2",
    title: "二、醫師資格",
    content: `醫師符合下列資格之一者，得參加專科醫師甄審：

（一）依本部一百零一年六月三十日以前公告該年度所定訓練期間，接受畢業後一般醫學（以下簡稱PGY）訓練：於內科專科醫師訓練醫院接受五年以上之內科臨床訓練，且至少連續九個月以上於同一家醫院接受訓練，並取得該院內科專科醫師訓練期滿之證明文件。`,
    revisionNote: "因應衛福部 114 年法規修正，將訓練年限由三年調整為五年。",
  },
  {
    id: "3",
    title: "三、訓練醫院資格",
    content: "訓練醫院必須符合本部公告之訓練醫院認定基準。",
    revisionNote: "將「應」改為「必須」以符合新規定用語。",
  },
  {
    id: "2-2",
    title: "2.2 訓練計畫執行架構",
    content: `2.2.1精神科專科醫師訓練計畫委由「衛生福利部專科醫師訓練計畫認定會」(Residency Review Committee，以下簡稱RRC)認可之訓練醫院執行，依據核給名額收訓。訓練醫院必須有能力提供各樣資源以達到完整的訓練目標。

2.2.2各訓練醫院應有完整之住院醫師訓練計畫書，詳細載明訓練目標、核心課程、師資、教學資源、訓練課程與訓練方式、考評機制等重點，落實執行且持續檢討改進。訓練課程須符合「精神科專科醫師訓練課程基準」(依照衛生福利部最新公告)。

2.2.3教育相關人員應均清楚知道訓練計畫的建構精神與施行策略。

2.2.4為達到本計畫所載訓練之完整目標，不限同一家機構訓練，允許與合作醫院聯合訓練。`,
    revisionNote: "1. 2.2.1 將「由」改為「委由」，「應」改為「必須」\n2. 2.2.2 新增訓練課程基準參照說明\n3. 2.2.4 新增允許聯合訓練之說明",
  },
]

// Documents with two-stage review process (already handled by batch advancement)
// Keep for reference but not used in current stage management
const twoStageDocuments = ["計畫認定基準", "訓練課程基準", "評核標準", "容額分配原則"]

// Mock group review files (from previous stage)
const mockGroupReviewFiles = [
  { name: "分組會議紀錄_114-02-20.pdf", size: 2048000, date: "2025-02-20" },
  { name: "分組審查意見彙整.docx", size: 512000, date: "2025-02-20" },
]

export default function ReviewDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const searchParams = useSearchParams()
  
  // 從 URL query params 取得文件類型和階段
  const docTypeId = searchParams.get("docType") || "screening-principle"
  const stage = searchParams.get("stage") || "pending-review"
  
  // 取得文件類型和階段的標籤
  const documentTypes = getDocumentTypes()
  const societies = getSocieties()
  const docType = documentTypes.find((d) => d.id === docTypeId)
  const stages = getStagesForDocumentType(docTypeId)
  const stageInfo = stages.find((s) => s.value === stage)
  const society = societies.find((s) => s.id === id)
  
  // Document info derived from query params
  const documentInfo = {
    society: society?.name || "內科醫學會",
    documentType: docType?.shortName || "計畫認定基準",
    year: "114",
    submittedDate: "2025-03-01",
    currentStage: stage,
  }

  // Determine if this document has two-stage review
  const hasTwoStageReview = twoStageDocuments.includes(documentInfo.documentType)
  const isRRCReviewStage = stage === "rrc-meeting"
  const isGroupReviewStage = stage === "group-meeting"
  const showGroupReviewFiles = hasTwoStageReview && isRRCReviewStage

  const [expandedSections, setExpandedSections] = useState<string[]>(
    currentYearData.map((s) => s.id)
  )
  const [activeTab, setActiveTab] = useState<string>("current")
  
  // Review state - now only handles review result (pass/needs-revision)
  // Stage progression is managed at the document type level, not per submission
  const [reviewResult, setReviewResult] = useState("pending") // pending | approved | needs-revision
  const [reviewComment, setReviewComment] = useState("")
  const [showResultDialog, setShowResultDialog] = useState(false)
  const [pendingResult, setPendingResult] = useState("")
  
  // Uploaded files
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ name: string; size: number; date: string }>>([])

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId]
    )
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      const newFiles = Array.from(files).map((file) => ({
        name: file.name,
        size: file.size,
        date: new Date().toLocaleDateString("zh-TW"),
      }))
      setUploadedFiles([...uploadedFiles, ...newFiles])
      toast.success(`已上傳 ${newFiles.length} 個檔案`)
    }
    e.target.value = ""
  }

  const removeFile = (index: number) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index))
    toast.success("已移除檔案")
  }

  const handleResultChange = (newResult: string) => {
    setPendingResult(newResult)
    setShowResultDialog(true)
  }

  const confirmResultChange = () => {
    setReviewResult(pendingResult)
    setShowResultDialog(false)
    const resultLabel = {
      approved: "通過",
      "needs-revision": "需補件",
      pending: "待審查",
    }[pendingResult] || pendingResult
    toast.success(`審查結果已記錄為「${resultLabel}」`)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B"
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
    return (bytes / (1024 * 1024)).toFixed(1) + " MB"
  }

  const getStageColor = (stage: string) => {
    switch (stage) {
      case "pending":
        return "bg-gray-100 text-gray-700"
      case "reviewing":
        return "bg-blue-100 text-blue-700"
      case "group-review":
        return "bg-purple-100 text-purple-700"
      case "rrc-review":
        return "bg-indigo-100 text-indigo-700"
      case "announced":
        return "bg-green-100 text-green-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  const handleDownload = (format: "word" | "pdf") => {
    toast.success(`正在下載 ${format.toUpperCase()} 檔案...`)
  }

  return (
    <div className="min-h-screen bg-[#f5f7fa]">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="container mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/review/submissions">
                <Button variant="ghost" size="sm" className="gap-1">
                  <ChevronLeft className="h-4 w-4" />
                  返回列表
                </Button>
              </Link>
              <div className="h-6 w-px bg-gray-200" />
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-lg font-semibold">
                    {documentInfo.society} - {documentInfo.documentType}
                  </h1>
                  <Badge className={`${
                    stage === "pending-review" ? "bg-blue-100 text-blue-800" :
                    stage === "group-meeting" ? "bg-purple-100 text-purple-800" :
                    stage === "rrc-meeting" ? "bg-pink-100 text-pink-800" :
                    stage === "pending-announcement" ? "bg-amber-100 text-amber-800" :
                    "bg-green-100 text-green-800"
                  }`}>
                    {stageInfo?.label || stage}
                  </Badge>
                </div>
                <p className="text-base text-muted-foreground mt-1">
                  {documentInfo.year} 年度 | 提交日期：{documentInfo.submittedDate}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div>
                <p className="text-base text-gray-500 mb-1">審查結果</p>
                <Badge
                  className={`${
                    reviewResult === "approved"
                      ? "bg-green-100 text-green-700"
                      : reviewResult === "needs-revision"
                        ? "bg-orange-100 text-orange-700"
                        : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {reviewResult === "approved"
                    ? "通過"
                    : reviewResult === "needs-revision"
                      ? "需補件"
                      : "待審查"}
                </Badge>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1">
                    <Download className="h-4 w-4" />
                    下載檔案
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleDownload("word")}>
                    <FileIcon className="h-4 w-4 mr-2" />
                    Word 格式 (.docx)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDownload("pdf")}>
                    <FileText className="h-4 w-4 mr-2" />
                    PDF 格式 (.pdf)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Tabs */}
      <div className="sticky top-16 z-40 bg-white border-b shadow-sm">
        <div className="container mx-auto px-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="h-12 bg-transparent border-0 p-0">
              <TabsTrigger 
                value="current" 
                className="text-base data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-12 px-5"
              >
                114 年度 (本次送審)
              </TabsTrigger>
              <TabsTrigger 
                value="previous" 
                className="text-base data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-12 px-5"
              >
                113 年度 (參考)
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">
        {/* Stage-specific info banner */}
        {isGroupReviewStage && (
          <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                <FileText className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-medium text-purple-900">分組會議審查階段</h3>
                <p className="text-base text-purple-700">請審閱醫學會提交的文件內容，並於右側記錄審查結果與評語。</p>
              </div>
            </div>
          </div>
        )}
        {isRRCReviewStage && (
          <div className="mb-6 p-4 bg-pink-50 border border-pink-200 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-pink-100 flex items-center justify-center">
                <FileText className="h-5 w-5 text-pink-600" />
              </div>
              <div>
                <h3 className="font-medium text-pink-900">RRC 大會審核階段</h3>
                <p className="text-base text-pink-700">此案件已通過分組會議審查，請參考分組會議審查資料進行最終審核。</p>
              </div>
            </div>
          </div>
        )}
        {stage === "pending-announcement" && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                <FileText className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-medium text-amber-900">待公告階段</h3>
                <p className="text-base text-amber-700">此案件已通過所有審查，等待正式公告。</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsContent value="current" className="mt-0 space-y-4">
                {currentYearData.map((section) => {
                  const prevSection = previousYearData.find(
                    (p) => p.id === section.id
                  )
                  const prevContent = prevSection?.content || ""
                  const hasChanges = prevContent !== section.content

                  return (
                    <Collapsible
                      key={section.id}
                      open={expandedSections.includes(section.id)}
                      onOpenChange={() => toggleSection(section.id)}
                    >
                      <div className="bg-white rounded-lg border shadow-sm">
                        <CollapsibleTrigger asChild>
                          <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50">
                            <div className="flex items-center gap-3">
                              {expandedSections.includes(section.id) ? (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              )}
                              <span className="font-medium">{section.title}</span>
                              {hasChanges && (
                                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                                  已修訂
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="px-4 pb-4 space-y-4">
                            {/* Content Display */}
                            <div className="p-4 bg-gray-50 rounded-lg border">
                              <p className="whitespace-pre-wrap text-base leading-relaxed">
                                {section.content}
                              </p>
                            </div>

                            {/* Diff Display */}
                            {hasChanges && (
                              <div className="p-4 bg-muted/30 rounded-lg border">
                                <div className="text-base text-muted-foreground mb-2 flex items-center gap-4">
                                  <span>變更比對：</span>
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
                                  newText={section.content}
                                />
                              </div>
                            )}

                            {/* Revision Note (from filing) */}
                            {section.revisionNote && (
                              <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                                <p className="text-base font-medium text-blue-700 mb-1">
                                  醫學會修訂說明
                                </p>
                                <p className="text-base text-blue-900 whitespace-pre-wrap">
                                  {section.revisionNote}
                                </p>
                              </div>
                            )}
                          </div>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  )
                })}
              </TabsContent>

              <TabsContent value="previous" className="mt-0 space-y-4">
                {previousYearData.map((section) => (
                  <Collapsible
                    key={section.id}
                    open={expandedSections.includes(section.id)}
                    onOpenChange={() => toggleSection(section.id)}
                  >
                    <div className="bg-white rounded-lg border shadow-sm">
                      <CollapsibleTrigger asChild>
                        <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50">
                          <div className="flex items-center gap-3">
                            {expandedSections.includes(section.id) ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )}
                            <span className="font-medium">{section.title}</span>
                          </div>
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="px-4 pb-4">
                          <div className="p-4 bg-gray-50 rounded-lg border">
                            <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                              {section.content}
                            </p>
                          </div>
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                ))}
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Sidebar - Review Actions */}
          <div className="space-y-4">
            {/* Review Result Selection */}
            <div className="bg-white rounded-lg border shadow-sm p-4">
              <Label className="text-sm font-medium mb-3 block">審查結果 <span className="text-destructive">*</span></Label>
              <Select value={reviewResult} onValueChange={handleResultChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="approved">
                    <span className="text-green-600 font-medium">通過</span>
                  </SelectItem>
                  <SelectItem value="needs-revision">
                    <span className="text-orange-600 font-medium">需補件</span>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground mt-2">
                選擇審查結果，文件會在批次推進時統一進入下一階段。
              </p>
            </div>

            {/* Group Review Files (only shown in RRC review stage for two-stage documents) */}
            {showGroupReviewFiles && (
              <div className="bg-white rounded-lg border shadow-sm p-4">
                <Label className="text-sm font-medium">分組會議審查資料</Label>
                <p className="text-sm text-muted-foreground mt-1 mb-3">
                  以下為分組會議審查階段通過時上傳之相關文件
                </p>
                <div className="space-y-2">
                  {mockGroupReviewFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-2 bg-purple-50 rounded-lg border border-purple-100"
                    >
                      <FileText className="h-4 w-4 text-purple-600 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{file.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatFileSize(file.size)} | {file.date}
                        </p>
                      </div>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Review Comment */}
            <div className="bg-white rounded-lg border shadow-sm p-4">
              <Label htmlFor="review-comment" className="text-sm font-medium">
                審查評語
              </Label>
              <Textarea
                id="review-comment"
                placeholder="請輸入審查評語或會議決議內容..."
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                className="mt-2 min-h-[200px]"
              />
              <Button 
                className="w-full mt-3"
                onClick={() => {
                  if (reviewComment.trim()) {
                    toast.success("審查評語已儲存")
                  }
                }}
              >
                儲存評語
              </Button>
            </div>

            {/* Meeting Minutes Upload */}
            <div className="bg-white rounded-lg border shadow-sm p-4">
              <Label className="text-sm font-medium">
                {isRRCReviewStage ? "RRC 大會會議記錄" : isGroupReviewStage ? "分組會議記錄" : "會議記錄檔案"}
              </Label>
              
              {/* Uploaded Files List */}
              {uploadedFiles.length > 0 && (
                <div className="mt-3 space-y-2">
                  {uploadedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border"
                    >
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{file.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatFileSize(file.size)} | {file.date}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => removeFile(index)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload Button */}
              <div className="mt-3">
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  multiple
                  accept=".pdf,.doc,.docx,.xls,.xlsx"
                  onChange={handleFileUpload}
                />
                <label htmlFor="file-upload">
                  <Button variant="outline" className="w-full gap-2" asChild>
                    <span>
                      <Upload className="h-4 w-4" />
                      上傳會議記錄
                    </span>
                  </Button>
                </label>
                <p className="text-sm text-muted-foreground mt-2">
                  支援 PDF、Word、Excel 格式
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 審查結果確認 Dialog */}
      <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>確認審查結果</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <p className="text-sm text-muted-foreground">
              確定要將審查結果記錄為「
              <span className="font-medium text-foreground">
                {pendingResult === "approved"
                  ? "通過"
                  : pendingResult === "needs-revision"
                    ? "需補件"
                    : "待審查"}
              </span>
              」嗎？
            </p>
            {pendingResult === "needs-revision" && (
              <div className="bg-orange-50 border border-orange-200 rounded p-3">
                <p className="text-sm text-orange-700">
                  需補件後，醫學會將收到通知並可重新修改內容，審查流程會重新開始。
                </p>
              </div>
            )}
            {pendingResult === "approved" && (
              <div className="bg-green-50 border border-green-200 rounded p-3">
                <p className="text-sm text-green-700">
                  此結果將在批次推進時統一納入考量。
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResultDialog(false)}>
              取消
            </Button>
            <Button onClick={confirmResultChange}>確認</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
