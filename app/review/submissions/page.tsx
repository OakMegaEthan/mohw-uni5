"use client"

import { useState } from "react"
import Link from "next/link"
import { Clock, ChevronRight, AlertCircle, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { ReviewSimpleNav } from "@/components/review/simple-nav"
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

  const handleAdvanceStage = () => {
    if (advanceDocumentTypeToNextStage(activeDocumentType)) {
      setShowAdvanceDialog(false)
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">填報審查</h1>
            <p className="text-sm text-gray-500 mt-1">以文件類型為單位檢視各醫學會的填報狀態並進行審查</p>
          </div>
        </div>

        <Tabs
          value={activeDocumentType}
          onValueChange={setActiveDocumentType}
          className="w-full"
        >
          <TabsList className="mb-6">
            {documentTypes.map((doc) => (
              <TabsTrigger key={doc.id} value={doc.id}>
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
                          <span className="text-sm text-gray-600">目前階段：</span>
                          <Badge className={`${getStageColors()[docStage] || "bg-gray-100 text-gray-800"} text-sm px-3 py-1`}>
                            {docStageLabel}
                          </Badge>
                        </div>
                      </div>
                      {docHasNextStage && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5"
                          onClick={() => setShowAdvanceDialog(true)}
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
                                    <div className="flex items-center gap-1 text-sm text-gray-600">
                                      <Clock className="w-4 h-4" />
                                      {submission.uploadedDate}
                                    </div>
                                  ) : (
                                    <span className="text-sm text-gray-400">未上傳</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {submission.uploaded ? (
                                    getReviewResultBadge(submission.reviewResult, submission.uploaded)
                                  ) : (
                                    <span className="text-sm text-gray-400">-</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-right">
                                  {submission.uploaded ? (
                                    <Button asChild size="sm">
                                      <Link
                                        href={`/review/${submission.societyId}?docType=${activeDocumentType}&stage=${currentDocumentStage}`}
                                        className="flex items-center gap-2"
                                      >
                                        檢視審查
                                        <ChevronRight className="w-4 h-4" />
                                      </Link>
                                    </Button>
                                  ) : (
                                    <span className="text-sm text-gray-400">等待醫學會上傳</span>
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
              <DialogTitle>推進至下一階段</DialogTitle>
            </DialogHeader>
            <div className="py-2 space-y-4">
              <div>
                <p className="text-sm text-gray-600">
                  即將推進 <span className="font-medium">{documentTypes.find((d) => d.id === activeDocumentType)?.name}</span> 至{" "}
                  <span className="font-medium">{nextStageLabel}</span>
                </p>
              </div>

              {/* 送件狀態統計 */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-700">送件狀態</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-green-700">已送件</span>
                      <Badge className="bg-green-100 text-green-700">{advanceStats.uploaded.count} 件</Badge>
                    </div>
                  </div>
                  <div className={`border rounded-lg p-3 ${advanceStats.notUploaded.count > 0 ? "bg-orange-50 border-orange-200" : "bg-gray-50 border-gray-200"}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-sm ${advanceStats.notUploaded.count > 0 ? "text-orange-700" : "text-gray-600"}`}>未送件</span>
                      <Badge className={advanceStats.notUploaded.count > 0 ? "bg-orange-100 text-orange-700" : "bg-gray-100 text-gray-600"}>
                        {advanceStats.notUploaded.count} 件
                      </Badge>
                    </div>
                    {advanceStats.notUploaded.count > 0 && (
                      <p className="text-xs text-orange-600 mt-1 line-clamp-2">
                        {advanceStats.notUploaded.societies.slice(0, 3).join("、")}
                        {advanceStats.notUploaded.societies.length > 3 && `...等 ${advanceStats.notUploaded.societies.length} 間`}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* 審查狀態統計 */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-700">審查狀態</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                    <span className="text-sm text-green-700">已審查通過</span>
                    <Badge className="bg-green-100 text-green-700">{advanceStats.approved.count} 件</Badge>
                  </div>
                  <div className={`flex items-center justify-between p-3 border rounded-lg ${advanceStats.needsRevision.count > 0 ? "bg-orange-50 border-orange-200" : "bg-gray-50 border-gray-200"}`}>
                    <div>
                      <span className={`text-sm ${advanceStats.needsRevision.count > 0 ? "text-orange-700" : "text-gray-600"}`}>需補件</span>
                      {advanceStats.needsRevision.count > 0 && (
                        <p className="text-xs text-orange-600 mt-0.5">
                          {advanceStats.needsRevision.societies.slice(0, 3).join("、")}
                          {advanceStats.needsRevision.societies.length > 3 && `...等`}
                        </p>
                      )}
                    </div>
                    <Badge className={advanceStats.needsRevision.count > 0 ? "bg-orange-100 text-orange-700" : "bg-gray-100 text-gray-600"}>
                      {advanceStats.needsRevision.count} 件
                    </Badge>
                  </div>
                  <div className={`flex items-center justify-between p-3 border rounded-lg ${advanceStats.pendingReview.count > 0 ? "bg-amber-50 border-amber-200" : "bg-gray-50 border-gray-200"}`}>
                    <div>
                      <span className={`text-sm ${advanceStats.pendingReview.count > 0 ? "text-amber-700" : "text-gray-600"}`}>尚未審查</span>
                      {advanceStats.pendingReview.count > 0 && (
                        <p className="text-xs text-amber-600 mt-0.5">
                          {advanceStats.pendingReview.societies.slice(0, 3).join("、")}
                          {advanceStats.pendingReview.societies.length > 3 && `...等`}
                        </p>
                      )}
                    </div>
                    <Badge className={advanceStats.pendingReview.count > 0 ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-600"}>
                      {advanceStats.pendingReview.count} 件
                    </Badge>
                  </div>
                </div>
              </div>

              {/* 警告提示 */}
              {(advanceStats.notUploaded.count > 0 || advanceStats.pendingReview.count > 0) && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-xs text-amber-700">
                    <AlertCircle className="h-3.5 w-3.5 inline-block mr-1 -mt-0.5" />
                    有 {advanceStats.notUploaded.count + advanceStats.pendingReview.count} 件案件尚未完成送件或審查，推進後這些案件將一併進入下一階段。
                  </p>
                </div>
              )}
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setShowAdvanceDialog(false)}>
                取消
              </Button>
              <Button onClick={handleAdvanceStage} className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5">
                <ArrowRight className="h-4 w-4" />
                確認推進
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
