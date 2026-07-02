"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Pencil, Settings2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FilingScheduleDialog } from "@/components/admin/filing-schedule-dialog"
import { TrainingPlanFilingDialog } from "@/components/admin/training-plan-filing-dialog"
import { filingItemsConfig, quotaFilingConfig } from "@/lib/mock/review-outline"
import type { FilingItemConfig } from "@/lib/mock/review-outline"

export default function FilingItemManagementPage() {
  const [selectedItem, setSelectedItem] = useState<FilingItemConfig | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [trainingPlanDialogOpen, setTrainingPlanDialogOpen] = useState(false)

  const getStatusBadge = (item: FilingItemConfig) => {
    switch (item.status) {
      case "open":
        return <Badge className="bg-green-100 text-green-800 border-green-200">開放中</Badge>
      case "closed":
        return <Badge className="bg-gray-100 text-gray-600 border-gray-200">未開放</Badge>
      case "scheduled":
        return <Badge className="bg-blue-100 text-blue-700 border-blue-200">排程中</Badge>
    }
  }

  const getFilingPeriod = (item: FilingItemConfig) => {
    if (!item.openingDate) return "未開放"
    const startDate = item.openingDate.split(" ")[0]
    const endDate = item.closingDate?.split(" ")[0]
    return `${startDate} ~ ${endDate}`
  }

  const handleSettingsClick = (item: FilingItemConfig) => {
    if (item.id === "training-plan") {
      setTrainingPlanDialogOpen(true)
    } else {
      setSelectedItem(item)
      setDialogOpen(true)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">填報項目管理</h1>
          <p className="text-base text-gray-500 mt-1">設定各填報項目的開放時間和狀態</p>
        </div>

        {/* 專科醫師訓練相關文件填報管理 */}
        <div className="mb-8">
          <h2 className="text-base font-semibold text-gray-700 mb-3">專科醫師訓練相關文件填報管理</h2>
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-500 uppercase tracking-wide">文件名稱</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-500 uppercase tracking-wide w-28">狀態</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">新增公告日期</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">發文字號</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-500 uppercase tracking-wide">填報期間</th>
                  <th className="text-right px-6 py-3 text-sm font-semibold text-gray-500 uppercase tracking-wide w-40">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filingItemsConfig.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-900">{item.name}</span>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(item)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-500">{item.announcementDate ?? "—"}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-500">{item.documentNumber ?? "—"}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-500">{getFilingPeriod(item)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5 h-8"
                          onClick={() => handleSettingsClick(item)}
                        >
                          <Settings2 className="w-3.5 h-3.5" />
                          <span className="text-sm">開放設定</span>
                        </Button>
                        <Button asChild variant="ghost" size="sm" className="gap-1.5 h-8">
                          <Link href={`/admin/outline-management/${item.id}`}>
                            <Pencil className="w-3.5 h-3.5" />
                            <span className="text-sm">編輯大綱</span>
                          </Link>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 專科醫師訓練醫院名冊及訓練容量填報管理 */}
        <div>
          <h2 className="text-base font-semibold text-gray-700 mb-3">專科醫師訓練醫院名冊及訓練容量填報管理</h2>
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-500 uppercase tracking-wide">項目名稱</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-500 uppercase tracking-wide w-28">狀態</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-500 uppercase tracking-wide">填報期間</th>
                  <th className="text-right px-6 py-3 text-sm font-semibold text-gray-500 uppercase tracking-wide w-40">操作</th>
                </tr>
              </thead>
              <tbody>
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-gray-900">{quotaFilingConfig.name}</span>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(quotaFilingConfig)}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-500">{getFilingPeriod(quotaFilingConfig)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 h-8"
                        onClick={() => handleSettingsClick(quotaFilingConfig)}
                      >
                        <Settings2 className="w-3.5 h-3.5" />
                        <span className="text-sm">開放設定</span>
                      </Button>
                      <Button asChild variant="ghost" size="sm" className="gap-1.5 h-8">
                        <Link href="/admin/society-quota-limit">
                          <Pencil className="w-3.5 h-3.5" />
                          <span className="text-sm">容額上限設定</span>
                        </Link>
                      </Button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {selectedItem && (
        <FilingScheduleDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          item={selectedItem}
        />
      )}

      <TrainingPlanFilingDialog
        open={trainingPlanDialogOpen}
        onOpenChange={setTrainingPlanDialogOpen}
      />
    </div>
  )
}
