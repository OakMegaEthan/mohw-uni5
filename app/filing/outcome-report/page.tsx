"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { ArrowLeft, ChevronRight, ChevronsUpDown, ChevronUp, ChevronDown, FileText, Filter } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  AQ_OUTCOME_STATUS_CONFIG,
  getAqOutcomeReportCases,
  type OutcomeReportReviewStatus,
} from "@/lib/mock/additional-quota-outcome-report"
import { getClassificationPrincipleNames, getSpecialtyOptions } from "@/lib/mock/additional-quota"

type TextField = "hospitalName" | "ministryDocNumber" | "announcementNumber"

const TEXT_FIELD_LABELS: Record<TextField, string> = {
  hospitalName: "訓練醫院",
  ministryDocNumber: "本部文號",
  announcementNumber: "公告文號",
}

/** 多選篩選器：與外加容額管理列表相同的互動模式。 */
function MultiSelectFilter({
  label,
  options,
  selected,
  onChange,
}: {
  label: string
  options: string[]
  selected: string[]
  onChange: (next: string[]) => void
}) {
  const toggle = (value: string) =>
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value])

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="h-9 gap-2">
          <Filter className="h-4 w-4" />
          {label}
          {selected.length > 0 && (
            <Badge variant="secondary" className="ml-0.5 h-5 px-1.5 text-xs">
              {selected.length}
            </Badge>
          )}
          <ChevronsUpDown className="h-3.5 w-3.5 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="max-h-72 w-56 overflow-y-auto p-2">
        {options.map((option) => (
          <label
            key={option}
            className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
          >
            <Checkbox checked={selected.includes(option)} onCheckedChange={() => toggle(option)} />
            {option}
          </label>
        ))}
      </PopoverContent>
    </Popover>
  )
}

/**
 * 外加容額成果報告（醫事司＋醫策會共用的獨立模組）。
 * 適用案件＝分類原則「需成果報告」且已公告的外加容額案件。
 * 兩單位平行審查、各留評論、歸檔；無退回。獨立於外加容額管理，以維持權限邊界。
 */
export default function AdditionalQuotaOutcomeReportPage() {
  const [textField, setTextField] = useState<TextField>("hospitalName")
  const [textQuery, setTextQuery] = useState("")
  const [specialtyFilter, setSpecialtyFilter] = useState<string[]>([])
  const [principleFilter, setPrincipleFilter] = useState<string[]>([])
  const [statusFilter, setStatusFilter] = useState<OutcomeReportReviewStatus | "all">("all")
  const [sortAsc, setSortAsc] = useState(false)

  const cases = getAqOutcomeReportCases()
  const specialtyOptions = getSpecialtyOptions()
  const principleOptions = getClassificationPrincipleNames()

  // 先套用文字與下拉篩選；狀態 tab 在其上再細分，故 tab 計數反映目前篩選結果
  const baseFiltered = useMemo(() => {
    const q = textQuery.trim().toLowerCase()
    return cases.filter((c) => {
      const matchesText = q === "" || c[textField].toLowerCase().includes(q)
      const matchesSpecialty = specialtyFilter.length === 0 || specialtyFilter.includes(c.specialty)
      const matchesPrinciple =
        principleFilter.length === 0 || principleFilter.includes(c.classificationPrinciple)
      return matchesText && matchesSpecialty && matchesPrinciple
    })
  }, [cases, textField, textQuery, specialtyFilter, principleFilter])

  const statusTabs = useMemo(() => {
    const count = (s: OutcomeReportReviewStatus) => baseFiltered.filter((c) => c.status === s).length
    return [
      { value: "all" as const, label: "全部", count: baseFiltered.length },
      { value: "待審查" as const, label: "待審查", count: count("待審查") },
      { value: "已歸檔" as const, label: "已歸檔", count: count("已歸檔") },
    ]
  }, [baseFiltered])

  const rows = useMemo(() => {
    const byStatus =
      statusFilter === "all" ? baseFiltered : baseFiltered.filter((c) => c.status === statusFilter)
    return [...byStatus].sort((a, b) =>
      sortAsc
        ? a.announcementDate.localeCompare(b.announcementDate)
        : b.announcementDate.localeCompare(a.announcementDate),
    )
  }, [baseFiltered, statusFilter, sortAsc])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Link href="/" className="mb-4 inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800">
          <ArrowLeft className="h-4 w-4" />
          返回首頁
        </Link>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">外加容額成果報告</h1>
          <p className="mt-1 text-base text-gray-500">
            訓練醫院於外加容額公告執行滿一年後提交之成果報告，由醫事司與醫策會分工審查、留存歸檔
          </p>
        </div>

        {/* 狀態切換 */}
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

        {/* 篩選工具列 */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="flex items-center">
            <Select value={textField} onValueChange={(v) => setTextField(v as TextField)}>
              <SelectTrigger className="h-9 w-32 rounded-r-none border-r-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(TEXT_FIELD_LABELS) as TextField[]).map((f) => (
                  <SelectItem key={f} value={f}>
                    {TEXT_FIELD_LABELS[f]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              value={textQuery}
              onChange={(e) => setTextQuery(e.target.value)}
              placeholder={`輸入${TEXT_FIELD_LABELS[textField]}關鍵字`}
              className="h-9 w-64 rounded-l-none"
            />
          </div>
          <MultiSelectFilter
            label="申請分科"
            options={specialtyOptions}
            selected={specialtyFilter}
            onChange={setSpecialtyFilter}
          />
          <MultiSelectFilter
            label="分類原則"
            options={principleOptions}
            selected={principleFilter}
            onChange={setPrincipleFilter}
          />
          <span className="ml-auto text-sm text-muted-foreground">共 {rows.length} 筆</span>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>訓練醫院</TableHead>
                    <TableHead className="w-28">分科</TableHead>
                    <TableHead className="w-32">分類原則</TableHead>
                    <TableHead className="w-32">
                      <button
                        onClick={() => setSortAsc((v) => !v)}
                        className="inline-flex items-center gap-1 hover:text-foreground"
                      >
                        公告日期
                        {sortAsc ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                      </button>
                    </TableHead>
                    <TableHead className="w-44">公告文號</TableHead>
                    <TableHead className="w-24 text-right">核定容額</TableHead>
                    <TableHead className="w-28">狀態</TableHead>
                    <TableHead className="w-24" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((c) => (
                    <TableRow key={c.applicationId}>
                      <TableCell className="font-medium text-gray-900">{c.hospitalName}</TableCell>
                      <TableCell>{c.specialty}</TableCell>
                      <TableCell className="text-sm text-gray-600">{c.classificationPrinciple}</TableCell>
                      <TableCell className="text-sm text-gray-600">{c.announcementDate}</TableCell>
                      <TableCell className="text-sm text-gray-600">{c.announcementNumber}</TableCell>
                      <TableCell className="text-right text-sm text-gray-600">{c.approvedQuota} 名</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={AQ_OUTCOME_STATUS_CONFIG[c.status].color}>
                          {AQ_OUTCOME_STATUS_CONFIG[c.status].label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" asChild>
                          <Link
                            href={`/filing/outcome-report/${c.applicationId}`}
                            className="flex items-center gap-1"
                          >
                            <FileText className="h-4 w-4" />
                            {c.status === "已歸檔" ? "檢視" : "審查"}
                            <ChevronRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {rows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="py-12 text-center text-gray-500">
                        沒有符合條件的案件
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
