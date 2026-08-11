"use client"

// 容額微調列表（醫學會端）。一個醫學會同年度可能有多次微調，故案件是一等物件、需要列表。
//
// **醫學會視角**：只呈現本會的案件，故不列醫學會與科別欄——那是醫事司才需要區分的維度。
// 首欄為「第 N 次」，依年度與次數降冪，最新一次在最上方。
// 醫事司視角在審查專區（/review/quota-adjustment），那裡才會看到全部醫學會的案件。

import { useMemo, useState } from "react"
import Link from "next/link"
import { ArrowLeft, ChevronRight, Inbox, Plus } from "lucide-react"

import { PageContainer, PageHeader } from "@/components/layout/page-container"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  ADJUSTMENT_RETURNED_BUCKET,
  QUOTA_ADJUSTMENT_STAGE_CONFIG,
  getBalance,
  getCurrentSociety,
  getMyAdjustmentCases,
  type QuotaAdjustmentCase,
} from "@/lib/mock/quota-adjustment"

type Tab = "all" | "待送件" | "醫事司審查" | "審查通過"

const TABS: Array<{ value: Tab; label: string }> = [
  { value: "all", label: "全部" },
  { value: "待送件", label: "待送件" },
  { value: "醫事司審查", label: "審查中" },
  { value: "審查通過", label: "已通過" },
]

function matchesTab(c: QuotaAdjustmentCase, tab: Tab): boolean {
  if (tab === "all") return true
  // 退件補正中的案件回到醫學會手上，歸在「待送件」（待補正重送）
  if (tab === "待送件") return c.stage === "待送件" || c.returnedFrom !== null
  if (tab === "醫事司審查") return c.stage === "醫事司審查" && c.returnedFrom === null
  return c.stage === "審查通過"
}

export default function QuotaAdjustmentListPage() {
  const [tab, setTab] = useState<Tab>("all")
  const society = getCurrentSociety()
  const cases = getMyAdjustmentCases()

  const counts = useMemo(() => {
    const c = {} as Record<Tab, number>
    TABS.forEach((t) => (c[t.value] = cases.filter((x) => matchesTab(x, t.value)).length))
    return c
  }, [cases])

  // 降冪：最新一次在最上方
  const rows = useMemo(
    () =>
      cases
        .filter((c) => matchesTab(c, tab))
        .sort((a, b) => b.year.localeCompare(a.year) || b.round - a.round),
    [cases, tab],
  )

  return (
    <PageContainer>
      <Link
        href="/filing"
        className="mb-4 inline-flex items-center gap-1 text-base text-blue-600 hover:text-blue-800"
      >
        <ArrowLeft className="h-4 w-4" />
        返回填報專區
      </Link>

      <PageHeader
        title="容額微調"
        description={`${society.name}　在既有訓練醫院之間調整訓練容額。總容額不變——有醫院調增，就要有醫院調減`}
      >
        <Button asChild className="gap-2 bg-[#2d3a8c] hover:bg-[#252f73]">
          <Link href="/filing/quota-adjustment/new">
            <Plus className="h-4 w-4" />
            新增容額微調
          </Link>
        </Button>
      </PageHeader>

      <div className="mb-4 flex items-center gap-6 border-b border-gray-200">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`relative -mb-px flex items-center gap-2 border-b-2 px-1 pb-3 text-base font-medium transition-colors ${
              tab === t.value
                ? "border-[#2d3a8c] text-[#2d3a8c]"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
            <Badge variant="secondary" className="text-sm">
              {counts[t.value]}
            </Badge>
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-28">次數</TableHead>
              <TableHead className="w-32">年度</TableHead>
              <TableHead className="w-28 text-right">異動家數</TableHead>
              <TableHead className="w-32">送出日期</TableHead>
              <TableHead className="w-32">審結日期</TableHead>
              <TableHead className="w-32">狀態</TableHead>
              <TableHead>審查意見</TableHead>
              <TableHead className="w-28 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-16 text-center">
                  <Inbox className="mx-auto mb-3 h-10 w-10 text-gray-300" />
                  <p className="text-base text-gray-500">此分頁目前沒有案件</p>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((c) => {
                const b = getBalance(c.rows)
                const editable = c.stage === "待送件" || c.returnedFrom !== null
                return (
                  <TableRow key={c.id} className="h-14">
                    <TableCell className="text-base font-medium text-gray-900">
                      第 {c.round} 次
                    </TableCell>
                    <TableCell className="text-base text-gray-700">{c.year}</TableCell>
                    <TableCell className="text-right text-base text-gray-700">
                      {b.changedCount > 0 ? `${b.changedCount} 家` : "—"}
                    </TableCell>
                    <TableCell className="text-base text-gray-600">
                      {c.submittedDate ?? "—"}
                    </TableCell>
                    <TableCell className="text-base text-gray-600">
                      {c.approvedDate ?? "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-1">
                        <Badge
                          variant="outline"
                          className={QUOTA_ADJUSTMENT_STAGE_CONFIG[c.stage].color}
                        >
                          {QUOTA_ADJUSTMENT_STAGE_CONFIG[c.stage].label}
                        </Badge>
                        {c.returnedFrom && (
                          <Badge variant="outline" className={ADJUSTMENT_RETURNED_BUCKET.color}>
                            退件
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-md text-base text-gray-600">
                      {c.reviewComment || <span className="text-gray-400">—</span>}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="outline" size="sm" className="gap-1">
                        <Link href={`/filing/quota-adjustment/${c.id}`}>
                          {editable ? "填寫" : "檢視"}
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </PageContainer>
  )
}
