"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { ChevronRight, ArrowRight, AlertCircle, Undo2 } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  RETURNED_BUCKET,
  advanceQuotaReviewSocieties,
  getAdvanceCheckStatsForQuota,
  getHospitalQuotaSocieties,
  getHospitalQuotaStageConfig,
  getNextQuotaReviewStage,
  getQuotaReviewStageUnit,
  quotaReviewStages,
  type HospitalQuotaReviewSociety,
  type QuotaReviewStage,
} from "@/lib/mock/review-hospital-quota"

/**
 * 容額填報審查列表（醫策會／RRC／醫事司視角）。
 * 階段語彙與容額填報端共用；醫學會固定 25 個，未送件者標「尚未填寫」留在第一個審查階段；
 * 退件為一等狀態，自階段分頁移出、另立「退件補正中」分頁。
 */
export default function HospitalQuotaReviewPage() {
  const [activeTab, setActiveTab] = useState<string>(quotaReviewStages[0])
  const [showAdvanceDialog, setShowAdvanceDialog] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [, forceUpdate] = useState(0)

  const stageConfig = getHospitalQuotaStageConfig()
  const societies = getHospitalQuotaSocieties()

  // 退件案件自階段分頁移出，改列退件分頁
  const inStage = (stage: QuotaReviewStage) =>
    societies.filter((s) => s.stage === stage && s.returnedFrom === null)
  const returnedSocieties = societies.filter((s) => s.returnedFrom !== null)

  const activeStage = activeTab === RETURNED_BUCKET.value ? null : (activeTab as QuotaReviewStage)
  const nextStage = activeStage ? getNextQuotaReviewStage(activeStage) : null
  const advanceStats = useMemo(
    () => (activeStage ? getAdvanceCheckStatsForQuota(activeStage) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeStage, forceUpdate],
  )

  const handleOpenAdvanceDialog = () => {
    // 預設全選當前階段已審查通過的醫學會
    const approved = (advanceStats?.societies ?? []).filter((s) => s.reviewResult === "approved")
    setSelectedIds(approved.map((s) => s.id))
    setShowAdvanceDialog(true)
  }

  const toggleSelect = (id: string) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]))

  const toggleSelectAll = () => {
    const all = advanceStats?.societies ?? []
    setSelectedIds((prev) => (prev.length === all.length ? [] : all.map((s) => s.id)))
  }

  const handleConfirmAdvance = () => {
    if (nextStage) advanceQuotaReviewSocieties(selectedIds, nextStage)
    setShowAdvanceDialog(false)
    setSelectedIds([])
    forceUpdate((n) => n + 1)
    if (nextStage) setActiveTab(nextStage)
  }

  const renderReviewResult = (society: HospitalQuotaReviewSociety) => {
    if (!society.submitted)
      return <Badge className="bg-gray-100 text-gray-600 border-gray-200 text-sm">尚未填寫</Badge>
    if (society.reviewResult === "approved")
      return <Badge className="bg-green-100 text-green-700 border-green-200 text-sm">審查通過</Badge>
    return <Badge className="bg-gray-100 text-gray-600 border-gray-200 text-sm">待審查</Badge>
  }

  const renderStageTable = (stage: QuotaReviewStage) => {
    const rows = inStage(stage)
    return (
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>醫學會名稱</TableHead>
                <TableHead className="w-28">年度</TableHead>
                <TableHead className="w-36">送件日期</TableHead>
                <TableHead className="w-32">審查結果</TableHead>
                <TableHead className="w-36 text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length > 0 ? (
                rows.map((society, index) => (
                  <TableRow key={society.id} className={!society.submitted ? "bg-gray-50" : ""}>
                    <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {!society.submitted && <AlertCircle className="h-4 w-4 shrink-0 text-gray-400" />}
                        <span className={!society.submitted ? "text-gray-500" : ""}>{society.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-sm">
                        {society.year}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {society.submittedDate ?? <span className="text-gray-400">未送件</span>}
                    </TableCell>
                    <TableCell>{renderReviewResult(society)}</TableCell>
                    <TableCell className="text-right">
                      {society.submitted ? (
                        <Button asChild size="sm" variant="outline">
                          <Link
                            href={`/review/hospital-quota/${society.id}`}
                            className="flex items-center gap-2"
                          >
                            檢視審查
                            <ChevronRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      ) : (
                        <span className="text-base text-gray-400">等待送件</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-base text-gray-500">
                    此階段目前沒有案件
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    )
  }

  const renderReturnedTable = () => (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>醫學會名稱</TableHead>
              <TableHead className="w-28">年度</TableHead>
              <TableHead className="w-44">退回自</TableHead>
              <TableHead className="w-36">原送件日期</TableHead>
              <TableHead className="w-36 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {returnedSocieties.length > 0 ? (
              returnedSocieties.map((society, index) => (
                <TableRow key={society.id}>
                  <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                  <TableCell className="font-medium">{society.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-sm">
                      {society.year}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Badge className={`${stageConfig[society.returnedFrom!].color} text-sm`}>
                        {society.returnedFrom}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        （{getQuotaReviewStageUnit(society.returnedFrom!)}）
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{society.submittedDate}</TableCell>
                  <TableCell className="text-right">
                    <Button asChild size="sm" variant="outline">
                      <Link
                        href={`/review/hospital-quota/${society.id}`}
                        className="flex items-center gap-2"
                      >
                        檢視退件
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-base text-gray-500">
                  目前沒有退件補正中的案件
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">容額填報審查</h1>
          <p className="mt-1 text-base text-gray-500">
            審查 25 個醫學會提交的訓練醫院容額分配，依階段推進至公告
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6 h-11">
            {quotaReviewStages.map((stage) => (
              <TabsTrigger key={stage} value={stage} className="flex items-center gap-2 px-5 text-base">
                {stageConfig[stage].label}
                <Badge variant="secondary" className="ml-1">
                  {inStage(stage).length}
                </Badge>
              </TabsTrigger>
            ))}
            <TabsTrigger
              value={RETURNED_BUCKET.value}
              className="flex items-center gap-2 px-5 text-base"
            >
              <Undo2 className="h-4 w-4" />
              {RETURNED_BUCKET.label}
              <Badge variant="secondary" className="ml-1">
                {returnedSocieties.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          {quotaReviewStages.map((stage) => {
            const nextForTab = getNextQuotaReviewStage(stage)
            const notFiledCount = societies.filter((s) => s.stage === stage && !s.submitted).length
            return (
              <TabsContent key={stage} value={stage}>
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-base text-gray-600">目前階段：</span>
                    <Badge className={`${stageConfig[stage].color} px-3 py-1 text-base`}>
                      {stageConfig[stage].label}
                    </Badge>
                    {notFiledCount > 0 && (
                      <span className="text-base text-gray-500">
                        （其中 {notFiledCount} 個醫學會尚未填寫）
                      </span>
                    )}
                  </div>
                  {nextForTab && stage === activeTab && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={handleOpenAdvanceDialog}
                      disabled={(advanceStats?.societies.length ?? 0) === 0}
                    >
                      <ArrowRight className="h-4 w-4" />
                      推進至{nextForTab}
                    </Button>
                  )}
                </div>
                {renderStageTable(stage)}
              </TabsContent>
            )
          })}

          <TabsContent value={RETURNED_BUCKET.value}>
            <div className="mb-4 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3">
              <p className="text-base text-orange-800">
                以下案件已退回醫學會補正。醫學會重新送件後，案件回到「退回自」的階段續審，
                不重走先前已通過的階段。
              </p>
            </div>
            {renderReturnedTable()}
          </TabsContent>
        </Tabs>

        {/* 批次推進 Dialog */}
        <Dialog open={showAdvanceDialog} onOpenChange={setShowAdvanceDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>選擇推進至{nextStage}的醫學會</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <p className="text-base text-gray-600">
                可選擇部分醫學會推進至下一階段，未選取的醫學會將繼續留在「{activeStage}」。
                尚未填寫與退件補正中的醫學會不會出現在此清單。
              </p>

              {/* 審查狀態統計 */}
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-center">
                  <p className="mb-0.5 text-base text-green-600">審查通過</p>
                  <p className="text-xl font-bold text-green-700">{advanceStats?.approved.count ?? 0}</p>
                </div>
                <div
                  className={`rounded-lg border p-3 text-center ${
                    (advanceStats?.pendingReview.count ?? 0) > 0
                      ? "border-amber-200 bg-amber-50"
                      : "border-gray-200 bg-gray-50"
                  }`}
                >
                  <p
                    className={`mb-0.5 text-base ${
                      (advanceStats?.pendingReview.count ?? 0) > 0 ? "text-amber-600" : "text-gray-500"
                    }`}
                  >
                    尚未審查
                  </p>
                  <p
                    className={`text-xl font-bold ${
                      (advanceStats?.pendingReview.count ?? 0) > 0 ? "text-amber-700" : "text-gray-400"
                    }`}
                  >
                    {advanceStats?.pendingReview.count ?? 0}
                  </p>
                </div>
                <div
                  className={`rounded-lg border p-3 text-center ${
                    (advanceStats?.notFiled.count ?? 0) > 0
                      ? "border-gray-300 bg-gray-100"
                      : "border-gray-200 bg-gray-50"
                  }`}
                >
                  <p className="mb-0.5 text-base text-gray-500">尚未填寫</p>
                  <p className="text-xl font-bold text-gray-400">{advanceStats?.notFiled.count ?? 0}</p>
                </div>
              </div>

              {/* 勾選列表 */}
              {(advanceStats?.societies.length ?? 0) > 0 ? (
                <div className="max-h-56 overflow-y-auto rounded-lg border">
                  <div
                    className="flex cursor-pointer items-center gap-3 border-b bg-gray-50 px-4 py-3"
                    onClick={toggleSelectAll}
                  >
                    <Checkbox
                      checked={
                        selectedIds.length === advanceStats!.societies.length &&
                        advanceStats!.societies.length > 0
                      }
                      onCheckedChange={toggleSelectAll}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span className="text-base font-medium text-gray-700">
                      全選（{advanceStats!.societies.length} 個醫學會）
                    </span>
                  </div>
                  {advanceStats!.societies.map((society) => (
                    <div
                      key={society.id}
                      className={`flex cursor-pointer items-center gap-3 border-b px-4 py-3 transition-colors last:border-b-0 ${
                        selectedIds.includes(society.id) ? "bg-blue-50" : "hover:bg-gray-50"
                      }`}
                      onClick={() => toggleSelect(society.id)}
                    >
                      <Checkbox
                        checked={selectedIds.includes(society.id)}
                        onCheckedChange={() => toggleSelect(society.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <p className="min-w-0 flex-1 text-base font-medium">{society.name}</p>
                      <div className="shrink-0">{renderReviewResult(society)}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-4 text-center text-base text-gray-400">目前此階段沒有可推進的醫學會</p>
              )}

              {/* 警告：選到尚未審查的案件 */}
              {selectedIds.some((id) => {
                const s = advanceStats?.societies.find((soc) => soc.id === id)
                return s && s.reviewResult !== "approved"
              }) && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <p className="text-base text-amber-700">
                    <AlertCircle className="mr-1 -mt-0.5 inline-block h-4 w-4" />
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
                onClick={handleConfirmAdvance}
                className="gap-1.5 bg-blue-600 text-white hover:bg-blue-700"
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
