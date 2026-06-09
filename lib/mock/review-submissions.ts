import { allSocieties } from "@/lib/data/societies"

export const documentTypes = [
  { id: "hospital-accreditation", name: "專科醫師訓練計畫認定基準", shortName: "計畫認定基準" },
  { id: "training-curriculum", name: "訓練課程基準", shortName: "訓練課程基準" },
  { id: "evaluation-standards", name: "評核標準與評核表", shortName: "評核標準" },
  { id: "quota-allocation", name: "留存容額分配原則", shortName: "容額分配原則" },
  { id: "improvement-guide", name: "精進指南", shortName: "精進指南" },
  { id: "screening-principle", name: "甄審原則", shortName: "甄審原則" },
]

export const stagesByDocumentType: Record<string, Array<{ value: string; label: string }>> = {
  "screening-principle": [
    { value: "pending-review", label: "待審查" },
    { value: "pending-announcement", label: "待公告" },
    { value: "announced", label: "已公告" },
  ],
  "hospital-accreditation": [
    { value: "pending-review", label: "待審查" },
    { value: "group-meeting", label: "分組會議審查" },
    { value: "rrc-meeting", label: "RRC 大會審核" },
    { value: "pending-announcement", label: "待公告" },
    { value: "announced", label: "已公告" },
  ],
  "training-curriculum": [
    { value: "pending-review", label: "待審查" },
    { value: "group-meeting", label: "分組會議審查" },
    { value: "rrc-meeting", label: "RRC 大會審核" },
    { value: "pending-announcement", label: "待公告" },
    { value: "announced", label: "已公告" },
  ],
  "evaluation-standards": [
    { value: "pending-review", label: "待審查" },
    { value: "group-meeting", label: "分組會議審查" },
    { value: "rrc-meeting", label: "RRC 大會審核" },
    { value: "pending-announcement", label: "待公告" },
    { value: "announced", label: "已公告" },
  ],
  "quota-allocation": [
    { value: "pending-review", label: "待審查" },
    { value: "group-meeting", label: "分組會議審查" },
    { value: "rrc-meeting", label: "RRC 大會審核" },
    { value: "pending-announcement", label: "待公告" },
    { value: "announced", label: "已公告" },
  ],
  "improvement-guide": [
    { value: "pending-review", label: "待審查" },
    { value: "pending-announcement", label: "待公告" },
    { value: "announced", label: "已公告" },
  ],
}

export type Submission = {
  societyId: string
  stage: string
  uploaded: boolean
  uploadedDate: string | null
  lastUpdated: string | null
  reviewResult: "pending" | "approved" | "needs-revision"
}

// 為每個文件類型生成跨階段共存的 mock 資料
// 每筆案件有各自的 stage，反映真實情況下進度不一的狀態
const generateMockSubmissionsForDocType = (
  documentTypeId: string,
  stageDistribution: Array<{ stage: string; portion: number }>
): Submission[] => {
  const total = allSocieties.length
  let stageIndex = 0
  let countInCurrentStage = 0

  // 計算每個階段的數量
  const stageCounts = stageDistribution.map((d) => ({
    stage: d.stage,
    count: Math.round(total * d.portion),
  }))
  // 修正捨入誤差，確保總數一致
  const countSum = stageCounts.reduce((acc, s) => acc + s.count, 0)
  if (countSum < total) stageCounts[stageCounts.length - 1].count += total - countSum

  return allSocieties.map((society, index) => {
    // 決定這筆案件所在的階段
    while (
      stageIndex < stageCounts.length - 1 &&
      countInCurrentStage >= stageCounts[stageIndex].count
    ) {
      stageIndex++
      countInCurrentStage = 0
    }
    const stage = stageCounts[stageIndex].stage
    countInCurrentStage++

    // 未上傳的案件（每 8 筆中有 1 筆，且只在早期階段才未上傳）
    const isEarlyStage = stageIndex === 0
    const notUploaded = isEarlyStage && index % 8 === 0

    if (notUploaded) {
      return {
        societyId: society.id,
        stage,
        uploaded: false,
        uploadedDate: null,
        lastUpdated: null,
        reviewResult: "pending" as const,
      }
    }

    // 已上傳的案件，根據 index 分配不同審查結果
    let reviewResult: "pending" | "approved" | "needs-revision" = "pending"
    if (index % 4 === 1) reviewResult = "approved"
    else if (index % 4 === 2) reviewResult = "needs-revision"

    return {
      societyId: society.id,
      stage,
      uploaded: true,
      uploadedDate: `2025-01-${String(5 + (index % 20)).padStart(2, "0")}`,
      lastUpdated: `2025-01-${String(10 + (index % 15)).padStart(2, "0")}`,
      reviewResult,
    }
  })
}

