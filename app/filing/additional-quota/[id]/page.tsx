"use client"

import { use } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { AdditionalQuotaForm } from "@/components/filing/additional-quota-form"
import { getAdditionalQuotaApplication } from "@/lib/mock/additional-quota"

/**
 * 外加容額申請詳情。單頁工作流：依階段（待審查／待公告／已公告）決定可編輯範圍，
 * 由 AdditionalQuotaForm 自行切換。
 */
export default function AdditionalQuotaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const application = getAdditionalQuotaApplication(id)

  if (!application) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <Link
            href="/filing/additional-quota"
            className="mb-4 inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft className="h-4 w-4" />
            返回外加容額申請
          </Link>
          <div className="rounded-lg border border-dashed border-gray-300 bg-white p-12 text-center">
            <p className="text-gray-500">找不到編號 {id} 的申請案件</p>
            <Button variant="outline" asChild className="mt-4">
              <Link href="/filing/additional-quota">返回列表</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return <AdditionalQuotaForm application={application} />
}
