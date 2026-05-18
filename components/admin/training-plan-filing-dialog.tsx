"use client"

import { useState, useMemo } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Search, ArrowUpDown, ArrowUp, ArrowDown, AlertTriangle } from "lucide-react"
import { allSocieties } from "@/lib/data/societies"
import { mockSocietyFilingConfigs } from "@/lib/mock/review-outline"
import type { SocietyFilingConfig } from "@/lib/mock/review-outline"

interface TrainingPlanFilingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type SortField = "id" | "lastAnnouncedDate"
type SortDir = "asc" | "desc"

const FOUR_YEARS_MS = 4 * 365 * 24 * 60 * 60 * 1000

function isOverFourYears(dateStr: string | null): boolean {
  if (!dateStr) return true
  const parts = dateStr.split("/")
  const date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
  return Date.now() - date.getTime() > FOUR_YEARS_MS
}

export function TrainingPlanFilingDialog({
  open,
  onOpenChange,
}: TrainingPlanFilingDialogProps) {
  const [configs, setConfigs] = useState<SocietyFilingConfig[]>(
    () => JSON.parse(JSON.stringify(mockSocietyFilingConfigs))
  )
  const [search, setSearch] = useState("")
  const [sortField, setSortField] = useState<SortField>("id")
  const [sortDir, setSortDir] = useState<SortDir>("asc")

  // Toggle individual society
  function toggleSociety(societyId: string) {
    setConfigs((prev) =>
      prev.map((c) =>
        c.societyId === societyId ? { ...c, isOpen: !c.isOpen } : c
      )
    )
  }

  // Select all / deselect all (filtered)
  function setAllFiltered(value: boolean) {
    const filteredIds = new Set(filtered.map((r) => r.society.id))
    setConfigs((prev) =>
      prev.map((c) => (filteredIds.has(c.societyId) ? { ...c, isOpen: value } : c))
    )
  }

  // Sort handler
  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortField(field)
      setSortDir("asc")
    }
  }

  // Merge societies + configs
  const rows = useMemo(() => {
    return allSocieties.map((society) => {
      const config = configs.find((c) => c.societyId === society.id)!
      return { society, config }
    })
  }, [configs])

  // Filter by search
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter(
      (r) =>
        !q ||
        r.society.name.toLowerCase().includes(q) ||
        r.society.specialty.toLowerCase().includes(q)
    )
  }, [rows, search])

  // Sort
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let cmp = 0
      if (sortField === "id") {
        cmp = Number(a.society.id) - Number(b.society.id)
      } else {
        const da = a.config.lastAnnouncedDate
        const db = b.config.lastAnnouncedDate
        if (!da && !db) cmp = 0
        else if (!da) cmp = 1
        else if (!db) cmp = -1
        else cmp = da < db ? -1 : da > db ? 1 : 0
      }
      return sortDir === "asc" ? cmp : -cmp
    })
  }, [filtered, sortField, sortDir])

  const openCount = filtered.filter((r) => r.config.isOpen).length
  const allOpen = openCount === filtered.length && filtered.length > 0
  const allClosed = openCount === 0

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return <ArrowUpDown className="w-3.5 h-3.5 opacity-40" />
    return sortDir === "asc"
      ? <ArrowUp className="w-3.5 h-3.5" />
      : <ArrowDown className="w-3.5 h-3.5" />
  }

  function handleSave() {
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col gap-0 p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <DialogTitle>訓練計畫認定基準——開放設定</DialogTitle>
          <DialogDescription>
            針對各醫學會分別設定是否開放填報，可參考前次公告時間進行判斷
          </DialogDescription>
        </DialogHeader>

        {/* Toolbar */}
        <div className="px-6 py-3 border-b bg-gray-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="搜尋醫學會名稱或專科..."
                className="pl-9 h-9 text-sm"
              />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                className="h-9 text-sm"
                disabled={allOpen}
                onClick={() => setAllFiltered(true)}
              >
                全選開放
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-9 text-sm"
                disabled={allClosed}
                onClick={() => setAllFiltered(false)}
              >
                全選關閉
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-sm text-muted-foreground">
              已開放 <span className="font-semibold text-foreground">{openCount}</span> / {filtered.length} 個醫學會
              {search && <span className="ml-1">（搜尋結果）</span>}
            </span>
            <div className="flex items-center gap-1.5 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>橘色標示：距前次公告已超過 4 年</span>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-white border-b">
              <tr>
                <th className="px-5 py-3 text-left font-semibold text-gray-500 uppercase tracking-wide text-xs w-10">
                  <button
                    onClick={() => handleSort("id")}
                    className="flex items-center gap-1 hover:text-gray-700 transition-colors"
                  >
                    #
                    <SortIcon field="id" />
                  </button>
                </th>
                <th className="px-5 py-3 text-left font-semibold text-gray-500 uppercase tracking-wide text-xs">
                  醫學會名稱
                </th>
                <th className="px-5 py-3 text-left font-semibold text-gray-500 uppercase tracking-wide text-xs w-40">
                  <button
                    onClick={() => handleSort("lastAnnouncedDate")}
                    className="flex items-center gap-1 hover:text-gray-700 transition-colors"
                  >
                    前次公告時間
                    <SortIcon field="lastAnnouncedDate" />
                  </button>
                </th>
                <th className="px-5 py-3 text-center font-semibold text-gray-500 uppercase tracking-wide text-xs w-28">
                  開放狀態
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sorted.map(({ society, config }) => {
                const stale = isOverFourYears(config.lastAnnouncedDate)
                return (
                  <tr
                    key={society.id}
                    className={stale ? "bg-amber-50 hover:bg-amber-100/70" : "hover:bg-gray-50"}
                  >
                    <td className="px-5 py-3 text-gray-400 text-xs">{society.id}</td>
                    <td className="px-5 py-3">
                      <div className="font-medium text-gray-900">{society.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{society.specialty}</div>
                    </td>
                    <td className="px-5 py-3">
                      {config.lastAnnouncedDate ? (
                        <div className="flex items-center gap-1.5">
                          <span className={stale ? "text-amber-700 font-medium" : "text-gray-600"}>
                            {config.lastAnnouncedDate}
                          </span>
                          {stale && (
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground italic">從未公告</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <Switch
                          checked={config.isOpen}
                          onCheckedChange={() => toggleSociety(society.id)}
                          aria-label={`${society.name} 開放狀態`}
                        />
                        <Badge
                          className={
                            config.isOpen
                              ? "bg-green-100 text-green-800 border-green-200 text-xs"
                              : "bg-gray-100 text-gray-500 border-gray-200 text-xs"
                          }
                        >
                          {config.isOpen ? "開放" : "關閉"}
                        </Badge>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <DialogFooter className="px-6 py-4 border-t bg-gray-50 shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSave} className="bg-primary">
            儲存設定
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
