"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { ArrowLeft, ChevronRight, FileText } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  OUTCOME_REPORT_STAGE_CONFIG,
  OUTCOME_REPORT_TYPES,
  PRELIMINARY_REVIEW_CONFIG,
  getOutcomeReportCases,
  getOutcomeReportStageCounts,
  getSocietyName,
  type OutcomeReportType,
} from "@/lib/mock/filing-outcome-report"

/**
 * 成果報告上傳（醫策會視角）。
 * 兩種報告類型的列表與版型完全相同，僅上傳的報告不同，故以 Tabs 區分。
 * 階段推進發生在案件內容頁，列表不提供批次操作。
 */
export default function OutcomeReportPage() {
  const [activeType, setActiveType] = useState<OutcomeReportType>("quota")
  const [stageFilter, setStageFilter] = useState<string>("all")

  const cases = useMemo(() => getOutcomeReportCases(activeType), [activeType])
  const stageCounts = useMemo(() => getOutcomeReportStageCounts(activeType), [activeType])
  const filtered = useMemo(
    () => (stageFilter === "all" ? cases : cases.filter((c) => c.stage === stageFilter)),
    [cases, stageFilter],
  )

  const handleTypeChange = (value: string) => {
    setActiveType(value as OutcomeReportType)
    setStageFilter("all")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <Link href="/" className="mb-4 inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800">
          <ArrowLeft className="h-4 w-4" />
          返回首頁
        </Link>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">成果報告上傳</h1>
          <p className="mt-1 text-base text-gray-500">
            上傳各專科醫學會提交之成果報告並進行初步審查，初審完成後提送醫事司審查
          </p>
        </div>

        <Tabs value={activeType} onValueChange={handleTypeChange} className="w-full">
          <TabsList className="mb-6 h-11">
            {OUTCOME_REPORT_TYPES.map((t) => (
              <TabsTrigger key={t.id} value={t.id} className="px-5 text-base">
                {t.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {OUTCOME_REPORT_TYPES.map((t) => (
            <TabsContent key={t.id} value={t.id} className="space-y-4">
              <Card>
                <CardContent className="p-6">
                  <div className="mb-5">
                    <h2 className="text-lg font-semibold text-gray-900">{t.name}</h2>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      共 {cases.length} 個醫學會
                    </p>
                  </div>

                  {/* 階段篩選 */}
                  <div className="mb-4 flex flex-wrap items-center gap-2">
                    <Button
                      variant={stageFilter === "all" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setStageFilter("all")}
                    >
                      全部 {cases.length}
                    </Button>
                    {stageCounts.map(({ stage, count }) => (
                      <Button
                        key={stage}
                        variant={stageFilter === stage ? "default" : "outline"}
                        size="sm"
                        onClick={() => setStageFilter(stage)}
                      >
                        {stage} {count}
                      </Button>
                    ))}
                  </div>

                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>專科醫學會</TableHead>
                          <TableHead className="w-32">階段</TableHead>
                          <TableHead className="w-32">初審結果</TableHead>
                          <TableHead className="w-28" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filtered.map((c) => (
                          <TableRow key={c.societyId}>
                            <TableCell className="font-medium text-gray-900">{getSocietyName(c.societyId)}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={OUTCOME_REPORT_STAGE_CONFIG[c.stage].color}>
                                {OUTCOME_REPORT_STAGE_CONFIG[c.stage].label}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {c.preliminaryReview ? (
                                <Badge variant="outline" className={PRELIMINARY_REVIEW_CONFIG[c.preliminaryReview].color}>
                                  {PRELIMINARY_REVIEW_CONFIG[c.preliminaryReview].label}
                                </Badge>
                              ) : (
                                <span className="text-sm text-gray-400">—</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Button variant="outline" size="sm" asChild>
                                <Link
                                  href={`/filing/outcome-report/${c.societyId}?type=${c.type}`}
                                  className="flex items-center gap-1"
                                >
                                  <FileText className="h-4 w-4" />
                                  編輯
                                  <ChevronRight className="h-4 w-4" />
                                </Link>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        {filtered.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={4} className="py-12 text-center text-gray-500">
                              此階段目前沒有案件
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  )
}