// 每個文件類型設定不同的跨階段分布，展示真實的跨階段共存情境
export const mockDocumentSubmissions: Record<string, Submission[]> = {
  // 計畫認定基準：大部分在分組會議，少數在待審查與 RRC
  "hospital-accreditation": generateMockSubmissionsForDocType("hospital-accreditation", [
    { stage: "pending-review", portion: 0.15 },
    { stage: "group-meeting", portion: 0.55 },
    { stage: "rrc-meeting", portion: 0.20 },
    { stage: "pending-announcement", portion: 0.10 },
  ]),
  // 訓練課程基準：大部分在 RRC，少數在分組與待公告
  "training-curriculum": generateMockSubmissionsForDocType("training-curriculum", [
    { stage: "group-meeting", portion: 0.20 },
    { stage: "rrc-meeting", portion: 0.60 },
    { stage: "pending-announcement", portion: 0.20 },
  ]),
  // 評核標準：跨三個中間階段
  "evaluation-standards": generateMockSubmissionsForDocType("evaluation-standards", [
    { stage: "pending-review", portion: 0.25 },
    { stage: "group-meeting", portion: 0.40 },
    { stage: "rrc-meeting", portion: 0.35 },
  ]),
  // 容額分配原則：主要在待審查
  "quota-allocation": generateMockSubmissionsForDocType("quota-allocation", [
    { stage: "pending-review", portion: 0.70 },
    { stage: "group-meeting", portion: 0.30 },
  ]),
  // 精進指南：多數已到待公告
  "improvement-guide": generateMockSubmissionsForDocType("improvement-guide", [
    { stage: "pending-review", portion: 0.20 },
    { stage: "pending-announcement", portion: 0.80 },
  ]),
  // 甄審原則：全部在待審查（剛開始）
  "screening-principle": generateMockSubmissionsForDocType("screening-principle", [
    { stage: "pending-review", portion: 1.0 },
  ]),
}

export const stageColors: Record<string, string> = {
  "pending-review": "bg-blue-100 text-blue-800 border-blue-200",
  "group-meeting": "bg-purple-100 text-purple-800 border-purple-200",
  "rrc-meeting": "bg-pink-100 text-pink-800 border-pink-200",
  "pending-announcement": "bg-amber-100 text-amber-800 border-amber-200",
  "announced": "bg-green-100 text-green-800 border-green-200",
}

// ── 查詢函式 ──────────────────────────────────────────────

export function getDocumentTypes() {
  return documentTypes
}

export function getStagesForDocumentType(documentTypeId: string) {
  return stagesByDocumentType[documentTypeId] ?? []
}

export function getDocumentSubmissions(documentTypeId: string): Submission[] {
  return mockDocumentSubmissions[documentTypeId] ?? []
}

export function getSocieties() {
  return allSocieties.map((s) => ({ id: s.id, name: s.name }))
}

export function getStageColors() {
  return stageColors
}

/** 取得各階段的案件數量統計（只列出有案件的階段） */
export function getSubmissionCountsByStage(documentTypeId: string) {
  const submissions = getDocumentSubmissions(documentTypeId)
  const stages = getStagesForDocumentType(documentTypeId)

  return stages
    .map((stage) => ({
      stage: stage.value,
      label: stage.label,
      count: submissions.filter((s) => s.stage === stage.value).length,
    }))
    .filter((s) => s.count > 0)
}

/** 取得指定文件類型中，特定階段的所有案件 */
export function getSubmissionsByStage(documentTypeId: string, stage: string): Submission[] {
  return getDocumentSubmissions(documentTypeId).filter((s) => s.stage === stage)
}

/** 將指定案件推進到目標階段（mutation，直接更新 mockDocumentSubmissions） */
export function advanceSubmissions(
  documentTypeId: string,
  societyIds: string[],
  targetStage: string
): void {
  const submissions = mockDocumentSubmissions[documentTypeId]
  if (!submissions) return
  submissions.forEach((s) => {
    if (societyIds.includes(s.societyId)) {
      s.stage = targetStage
    }
  })
}

/** 取得某案件可推進的下一個階段 */
export function getNextStage(
  documentTypeId: string,
  currentStage: string
): { value: string; label: string } | null {
  const stages = getStagesForDocumentType(documentTypeId)
  const idx = stages.findIndex((s) => s.value === currentStage)
  if (idx >= 0 && idx < stages.length - 1) return stages[idx + 1]
  return null
}
