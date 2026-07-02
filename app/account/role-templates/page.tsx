import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Edit, Trash2, Copy, Shield, ArrowLeft } from "lucide-react"
import Link from "next/link"
import {
  ROLE_TEMPLATES,
  ROLE_TEMPLATE_LEVEL_LABELS,
  ROLE_TEMPLATE_LEVEL_BADGE_CLASS,
} from "@/lib/mock/role-templates"

export default function RoleTemplatesPage() {
  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto px-4 py-8">
        {/* 返回連結 */}
        <Link
          href="/account/users"
          className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          返回使用者管理
        </Link>

        {/* 頁面標題 */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">角色模板管理</h1>
            <p className="text-sm text-muted-foreground mt-1">建立與管理角色權限模板，快速套用至使用者帳號</p>
          </div>
          <Link href="/account/role-templates/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              新增角色模板
            </Button>
          </Link>
        </div>

        {/* 角色模板列表 */}
        <Card>
          <CardHeader>
            <CardTitle>角色模板列表</CardTitle>
            <CardDescription>管理系統中的所有角色權限模板</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>角色名稱</TableHead>
                    <TableHead>說明</TableHead>
                    <TableHead>適用層級</TableHead>
                    <TableHead>最後修改</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ROLE_TEMPLATES.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-primary" />
                          <span className="font-medium">{template.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-md">
                        <p className="text-sm text-muted-foreground line-clamp-2">{template.description}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={ROLE_TEMPLATE_LEVEL_BADGE_CLASS[template.level]}>
                          {ROLE_TEMPLATE_LEVEL_LABELS[template.level]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{template.lastModified}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Link href={`/account/role-templates/${template.id}`}>
                            <Button size="sm" variant="ghost" title="編輯模板">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link href={`/account/role-templates/new?from=${template.id}`}>
                            <Button size="sm" variant="ghost" title="複製模板">
                              <Copy className="h-4 w-4" />
                            </Button>
                          </Link>
                          {!template.isSystem && (
                            <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700" title="刪除">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* 提示資訊 */}
        <Card className="mt-6 bg-yellow-50 border-yellow-200">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-yellow-900">角色模板管理提醒</p>
              <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
                <li>系統預設模板無法刪除，但可以修改權限設定</li>
                <li>修改模板權限不會影響已套用該模板的使用者</li>
                <li>刪除自訂模板前，請確認沒有使用者正在使用</li>
                <li>可以複製現有模板來建立新的角色模板</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
