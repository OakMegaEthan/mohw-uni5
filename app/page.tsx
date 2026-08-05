import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getCaseDocStatusCounts } from "@/lib/mock/announcement-cases"
import { Users, ClipboardCheck, ArrowRight, Globe, FileEdit, Settings } from "lucide-react"

export default function HomePage() {
  // 兩個公告模組各自的待辦件數（載入時的快照即可；mock 為 module singleton）
  const docCounts = getCaseDocStatusCounts()

  const reviewDescription = [
    "\u5BE9\u67E5\u91AB\u5B78\u6703\u63D0\u4EA4\u7684",
    "\u586B\u5831\u6587\u4EF6\u8207\u5BB9\u984D\u7533\u8ACB",
  ].join("")

  const modules = [
    {
      title: "\u5E33\u865F\u7BA1\u7406",
      description: "\u7BA1\u7406\u4F7F\u7528\u8005\u5E33\u865F\u3001\u6B0A\u9650\u8A2D\u5B9A\u8207\u500B\u4EBA\u8CC7\u6599",
      icon: Users,
      color: "bg-blue-500",
      pages: [
        { name: "\u500B\u4EBA\u8A2D\u5B9A", href: "/account/personal", description: "\u7BA1\u7406\u500B\u4EBA\u8CC7\u6599\u3001\u5BC6\u78BC\u8207\u901A\u77E5\u8A2D\u5B9A" },
        { name: "\u4F7F\u7528\u8005\u7BA1\u7406\u5217\u8868", href: "/account/users", description: "\u6AA2\u8996\u8207\u7BA1\u7406\u7CFB\u7D71\u4F7F\u7528\u8005" },
        { name: "\u89D2\u8272\u6A21\u677F\u7BA1\u7406", href: "/account/role-templates", description: "\u7BA1\u7406\u6B0A\u9650\u89D2\u8272\u6A21\u677F" },
      ],
    },
    {
      title: "填報專區",
      description: "醫學會填報文件與容額分配申請",
      icon: FileEdit,
      color: "bg-amber-500",
      pages: [
        { name: "文件填報", href: "/filing", description: "管理年度文件填報作業" },
        { name: "容額填報", href: "/filing/quota-filing", description: "管理訓練醫院名單與容額分配" },
        { name: "外加容額管理", href: "/filing/additional-quota", description: "登錄、審查外加容額申請並辦理公告" },
        { name: "外加容額成果報告", href: "/filing/outcome-report", description: "醫事司與醫策會審查訓練醫院外加容額成果報告" },
      ],
    },
    {
      title: "審查專區",
      description: reviewDescription,
      icon: ClipboardCheck,
      color: "bg-green-500",
      pages: [
        { name: "文件填報審查", href: "/review/submissions", description: "審查醫學會提交的五份填報文件" },
        { name: "容額填報審查", href: "/review/hospital-quota", description: "審查醫學會提交的訓練醫院容額分配" },
        { name: "容額成果報告審查", href: "/review/outcome-report", description: "確認醫學會上傳之容額成果報告" },
      ],
    },
    {
      title: "管理專區",
      description: "主管機關管理功能與系統設定",
      icon: Settings,
      color: "bg-slate-500",
      pages: [
        { name: "大綱規範管理", href: "/admin/outline-management", description: "管理填報文件的大綱結構與版本" },
        { name: "使用者管理", href: "/account/users", description: "檢視與管理系統使用者" },
        { name: "角色模板管理", href: "/account/role-templates", description: "管理權限角色模板" },
        {
          name: "公告文件製作",
          href: "/announcement-documents",
          description: "為審查通過的案件製作官網公告文件",
          badge: docCounts["待製作"],
        },
        {
          name: "站內公告管理",
          href: "/announcement-management",
          description: "編製並發布站內公告，可引用已製作的公告文件",
          badge: docCounts["已製作"],
        },
      ],
    },
    {
      title: "\u516C\u544A\u6B04",
      description: "\u6AA2\u8996\u7CFB\u7D71\u6700\u65B0\u516C\u544A\u8207\u91CD\u8981\u6D88\u606F",
      icon: Globe,
      color: "bg-purple-500",
      pages: [{ name: "\u516C\u544A\u5217\u8868", href: "/announcements", description: "\u700F\u89BD\u5C08\u79D1\u8A13\u7DF4\u8A8D\u5B9A\u3001\u5916\u52A0\u5BB9\u984D\u8207\u7504\u5BE9\u516C\u544A" }],
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{"\u91AB\u4E8B\u53F8\u4E94\u79D1\u7CFB\u7D71"}</h1>
          <p className="text-gray-600">{"\u9078\u64C7\u529F\u80FD\u6A21\u7D44\u958B\u59CB\u4F7F\u7528"}</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {modules.map((module) => {
            const Icon = module.icon
            return (
              <Card key={module.title} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-10 h-10 ${module.color} rounded-lg flex items-center justify-center`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="text-xl">{module.title}</CardTitle>
                  </div>
                  <CardDescription>{module.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {module.pages.map((page) => (
                      <Link key={page.href} href={page.href}>
                        <div className="group flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200">
                          <div>
                            <div className="flex items-center gap-2 font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                              {page.name}
                              {"badge" in page && Number(page.badge) > 0 && (
                                <Badge className="border-amber-200 bg-amber-100 text-amber-800">
                                  {page.badge}
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-gray-500">{page.description}</div>
                          </div>
                          <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>{"\u63D0\u793A\uFF1A"}</strong>{"\u9019\u662F\u66AB\u6642\u6027\u7684\u5C0E\u89BD\u4ECB\u9762\uFF0C\u6B63\u5F0F\u7248\u672C\u5C07\u7531\u5176\u4ED6\u5718\u968A\u6210\u54E1\u8A2D\u8A08\u5B8C\u6574\u7684\u5C0E\u89BD\u7CFB\u7D71\u3002"}
          </p>
        </div>
      </div>
    </div>
  )
}
