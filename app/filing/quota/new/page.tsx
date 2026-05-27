"use client"

import { Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { QuotaForm, type QuotaFormValues } from "@/components/filing/quota-form"
import { quotaNotesStore } from "@/lib/stores/quota-notes-store"

export default function NewQuotaPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f5f7fa] p-8 text-center text-muted-foreground">
          載入中...
        </div>
      }
    >
      <NewQuotaPageContent />
    </Suspense>
  )
}

function NewQuotaPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const variant = searchParams.get("variant") || ""

  const backUrl = variant ? `/filing?tab=quota&variant=${variant}` : "/filing?tab=quota"

  const handleSave = (values: QuotaFormValues) => {
    const newId = `new-${Date.now()}`
    if (values.note.trim()) {
      quotaNotesStore.hospitalNotes[newId] = values.note.trim()
    }
    router.push(backUrl)
  }

  return (
    <QuotaForm
      mode="create"
      variant={variant}
      onSave={handleSave}
      onCancel={() => router.push(backUrl)}
    />
  )
}
