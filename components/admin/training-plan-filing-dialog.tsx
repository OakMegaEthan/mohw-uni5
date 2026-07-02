"use client"

import { useState, useMemo } from "react"
import { Search, ArrowUpDown, ArrowUp, ArrowDown, Pencil, Lock } from "lucide-react"
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
import { Label } from "@/components/ui/label"
import { allSocieties } from "@/lib/data/societies"
import { mockSocietyFilingConfigs, type SocietyFilingConfig } from "@/lib/mock/review-outline"

interface FilingPeriodOverride {
  startDate?: string
  endDate?: string
}

interface TrainingPlanState {
  configs: SocietyFilingConfig[]
  overrides: Record<string, FilingPeriodOverride>
}

const FOUR_YEARS_MS = 4 * 365 * 24 * 60 * 60 * 1000

// 距前次公告 4 年內 → 原則上不可再修改（少數特例，仍可由管理者個別開放）
// 從未公告或已超過 4 年 → 可修改（常態）
function isWithinFourYears(dateStr: string | null): boolean {
  if (!dateStr) return false
  const parts = dateStr.split("/")
  const date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
  return Date.now() - date.getTime() <= FOUR_YEARS_MS
}

export function TrainingPlanFilingDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  // Global period
  const [globalStartDate, setGlobalStartDate] = useState("2025-09-03")
  const [globalEndDate, setGlobalEndDate] = useState("2025-10-15")

  // Societies state
  const [configs, setConfigs] = useState<SocietyFilingConfig[]>(() =>
    JSON.parse(JSON.stringify(mockSocietyFilingConfigs))
  )
  const [overrides, setOverrides] = useState<Record<string, FilingPeriodOverride>>({})

  // UI state
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState<"id" | "announcedDate" | "modifiable">("id")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [editingOverride, setEditingOverride] = useState<string | null>(null)
  const [tempOverrideStart, setTempOverrideStart] = useState("")
  const [tempOverrideEnd, setTempOverrideEnd] = useState("")

  // Get society name by id
  const getSocietyName = (societyId: string) => {
    return allSocieties.find((s) => s.id === societyId)?.name || societyId
  }

  // Filter and sort
  const filteredConfigs = useMemo(() => {
    let result = configs.filter((config) => {
      const societyName = getSocietyName(config.societyId).toLowerCase()
      return societyName.includes(searchTerm.toLowerCase())
    })

    result.sort((a, b) => {
      let compareVal = 0
      if (sortBy === "id") {
        compareVal = Number(a.societyId) - Number(b.societyId)
      } else if (sortBy === "modifiable") {
        // 不可修改（4 年內）排在前，方便管理者快速聚焦少數特例
        const lockedA = isWithinFourYears(a.lastAnnouncedDate) ? 0 : 1
        const lockedB = isWithinFourYears(b.lastAnnouncedDate) ? 0 : 1
        compareVal = lockedA - lockedB
      } else {
        const dateA = a.lastAnnouncedDate
          ? new Date(a.lastAnnouncedDate).getTime()
          : 0
        const dateB = b.lastAnnouncedDate
          ? new Date(b.lastAnnouncedDate).getTime()
          : 0
        compareVal = dateA - dateB
      }
      return sortOrder === "asc" ? compareVal : -compareVal
    })

    return result
  }, [configs, searchTerm, sortBy, sortOrder])

  const openCount = configs.filter((c) => c.isOpen).length

  // Handlers
  const handleToggleSociety = (societyId: string) => {
    setConfigs((prev) =>
      prev.map((c) =>
        c.societyId === societyId ? { ...c, isOpen: !c.isOpen } : c
      )
    )
  }

  const handleToggleSort = (field: "id" | "announcedDate" | "modifiable") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(field)
      setSortOrder("asc")
    }
  }

  const handleSelectAll = (value: boolean) => {
    setConfigs((prev) => prev.map((c) => ({ ...c, isOpen: value })))
  }

  const handleStartEditOverride = (societyId: string) => {
    const current = getPeriod(societyId)
    setTempOverrideStart(current.start)
    setTempOverrideEnd(current.end)
    setEditingOverride(societyId)
  }

  const handleSaveOverride = (societyId: string) => {
    setOverrides((prev) => ({
      ...prev,
      [societyId]: {
        startDate: tempOverrideStart,
        endDate: tempOverrideEnd,
      },
    }))
    setEditingOverride(null)
  }

  const handleClearOverride = (societyId: string) => {
    setOverrides((prev) => {
      const newOverrides = { ...prev }
      delete newOverrides[societyId]
      return newOverrides
    })
  }

  const getPeriod = (societyId: string) => {
    const override = overrides[societyId]
    if (override?.startDate) {
      return {
        start: override.startDate,
        end: override.endDate || globalEndDate,
        isOverride: true,
      }
    }
    return {
      start: globalStartDate,
      end: globalEndDate,
      isOverride: false,
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>訓練計畫認定基準——開放設定</DialogTitle>
          <DialogDescription>
            設定全域填報期間，並針對各醫學會分別設定是否開放填報
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Global Period Section */}
          <div className="space-y-4 p-5 bg-blue-50 rounded-lg border border-blue-100">
            <h3 className="font-semibold text-gray-900">統一填報期間</h3>
            <p className="text-sm text-gray-600">
              以下未另行設定的醫學會，將套用此期間
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-muted-foreground mb-2 block">
                  開始日期
                </Label>
                <Input
                  type="date"
                  value={globalStartDate}
                  onChange={(e) => setGlobalStartDate(e.target.value)}
                />
              </div>
              <div>
                <Label className="text-sm text-muted-foreground mb-2 block">
                  結束日期
                </Label>
                <Input
                  type="date"
                  value={globalEndDate}
                  onChange={(e) => setGlobalEndDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Societies Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">醫學會開放設定</h3>
                <p className="text-sm text-gray-600 mt-1">
                  已開放 {openCount} / {configs.length} 個醫學會
                </p>
              </div>
            </div>

            {/* Search and quick actions */}
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="搜尋醫學會..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSelectAll(true)}
              >
                全選開放
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSelectAll(false)}
              >
                全選關閉
              </Button>
            </div>

            {/* Legend */}
            <div className="text-sm text-gray-500">
              修改狀態：距前次公告 4 年內者原則上不可再修改，可點擊欄位標題排序以聚焦此類醫學會
            </div>

            {/* Table */}
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="w-12 px-5 py-3 text-left font-semibold text-gray-700">
                      開放
                    </th>
                    <th className="px-5 py-3 text-left font-semibold text-gray-700">
                      醫學會名稱
                    </th>
                    <th
                      className="px-5 py-3 text-left font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 whitespace-nowrap"
                      onClick={() => handleToggleSort("modifiable")}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>修改狀態</span>
                        {sortBy === "modifiable" ? (
                          sortOrder === "asc" ? (
                            <ArrowUp className="w-4 h-4" />
                          ) : (
                            <ArrowDown className="w-4 h-4" />
                          )
                        ) : (
                          <ArrowUpDown className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                    </th>
                    <th
                      className="px-5 py-3 text-left font-semibold text-gray-700 cursor-pointer hover:bg-gray-100"
                      onClick={() => handleToggleSort("announcedDate")}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>前次公告時間</span>
                        {sortBy === "announcedDate" && (
                          sortOrder === "asc" ? (
                            <ArrowUp className="w-4 h-4" />
                          ) : (
                            <ArrowDown className="w-4 h-4" />
                          )
                        )}
                      </div>
                    </th>
                    <th className="px-5 py-3 text-left font-semibold text-gray-700">
                      填報期間
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredConfigs.map((config) => {
                    const isLocked = isWithinFourYears(config.lastAnnouncedDate)
                    const period = getPeriod(config.societyId)
                    const hasOverride = !!overrides[config.societyId]
                    const isEditing = editingOverride === config.societyId

                    return (
                      <tr
                        key={config.societyId}
                        className={`border-t ${hasOverride ? "bg-blue-50/30" : ""}`}
                      >
                        <td className="px-5 py-3">
                          <Switch
                            checked={config.isOpen}
                            onCheckedChange={() =>
                              handleToggleSociety(config.societyId)
                            }
                          />
                        </td>
                        <td className="px-5 py-3">
                          <span className="font-medium text-gray-900">
                            {getSocietyName(config.societyId)}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          {isLocked ? (
                            <Badge variant="secondary" className="gap-1 font-normal text-gray-600">
                              <Lock className="w-3 h-3" />
                              未滿4年
                            </Badge>
                          ) : (
                            <span className="text-sm text-gray-400">可修改</span>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          {config.lastAnnouncedDate ? (
                            <span className="text-gray-600">
                              {config.lastAnnouncedDate}
                            </span>
                          ) : (
                            <span className="text-muted-foreground italic">
                              從未公告
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          {config.isOpen ? (
                            <div>
                              {isEditing ? (
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="date"
                                    value={tempOverrideStart}
                                    onChange={(e) =>
                                      setTempOverrideStart(e.target.value)
                                    }
                                    className="h-8 text-sm flex-1"
                                  />
                                  <span className="text-gray-400">~</span>
                                  <Input
                                    type="date"
                                    value={tempOverrideEnd}
                                    onChange={(e) =>
                                      setTempOverrideEnd(e.target.value)
                                    }
                                    className="h-8 text-sm flex-1"
                                  />
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      handleSaveOverride(config.societyId)
                                    }
                                    className="text-xs h-8"
                                  >
                                    完成
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex items-center justify-between gap-3">
                                  <span className={`text-sm ${hasOverride ? "text-gray-900" : "text-gray-400"}`}>
                                    {period.start} ~ {period.end}
                                  </span>
                                  {hasOverride ? (
                                    <Badge
                                      variant="secondary"
                                      className="text-xs cursor-pointer hover:bg-gray-200 shrink-0"
                                      onClick={() =>
                                        handleClearOverride(config.societyId)
                                      }
                                    >
                                      個別設定 ✕
                                    </Badge>
                                  ) : (
                                    <Badge
                                      variant="outline"
                                      className="text-xs text-gray-500 cursor-pointer hover:bg-gray-50 shrink-0 gap-1.5"
                                      onClick={() =>
                                        handleStartEditOverride(config.societyId)
                                      }
                                    >
                                      <Pencil className="w-3 h-3" />
                                      統一填報期間
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t bg-gray-50">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button
            className="bg-[#2d3a8c] hover:bg-[#252f73] text-white"
            onClick={() => {
              // TODO: Save settings (globalStartDate, globalEndDate, configs, overrides)
              onOpenChange(false)
            }}
          >
            儲存設定
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
