"use client"

import { useState, useMemo } from "react"
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
  getSubmissionCountsByStage,
  getNextStage,
  advanceSubmissions,
} from "@/lib/mock/review-submissions"

export default function SubmissionsReviewPage() {
  const [activeDocumentType, setActiveDocumentType] = useState("screening-principle")
  const [activeStageFilter, setActiveStageFilter] = useState<string>("all")
  const [showAdvanceDialog, setShowAdvanceDialog] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [, forceUpdate] = useState(0)

  const documentTypes = getDocumentTypes()
  const societies = getSocieties()
  const stageColors = getStageColors()
  const allStages = getStagesForDocumentType(activeDocumentType)

  // 各階段案件數統計（有案件的階段）
  const stageCounts = useMemo(
    () => getSubmissionCountsByStage(activeDocumentType),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeDocumentType, forceUpdate]
  )

  // 當文件類型切換時，重設篩選為全部
  const handleDocTypeChange = (docType: string) => {
    setActiveDocumentType(docType)
    setActiveStageFilter("all")
    setSelectedIds([])
  }

  // 所有案件（含 society 資料）
  const allSubmissions = useMemo(() => {
    return getDocumentSubmissions(activeDocumentType)
      .map((s) => ({
        ...s,
        society: societies.find((soc) => soc.id === s.societyId)!,
      }))
      .sort((a, b) => {
        if (a.uploaded && !b.uploaded) return -1
        if (!a.uploaded && b.uploaded) return 1
        return 0
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDocumentType, forceUpdate])

  // 篩選後顯示的案件
  const filteredSubmissions = useMemo(() => {
    if (activeStageFilter === "all") return allSubmissions
    return allSubmissions.filter((s) => s.stage === activeStageFilter)
  }, [allSubmissions, activeStageFilter])

  // 推進 Dialog 使用：目前已選取的案件（只有已上傳的才可推進）
  const selectableSubmissions = useMemo(() => {
    const source = activeStageFilter === "all" ? allSubmissions : filteredSubmissions
    return source.filter((s) => s.uploaded)
  }, [allSubmissions, filteredSubmissions, activeStageFilter])

  // 多選操作
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    const allIds = selectableSubmissions.map((s) => s.societyId)
    if (selectedIds.length === allIds.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(allIds)
    }
  }

  const isAllSelected =
    selectableSubmissions.length > 0 &&
    selectedIds.length === selectableSubmissions.length

  const isIndeterminate =
    selectedIds.length > 0 && selectedIds.length < selectableSubmissions.length

  // 打開推進 Dialog
  const handleOpenAdvanceDialog = () => {
    // 若目前沒有選取，預設選取目前篩選視圖中的全部已上傳案件
    if (selectedIds.length === 0) {
      setSelectedIds(selectableSubmissions.map((s) => s.societyId))
    }
    setShowAdvanceDialog(true)
  }

  // 取得所選案件各自的下一個階段（可能不同）
  const selectedSubmissions = useMemo(
    () => allSubmissions.filter((s) => selectedIds.includes(s.societyId)),
    [allSubmissions, selectedIds]
  )

  // 計算推進 Dialog 中的統計
  const advanceStats = useMemo(() => {
    const approved = selectedSubmissions.filter((s) => s.reviewResult === "approved")
    const needsRevision = selectedSubmissions.filter((s) => s.reviewResult === "needs-revision")
    const pending = selectedSubmissions.filter((s) => s.reviewResult === "pending")

    // 按「目前階段 → 下一階段」分組，讓使用者知道各組要推進到哪裡
    const byCurrentStage: Record<
      string,
      { currentLabel: string; nextStage: { value: string; label: string } | null; societies: string[] }
    > = {}
    selectedSubmissions.forEach((s) => {
      if (!byCurrentStage[s.stage]) {
        const next = getNextStage(activeDocumentType, s.stage)
        const currentLabel = allStages.find((st) => st.value === s.stage)?.label ?? s.stage
        byCurrentStage[s.stage] = { currentLabel, nextStage: next, societies: [] }
      }
      byCurrentStage[s.stage].societies.push(s.society.name)
    })

    return { approved, needsRevision, pending, byCurrentStage }
  }, [selectedSubmissions, activeDocumentType, allStages])

  // 確認推進
  const handleAdvanceConfirm = () => {
    // 依各案件所在階段分別推進到下一階段
    const byStage: Record<string, string[]> = {}
    selectedSubmissions.forEach((s) => {
      const next = getNextStage(activeDocumentType, s.stage)
      if (next) {
        if (!byStage[next.value]) byStage[next.value] = []
        byStage[next.value].push(s.societyId)
      }
    })
    Object.entries(byStage).forEach(([targetStage, ids]) => {
      advanceSubmissions(activeDocumentType, ids, targetStage)
    })
    setShowAdvanceDialog(false)
    setSelectedIds([])
    forceUpdate((n) => n + 1)
  }

  // 審查結果 Badge
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
          <h1 className="text-2xl font-bold text-gray-900">填報審查</h1>
          <p className="text-base text-gray-500 mt-1">以文件類型為單位檢視各醫學會的填報狀態並進行審查</p>
        </div>

        {/* 文件類型 Tabs */}
        <Tabs
          value={activeDocumentType}
          onValueChange={handleDocTypeChange}
          className="w-full"
        >
          <TabsList className="mb-6 h-11">
            {documentTypes.map((doc) => (
              <TabsTrigger key={doc.id} value={doc.id} className="text-base px-5">
                {doc.shortName}
              </TabsTrigger>
            ))}
          </TabsList>

          {documentTypes.map((doc) => (
            <TabsContent key={doc.id} value={doc.id} className="space-y-4">
              <Card>
                <CardContent className="p-6">
                  {/* 標題列 */}
                  <div className="flex items-start justify-between mb-5">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">{doc.name}</h2>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        共 {allSubmissions.length} 個醫學會，分布於 {stageCounts.length} 個審查階段
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 shrink-0"
                      onClick={handleOpenAdvanceDialog}
                      disabled={selectableSubmissions.length === 0}
                    >
                      <ArrowRight className="h-4 w-4" />
                      推進案件
                      {selectedIds.length > 0 && (
                        <Badge className="ml-1 bg-blue-100 text-blue-700 text-xs px-1.5 py-0">
                          {selectedIds.length}
                        </Badge>
                      )}
                    </Button>
                  </div>

                  {/* 階段篩選 */}
                  <div className="flex items-center gap-2 mb-4 flex-wrap">
                    <span className="text-sm text-muted-foreground shrink-0">篩選階段：</span>
                    <button
                      onClick={() => setActiveStageFilter("all")}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border transition-colors ${
                        activeStageFilter === "all"
                          ? "bg-gray-800 text-white border-gray-800"
                          : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      全部
                      <span className={`text-xs rounded-full px-1.5 ${
                        activeStageFilter === "all" ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
                      }`}>
                        {allSubmissions.length}
                      </span>
                    </button>
                    {stageCounts.map(({ stage, label, count }) => {
                      const colorClass = stageColors[stage] ?? "bg-gray-100 text-gray-700 border-gray-200"
                      const isActive = activeStageFilter === stage
                      return (
                        <button
                          key={stage}
                          onClick={() => setActiveStageFilter(stage)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border transition-colors ${
                            isActive
                              ? `${colorClass} ring-2 ring-offset-1 ring-current`
                              : `${colorClass} opacity-70 hover:opacity-100`
                          }`}
                        >
                          {label}
                          <span className="text-xs font-semibold">{count}</span>
                        </button>
                      )
                    })}
                  </div>

                  {/* 案件列表 */}
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-10">
                            <Checkbox
                              checked={isAllSelected}
                              ref={(el) => {
                                if (el) (el as HTMLButtonElement & { indeterminate?: boolean }).indeterminate = isIndeterminate
                              }}
                              onCheckedChange={toggleSelectAll}
                              aria-label="全選"
                            />
                          </TableHead>
                          <TableHead className="w-8">#</TableHead>
                          <TableHead>醫學會名稱</TableHead>
                          <TableHead>目前階段</TableHead>
                          <TableHead>上傳日期</TableHead>
                          <TableHead>審查結果</TableHead>
                          <TableHead className="text-right">操作</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredSubmissions.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                              此階段目前沒有案件
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredSubmissions.map((submission, index) => (
                            <TableRow
                              key={submission.societyId}
                              className={!submission.uploaded ? "bg-gray-50" : ""}
                            >
                              <TableCell>
                                {submission.uploaded && (
                                  <Checkbox
                                    checked={selectedIds.includes(submission.societyId)}
                                    onCheckedChange={() => toggleSelect(submission.societyId)}
                                    aria-label={`選取 ${submission.society.name}`}
                                  />
                                )}
                              </TableCell>
                              <TableCell className="font-medium text-gray-500">{index + 1}</TableCell>
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                  {!submission.uploaded && <AlertCircle className="w-4 h-4 text-gray-400" />}
                                  {submission.society.name}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  className={`${stageColors[submission.stage] ?? "bg-gray-100 text-gray-700"} text-sm`}
                                >
                                  {allStages.find((s) => s.value === submission.stage)?.label ?? submission.stage}
                                </Badge>
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
                                {submission.uploaded
                                  ? getReviewResultBadge(submission.reviewResult, submission.uploaded)
                                  : <span className="text-base text-gray-400">-</span>
                                }
                              </TableCell>
                              <TableCell className="text-right">
                                {submission.uploaded ? (
                                  <Button asChild size="sm">
                                    <Link
                                      href={`/review/${submission.societyId}?docType=${activeDocumentType}&stage=${submission.stage}`}
                                      className="flex items-center gap-2"
                                    >
                                      檢視審查
                                      <ChevronRight className="w-4 h-4" />
                                    </Link>
                                  </Button>
                                ) : (
                                  <span className="text-sm text-gray-400">等待上傳</span>
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
          ))}
        </Tabs>

        {/* 推進案件確認 Dialog */}
        <Dialog open={showAdvanceDialog} onOpenChange={setShowAdvanceDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>推進選取的案件</DialogTitle>
            </DialogHeader>
            <div className="py-2 space-y-4">
              <p className="text-base text-gray-600">
                已選取 <span className="font-semibold text-gray-900">{selectedIds.length}</span> 個醫學會。
                各案件將依其目前所在的審查階段，分別推進至下一個階段。
              </p>

              {/* 審查結果統計 */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                  <p className="text-sm text-green-600 mb-0.5">審查通過</p>
                  <p className="text-xl font-bold text-green-700">{advanceStats.approved.length}</p>
                </div>
                <div className={`border rounded-lg p-3 text-center ${advanceStats.needsRevision.length > 0 ? "bg-orange-50 border-orange-200" : "bg-gray-50 border-gray-200"}`}>
                  <p className={`text-sm mb-0.5 ${advanceStats.needsRevision.length > 0 ? "text-orange-600" : "text-gray-400"}`}>需補件</p>
                  <p className={`text-xl font-bold ${advanceStats.needsRevision.length > 0 ? "text-orange-700" : "text-gray-400"}`}>{advanceStats.needsRevision.length}</p>
                </div>
                <div className={`border rounded-lg p-3 text-center ${advanceStats.pending.length > 0 ? "bg-amber-50 border-amber-200" : "bg-gray-50 border-gray-200"}`}>
                  <p className={`text-sm mb-0.5 ${advanceStats.pending.length > 0 ? "text-amber-600" : "text-gray-400"}`}>尚未審查</p>
                  <p className={`text-xl font-bold ${advanceStats.pending.length > 0 ? "text-amber-700" : "text-gray-400"}`}>{advanceStats.pending.length}</p>
                </div>
              </div>

              {/* 各階段推進去向說明 */}
              {Object.entries(advanceStats.byCurrentStage).length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">推進去向：</p>
                  {Object.entries(advanceStats.byCurrentStage).map(([stage, info]) => (
                    <div key={stage} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 text-sm">
                      <Badge className={`${stageColors[stage] ?? ""} shrink-0 text-xs`}>
                        {info.currentLabel}
                      </Badge>
                      <ArrowRight className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                      {info.nextStage ? (
                        <Badge className={`${stageColors[info.nextStage.value] ?? ""} shrink-0 text-xs`}>
                          {info.nextStage.label}
                        </Badge>
                      ) : (
                        <span className="text-gray-400">已是最終階段</span>
                      )}
                      <span className="text-gray-500 ml-1">（{info.societies.length} 個醫學會）</span>
                    </div>
                  ))}
                </div>
              )}

              {/* 勾選列表 */}
              <div className="border rounded-lg overflow-hidden max-h-56 overflow-y-auto">
                {/* 全選列 */}
                <div
                  className="flex items-center gap-3 px-4 py-3 bg-gray-50 border-b cursor-pointer"
                  onClick={toggleSelectAll}
                >
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={toggleSelectAll}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <span className="text-base font-medium text-gray-700">
                    全選（{selectableSubmissions.length} 個醫學會）
                  </span>
                </div>
                {selectableSubmissions.map((s) => (
                  <div
                    key={s.societyId}
                    className={`flex items-center gap-3 px-4 py-2.5 border-b last:border-b-0 cursor-pointer transition-colors ${
                      selectedIds.includes(s.societyId) ? "bg-blue-50" : "hover:bg-gray-50"
                    }`}
                    onClick={() => toggleSelect(s.societyId)}
                  >
                    <Checkbox
                      checked={selectedIds.includes(s.societyId)}
                      onCheckedChange={() => toggleSelect(s.societyId)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span className="flex-1 text-base">{s.society.name}</span>
                    <Badge className={`${stageColors[s.stage] ?? ""} text-xs shrink-0`}>
                      {allStages.find((st) => st.value === s.stage)?.label ?? s.stage}
                    </Badge>
                    <div className="shrink-0">
                      {getReviewResultBadge(s.reviewResult, s.uploaded)}
                    </div>
                  </div>
                ))}
              </div>

              {/* 警告：含尚未審查的案件 */}
              {selectedSubmissions.some((s) => s.reviewResult !== "approved") && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-sm text-amber-700">
                    <AlertCircle className="h-4 w-4 inline-block mr-1 -mt-0.5" />
                    所選案件中包含尚未完成審查的醫學會，推進後這些案件將一併進入下一階段。
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
                onClick={handleAdvanceConfirm}
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
