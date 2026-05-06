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

export const mockSocieties = [
  { id: "1", name: "台灣內科醫學會" },
  { id: "2", name: "台灣外科醫學會" },
  { id: "3", name: "台灣小兒科醫學會" },
  { id: "4", name: "台灣婦產科醫學會" },
  { id: "5", name: "台灣骨科醫學會" },
  { id: "6", name: "台灣眼科醫學會" },
  { id: "7", name: "台灣耳鼻喉科醫學會" },
  { id: "8", name: "台灣皮膚科醫學會" },
  { id: "9", name: "台灣泌尿科醫學會" },
  { id: "10", name: "台灣神經科醫學會" },
  { id: "11", name: "台灣精神醫學會" },
  { id: "12", name: "台灣復健醫學會" },
  { id: "13", name: "台灣麻醉醫學會" },
  { id: "14", name: "台灣急診醫學會" },
  { id: "15", name: "台灣家庭醫學會" },
  { id: "16", name: "台灣病理學會" },
  { id: "17", name: "台灣放射線醫學會" },
  { id: "18", name: "台灣核醫學會" },
  { id: "19", name: "台灣整形外科醫學會" },
  { id: "20", name: "台灣職業醫學會" },
  { id: "21", name: "台灣老年醫學會" },
  { id: "22", name: "台灣安寧緩和醫學會" },
  { id: "23", name: "台灣重症醫學會" },
]

// 學會層級的目前階段管理（按文件類型）
// 為了 demo 展示，各文件類型設定不同階段
// 注意：必須在 generateMockSubmissionsForDocType 之前定義
export const societyCurrentStages: Record<string, string> = {
  "screening-principle": "pending-review",        // 待審查
  "hospital-accreditation": "group-meeting",      // 分組會議審查
  "training-curriculum": "rrc-meeting",           // RRC 大會審核
  "evaluation-standards": "pending-announcement", // 待公告
  "quota-allocation": "pending-review",           // 待審查
  "improvement-guide": "pending-announcement",    // 待公告
}

// 生成該文件類型的案件（所有案件都處於同一階段）
const generateMockSubmissionsForDocType = (documentTypeId: string) => {
  // 取得該文件類型目前所在階段
  const currentStage = societyCurrentStages[documentTypeId] ?? "pending-review"
  
  return mockSocieties.map((society, index) => {
    // 未送件的案件（少數）
    if (index % 8 === 0) {
      return {
        societyId: society.id,
        stage: currentStage,
        uploaded: false,
        uploadedDate: null as string | null,
        lastUpdated: null as string | null,
        reviewResult: "pending" as "pending" | "approved" | "needs-revision",
      }
    }

    // 已送件的案件，根據 index 分配不同審查結果
    let reviewResult: "pending" | "approved" | "needs-revision" = "pending"
    if (index % 4 === 1) {
      reviewResult = "approved"
    } else if (index % 4 === 2) {
      reviewResult = "needs-revision"
    }
    // index % 4 === 0 或 3 保持 pending

    return {
      societyId: society.id,
      stage: currentStage,
      uploaded: true,
      uploadedDate: `2025-01-${String(5 + index).padStart(2, "0")}`,
      lastUpdated: `2025-01-${String(10 + index).padStart(2, "0")}`,
      reviewResult,
    }
  })
}

export const mockDocumentSubmissions: Record<
  string,
  Array<{
    societyId: string
    stage: string
    uploaded: boolean
    uploadedDate: string | null
    lastUpdated: string | null
    reviewResult: "pending" | "approved" | "needs-revision"
  }>
> = {
  "screening-principle": generateMockSubmissionsForDocType("screening-principle"),
  "hospital-accreditation": generateMockSubmissionsForDocType("hospital-accreditation"),
  "training-curriculum": generateMockSubmissionsForDocType("training-curriculum"),
  "evaluation-standards": generateMockSubmissionsForDocType("evaluation-standards"),
  "quota-allocation": generateMockSubmissionsForDocType("quota-allocation"),
  "improvement-guide": generateMockSubmissionsForDocType("improvement-guide"),
}

export const stageColors: Record<string, string> = {
  "pending-review": "bg-blue-100 text-blue-800 border-blue-200",
  "group-meeting": "bg-purple-100 text-purple-800 border-purple-200",
  "rrc-meeting": "bg-pink-100 text-pink-800 border-pink-200",
  "pending-announcement": "bg-amber-100 text-amber-800 border-amber-200",
  announced: "bg-green-100 text-green-800 border-green-200",
}

export function getDocumentTypes() {
  return documentTypes
}

export function getStagesForDocumentType(documentTypeId: string) {
  return stagesByDocumentType[documentTypeId] ?? []
}

export function getDocumentSubmissions(documentTypeId: string) {
  return mockDocumentSubmissions[documentTypeId] ?? []
}

export function getSocieties() {
  return mockSocieties
}

export function getStageColors() {
  return stageColors
}

// 獲取文件類型目前所處的整體階段
export function getCurrentStageForDocumentType(documentTypeId: string) {
  return societyCurrentStages[documentTypeId] ?? "pending-review"
}

// 取得指定階段的案件統計
export function getSubmissionCountsByStage(documentTypeId: string) {
  const submissions = getDocumentSubmissions(documentTypeId)
  const stages = getStagesForDocumentType(documentTypeId)

  return stages.map((stage) => ({
    stage: stage.value,
    label: stage.label,
    count: submissions.filter((s) => s.stage === stage.value).length,
  }))
}

// 推進到下一階段
export function advanceDocumentTypeToNextStage(documentTypeId: string) {
  const stages = getStagesForDocumentType(documentTypeId)
  const currentStage = societyCurrentStages[documentTypeId] ?? stages[0]?.value
  const currentIndex = stages.findIndex((s) => s.value === currentStage)

  if (currentIndex < stages.length - 1) {
    societyCurrentStages[documentTypeId] = stages[currentIndex + 1].value
    return true
  }
  return false
}

// 取得推進前的防呆統計資料
export function getAdvanceCheckStats(documentTypeId: string) {
  const submissions = getDocumentSubmissions(documentTypeId)
  const societies = getSocieties()

  const uploaded = submissions.filter((s) => s.uploaded)
  const notUploaded = submissions.filter((s) => !s.uploaded)

  const approved = submissions.filter((s) => s.reviewResult === "approved")
  const needsRevision = submissions.filter((s) => s.reviewResult === "needs-revision")
  const pendingReview = submissions.filter((s) => s.reviewResult === "pending")

  // 取得各類別的醫學會名單
  const getSocietyNames = (subs: typeof submissions) =>
    subs.map((s) => societies.find((soc) => soc.id === s.societyId)?.name || s.societyId)

  return {
    total: submissions.length,
    uploaded: {
      count: uploaded.length,
      societies: getSocietyNames(uploaded),
    },
    notUploaded: {
      count: notUploaded.length,
      societies: getSocietyNames(notUploaded),
    },
    approved: {
      count: approved.length,
      societies: getSocietyNames(approved),
    },
    needsRevision: {
      count: needsRevision.length,
      societies: getSocietyNames(needsRevision),
    },
    pendingReview: {
      count: pendingReview.length,
      societies: getSocietyNames(pendingReview),
    },
  }
}

