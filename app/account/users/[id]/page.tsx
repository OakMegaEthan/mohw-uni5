import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, User, Shield, History, Save, FileText, AlertCircle } from "lucide-react"
import Link from "next/link"

// 模擬使用者資料
const user = {
  id: "1",
  name: "王小明",
  email: "wang.xiaoming@example.com",
  department: "醫事司五科",
  role: "一般使用者",
  status: "active",
  lastLogin: "2025/10/16 09:30",
}

// 功能模組權限設定 - 基於 RFP 文件的實際功能
const permissionModules = [
  {
    id: "outline",
    name: "自定義大綱格式",
    description: "建立與管理各類規範文件的大綱格式",
    defaultLevel: "view",
    hasExportPermission: false,
  },
  {
    id: "submission",
    name: "填報專區",
    description: "各類規範的填報功能",
    subModules: [
      {
        id: "submission-general",
        name: "一般填報申請",
        description: "包含甄審原則、訓練醫院認定基準、訓練課程基準、評核標準與評核表、容額分配原則",
        defaultLevel: "edit",
      },
      { id: "submission-hospital-quota", name: "醫院與容額分配填報", defaultLevel: "view" },
      { id: "submission-extra-quota", name: "外加容額填報", defaultLevel: "none" },
    ],
    hasExportPermission: false,
  },
  {
    id: "review",
    name: "審查專區",
    description: "各類填報案件的審查與核定功能",
    subModules: [
      {
        id: "review-general",
        name: "一般填報審查",
        description: "包含甄審原則、訓練醫院認定基準、訓練課程基準、評核標準、容額分配原則審查",
        defaultLevel: "none",
      },
      { id: "review-hospital-quota", name: "醫院與容額分配審查", defaultLevel: "none" },
      { id: "review-extra-quota", name: "外加容額審查", defaultLevel: "none" },
    ],
    hasExportPermission: false,
  },
  {
    id: "statistics",
    name: "統計專區",
    description: "統計資料視覺化與匯出功能",
    defaultLevel: "view",
    hasExportPermission: true,
    exportFormats: {
      pdf: true,
      word: false,
    },
  },
  {
    id: "account",
    name: "帳號管理",
    description: "使用者帳號與權限管理功能",
    defaultLevel: "view",
    hasExportPermission: false,
  },
  {
    id: "backend",
    name: "後台機能",
    description: "公告管理與系統通知功能",
    subModules: [
      { id: "backend-announcement", name: "公告管理", defaultLevel: "none" },
      { id: "backend-notification", name: "自動通知設定", defaultLevel: "none" },
    ],
    hasExportPermission: false,
  },
  {
    id: "frontend",
    name: "前台機能",
    description: "公告欄瀏覽功能",
    defaultLevel: "view",
    hasExportPermission: false,
  },
]

// 權限變更歷史
const permissionHistory = [
  {
    date: "2025/10/10 14:30",
    operator: "張大明",
    action: "新增「填報專區 - 甄審原則填報」編輯權限",
  },
  {
    date: "2025/10/10 14:28",
    operator: "張大明",
    action: "變更「統計專區」匯出權限為「僅 PDF」",
  },
  {
    date: "2025/09/15 10:20",
    operator: "李小華",
    action: "變更角色為「一般使用者」",
  },
  {
    date: "2025/08/01 09:00",
    operator: "系統管理員",
    action: "建立帳號",
  },
]

function PermissionLevelSelector({
  moduleId,
  moduleName,
  moduleDescription,
  defaultLevel,
}: {
  moduleId: string
  moduleName: string
  moduleDescription?: string
  defaultLevel: string
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-sm font-medium">{moduleName}</Label>
          {moduleDescription && <p className="text-sm text-muted-foreground mt-0.5">{moduleDescription}</p>}
        </div>
      </div>
      <RadioGroup defaultValue={defaultLevel} className="grid grid-cols-3 gap-3">
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="none" id={`${moduleId}-none`} />
          <Label htmlFor={`${moduleId}-none`} className="text-sm font-normal cursor-pointer">
            無權限
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="view" id={`${moduleId}-view`} />
          <Label htmlFor={`${moduleId}-view`} className="text-sm font-normal cursor-pointer">
            可檢視
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="edit" id={`${moduleId}-edit`} />
          <Label htmlFor={`${moduleId}-edit`} className="text-sm font-normal cursor-pointer">
            可編輯
          </Label>
        </div>
      </RadioGroup>
    </div>
  )
}

