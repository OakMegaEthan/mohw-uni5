"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Pin,
  FileText,
  Calendar,
  Bell,
  AlertCircle,
  ExternalLink,
  X,
} from "lucide-react"

// Mock 資料
const mockAnnouncements = [
  {
    id: "1",
    title: "115年度專科醫師訓練計畫甄審原則修訂公告",
    category: "training",
    status: "published",
    isPinned: true,
    publishDate: "2025-01-15",
    views: 245,
    attachments: 2,
  },
  {
    id: "2",
    title: "外加容額申請作業時程公告",
    category: "additional",
    status: "published",
    isPinned: true,
    publishDate: "2025-01-10",
    views: 189,
    attachments: 1,
  },
  {
    id: "3",
    title: "114年度醫院容額分配審查結果",
    category: "review",
    status: "published",
    isPinned: false,
    publishDate: "2025-01-08",
    views: 156,
    attachments: 3,
  },
  {
    id: "4",
    title: "訓練醫院認定基準更新說明",
    category: "training",
    status: "draft",
    isPinned: false,
    publishDate: null,
    views: 0,
    attachments: 1,
  },
  {
    id: "5",
    title: "專科醫師訓練容額調整通知",
    category: "review",
    status: "archived",
    isPinned: false,
    publishDate: "2024-12-20",
    views: 312,
    attachments: 2,
  },
]

const mockPendingAnnouncements = [
  {
    id: "pa-1",
    title: "台灣內科醫學會 - 甄審原則審查通過",
    source: "填報審查",
    sourceModule: "submissions",
    category: "training",
    caseId: "1",
    approvedDate: "2024-11-19",
    type: "screening-principle",
  },
  {
    id: "pa-2",
    title: "台大醫院 - 外加容額申請審查通過",
    source: "外加容額審查",
    sourceModule: "additional-quota",
    category: "additional",
    caseId: "1",
    approvedDate: "2024-11-18",
    type: "additional-quota",
  },
  {
    id: "pa-3",
    title: "台灣外科醫學會 - 訓練醫院認定基準審查通過",
    source: "填報審查",
    sourceModule: "submissions",
    category: "training",
    caseId: "2",
    approvedDate: "2024-11-17",
    type: "hospital-accreditation",
  },
  {
    id: "pa-4",
    title: "長庚醫院 - 醫院容額分配審查通過",
    source: "醫院容額分配審查",
    sourceModule: "hospital-quota",
    category: "review",
    caseId: "3",
    approvedDate: "2024-11-16",
    type: "hospital-quota",
  },
  {
    id: "pa-5",
    title: "台灣骨科醫學會 - 評核標準審查通過",
    source: "填報審查",
    sourceModule: "submissions",
    category: "training",
    caseId: "4",
    approvedDate: "2024-11-15",
    type: "evaluation-standard",
  },
]

const categories = [
  { value: "all", label: "全部類別" },
  { value: "training", label: "專科訓練認定" },
  { value: "additional", label: "外加容額" },
  { value: "review", label: "甄審" },
]

const statuses = [
  { value: "all", label: "全部狀態" },
  { value: "published", label: "已發布" },
  { value: "draft", label: "草稿" },
  { value: "archived", label: "已下架" },
]

const getCategoryLabel = (category: string) => {
  return categories.find((c) => c.value === category)?.label || category
}

const getStatusBadge = (status: string) => {
  const variants: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
    published: { label: "已發布", variant: "default" },
    draft: { label: "草稿", variant: "secondary" },
    archived: { label: "已下架", variant: "outline" },
  }
  const config = variants[status] || { label: status, variant: "outline" as const }
  return <Badge variant={config.variant}>{config.label}</Badge>
}

