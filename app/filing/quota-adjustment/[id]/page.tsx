"use client"

import { use } from "react"

import { QuotaAdjustmentForm } from "@/components/filing/quota-adjustment-form"

/** 容額微調案件（填寫／檢視）。與新增後導向的目的地相同。 */
export default function QuotaAdjustmentCasePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  return <QuotaAdjustmentForm caseId={id} />
}
