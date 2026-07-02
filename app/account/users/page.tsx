"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Filter, UserPlus, Edit, ShieldCheck, ChevronRight } from "lucide-react"
import Link from "next/link"
import { AddUserDialog } from "@/components/account/add-user-dialog"
import { USERS, USER_LEVEL_BADGE_CLASS, getSortedUsers } from "@/lib/mock/users"

export default function UsersManagementPage() {
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false)

  // 預設排序：醫事司 -> 醫策會 -> 醫學會，同層級維持原始順序
  const sortedUsers = getSortedUsers()

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
                <CardDescription>共 {USERS.length} 位使用者</CardDescription>
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
                        <Badge variant="outline" className={USER_LEVEL_BADGE_CLASS[user.level]}>{user.level}</Badge>
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
                        <Button variant="ghost" size="sm" asChild title="編輯權限">
                          <Link href={`/account/users/${user.id}`} className="flex items-center">
                            <Edit className="h-4 w-4 mr-2" />
                            編輯權限
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* 分頁 */}
            <div className="flex items-center justify-between mt-4">
              <p className="text-base text-muted-foreground">
                顯示 1-{USERS.length} 筆，共 {USERS.length} 筆
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