export default function AnnouncementManagementPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [pendingCases, setPendingCases] = useState(mockPendingAnnouncements)
  const [popoverOpen, setPopoverOpen] = useState(false)

  const filteredAnnouncements = mockAnnouncements.filter((announcement) => {
    const matchesSearch = announcement.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === "all" || announcement.category === categoryFilter
    const matchesStatus = statusFilter === "all" || announcement.status === statusFilter
    return matchesSearch && matchesCategory && matchesStatus
  })

  const handleIgnoreCase = (caseId: string) => {
    setPendingCases(pendingCases.filter((c) => c.id !== caseId))
  }

  const handleCreateAnnouncement = (pendingCase: (typeof mockPendingAnnouncements)[0]) => {
    console.log("[v0] Creating announcement for case:", pendingCase)
    setPopoverOpen(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">公告管理</h1>
              <p className="text-base text-gray-600">管理系統公告的新增、編輯、發布與下架</p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/announcement-management/create">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  新增公告
                </Button>
              </Link>

              {pendingCases.length > 0 && (
                <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="relative border-amber-300 hover:bg-amber-50 bg-transparent">
                      <Bell className="w-4 h-4 mr-2 text-amber-600" />
                      待公告案件
                      <Badge variant="secondary" className="ml-2 bg-amber-100 text-amber-800">
                        {pendingCases.length}
                      </Badge>
                      {pendingCases.length > 0 && (
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[500px] p-0" align="end">
                    <div className="p-4 border-b bg-amber-50">
                      <div className="flex items-center gap-2">
                        <Bell className="w-5 h-5 text-amber-600" />
                        <h3 className="font-semibold text-gray-900">待公告案件</h3>
                        <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                          {pendingCases.length}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">以下案件已審查通過，需建立公告</p>
                    </div>

                    <ScrollArea className="max-h-[400px]">
                      <div className="p-2">
                        {pendingCases.map((pendingCase) => (
                          <div
                            key={pendingCase.id}
                            className="p-3 mb-2 rounded-lg border border-amber-100 bg-white hover:bg-amber-50/50 transition-colors"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-start gap-2 flex-1">
                                <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium text-sm text-gray-900 mb-1 leading-tight">
                                    {pendingCase.title}
                                  </h4>
                                  <div className="flex flex-col gap-1 text-sm text-gray-600">
                                    <span className="flex items-center gap-1">
                                      來源：
                                      <Badge variant="outline" className="text-sm">
                                        {pendingCase.source}
                                      </Badge>
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Calendar className="w-3 h-3" />
                                      通過日期：{pendingCase.approvedDate}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => handleIgnoreCase(pendingCase.id)}
                              >
                                <X className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                            <div className="flex items-center gap-2 ml-6">
                              <Link
                                href={`/announcement-management/create?caseId=${pendingCase.id}`}
                                onClick={() => setPopoverOpen(false)}
                              >
                                <Button size="sm" className="h-7 text-sm bg-amber-600 hover:bg-amber-700">
                                  <Plus className="w-3 h-3 mr-1" />
                                  建立公告
                                </Button>
                              </Link>
                              <Link
                                href={
                                  pendingCase.sourceModule === "submissions"
                                    ? `/review/submissions/${pendingCase.type}/${pendingCase.caseId}`
                                    : pendingCase.sourceModule === "additional-quota"
                                      ? `/filing/additional-quota/${pendingCase.caseId}`
                                      : `/review/hospital-quota/${pendingCase.caseId}`
                                }
                                onClick={() => setPopoverOpen(false)}
                              >
                                <Button variant="outline" size="sm" className="h-7 text-sm bg-transparent">
                                  <ExternalLink className="w-3 h-3 mr-1" />
                                  查看審查
                                </Button>
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </PopoverContent>
                </Popover>
              )}
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="搜尋公告標題..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="選擇類別" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="選擇狀態" />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>標題</TableHead>
                  <TableHead>類別</TableHead>
                  <TableHead>狀態</TableHead>
                  <TableHead>發布日期</TableHead>
                  <TableHead className="text-right">瀏覽數</TableHead>
                  <TableHead className="text-right">附件</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAnnouncements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      無符合條件的公告
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAnnouncements.map((announcement) => (
                    <TableRow key={announcement.id}>
                      <TableCell>
                        {announcement.isPinned && <Pin className="w-4 h-4 text-amber-500 fill-amber-500" />}
                      </TableCell>
                      <TableCell className="font-medium">{announcement.title}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{getCategoryLabel(announcement.category)}</Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(announcement.status)}</TableCell>
                      <TableCell>
                        {announcement.publishDate ? (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="w-4 h-4" />
                            {announcement.publishDate}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">未發布</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2 text-sm text-gray-600">
                          <Eye className="w-4 h-4" />
                          {announcement.views}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2 text-sm text-gray-600">
                          <FileText className="w-4 h-4" />
                          {announcement.attachments}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/announcements/${announcement.id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Link href={`/announcement-management/${announcement.id}/edit`}>
                            <Button variant="ghost" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
