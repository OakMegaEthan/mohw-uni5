"use client"

import { use } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { QuotaForm, type QuotaFormValues, type ApplicationMode } from "@/components/filing/quota-form"
import { quotaNotesStore } from "@/lib/stores/quota-notes-store"
import type { InstitutionEntity } from "@/components/filing/institution-entity-selector"

// Mock 資料（日後替換為 API 呼叫）
const hospitalData: Record<
  string,
  {
    mainEntity: InstitutionEntity
    partnerEntities: InstitutionEntity[]
    prevQuota: string
    isNewApplication: boolean
    quotaLimit: number
    currentQuota: number
    applicationMode: ApplicationMode
  }
> = {
  // 單一機構申請
  "1": {
    mainEntity: {
      id: "entity-1",
      type: "single",
      hospitalCode: "0401180014",
      expiryStartYear: "115",
      expiryEndYear: "115",
    },
    partnerEntities: [],
    prevQuota: "5",
    isNewApplication: false,
    quotaLimit: 15,
    currentQuota: 5,
    applicationMode: "single",
  },
  "2": {
    mainEntity: {
      id: "entity-2",
      type: "single",
      hospitalCode: "0401190015",
      expiryStartYear: "115",
      expiryEndYear: "115",
    },
    partnerEntities: [],
    prevQuota: "3",
    isNewApplication: false,
    quotaLimit: 12,
    currentQuota: 4,
    applicationMode: "single",
  },
  "3": {
    mainEntity: {
      id: "entity-3",
      type: "single",
      hospitalCode: "0401200016",
      expiryStartYear: "113",
      expiryEndYear: "115",
    },
    partnerEntities: [],
    prevQuota: "2",
    isNewApplication: false,
    quotaLimit: 10,
    currentQuota: 3,
    applicationMode: "single",
  },
  "4": {
    mainEntity: {
      id: "entity-4",
      type: "single",
      hospitalCode: "0401280024",
      expiryStartYear: "115",
      expiryEndYear: "115",
    },
    partnerEntities: [],
    prevQuota: "2",
    isNewApplication: false,
    quotaLimit: 8,
    currentQuota: 2,
    applicationMode: "single",
  },
  // 聯合申請（主訓為單一機構）
  "5": {
    mainEntity: {
      id: "entity-5-main",
      type: "single",
      hospitalCode: "0401260022",
      expiryStartYear: "115",
      expiryEndYear: "115",
    },
    partnerEntities: [
      {
        id: "entity-5-p1",
        type: "single",
        hospitalCode: "0401270023",
        expiryStartYear: "115",
        expiryEndYear: "115",
      },
      {
        id: "entity-5-p2",
        type: "single",
        hospitalCode: "0401240020",
        expiryStartYear: "114",
        expiryEndYear: "115",
      },
    ],
    prevQuota: "4",
    isNewApplication: false,
    quotaLimit: 15,
    currentQuota: 5,
    applicationMode: "joint",
  },
  "6": {
    mainEntity: {
      id: "entity-6-main",
      type: "single",
      hospitalCode: "0401300026",
      expiryStartYear: "114",
      expiryEndYear: "116",
    },
    partnerEntities: [
      {
        id: "entity-6-p1",
        type: "single",
        hospitalCode: "0401310027",
        expiryStartYear: "115",
        expiryEndYear: "115",
      },
    ],
    prevQuota: "3",
    isNewApplication: false,
    quotaLimit: 9,
    currentQuota: 4,
    applicationMode: "joint",
  },
  // 單一機構申請（主訓為合併主體）
  "7": {
    mainEntity: {
      id: "entity-7-main",
      type: "merged",
      mergedName: "高雄聯合訓練中心",
      mergedHospitalCodes: ["0401320028", "0401330029"],
      expiryStartYear: "115",
      expiryEndYear: "115",
    },
    partnerEntities: [],
    prevQuota: "6",
    isNewApplication: false,
    quotaLimit: 18,
    currentQuota: 7,
    applicationMode: "single",
  },
  "8": {
    mainEntity: {
      id: "entity-8",
      type: "single",
      hospitalCode: "0401290025",
      expiryStartYear: "115",
      expiryEndYear: "115",
    },
    partnerEntities: [],
    prevQuota: "4",
    isNewApplication: false,
    quotaLimit: 11,
    currentQuota: 4,
    applicationMode: "single",
  },
  "9": {
    mainEntity: {
      id: "entity-9",
      type: "single",
      hospitalCode: "0401340030",
      expiryStartYear: "114",
      expiryEndYear: "115",
    },
    partnerEntities: [],
    prevQuota: "2",
    isNewApplication: false,
    quotaLimit: 7,
    currentQuota: 3,
    applicationMode: "single",
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
  const backUrl = variant ? `/filing/quota-filing?variant=${variant}` : "/filing/quota-filing"

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
        mainEntity: data.mainEntity,
        partnerEntities: data.partnerEntities,
        prevQuota: data.prevQuota,
        isNewApplication: data.isNewApplication,
        quotaLimit: data.quotaLimit.toString(),
        currentQuota: data.currentQuota.toString(),
        note: quotaNotesStore.hospitalNotes[id] ?? "",
      }}
      onSave={handleSave}
      onCancel={() => router.push(backUrl)}
    />
  )
}
