"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ReviewSimpleNav } from "@/components/review/simple-nav"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { ArrowLeft, FileText, Download, AlertCircle } from "lucide-react"
import Link from "next/link"
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

// Mock data
const mockApplication = {
  id: "1",
  hospitalName: "台大醫院",
  year: "115 年度",
  submittedDate: "2025-01-15",
  status: "待公告" as const,
  requestReason: "因應本院急診醫學科業務擴展，急需增加住院醫師訓練名額以滿足臨床服務需求。",
  requestedQuota: 5,
  requestDescription:
    "本院急診醫學科近年來業務量持續成長，每日急診就診人次已達 300 人次以上。為維持醫療服務品質，並提供住院醫師完整的訓練環境，擬申請外加容額 5 名。本科現有主治醫師 15 名，具備充足的師資與教學資源，能夠提供完整的訓練計畫。",
  attachments: [
    { id: "1", name: "急診科業務量統計報告.pdf", size: "2.3 MB" },
    { id: "2", name: "師資名單與資格證明.pdf", size: "1.8 MB" },
    { id: "3", name: "訓練計畫書.pdf", size: "3.5 MB" },
  ],
  currentYearQuota: {
    approved: 15,
    limit: 25,
    validFrom: "2024-08-01",
    validTo: "2025-07-31",
    specialty: "急診醫學科",
  },
  previousPeriod: {
    year: "114 年度",
    quota: 3,
    requestReason: "因應急診科夜間業務量增加，申請外加容額以確保值班人力充足。",
    requestDescription:
      "本院急診科 114 年度夜間急診量較前一年成長 25%，為維持醫療品質與住院醫師訓練品質，申請外加容額 3 名。",
    attachments: [
      { id: "p1", name: "114年度業務統計.pdf", size: "1.9 MB" },
      { id: "p2", name: "114年度訓練計畫.pdf", size: "2.1 MB" },
    ],
    report: {
      name: "114年度外加容額成果報告書.pdf",
      size: "4.2 MB",
    },
    reviewComment:
      "該院於 114 年度外加容額執行成效良好，住院醫師訓練計畫完整，教學品質優良。建議持續加強臨床技能訓練與研究能力培養。",
  },
}

