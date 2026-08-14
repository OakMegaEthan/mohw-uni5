"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { ArrowLeft, Plus, Download, ChevronRight, ChevronsUpDown, ChevronUp, ChevronDown, Filter } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  ADDITIONAL_QUOTA_APPLICATIONS,
  ADDITIONAL_QUOTA_STAGE_CONFIG,
  CURRENT_QUOTA_YEAR,
  getClassificationPrincipleNames,
  getSpecialtyOptions,
  getYearOptions,
  type AdditionalQuotaStage,
} from "@/lib/mock/additional-quota"

type TextField = "hospitalName" | "incomingDocNumber" | "ministryDocNumber"
const TEXT_FIELD_LABELS: Record<TextField, string> = {
  hospitalName: "訓練醫院",
  incomingDocNumber: "來文字號",
  ministryDocNumber: "本部文號",
}

// 多選下拉：申請專科／分類原則共用
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
        <Button variant="outline" className="h-9 justify-between gap-2">
          <span className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-gray-400" />
            {label}
            {selected.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                {selected.length}
              </Badge>
            )}
          </span>
          <ChevronsUpDown className="h-3.5 w-3.5 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56 p-2">
        <div className="max-h-64 space-y-1 overflow-y-auto">
          {options.map((option) => (
            <label
              key={option}
              className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
            >
              <Checkbox checked={selected.includes(option)} onCheckedChange={() => toggle(option)} />
              <span className="truncate">{option}</span>
            </label>
          ))}
        </div>
        {selected.length > 0 && (
          <Button variant="ghost" size="sm" className="mt-1 w-full text-xs" onClick={() => onChange([])}>
            清除
          </Button>
        )}
      </PopoverContent>
    </Popover>
  )
}

