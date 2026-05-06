"use client"

import { useState } from "react"
import { ReviewSimpleNav } from "@/components/review/simple-nav"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Search, ChevronRight, ArrowRight, AlertCircle } from "lucide-react"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  getHospitalQuotaSocieties,
  getHospitalQuotaStageConfig,
  hospitalQuotaStages,
  getAdvanceCheckStatsForQuota,
} from "@/lib/mock/review-hospital-quota"

export default function HospitalQuotaReviewPage() {
  const [searchExpanded, setSearchExpanded] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("pending")
  const [showAdvanceDialog, setShowAdvanceDialog] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const societies = getHospitalQuotaSocieties()
  const stageConfig = getHospitalQuotaStageConfig()

  const filteredSocieties = societies.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const societiesByStage = (stage: string) =>
    filteredSocieties.filter((s) => s.stage === stage)

  const currentStageLabel = stageConfig[activeTab as keyof typeof stageConfig]?.label || activeTab
  const currentStageIndex = hospitalQuotaStages.findIndex((s) => s.value === activeTab)
  const nextStage = hospitalQuotaStages[currentStageIndex + 1] ?? null

  const handleOpenAdvanceDialog = () => {
    // 預設全選當前階段已審查通過的醫學會
    const inStage = societiesByStage(activeTab)
    setSelectedIds(inStage.filter((s) => s.reviewResult === "approved").map((s) => s.id))
    setShowAdvanceDialog(true)
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id])
  }

  const toggleSelectAll = () => {
    const inStage = societiesByStage(activeTab)
    if (selectedIds.length === inStage.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(inStage.map((s) => s.id))
    }
  }

  const handleConfirmAdvance = () => {
    setShowAdvanceDialog(false)
    setSelectedIds([])
    if (nextStage) setActiveTab(nextStage.value)
  }

  const advanceStats = getAdvanceCheckStatsForQuota(activeTab)

  const renderReviewResultBadge = (result: string) => {
    if (result === "approved")
      return <Badge className="bg-green-100 text-green-700 text-xs">審查通過</Badge>
    if (result === "needs-revision")
      return <Badge className="bg-orange-100 text-orange-700 text-xs">需補件</Badge>
    return <Badge className="bg-gray-100 text-gray-600 text-xs">待審查</Badge>
  }

  const renderTable = (stage: string) => {
    const rows = societiesByStage(stage)
    return (
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>醫學會名稱</TableHead>
                <TableHead>年度</TableHead>
                <TableHead>送件日期</TableHead>
                <TableHead>審查結果</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length > 0 ? (
                rows.map((society) => (
                  <TableRow key={society.id}>
                    <TableCell className="font-medium">{society.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{society.year}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">{society.submittedDate}</TableCell>
                    <TableCell>{renderReviewResultBadge(society.reviewResult)}</TableCell>
                    <TableCell className="text-right">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/review/hospital-quota/${society.id}`} className="flex items-center gap-2">
                          檢視審查
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-gray-500">
                    目前沒有符合條件的醫學會
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ReviewSimpleNav />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">醫院容額分配審查</h1>
            <p className="text-sm text-gray-500 mt-1">審查各醫學會提交的醫院訓練容額分配申請</p>
            <div className="flex items-center gap-3 mt-3">
              <span className="text-sm text-gray-600">目前階段：</span>
              <Badge className={`${stageConfig[activeTab as keyof typeof stageConfig]?.color || "bg-gray-100 text-gray-800"} text-sm px-3 py-1`}>
                {currentStageLabel}
              </Badge>
              {nextStage && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 ml-2"
                  onClick={handleOpenAdvanceDialog}
                  disabled={societiesByStage(activeTab).length === 0}
                >
                  <ArrowRight className="h-4 w-4" />
                  推進至{nextStage.label}
                </Button>
              )}
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSearchExpanded(!searchExpanded)}
            className="text-gray-600 hover:text-gray-900"
          >
            <Search className="w-5 h-5" />
          </Button>
        </div>

        {searchExpanded && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <Input
                placeholder="搜尋醫學會名稱..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-xs"
              />
            </CardContent>
          </Card>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6">
            {hospitalQuotaStages.map((stage) => (
              <TabsTrigger key={stage.value} value={stage.value} className="flex items-center gap-2">
                {stage.label}
                <Badge variant="secondary" className="ml-1">
                  {societiesByStage(stage.value).length}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>

          {hospitalQuotaStages.map((stage) => (
            <TabsContent key={stage.value} value={stage.value}>
              {renderTable(stage.value)}
            </TabsContent>
          ))}
        </Tabs>

        {/* 批次推進 Dialog */}
        <Dialog open={showAdvanceDialog} onOpenChange={setShowAdvanceDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>選擇推進至{nextStage?.label}的醫學會</DialogTitle>
            </DialogHeader>
            <div className="py-2 space-y-4">
              <p className="text-sm text-gray-600">
                可選擇部分醫學會推進至下一階段，未選取的醫學會將繼續留在「{currentStageLabel}」。
              </p>

              {/* 審查狀態統計 */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-green-50 border border-green-200 rounded-lg p-2.5 text-center">
                  <p className="text-xs text-green-600 mb-0.5">審查通過</p>
                  <p className="text-lg font-bold text-green-700">{advanceStats.approved.count}</p>
                </div>
                <div className={`border rounded-lg p-2.5 text-center ${advanceStats.needsRevision.count > 0 ? "bg-orange-50 border-orange-200" : "bg-gray-50 border-gray-200"}`}>
                  <p className={`text-xs mb-0.5 ${advanceStats.needsRevision.count > 0 ? "text-orange-600" : "text-gray-500"}`}>需補件</p>
                  <p className={`text-lg font-bold ${advanceStats.needsRevision.count > 0 ? "text-orange-700" : "text-gray-400"}`}>{advanceStats.needsRevision.count}</p>
                </div>
                <div className={`border rounded-lg p-2.5 text-center ${advanceStats.pendingReview.count > 0 ? "bg-amber-50 border-amber-200" : "bg-gray-50 border-gray-200"}`}>
                  <p className={`text-xs mb-0.5 ${advanceStats.pendingReview.count > 0 ? "text-amber-600" : "text-gray-500"}`}>尚未審查</p>
                  <p className={`text-lg font-bold ${advanceStats.pendingReview.count > 0 ? "text-amber-700" : "text-gray-400"}`}>{advanceStats.pendingReview.count}</p>
                </div>
              </div>

              {/* 勾選列表 */}
              {advanceStats.societies.length > 0 ? (
                <div className="border rounded-lg overflow-hidden">
                  {/* 全選 */}
                  <div
                    className="flex items-center gap-3 px-4 py-2.5 bg-gray-50 border-b cursor-pointer"
                    onClick={toggleSelectAll}
                  >
                    <Checkbox
                      checked={selectedIds.length === advanceStats.societies.length && advanceStats.societies.length > 0}
                      onCheckedChange={toggleSelectAll}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span className="text-sm font-medium text-gray-700">全選（{advanceStats.societies.length} 個醫學會）</span>
                  </div>
                  {advanceStats.societies.map((society) => (
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
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{society.name}</p>
                      </div>
                      <div className="shrink-0">
                        {society.reviewResult === "approved" && (
                          <Badge className="bg-green-100 text-green-700 text-xs">審查通過</Badge>
                        )}
                        {society.reviewResult === "needs-revision" && (
                          <Badge className="bg-orange-100 text-orange-700 text-xs">需補件</Badge>
                        )}
                        {society.reviewResult === "pending" && (
                          <Badge className="bg-gray-100 text-gray-600 text-xs">待審查</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-center text-gray-400 py-4">目前此階段沒有醫學會</p>
              )}

              {/* 警告 */}
              {(advanceStats.needsRevision.count > 0 || advanceStats.pendingReview.count > 0) && selectedIds.some((id) => {
                const s = advanceStats.societies.find((soc) => soc.id === id)
                return s && s.reviewResult !== "approved"
              }) && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-xs text-amber-700">
                    <AlertCircle className="h-3.5 w-3.5 inline-block mr-1 -mt-0.5" />
                    您選擇了尚未完成審查的醫學會，推進後這些案件將一併進入下一階段。
                  </p>
                </div>
              )}
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setShowAdvanceDialog(false)}>取消</Button>
              <Button
                disabled={selectedIds.length === 0}
                onClick={handleConfirmAdvance}
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