export default function AdditionalQuotaReviewDetailPage({ params }: { params: { hospitalId: string } }) {
  const router = useRouter()
  const [reviewComment, setReviewComment] = useState("")
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [showLeaveDialog, setShowLeaveDialog] = useState(false)
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null)

  useEffect(() => {
    if (reviewComment.trim() !== "" || uploadedFiles.length > 0) {
      setHasUnsavedChanges(true)
    } else {
      setHasUnsavedChanges(false)
    }
  }, [reviewComment, uploadedFiles])

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = ""
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [hasUnsavedChanges])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!hasUnsavedChanges) return

      const target = e.target as HTMLElement
      const link = target.closest("a")

      if (link && link.href && !link.href.includes(params.hospitalId)) {
        e.preventDefault()
        e.stopPropagation()
        setPendingNavigation(link.href)
        setShowLeaveDialog(true)
      }
    }

    document.addEventListener("click", handleClick, true)
    return () => document.removeEventListener("click", handleClick, true)
  }, [hasUnsavedChanges, params.hospitalId])

  const handleApprove = () => {
    setHasUnsavedChanges(false)
    toast.success("審查通過")
    setTimeout(() => {
      router.push("/review/additional-quota")
    }, 0)
  }

  const handleReject = () => {
    if (!reviewComment.trim()) {
      toast.error("請填寫審查意見")
      return
    }
    setHasUnsavedChanges(false)
    toast.warning("不通過結案")
    setTimeout(() => {
      router.push("/review/additional-quota")
    }, 0)
  }

  const handleReturnForRevision = () => {
    if (!reviewComment.trim()) {
      toast.error("請填寫退回原因")
      return
    }
    setHasUnsavedChanges(false)
    toast.info("已退回補件")
    setTimeout(() => {
      router.push("/review/additional-quota")
    }, 0)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setUploadedFiles(Array.from(e.target.files))
    }
  }

  const totalAfterApproval = mockApplication.currentYearQuota.approved + mockApplication.requestedQuota
  const exceedsLimit = totalAfterApproval > mockApplication.currentYearQuota.limit

  const handleConfirmLeave = () => {
    setHasUnsavedChanges(false)
    setShowLeaveDialog(false)
    if (pendingNavigation) {
      setTimeout(() => {
        window.location.href = pendingNavigation
      }, 0)
    }
  }

  const handleCancelLeave = () => {
    setShowLeaveDialog(false)
    setPendingNavigation(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ReviewSimpleNav />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild className="mb-4">
            <Link href="/review/additional-quota" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              返回列表
            </Link>
          </Button>

          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">{mockApplication.hospitalName}</h1>
                <Badge variant="outline">{mockApplication.year}</Badge>
                <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">待公告</Badge>
              </div>
              <p className="text-sm text-gray-500">送件日期：{mockApplication.submittedDate}</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* 本年度容額資訊 */}
          <Card className="border-blue-200 bg-blue-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>本年度容額資訊</span>
                <Badge variant="outline" className="bg-white">
                  {mockApplication.currentYearQuota.specialty}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <Label className="text-sm font-medium text-gray-500">已核定容額</Label>
                  <p className="mt-1 text-2xl font-bold text-gray-900">
                    {mockApplication.currentYearQuota.approved} 名
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <Label className="text-sm font-medium text-gray-500">容額上限</Label>
                  <p className="mt-1 text-2xl font-bold text-gray-900">{mockApplication.currentYearQuota.limit} 名</p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <Label className="text-sm font-medium text-gray-500">本次申請數</Label>
                  <p className="mt-1 text-2xl font-bold text-blue-600">+{mockApplication.requestedQuota} 名</p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <Label className="text-sm font-medium text-gray-500">核定後總容額</Label>
                  <p className={`mt-1 text-2xl font-bold ${exceedsLimit ? "text-red-600" : "text-green-600"}`}>
                    {totalAfterApproval} 名
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">容額效期</Label>
                    <p className="mt-1 text-sm text-gray-900">
                      {mockApplication.currentYearQuota.validFrom} ~ {mockApplication.currentYearQuota.validTo}
                    </p>
                  </div>
                  {exceedsLimit && (
                    <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <p className="text-sm font-medium">核定後將超過容額上限</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 本次申請內容 */}
          <Card>
            <CardHeader>
              <CardTitle>本次申請內容</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">申請緣由</Label>
                <p className="mt-1 text-sm text-gray-900">{mockApplication.requestReason}</p>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">申請容額數</Label>
                <p className="mt-1 text-lg font-semibold text-blue-600">{mockApplication.requestedQuota} 名</p>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">申請說明</Label>
                <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{mockApplication.requestDescription}</p>
              </div>

              {/* 申請上傳文件 */}
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">申請上傳文件</Label>
                <div className="space-y-2">
                  {mockApplication.attachments.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{file.name}</p>
                          <p className="text-sm text-gray-500">{file.size}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 前一期間資訊 */}
          <Card>
            <CardHeader>
              <CardTitle>前一期間資訊（{mockApplication.previousPeriod.year}）</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">核定容額</Label>
                <p className="mt-1 text-lg font-semibold text-gray-900">{mockApplication.previousPeriod.quota} 名</p>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">前次申請緣由</Label>
                <p className="mt-1 text-sm text-gray-900">{mockApplication.previousPeriod.requestReason}</p>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">前次申請說明</Label>
                <p className="mt-1 text-sm text-gray-900">{mockApplication.previousPeriod.requestDescription}</p>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">前次申請文件</Label>
                <div className="space-y-2">
                  {mockApplication.previousPeriod.attachments.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{file.name}</p>
                          <p className="text-sm text-gray-500">{file.size}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">成果報告書</Label>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{mockApplication.previousPeriod.report.name}</p>
                      <p className="text-sm text-gray-500">{mockApplication.previousPeriod.report.size}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <Label className="text-sm font-medium text-gray-700">前次審查評論</Label>
                <p className="mt-1 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                  {mockApplication.previousPeriod.reviewComment}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 審核操作 */}
          <Card>
            <CardHeader>
              <CardTitle>審核操作</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="reviewComment">審查紀錄 *</Label>
                <Textarea
                  id="reviewComment"
                  placeholder="請輸入審查紀錄..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  rows={4}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="fileUpload">上傳文件</Label>
                <div className="mt-2">
                  <input id="fileUpload" type="file" multiple onChange={handleFileUpload} className="hidden" />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById("fileUpload")?.click()}
                    className="w-full"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    選擇檔案上傳
                  </Button>
                  {uploadedFiles.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {uploadedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                          <span className="text-sm text-gray-700">{file.name}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setUploadedFiles((files) => files.filter((_, i) => i !== index))}
                          >
                            移除
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={handleReturnForRevision}>
                  退回補件
                </Button>
                <Button variant="destructive" onClick={handleReject}>
                  不通過結案
                </Button>
                <Button onClick={handleApprove} className="bg-green-600 hover:bg-green-700">
                  通過
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確定要離開此頁面嗎？</AlertDialogTitle>
            <AlertDialogDescription>
              您有尚未儲存的審查記錄或上傳的文件。如果現在離開，這些內容將會遺失。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelLeave}>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmLeave} className="bg-red-600 hover:bg-red-700">
              確定離開
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