export default function FilingAdditionalQuotaPage() {
  // 年度為單選且預設當年度：清單的主要工作面是本年度案件，歷史年度供查詢
  const [year, setYear] = useState<string>(CURRENT_QUOTA_YEAR)
  const [textField, setTextField] = useState<TextField>("hospitalName")
  const [textQuery, setTextQuery] = useState("")
  const [specialtyFilter, setSpecialtyFilter] = useState<string[]>([])
  const [principleFilter, setPrincipleFilter] = useState<string[]>([])
  const [stageTab, setStageTab] = useState<AdditionalQuotaStage | "all">("all")
  const [sortAsc, setSortAsc] = useState(false)

  const specialtyOptions = getSpecialtyOptions()
  const principleOptions = getClassificationPrincipleNames()

  // 先套用文字與下拉篩選；狀態 tab 在其上再細分，故 tab 計數反映目前篩選結果
  const baseFiltered = useMemo(() => {
    const q = textQuery.trim().toLowerCase()
    return ADDITIONAL_QUOTA_APPLICATIONS.filter((a) => {
      const matchesYear = a.year === year
      const matchesText = q === "" || a[textField].toLowerCase().includes(q)
      const matchesSpecialty = specialtyFilter.length === 0 || specialtyFilter.includes(a.specialty)
      const matchesPrinciple = principleFilter.length === 0 || principleFilter.includes(a.classificationPrinciple)
      return matchesYear && matchesText && matchesSpecialty && matchesPrinciple
    })
  }, [year, textField, textQuery, specialtyFilter, principleFilter])

  const stageTabs = useMemo(() => {
    const count = (s: AdditionalQuotaStage) => baseFiltered.filter((a) => a.stage === s).length
    return [
      { value: "all" as const, label: "全部", count: baseFiltered.length },
      { value: "待審查" as const, label: "待審查", count: count("待審查") },
      { value: "審查通過" as const, label: "審查通過", count: count("審查通過") },
    ]
  }, [baseFiltered])

  const rows = useMemo(() => {
    const byStage = stageTab === "all" ? baseFiltered : baseFiltered.filter((a) => a.stage === stageTab)
    return [...byStage].sort((a, b) =>
      sortAsc ? a.incomingDate.localeCompare(b.incomingDate) : b.incomingDate.localeCompare(a.incomingDate),
    )
  }, [baseFiltered, stageTab, sortAsc])

  // 審查結果清單：已登錄審查結果（審查通過）的案件，供公告管理準備公告文書
  const reviewedCount = useMemo(
    () => baseFiltered.filter((a) => a.stage === "審查通過").length,
    [baseFiltered],
  )

  const handleExportApplications = () => toast.success(`已匯出 ${rows.length} 筆申請清單`)
  const handleExportReviewed = () => toast.success(`已匯出 ${reviewedCount} 筆審查結果清單（審查通過）`)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Link href="/" className="mb-4 inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800">
          <ArrowLeft className="h-4 w-4" />
          返回首頁
        </Link>

        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">外加容額管理</h1>
            <p className="mt-1 text-sm text-gray-500">登錄、審查各訓練醫院之外加容額申請，並辦理公告</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Download className="h-4 w-4" />
                  匯出
                  <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuItem onClick={handleExportApplications} className="cursor-pointer">
                  <div className="flex flex-col">
                    <span>匯出申請清單</span>
                    <span className="text-xs text-muted-foreground">目前檢視之案件，供會議審查</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportReviewed} className="cursor-pointer">
                  <div className="flex flex-col">
                    <span>匯出審查結果清單</span>
                    <span className="text-xs text-muted-foreground">審查通過案件，供公告管理準備公告文書</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button asChild className="gap-2 bg-[#2d3a8c] hover:bg-[#252f73]">
              <Link href="/filing/additional-quota/new">
                <Plus className="h-4 w-4" />
                新增申請
              </Link>
            </Button>
          </div>
        </div>

        {/* 狀態切換：醫事司的主要工作軸，故以 tab 呈現於篩選之上 */}
        <div className="mb-4 flex items-center gap-6 border-b border-gray-200">
          {stageTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStageTab(tab.value)}
              className={`relative -mb-px flex items-center border-b-2 px-1 pb-3 text-sm font-medium transition-colors ${
                stageTab === tab.value
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
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="h-9 w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {getYearOptions().map((y) => (
                <SelectItem key={y} value={y}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
            label="申請專科"
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

        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>訓練醫院</TableHead>
                <TableHead>申請專科</TableHead>
                <TableHead className="text-right">申請人數</TableHead>
                {/* 資料來源：RRC 會議決議中的最大可收訓容額數（見 CurrentYearQuota.limit） */}
                <TableHead className="text-right">可收訓容額</TableHead>
                {/* 資料來源：該院該專科最新一次的分配容額數（見 CurrentYearQuota.approved） */}
                <TableHead className="text-right">已分配容額</TableHead>
                <TableHead>分類原則</TableHead>
                <TableHead>
                  <button
                    className="flex items-center gap-1 font-medium hover:text-foreground"
                    onClick={() => setSortAsc((v) => !v)}
                  >
                    來文日期
                    {sortAsc ? (
                      <ChevronUp className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5" />
                    )}
                  </button>
                </TableHead>
                <TableHead>來文字號</TableHead>
                <TableHead>本部文號</TableHead>
                <TableHead className="w-24">狀態</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium text-gray-900">
                    <span className="block max-w-[16rem] truncate" title={a.hospitalName}>
                      {a.hospitalName}
                    </span>
                  </TableCell>
                  <TableCell>{a.specialty}</TableCell>
                  <TableCell className="text-right">{a.requestedQuota} 名</TableCell>
                  <TableCell className="text-right text-gray-600">
                    {a.currentYearQuota.limit} 名
                  </TableCell>
                  <TableCell className="text-right text-gray-600">
                    {a.currentYearQuota.approved} 名
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    <span
                      className="block max-w-[13rem] truncate"
                      title={a.classificationPrinciple}
                    >
                      {a.classificationPrinciple}
                    </span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-gray-600">{a.incomingDate}</TableCell>
                  <TableCell className="text-sm text-gray-600">{a.incomingDocNumber}</TableCell>
                  <TableCell className="text-sm text-gray-600">{a.ministryDocNumber || "—"}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={ADDITIONAL_QUOTA_STAGE_CONFIG[a.stage].color}>
                      {ADDITIONAL_QUOTA_STAGE_CONFIG[a.stage].label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/filing/additional-quota/${a.id}`} className="flex items-center gap-1">
                        檢視
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={11} className="py-12 text-center text-gray-500">
                    查無符合條件的申請
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
