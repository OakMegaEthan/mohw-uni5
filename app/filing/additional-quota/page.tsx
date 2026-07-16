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
  ADDITIONAL_QUOTA_APPLICATIONS,
  ADDITIONAL_QUOTA_STAGE_CONFIG,
  getClassificationPrinciples,
  getSpecialtyOptions,
} from "@/lib/mock/additional-quota"

type TextField = "hospitalName" | "incomingDocNumber" | "ministryDocNumber"
const TEXT_FIELD_LABELS: Record<TextField, string> = {
  hospitalName: "訓練醫院",
  incomingDocNumber: "來文字號",
  ministryDocNumber: "本部文號",
}

// 多選下拉：申請分科／分類原則共用
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
  const [textField, setTextField] = useState<TextField>("hospitalName")
  const [textQuery, setTextQuery] = useState("")
  const [specialtyFilter, setSpecialtyFilter] = useState<string[]>([])
  const [principleFilter, setPrincipleFilter] = useState<string[]>([])
  const [sortAsc, setSortAsc] = useState(false)

  const specialtyOptions = getSpecialtyOptions()
  const principleOptions = getClassificationPrinciples()

  const rows = useMemo(() => {
    const q = textQuery.trim().toLowerCase()
    const filtered = ADDITIONAL_QUOTA_APPLICATIONS.filter((a) => {
      const matchesText = q === "" || a[textField].toLowerCase().includes(q)
      const matchesSpecialty = specialtyFilter.length === 0 || specialtyFilter.includes(a.specialty)
      const matchesPrinciple = principleFilter.length === 0 || principleFilter.includes(a.classificationPrinciple)
      return matchesText && matchesSpecialty && matchesPrinciple
    })
    return [...filtered].sort((a, b) =>
      sortAsc ? a.incomingDate.localeCompare(b.incomingDate) : b.incomingDate.localeCompare(a.incomingDate),
    )
  }, [textField, textQuery, specialtyFilter, principleFilter, sortAsc])

  const handleExport = () => toast.success(`已匯出 ${rows.length} 筆申請清單`)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Link href="/" className="mb-4 inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800">
          <ArrowLeft className="h-4 w-4" />
          返回首頁
        </Link>

        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">外加容額申請</h1>
            <p className="mt-1 text-sm text-gray-500">登錄、審查各訓練醫院之外加容額申請，並辦理公告</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button variant="outline" className="gap-2" onClick={handleExport}>
              <Download className="h-4 w-4" />
              匯出申請清單
            </Button>
            <Button asChild className="gap-2 bg-[#2d3a8c] hover:bg-[#252f73]">
              <Link href="/filing/additional-quota/new">
                <Plus className="h-4 w-4" />
                新增申請
              </Link>
            </Button>
          </div>
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

        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>訓練醫院</TableHead>
                <TableHead>申請分科</TableHead>
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
                <TableHead className="text-right">申請容額</TableHead>
                <TableHead>分類原則</TableHead>
                <TableHead className="w-24">狀態</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium text-gray-900">{a.hospitalName}</TableCell>
                  <TableCell>{a.specialty}</TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-gray-600">{a.incomingDate}</TableCell>
                  <TableCell className="text-sm text-gray-600">{a.incomingDocNumber}</TableCell>
                  <TableCell className="text-sm text-gray-600">{a.ministryDocNumber || "—"}</TableCell>
                  <TableCell className="text-right">{a.requestedQuota} 名</TableCell>
                  <TableCell className="text-sm text-gray-600">{a.classificationPrinciple}</TableCell>
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
                  <TableCell colSpan={9} className="py-12 text-center text-gray-500">
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
