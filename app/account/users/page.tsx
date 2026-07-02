"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Filter, UserPlus, Edit, Power, MoreHorizontal, ShieldCheck, ChevronRight, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AddUserDialog } from "@/components/account/add-user-dialog"

// 層級對應的顏色
const levelColors: Record<string, string> = {
  "醫事司": "bg-purple-50 text-purple-700 border-purple-200",
  "醫策會": "bg-blue-50 text-blue-700 border-blue-200",
  "醫學會": "bg-amber-50 text-amber-700 border-amber-200",
}

// 層級預設排序順序：醫事司 -> 醫策會 -> 醫學會
const LEVEL_SORT_ORDER: Record<string, number> = {
  "醫事司": 0,
  "醫策會": 1,
  "醫學會": 2,
}

// 模擬使用者資料
const users = [
  {
    id: "1",
    name: "王小明",
    email: "wang.xiaoming@mohw.gov.tw",
    level: "醫事司",
    organization: "衛生福利部醫事司",
    status: "active",
    lastLogin: "2026/04/22 09:30",
  },
  {
    id: "2",
    name: "李小華",
    email: "li.xiaohua@tjcha.org.tw",
    level: "醫策會",
    organization: "財團法人醫院評鑑暨醫療品質策進會",
    status: "active",
    lastLogin: "2026/04/21 14:20",
  },
  {
    id: "3",
    name: "張大明",
    email: "zhang.daming@ima.org.tw",
    level: "醫學會",
    organization: "中華民國內科醫學會",
    status: "active",
    lastLogin: "2026/04/22 08:15",
  },
  {
    id: "5",
    name: "林志明",
    email: "lin.zhiming@surgery.org.tw",
    level: "醫學會",
    organization: "台灣外科醫學會",
    status: "active",
    lastLogin: "2026/04/20 11:30",
  },
  {
    id: "7",
    name: "吳淑芬",
    email: "wu.shufen@tjcha.org.tw",
    level: "醫策會",
    organization: "財團法人醫院評鑑暨醫療品質策進會",
    status: "inactive",
    lastLogin: "2026/03/28 16:45",
  },
]

export default function UsersManagementPage() {
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false)

  // 預設排序：醫事司 -> 醫策會 -> 醫學會，同層級維持原始順序
  const sortedUsers = [...users].sort(
    (a, b) => (LEVEL_SORT_ORDER[a.level] ?? 99) - (LEVEL_SORT_ORDER[b.level] ?? 99),
  )

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* 頁面標題 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">使用者管理</h1>
            <p className="text-base text-muted-foreground mt-1">管理系統使用者帳號與權限設定</p>
          </div>
          <Link href="/account/role-templates">
            <Button variant="outline" className="gap-2">
              <ShieldCheck className="h-4 w-4" />
              角色模板管理
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>使用者列表</CardTitle>
                <CardDescription>共 {users.length} 位使用者</CardDescription>
              </div>
              <Button onClick={() => setAddUserDialogOpen(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                新增使用者
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* 搜尋與篩選 */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="搜尋姓名或帳號..." className="pl-9" />
              </div>
              <Select defaultValue="all">
                <SelectTrigger className="w-full md:w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="層級篩選" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部層級</SelectItem>
                  <SelectItem value="mohw">醫事司</SelectItem>
                  <SelectItem value="tjcha">醫策會</SelectItem>
                  <SelectItem value="society">醫學會</SelectItem>
                </SelectContent>
              </Select>
              <Select defaultValue="all">
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="狀態篩選" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部狀態</SelectItem>
                  <SelectItem value="active">啟用中</SelectItem>
                  <SelectItem value="inactive">已停用</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 使用者表格 */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>姓名</TableHead>
                    <TableHead>帳號</TableHead>
                    <TableHead>層級</TableHead>
                    <TableHead>所屬單位</TableHead>
                    <TableHead>狀態</TableHead>
                    <TableHead>最後登入</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell className="text-muted-foreground">{user.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={levelColors[user.level]}>{user.level}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground max-w-[200px] truncate">{user.organization}</TableCell>
                      <TableCell>
                        {user.status === "active" ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            啟用中
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                            已停用
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{user.lastLogin}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/account/users/${user.id}`} className="flex items-center">
                                <Edit className="h-4 w-4 mr-2" />
                                編輯權限
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Power className="h-4 w-4 mr-2" />
                              {user.status === "active" ? "停用帳號" : "啟用帳號"}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* 分頁 */}
            <div className="flex items-center justify-between mt-4">
              <p className="text-base text-muted-foreground">
                顯示 1-{users.length} 筆，共 {users.length} 筆
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled>
                  上一頁
                </Button>
                <Button variant="outline" size="sm" disabled>
                  下一頁
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <AddUserDialog open={addUserDialogOpen} onOpenChange={setAddUserDialogOpen} />
    </div>
  )
}
