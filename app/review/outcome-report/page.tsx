"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { ChevronRight, ClipboardCheck } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  OUTCOME_REPORT_SUB_CONFIG,
  getQuotaOutcomeReportCases,
  type OutcomeReportSubStatus,
} from "@/lib/mock/quota-outcome-report"

/**
 * 容額成果報告審查（醫事司視角）。
 * 醫學會於容額填報待公告後上傳，直接送醫事司確認歸檔或退回補件（不經醫策會）。
 */
export default function QuotaOutcomeReportReviewPage() {
  const [statusFilter, setStatusFilter] = useState<OutcomeReportSubStatus | "all">("all")
  const cases = getQuotaOutcomeReportCases()

  const statusTabs = useMemo(() => {
    const count = (s: OutcomeReportSubStatus) => cases.filter((c) => c.status === s).length
    return [
      { value: "all" as const, label: "全部", count: cases.length },
      { value: "已送出" as const, label: "待確認", count: count("已送出") },
      { value: "退回補件" as const, label: "退回補件", count: count("退回補件") },
      { value: "已歸檔" as const, label: "已歸檔", count: count("已歸檔") },
    ]
  }, [cases])

  const rows = useMemo(
    () => (statusFilter === "all" ? cases : cases.filter((c) => c.status === statusFilter)),
    [cases, statusFilter],
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">容額成果報告審查</h1>
          <p className="mt-1 text-base text-gray-500">
            醫學會於容額填報待公告後上傳之審查細節補充資料，確認無誤即歸檔，或退回補件
          </p>
        </div>

        <div className="mb-4 flex items-center gap-6 border-b border-gray-200">
          {statusTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`relative -mb-px flex items-center border-b-2 px-1 pb-3 text-sm font-medium transition-colors ${
                statusFilter === tab.value
                  ? "border-[#2d3a8c] text-[#2d3a8c]"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
              <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-xs">
                {tab.count}
              </Badge>
            </button>
          ))}
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>專科醫學會</TableHead>
                    <TableHead className="w-40">狀態</TableHead>
                    <TableHead className="w-32">送出日期</TableHead>
                    <TableHead className="w-24">檔案數</TableHead>
                    <TableHead className="w-24" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((c) => (
                    <TableRow key={c.societyId}>
                      <TableCell className="font-medium text-gray-900">{c.societyName}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={OUTCOME_REPORT_SUB_CONFIG[c.status].color}>
                          {OUTCOME_REPORT_SUB_CONFIG[c.status].label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">{c.submittedDate}</TableCell>
                      <TableCell className="text-sm text-gray-600">{c.reports.length} 份</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" asChild>
                          <Link
                            href={`/review/outcome-report/${c.societyId}`}
                            className="flex items-center gap-1"
                          >
                            <ClipboardCheck className="h-4 w-4" />
                            {c.status === "已歸檔" ? "檢視" : "審查"}
                            <ChevronRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {rows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="py-12 text-center text-gray-500">
                        此狀態目前沒有案件
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