function ExportPermissionSelector({
  moduleId,
  defaultFormats,
}: {
  moduleId: string
  defaultFormats: { pdf: boolean; word: boolean }
}) {
  return (
    <div className="mt-4 p-4 bg-muted/50 rounded-lg space-y-3">
      <Label className="text-sm font-medium flex items-center gap-2">
        <FileText className="h-4 w-4 text-primary" />
        匯出格式權限
      </Label>
      <div className="space-y-2 pl-6">
        <div className="flex items-center space-x-2">
          <Checkbox id={`${moduleId}-export-pdf`} defaultChecked={defaultFormats.pdf} />
          <Label htmlFor={`${moduleId}-export-pdf`} className="text-sm font-normal cursor-pointer">
            可匯出 PDF 檔案
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox id={`${moduleId}-export-word`} defaultChecked={defaultFormats.word} />
          <Label htmlFor={`${moduleId}-export-word`} className="text-sm font-normal cursor-pointer">
            可匯出 Word 檔案
          </Label>
        </div>
      </div>
      <p className="text-sm text-muted-foreground pl-6">根據權限設定，使用者可匯出不同格式的統計報表與文件</p>
    </div>
  )
}

export default function UserPermissionPage({ params }: { params: { id: string } }) {
  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto px-4 py-8">
        {/* 返回按鈕 */}
        <Link
          href="/account/users"
          className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          返回使用者列表
        </Link>

        {/* 頁面標題 */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">使用者權限設定</h1>
          <p className="text-sm text-muted-foreground mt-1">設定使用者在系統各功能模組的存取權限與操作範圍</p>
        </div>

        {/* 使用者基本資訊 */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              <CardTitle>使用者資訊</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">姓名</p>
                <p className="font-medium">{user.name}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">帳號</p>
                <p className="font-medium">{user.email}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">所屬單位</p>
                <p className="font-medium">{user.department}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">帳號狀態</p>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  啟用中
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 快速套用角色模板 */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                  <Shield className="h-5 w-5 text-blue-600" />
                </div>
              </div>
              <div className="flex-1 space-y-3">
                <div>
                  <p className="text-sm font-medium text-blue-900">快速套用角色模板</p>
                  <p className="text-sm text-blue-700 mt-1">選擇預設角色模板，系統將自動配置對應的權限設定</p>
                </div>
                <div className="flex items-center gap-3">
                  <Select defaultValue={user.role}>
                    <SelectTrigger className="w-[200px] bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="一般使用者">一般使用者</SelectItem>
                      <SelectItem value="專科醫學會編輯">專科醫學會編輯</SelectItem>
                      <SelectItem value="醫策會審查委員">醫策會審查委員</SelectItem>
                      <SelectItem value="醫事司承辦">醫事司承辦</SelectItem>
                      <SelectItem value="系統管理員">系統管理員</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button size="sm" variant="outline" className="bg-white">
                    套用模板
                  </Button>
                  <Button size="sm" variant="ghost" asChild>
                    <Link href="/account/role-templates">管理模板</Link>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 功能模組權限設定 */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <CardTitle>功能模組權限</CardTitle>
            </div>
            <CardDescription>設定使用者在各功能模組的操作權限層級與特殊權限</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 權限層級說明 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-2 text-sm">
                  <p className="font-medium text-blue-900">權限層級說明</p>
                  <ul className="text-blue-700 space-y-1 text-sm">
                    <li>
                      <span className="font-medium">無權限</span>：無法存取此功能
                    </li>
                    <li>
                      <span className="font-medium">可檢視</span>：僅能瀏覽內容，無法進行任何編輯
                    </li>
                    <li>
                      <span className="font-medium">可編輯</span>
                      ：可建立、編輯內容，但無法進行審查或核准（審查功能在「審查專區」獨立管理）
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {permissionModules.map((module, index) => (
              <div key={module.id}>
                {index > 0 && <Separator className="my-6" />}
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-foreground">{module.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{module.description}</p>
                  </div>

                  {/* 如果有子模組，顯示子模組的權限設定 */}
                  {module.subModules ? (
                    <div className="space-y-4 pl-4 border-l-2 border-muted">
                      {module.subModules.map((subModule) => (
                        <PermissionLevelSelector
                          key={subModule.id}
                          moduleId={subModule.id}
                          moduleName={subModule.name}
                          moduleDescription={subModule.description}
                          defaultLevel={subModule.defaultLevel}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="pl-4">
                      <PermissionLevelSelector
                        moduleId={module.id}
                        moduleName="基本權限"
                        defaultLevel={module.defaultLevel || "none"}
                      />
                    </div>
                  )}

                  {/* 如果有匯出權限，顯示匯出格式選擇 */}
                  {module.hasExportPermission && module.exportFormats && (
                    <div className="pl-4">
                      <ExportPermissionSelector moduleId={module.id} defaultFormats={module.exportFormats} />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* 權限變更歷史 */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">權限變更歷史</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {permissionHistory.map((record, index) => (
              <div key={index} className="space-y-1 pb-4 border-b last:border-0 last:pb-0">
                <p className="text-sm font-medium">{record.action}</p>
                <p className="text-sm text-muted-foreground">
                  {record.date} 由 {record.operator}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* 儲存按鈕 */}
        <div className="flex justify-end gap-3">
          <Button variant="outline" asChild>
            <Link href="/account/users">取消</Link>
          </Button>
          <Button>
            <Save className="h-4 w-4 mr-2" />
            儲存變更
          </Button>
        </div>
      </div>
    </div>
  )
}
