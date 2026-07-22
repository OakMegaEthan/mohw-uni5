"use client"

// 公告清單。舊版把「待公告案件」塞在頁首的鈴鐺 Popover 裡（放不下、無法篩選、
// 數量為 0 時整個入口消失），已改為獨立的待公告工作台，本頁專責管理已建立的公告。

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Download, Eye, FileText, MoreHorizontal, Pin, Plus, Search } from "lucide-react"

import { PageContainer, PageHeader } from "@/components/layout/page-container"
import { AnnouncementModuleTabs } from "@/components/announcement/module-tabs"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getTotalPendingCount, releaseDraftCases } from "@/lib/mock/announcement-cases"
import {
  ANNOUNCEMENT_CATEGORIES,
  ANNOUNCEMENT_STATUS_CONFIG,
  createCorrection,
  deleteDraft,
  getAnnouncementList,
  getCategoryLabel,
  toRocDate,
  unpublishAnnouncement,
  type AnnouncementStatus,
} from "@/lib/mock/announcements"
import { downloadAnnouncementDocument } from "@/lib/announcement-export"

const STATUS_OPTIONS: AnnouncementStatus[] = ["草稿", "已排程", "已發布", "已下架"]

export default function AnnouncementListPage() {
  const router = useRouter()
  const [keyword, setKeyword] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [yearFilter, setYearFilter] = useState("all")
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [tick, forceUpdate] = useState(0)

  const announcements = useMemo(() => getAnnouncementList(), [tick])
  const pendingCount = useMemo(() => getTotalPendingCount(), [tick])
  const yearOptions = useMemo(
    () => [...new Set(announcements.map((a) => a.year))].sort().reverse(),
    [announcements],
  )

  const rows = useMemo(() => {
    return announcements
      .filter((a) => (categoryFilter === "all" ? true : a.category === categoryFilter))
      .filter((a) => (statusFilter === "all" ? true : a.status === statusFilter))
      .filter((a) => (yearFilter === "all" ? true : a.year === yearFilter))
      .filter((a) =>
        keyword.trim() === ""
          ? true
          : `${a.title}${a.docNumber}`.toLowerCase().includes(keyword.trim().toLowerCase()),
      )
      .sort((a, b) => {
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1
        return (b.publishDate ?? b.createdAt).localeCompare(a.publishDate ?? a.createdAt)
      })
  }, [announcements, categoryFilter, statusFilter, yearFilter, keyword])

  const handleCorrect = (id: string) => {
    const correction = createCorrection(id)
    if (!correction) return
    toast.success("已建立更正版本", { description: "原公告保留不動，更正稿發布後才會取代" })
    router.push(`/announcement-management/compose?id=${correction.id}`)
  }

  const handleUnpublish = (id: string) => {
    unpublishAnnouncement(id)
    forceUpdate((n) => n + 1)
    toast.success("公告已下架")
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    releaseDraftCases(deleteTarget)
    deleteDraft(deleteTarget)
    setDeleteTarget(null)
    forceUpdate((n) => n + 1)
    toast.success("草稿已刪除", { description: "其收錄的案件已釋回待公告池" })
  }

  return (
    <PageContainer>
      <PageHeader title="公告管理" description="彙整審查完成的案件、編製公告文稿並對外發布">
        <Button asChild className="gap-2 bg-[#2d3a8c] hover:bg-[#252f73]">
          <Link href="/announcement-management/compose">
            <Plus className="h-4 w-4" />
            新增公告
          </Link>
        </Button>
      </PageHeader>
      <AnnouncementModuleTabs pendingCount={pendingCount} />

      {/* 篩選工具列（舊版把三個篩選塞進 grid-cols-3 又沒給下拉寬度，三欄長短不一） */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="搜尋標題或公文文號"
            className="h-10 w-72 pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="h-10 w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部類別</SelectItem>
            {ANNOUNCEMENT_CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-10 w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部狀態</SelectItem>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={yearFilter} onValueChange={setYearFilter}>
          <SelectTrigger className="h-10 w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部年度</SelectItem>
            {yearOptions.map((y) => (
              <SelectItem key={y} value={y}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="ml-auto text-base text-gray-500">共 {rows.length} 筆</span>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10"></TableHead>
              <TableHead>標題</TableHead>
              <TableHead className="w-32">類別</TableHead>
              <TableHead className="w-28">狀態</TableHead>
              <TableHead className="w-32">發文日期</TableHead>
              <TableHead className="w-56">公文文號</TableHead>
              <TableHead className="w-24 text-right">涵蓋案件</TableHead>
              <TableHead className="w-20 text-right">附件</TableHead>
              <TableHead className="w-40 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="py-16 text-center">
                  <FileText className="mx-auto mb-3 h-10 w-10 text-gray-300" />
                  <p className="text-base text-gray-500">無符合條件的公告</p>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((a) => (
                <TableRow key={a.id} className="h-14">
                  <TableCell>
                    {a.isPinned && <Pin className="h-4 w-4 fill-amber-500 text-amber-500" />}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/announcement-management/${a.id}`}
                      className="text-base font-medium text-gray-900 hover:text-blue-700"
                    >
                      {a.title}
                    </Link>
                    <p className="text-sm text-gray-500">{a.year}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-sm">
                      {getCategoryLabel(a.category)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={`text-sm ${ANNOUNCEMENT_STATUS_CONFIG[a.status].color}`}>
                      {a.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-base text-gray-600">{toRocDate(a.issueDate)}</TableCell>
                  <TableCell className="text-base text-gray-600">
                    {a.docNumber || <span className="text-gray-400">未填</span>}
                  </TableCell>
                  <TableCell className="text-right text-base text-gray-600">
                    {a.cases.length || "—"}
                  </TableCell>
                  <TableCell className="text-right text-base text-gray-600">
                    {a.attachments.length || "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button asChild variant="outline" size="sm" className="gap-1">
                        <Link href={`/announcement-management/${a.id}`}>
                          <Eye className="h-4 w-4" />
                          檢視
                        </Link>
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" aria-label="更多操作">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          {(a.status === "草稿" || a.status === "已排程") && (
                            <DropdownMenuItem asChild>
                              <Link href={`/announcement-management/compose?id=${a.id}`}>
                                編輯內容
                              </Link>
                            </DropdownMenuItem>
                          )}
                          {a.status === "已發布" && (
                            <>
                              <DropdownMenuItem onClick={() => handleCorrect(a.id)}>
                                建立更正公告
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleUnpublish(a.id)}>
                                下架公告
                              </DropdownMenuItem>
                            </>
                          )}
                          <DropdownMenuItem onClick={() => downloadAnnouncementDocument(a)}>
                            <Download className="h-4 w-4" />
                            匯出文稿
                          </DropdownMenuItem>
                          {a.status === "草稿" && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600 focus:text-red-600"
                                onClick={() => setDeleteTarget(a.id)}
                              >
                                刪除草稿
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>刪除公告草稿？</AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              草稿刪除後無法復原，其收錄的案件會釋回待公告池，可重新彙整。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={handleDelete}>
              確認刪除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  )
}
