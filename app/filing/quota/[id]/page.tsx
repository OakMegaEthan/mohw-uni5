"use client"

import { use } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { QuotaForm, type QuotaFormValues, type ApplicationMode } from "@/components/filing/quota-form"
import { quotaNotesStore } from "@/lib/stores/quota-notes-store"

// Mock 資料（日後替換為 API 呼叫）
const hospitalData: Record<
  string,
  {
    mainHospitalCodes: string[]
    expiry: string
    extensionYears: string
    prevQuota: number
    quotaLimit: number
    currentQuota: number
    applicationMode: ApplicationMode
    partnerHospitals: string[]
  }
> = {
  "1": {
    mainHospitalCodes: ["0401180014"],
    expiry: "115/7/31",
    extensionYears: "4",
    prevQuota: 5,
    quotaLimit: 15,
    currentQuota: 5,
    applicationMode: "single",
    partnerHospitals: [],
  },
  "2": {
    mainHospitalCodes: ["0401190015"],
    expiry: "115/7/31",
    extensionYears: "0",
    prevQuota: 3,
    quotaLimit: 12,
    currentQuota: 4,
    applicationMode: "single",
    partnerHospitals: [],
  },
  "3": {
    mainHospitalCodes: ["0401200016"],
    expiry: "113/7/31",
    extensionYears: "4",
    prevQuota: 2,
    quotaLimit: 10,
    currentQuota: 3,
    applicationMode: "single",
    partnerHospitals: [],
  },
  "4": {
    mainHospitalCodes: ["0401280024"],
    expiry: "115/7/31",
    extensionYears: "4",
    prevQuota: 2,
    quotaLimit: 8,
    currentQuota: 2,
    applicationMode: "single",
    partnerHospitals: [],
  },
  "5": {
    mainHospitalCodes: ["0401260022"],
    expiry: "115/7/31",
    extensionYears: "4",
    prevQuota: 4,
    quotaLimit: 15,
    currentQuota: 5,
    applicationMode: "joint",
    partnerHospitals: ["0401270023", "0401240020"],
  },
  "6": {
    mainHospitalCodes: ["0401300026"],
    expiry: "114/7/31",
    extensionYears: "2",
    prevQuota: 3,
    quotaLimit: 9,
    currentQuota: 4,
    applicationMode: "joint",
    partnerHospitals: ["0401310027"],
  },
  "7": {
    mainHospitalCodes: ["0401320028", "0401330029"],
    expiry: "115/7/31",
    extensionYears: "4",
    prevQuota: 6,
    quotaLimit: 18,
    currentQuota: 7,
    applicationMode: "merged",
    partnerHospitals: [],
  },
}

export default function QuotaEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f5f7fa] p-8 text-center text-muted-foreground">
          載入中...
        </div>
      }
    >
      <QuotaEditPageContent params={params} />
    </Suspense>
  )
}

function QuotaEditPageContent({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const searchParams = useSearchParams()
  const variant = searchParams.get("variant") || ""

  const data = hospitalData[id] ?? hospitalData["1"]
  const backUrl = variant ? `/filing?tab=quota&variant=${variant}` : "/filing?tab=quota"

  const handleSave = (values: QuotaFormValues) => {
    if (values.note.trim()) {
      quotaNotesStore.hospitalNotes[id] = values.note.trim()
    } else {
      delete quotaNotesStore.hospitalNotes[id]
    }
    router.push(backUrl)
  }

  return (
    <QuotaForm
      mode="edit"
      variant={variant}
      initialValues={{
        applicationMode: data.applicationMode,
        mainHospitalCodes: data.mainHospitalCodes,
        partnerHospitalCodes: data.partnerHospitals,
        extensionYears: data.extensionYears,
        quotaLimit: data.quotaLimit.toString(),
        currentQuota: data.currentQuota.toString(),
        note: quotaNotesStore.hospitalNotes[id] ?? "",
      }}
      expiry={data.expiry}
      prevQuota={data.prevQuota}
      onSave={handleSave}
      onCancel={() => router.push(backUrl)}
    />
  )
}
