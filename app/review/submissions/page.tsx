"use client"

import { useState } from "react"
import Link from "next/link"
import { Clock, ChevronRight, AlertCircle, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  getDocumentSubmissions,
  getDocumentTypes,
  getSocieties,
  getStageColors,
  getStagesForDocumentType,
  getCurrentStageForDocumentType,
  advanceDocumentTypeToNextStage,
  getAdvanceCheckStats,
} from "@/lib/mock/review-submissions"

export default function SubmissionsReviewPage() {
  const [activeDocumentType, setActiveDocumentType] = useState("screening-principle")
  const [showAdvanceDialog, setShowAdvanceDialog] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [, forceUpdate] = useState(0)

  const documentTypes = getDocumentTypes()
  const allStagesForActiveType = getStagesForDocumentType(activeDocumentType)
  const currentDocumentSubmissions = getDocumentSubmissions(activeDocumentType)
  const societies = getSocieties()
  const currentDocumentStage = getCurrentStageForDocumentType(activeDocumentType)

  // 取得該文件類型的所有案件（已經都在同一階段）
  const submissions = currentDocumentSubmissions
    .map((submission) => ({
      ...submission,
      society: societies.find((s) => s.id === submission.societyId)!,
    }))
    .sort((a, b) => {
      // 已上傳的排在前面
      if (a.uploaded && !b.uploaded) return -1
      if (!a.uploaded && b.uploaded) return 1
      return 0
    })

  const currentStageLabel = allStagesForActiveType.find((s) => s.value === currentDocumentStage)?.label || currentDocumentStage
  const nextStageIndex = allStagesForActiveType.findIndex((s) => s.value === currentDocumentStage) + 1
  const hasNextStage = nextStageIndex < allStagesForActiveType.length
  const nextStageLabel = hasNextStage ? allStagesForActiveType[nextStageIndex].label : null
  const advanceStats = getAdvanceCheckStats(activeDocumentType)

  const handleOpenAdvanceDialog = () => {
    // 預設全選已審查通過的醫學會
    setSelectedIds(
      advanceStats.uploadedSocieties
        .filter((s) => s.reviewResult === "approved")
        .map((s) => s.id)
    )
    setShowAdvanceDialog(true)
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    const all = advanceStats.uploadedSocieties
    if (selectedIds.length === all.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(all.map((s) => s.id))
    }
  }

  const handleAdvanceStage = () => {
    if (advanceDocumentTypeToNextStage(activeDocumentType)) {
      setShowAdvanceDialog(false)
      setSelectedIds([])
      // 強制重新渲染以反映新的階段
      forceUpdate((n) => n + 1)
    }
  }

  // 審查結果顯示
  const getReviewResultBadge = (result: string, uploaded: boolean) => {
    if (!uploaded) return null
    switch (result) {
      case "approved":
        return <Badge className="bg-green-100 text-green-700 border-green-200">通過</Badge>
      case "needs-revision":
        return <Badge className="bg-orange-100 text-orange-700 border-orange-200">需補件</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-600 border-gray-200">待審查</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">填報審查</h1>
            <p className="text-base text-gray-500 mt-1">以文件類型為單位檢視各醫學會的填報狀態並進行審查</p>
          </div>
        </div>

        <Tabs
          value={activeDocumentType}
          onValueChange={setActiveDocumentType}
          className="w-full"
        >
          <TabsList className="mb-6 h-11">
            {documentTypes.map((doc) => (
              <TabsTrigger key={doc.id} value={doc.id} className="text-base px-5">
                {doc.shortName}
              </TabsTrigger>
            ))}
          </TabsList>

          {documentTypes.map((doc) => {
            const docStage = getCurrentStageForDocumentType(doc.id)
            const docStages = getStagesForDocumentType(doc.id)
            const docStageLabel = docStages.find((s) => s.value === docStage)?.label || docStage
            const docNextStageIndex = docStages.findIndex((s) => s.value === docStage) + 1
            const docHasNextStage = docNextStageIndex < docStages.length
            const docNextStageLabel = docHasNextStage ? docStages[docNextStageIndex].label : null

            return (
              <TabsContent key={doc.id} value={doc.id} className="space-y-4">
                <Card>
                  <CardContent className="p-6">
                    {/* 標題與目前階段 */}
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900">{doc.name}</h2>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-base text-gray-600">目前階段：</span>
                          <Badge className={`${getStageColors()[docStage] || "bg-gray-100 text-gray-800"} text-base px-3 py-1`}>
                            {docStageLabel}
                          </Badge>
                        </div>
                      </div>
                      {docHasNextStage && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5"
                          onClick={handleOpenAdvanceDialog}
                        >
                          <ArrowRight className="h-4 w-4" />
                          推進至{docNextStageLabel}
                        </Button>
                      )}
                    </div>

                    {/* 案件列表 */}
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12">#</TableHead>
                            <TableHead>醫學會名稱</TableHead>
                            <TableHead>上傳日期</TableHead>
                            <TableHead>審查結果</TableHead>
                            <TableHead className="text-right">操作</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {submissions.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                                沒有資料
                              </TableCell>
                            </TableRow>
                          ) : (
                            submissions.map((submission, index) => (
                              <TableRow
                                key={submission.societyId}
                                className={!submission.uploaded ? "bg-gray-50" : ""}
                              >
                                <TableCell className="font-medium">{index + 1}</TableCell>
                                <TableCell className="font-medium">
                                  <div className="flex items-center gap-2">
                                    {!submission.uploaded && <AlertCircle className="w-4 h-4 text-gray-400" />}
                                    {submission.society.name}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {submission.uploaded ? (
                                    <div className="flex items-center gap-1 text-base text-gray-600">
                                      <Clock className="w-4 h-4" />
                                      {submission.uploadedDate}
                                    </div>
                                  ) : (
                                    <span className="text-base text-gray-400">未上傳</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {submission.uploaded ? (
                                    getReviewResultBadge(submission.reviewResult, submission.uploaded)
                                  ) : (
                                    <span className="text-base text-gray-400">-</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-right">
                                  {submission.uploaded ? (
                                    <Button asChild>
                                      <Link
                                        href={`/review/${submission.societyId}?docType=${activeDocumentType}&stage=${currentDocumentStage}`}
                                        className="flex items-center gap-2"
                                      >
                                        檢視審查
                                        <ChevronRight className="w-4 h-4" />
                                      </Link>
                                    </Button>
                                  ) : (
                                    <span className="text-base text-gray-400">等待醫學會上傳</span>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )
          })}
        </Tabs>

        {/* 推進階段確認 Dialog */}
        <Dialog open={showAdvanceDialog} onOpenChange={setShowAdvanceDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                選擇推進至{nextStageLabel}的醫學會
              </DialogTitle>
            </DialogHeader>
            <div className="py-2 space-y-4">
              <p className="text-base text-gray-600">
                可選擇部分醫學會推進至下一階段，未選取的醫學會將繼續留在「{currentStageLabel}」。
              </p>

              {/* 審查狀態統計 */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                  <p className="text-base text-green-600 mb-0.5">審查通過</p>
                  <p className="text-xl font-bold text-green-700">{advanceStats.approved.count}</p>
                </div>
                <div className={`border rounded-lg p-3 text-center ${advanceStats.needsRevision.count > 0 ? "bg-orange-50 border-orange-200" : "bg-gray-50 border-gray-200"}`}>
                  <p className={`text-base mb-0.5 ${advanceStats.needsRevision.count > 0 ? "text-orange-600" : "text-gray-500"}`}>需補件</p>
                  <p className={`text-xl font-bold ${advanceStats.needsRevision.count > 0 ? "text-orange-700" : "text-gray-400"}`}>{advanceStats.needsRevision.count}</p>
                </div>
                <div className={`border rounded-lg p-3 text-center ${advanceStats.pendingReview.count > 0 ? "bg-amber-50 border-amber-200" : "bg-gray-50 border-gray-200"}`}>
                  <p className={`text-base mb-0.5 ${advanceStats.pendingReview.count > 0 ? "text-amber-600" : "text-gray-500"}`}>尚未審查</p>
                  <p className={`text-xl font-bold ${advanceStats.pendingReview.count > 0 ? "text-amber-700" : "text-gray-400"}`}>{advanceStats.pendingReview.count}</p>
                </div>
              </div>

              {/* 勾選列表 */}
              {advanceStats.uploadedSocieties.length > 0 ? (
                <div className="border rounded-lg overflow-hidden">
                  {/* 全選 */}
                  <div
                    className="flex items-center gap-3 px-4 py-3 bg-gray-50 border-b cursor-pointer"
                    onClick={toggleSelectAll}
                  >
                    <Checkbox
                      checked={selectedIds.length === advanceStats.uploadedSocieties.length && advanceStats.uploadedSocieties.length > 0}
                      onCheckedChange={toggleSelectAll}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span className="text-base font-medium text-gray-700">
                      全選（{advanceStats.uploadedSocieties.length} 個醫學會）
                    </span>
                  </div>
                  {advanceStats.uploadedSocieties.map((society) => (
                    <div
                      key={society.id}
                      className={`flex items-center gap-3 px-4 py-3 border-b last:border-b-0 cursor-pointer transition-colors ${
                        selectedIds.includes(society.id) ? "bg-blue-50" : "hover:bg-gray-50"
                      }`}
                      onClick={() => toggleSelect(society.id)}
                    >
                      <Checkbox
                        checked={selectedIds.includes(society.id)}
                        onCheckedChange={() => toggleSelect(society.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <span className="flex-1 text-base font-medium">{society.name}</span>
                      <div className="shrink-0">
                        {society.reviewResult === "approved" && (
                          <Badge className="bg-green-100 text-green-700 text-sm">審查通過</Badge>
                        )}
                        {society.reviewResult === "needs-revision" && (
                          <Badge className="bg-orange-100 text-orange-700 text-sm">需補件</Badge>
                        )}
                        {society.reviewResult === "pending" && (
                          <Badge className="bg-gray-100 text-gray-600 text-sm">待審查</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-base text-center text-gray-400 py-4">目前沒有已送件的醫學會</p>
              )}

              {/* 警告提示：選了尚未完成審查的醫學會 */}
              {selectedIds.some((id) => {
                const s = advanceStats.uploadedSocieties.find((soc) => soc.id === id)
                return s && s.reviewResult !== "approved"
              }) && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-base text-amber-700">
                    <AlertCircle className="h-4 w-4 inline-block mr-1 -mt-0.5" />
                    您選擇了尚未完成審查的醫學會，推進後這些案件將一併進入下一階段。
                  </p>
                </div>
              )}
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setShowAdvanceDialog(false)}>
                取消
              </Button>
              <Button
                disabled={selectedIds.length === 0}
                onClick={handleAdvanceStage}
                className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
              >
                <ArrowRight className="h-4 w-4" />
                確認推進 {selectedIds.length > 0 && `(${selectedIds.length} 個)`}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
