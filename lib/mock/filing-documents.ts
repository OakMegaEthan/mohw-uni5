// 文件填報：文件類型與版型完全耦合的單一來源
// 三種版型：
//  - section-edit     逐條編輯版型（現有）：訓練計畫認定基準、容額分配原則、精進指南
//  - single-upload    單主文件上傳版型：上傳 1 份主文件 + 1 份修正對照表（訓練課程基準、甄審原則）
//  - evaluation-upload 評核標準與評核表版型：上傳評核標準 + 評核表 + 各自修正對照表（共 4 份）
export type FilingVariant = "section-edit" | "single-upload" | "evaluation-upload"

// 文件填報狀態：URL param 使用英文 key，方便人工輸入與切換
//  not-submitted  尚未送出（尚無本年度內容，與前一年相同）
//  pending        待送件（已有內容、尚未送出）
//  needs-revision 需補件（審查退回，需補件）
//  under-review   審查中（已送件，僅供查看）
//  approved       通過（已通過，僅供查看及匯出）
export type FilingStatus = "not-submitted" | "pending" | "needs-revision" | "under-review" | "approved"

export const FILING_STATUS_LABELS: Record<FilingStatus, string> = {
  "not-submitted": "尚未送出",
  pending: "待送件",
  "needs-revision": "需補件",
  "under-review": "審查中",
  approved: "通過",
}

export function getFilingStatusLabel(status: string): string {
  return FILING_STATUS_LABELS[status as FilingStatus] ?? status
}

export interface FilingDocumentMeta {
  id: string
  title: string
  variant: FilingVariant
  status: FilingStatus
  deadline: string
  latestAnnouncementDate: string
  latestAnnouncementNumber: string
}

export const FILING_DOCUMENTS: FilingDocumentMeta[] = [
  {
    id: "training-plan",
    title: "訓練計畫認定基準",
    variant: "section-edit",
    status: "needs-revision",
    deadline: "114/03/31",
    latestAnnouncementDate: "114/09/03",
    latestAnnouncementNumber: "衛部醫字第1141660001號",
  },
  {
    id: "training-curriculum",
    title: "訓練課程基準",
    variant: "single-upload",
    status: "not-submitted",
    deadline: "114/04/30",
    latestAnnouncementDate: "114/09/03",
    latestAnnouncementNumber: "衛部醫字第1141660002號",
  },
  {
    id: "evaluation-standards",
    title: "評核標準與評核表",
    variant: "evaluation-upload",
    status: "under-review",
    deadline: "114/04/15",
    latestAnnouncementDate: "113/10/01",
    latestAnnouncementNumber: "衛部醫字第1131660015號",
  },
  {
    id: "quota-allocation",
    title: "容額分配原則",
    variant: "section-edit",
    status: "approved",
    deadline: "114/03/15",
    latestAnnouncementDate: "114/09/03",
    latestAnnouncementNumber: "衛部醫字第1141660003號",
  },
  {
    id: "improvement-guide",
    title: "精進指南",
    variant: "section-edit",
    status: "pending",
    deadline: "114/04/30",
    latestAnnouncementDate: "112/09/25",
    latestAnnouncementNumber: "衛部醫字第1121660008號",
  },
  {
    id: "screening-principle",
    title: "甄審原則",
    variant: "single-upload",
    status: "approved",
    deadline: "114/03/15",
    latestAnnouncementDate: "114/09/03",
    latestAnnouncementNumber: "衛部醫字第1141660004號",
  },
]

export function getFilingDocument(id: string): FilingDocumentMeta | undefined {
  return FILING_DOCUMENTS.find((doc) => doc.id === id)
}

export function getFilingDocumentTitle(id: string): string {
  return getFilingDocument(id)?.title ?? id
}
