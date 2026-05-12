import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, Save } from "lucide-react"
import Link from "next/link"

export default function NewRoleTemplatePage() {
  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* 返回連結 */}
        <Link
          href="/account/role-templates"
          className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          返回角色模板管理
        </Link>

        {/* 頁面標題 */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">新增角色模板</h1>
            <p className="text-sm text-muted-foreground mt-1">建立新的角色權限模板</p>
          </div>
          <div className="flex gap-2">
            <Link href="/account/role-templates">
              <Button variant="outline">取消</Button>
            </Link>
            <Button>
              <Save className="h-4 w-4 mr-2" />
              儲存模板
            </Button>
          </div>
        </div>

        {/* 基本資訊 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>基本資訊</CardTitle>
            <CardDescription>設定角色模板的名稱與說明</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                角色名稱 <span className="text-red-500">*</span>
              </Label>
              <Input id="name" placeholder="例如：專科醫學會編輯" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">角色說明</Label>
              <Textarea id="description" placeholder="描述此角色的用途與適用對象..." rows={3} />
            </div>
          </CardContent>
        </Card>

        {/* 功能模組權限 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>功能模組權限</CardTitle>
            <CardDescription>設定此角色在各功能模組的操作權限</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 填報專區 */}
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-foreground border-b pb-2">填報專區</h3>
              <p className="text-sm text-muted-foreground -mt-2 mb-2">各類規範的填報功能</p>
              {[
                {
                  id: "submission-general",
                  name: "一般填報申請",
                  description: "包含甄審原則、訓練醫院認定基準、訓練課程基準、評核標準與評核表、容額分配原則",
                },
                { id: "submission-hospital-quota", name: "醫院與容額分配填報" },
                { id: "submission-extra-quota", name: "外加容額填報" },
              ].map((item) => (
                <div key={item.id} className="py-3 border-b last:border-0">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <Label className="text-sm font-medium">{item.name}</Label>
                      {item.description && <p className="text-sm text-muted-foreground mt-0.5">{item.description}</p>}
                    </div>
                  </div>
                  <RadioGroup defaultValue="none" className="flex gap-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="none" id={`${item.id}-none`} />
                      <Label htmlFor={`${item.id}-none`} className="text-sm font-normal cursor-pointer">
                        無權限
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="view" id={`${item.id}-view`} />
                      <Label htmlFor={`${item.id}-view`} className="text-sm font-normal cursor-pointer">
                        可檢視
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="edit" id={`${item.id}-edit`} />
                      <Label htmlFor={`${item.id}-edit`} className="text-sm font-normal cursor-pointer">
                        可編輯
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              ))}
            </div>

            {/* 審查專區 */}
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-foreground border-b pb-2">審查專區</h3>
              <p className="text-sm text-muted-foreground -mt-2 mb-2">各類填報案件的審查與核定功能</p>
              {[
                {
                  id: "review-general",
                  name: "一般填報審查",
                  description: "包含甄審原則、訓練醫院認定基準、訓練課程基準、評核標準、容額分配原則審查",
                },
                { id: "review-hospital-quota", name: "醫院與容額分配審查" },
                { id: "review-extra-quota", name: "外加容額審查" },
              ].map((item) => (
                <div key={item.id} className="py-3 border-b last:border-0">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <Label className="text-sm font-medium">{item.name}</Label>
                      {item.description && <p className="text-sm text-muted-foreground mt-0.5">{item.description}</p>}
                    </div>
                  </div>
                  <RadioGroup defaultValue="none" className="flex gap-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="none" id={`${item.id}-none`} />
                      <Label htmlFor={`${item.id}-none`} className="text-sm font-normal cursor-pointer">
                        無權限
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="view" id={`${item.id}-view`} />
                      <Label htmlFor={`${item.id}-view`} className="text-sm font-normal cursor-pointer">
                        可檢視
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="edit" id={`${item.id}-edit`} />
                      <Label htmlFor={`${item.id}-edit`} className="text-sm font-normal cursor-pointer">
                        可編輯
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              ))}
            </div>

            {/* 統計專區 */}
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-foreground border-b pb-2">統計專區</h3>
              <div className="flex items-center justify-between py-3 border-b">
                <Label className="text-sm font-normal">統計資料檢視</Label>
                <RadioGroup defaultValue="none" className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="none" id="stats-none" />
                    <Label htmlFor="stats-none" className="text-sm font-normal cursor-pointer">
                      無權限
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="view" id="stats-view" />
                    <Label htmlFor="stats-view" className="text-sm font-normal cursor-pointer">
                      可檢視
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="edit" id="stats-edit" />
                    <Label htmlFor="stats-edit" className="text-sm font-normal cursor-pointer">
                      可編輯
                    </Label>
                  </div>
                </RadioGroup>
              </div>
              <div className="pl-4 space-y-3">
                <Label className="text-sm font-medium">匯出格式權限</Label>
                <div className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="export-pdf" />
                    <Label htmlFor="export-pdf" className="text-sm font-normal cursor-pointer">
                      可匯出 PDF
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="export-word" />
                    <Label htmlFor="export-word" className="text-sm font-normal cursor-pointer">
                      可匯出 Word
                    </Label>
                  </div>
                </div>
              </div>
            </div>

            {/* 帳號管理 */}
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-foreground border-b pb-2">帳號管理</h3>
              {[
                { id: "account-personal", name: "個人設定" },
                { id: "account-users", name: "使用者管理" },
                { id: "account-templates", name: "角色模板管理" },
              ].map((item) => (
                <div key={item.id} className="flex items-center justify-between py-3 border-b last:border-0">
                  <Label className="text-sm font-normal">{item.name}</Label>
                  <RadioGroup defaultValue="none" className="flex gap-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="none" id={`${item.id}-none`} />
                      <Label htmlFor={`${item.id}-none`} className="text-sm font-normal cursor-pointer">
                        無權限
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="view" id={`${item.id}-view`} />
                      <Label htmlFor={`${item.id}-view`} className="text-sm font-normal cursor-pointer">
                        可檢視
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="edit" id={`${item.id}-edit`} />
                      <Label htmlFor={`${item.id}-edit`} className="text-sm font-normal cursor-pointer">
                        可編輯
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              ))}
            </div>

            {/* 後台機能 */}
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-foreground border-b pb-2">後台機能</h3>
              {[
                { id: "admin-pending", name: "待發佈管理" },
                { id: "admin-published", name: "已發佈管理" },
              ].map((item) => (
                <div key={item.id} className="flex items-center justify-between py-3 border-b last:border-0">
                  <Label className="text-sm font-normal">{item.name}</Label>
                  <RadioGroup defaultValue="none" className="flex gap-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="none" id={`${item.id}-none`} />
                      <Label htmlFor={`${item.id}-none`} className="text-sm font-normal cursor-pointer">
                        無權限
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="view" id={`${item.id}-view`} />
                      <Label htmlFor={`${item.id}-view`} className="text-sm font-normal cursor-pointer">
                        可檢視
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="edit" id={`${item.id}-edit`} />
                      <Label htmlFor={`${item.id}-edit`} className="text-sm font-normal cursor-pointer">
                        可編輯
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              ))}
            </div>

            {/* 前台機能 */}
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-foreground border-b pb-2">前台機能</h3>
              <div className="flex items-center justify-between py-3">
                <Label className="text-sm font-normal">公告欄檢視</Label>
                <RadioGroup defaultValue="view" className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="none" id="public-none" />
                    <Label htmlFor="public-none" className="text-sm font-normal cursor-pointer">
                      無權限
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="view" id="public-view" />
                    <Label htmlFor="public-view" className="text-sm font-normal cursor-pointer">
                      可檢視
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="edit" id="public-edit" />
                    <Label htmlFor="public-edit" className="text-sm font-normal cursor-pointer">
                      可編輯
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 底部操作按鈕 */}
        <div className="flex justify-end gap-2">
          <Link href="/account/role-templates">
            <Button variant="outline">取消</Button>
          </Link>
          <Button>
            <Save className="h-4 w-4 mr-2" />
            儲存模板
          </Button>
        </div>
      </div>
    </div>
  )
}
