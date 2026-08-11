"use client"

// 新增容額微調。案件在系統內的第一個動作由醫學會發起，故起點是這裡。
//
// **醫學會視角**：使用者只有自己一個科，故此處不選醫學會，只決定年度。
// 要調整的訓練醫院在案件頁加選（範圍限本會容額填報送過的機構）。
//
// **同年度未審結前不得再新增**：基準容額是「原公告疊加已通過的微調」，若允許兩件並行，
// 兩件都以同一基準各自平衡，合併後可能讓某醫院容額變負數。

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ArrowLeft, Info } from "lucide-react"

import { PageContainer, PageHeader } from "@/components/layout/page-container"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  CURRENT_SOCIETY_ID,
  createAdjustment,
  getBaselineHospitals,
  getCurrentSociety,
  hasOpenAdjustment,
  isSelectableHospital,
  nextRound,
} from "@/lib/mock/quota-adjustment"

const YEAR_OPTIONS = ["115 年度", "116 年度"]

export default function NewQuotaAdjustmentPage() {
  const router = useRouter()
  const society = getCurrentSociety()
  const [year, setYear] = useState(YEAR_OPTIONS[0])

  const blocked = useMemo(() => hasOpenAdjustment(CURRENT_SOCIETY_ID, year), [year])
  const hospitalCount = useMemo(
    () => getBaselineHospitals(CURRENT_SOCIETY_ID).filter(isSelectableHospital).length,
    [],
  )

  const handleCreate = () => {
    if (blocked) return
    const created = createAdjustment(CURRENT_SOCIETY_ID, year)
    toast.success("已建立容額微調案件", { description: "請加選要調整的訓練醫院" })
    router.push(`/filing/quota-adjustment/${created.id}`)
  }

  return (
    <PageContainer>
      <Link
        href="/filing/quota-adjustment"
        className="mb-4 inline-flex items-center gap-1 text-base text-blue-600 hover:text-blue-800"
      >
        <ArrowLeft className="h-4 w-4" />
        返回容額微調
      </Link>

      <PageHeader
        title="新增容額微調"
        description={`${society.name}　選擇要微調的年度，建立後於案件頁加選要調整的訓練醫院`}
      />

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle className="text-lg">案件基本資料</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label className="text-base">年度 *</Label>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger className="h-11 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {YEAR_OPTIONS.map((y) => (
                  <SelectItem key={y} value={y}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {blocked ? (
            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-4">
              <Info className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <div className="text-base text-amber-900">
                <p className="font-medium">本會 {year} 已有未審結的微調案件，暫不可新增。</p>
                <p className="mt-1 text-sm">
                  微調的基準容額是「原公告疊加已通過的微調」；若兩件並行，各自平衡但合併後
                  可能讓某醫院容額變成負數，故須待前案審結。
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-base text-gray-700">
              <p>
                將建立：{year}
                <span className="font-medium">第 {nextRound(CURRENT_SOCIETY_ID, year)} 次微調</span>
              </p>
              <p className="mt-1 text-sm text-gray-500">
                可調整的訓練機構共 {hospitalCount} 家（不含聯合申請的合作機構）。
                基準容額為原公告疊加本年度已通過的微調。
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-6 flex max-w-3xl items-center justify-end gap-3">
        <Button variant="outline" asChild>
          <Link href="/filing/quota-adjustment">取消</Link>
        </Button>
        <Button
          onClick={handleCreate}
          disabled={blocked}
          className="bg-[#2d3a8c] hover:bg-[#252f73]"
        >
          建立案件
        </Button>
      </div>
    </PageContainer>
  )
}
