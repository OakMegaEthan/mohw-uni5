// 公告的資料模型與 mock store。
//
// 一份公告彙整 0～N 筆待公告案件（見 lib/mock/announcement-cases.ts 與
// docs/announcement-module-plan.md）：
//   - 由案件彙整而來：cases 有值，發布時回寫案件為「已公告」
//   - 醫事司自建（作業時程、說明會通知等）：cases 為空
//
// 公文文號為人工輸入的字串，本系統不做文號管理、不驗證格式，但「沒有文號不得發布」。
// 發布後若發現錯誤，不直接改內容，而是建立「更正公告」（保留版本鏈），
// 這也是日後容額微調產生後續公告時要用的同一套機制。

import type { PendingSourceModule } from "@/lib/mock/announcement-cases"

// ── 類別 ────────────────────────────────────────────────────
// 類別直接由來源模組推導，前後台共用同一組 key（舊版後台用 additional／前台用
// additional-quota，兩邊對不起來，已收斂）。

export type AnnouncementCategory =
  | "training-document"
  | "hospital-quota"
  | "additional-quota"
  | "general"

export const ANNOUNCEMENT_CATEGORIES: Array<{
  value: AnnouncementCategory
  label: string
  description: string
}> = [
  {
    value: "training-document",
    label: "專科訓練文件",
    description: "認定基準、訓練課程基準、評核標準、甄審原則等六類填報文件的審查結果",
  },
  { value: "hospital-quota", label: "容額分配", description: "各醫學會訓練醫院容額分配核定結果" },
  { value: "additional-quota", label: "外加容額", description: "訓練醫院外加容額核定結果" },
  { value: "general", label: "一般公告", description: "作業時程、說明會通知等醫事司自建公告" },
]

export function getCategoryLabel(value: string): string {
  return ANNOUNCEMENT_CATEGORIES.find((c) => c.value === value)?.label ?? value
}

// ── 狀態 ────────────────────────────────────────────────────
// 已排程＝上架日期填未來日期，時間到才在前台出現。目前不做自動下架（待與客戶確認）。

export type AnnouncementStatus = "草稿" | "已排程" | "已發布" | "已下架"

export const ANNOUNCEMENT_STATUS_CONFIG: Record<AnnouncementStatus, { color: string }> = {
  草稿: { color: "bg-gray-100 text-gray-700 border-gray-200" },
  已排程: { color: "bg-blue-100 text-blue-700 border-blue-200" },
  已發布: { color: "bg-green-100 text-green-700 border-green-200" },
  已下架: { color: "bg-orange-100 text-orange-700 border-orange-200" },
}

// ── 型別 ────────────────────────────────────────────────────

export interface AnnouncementAttachment {
  id: string
  name: string
  size: string
  /** 有值＝自來源案件帶入（快照），無值＝本頁自行上傳 */
  fromCase?: string
}

/** 公告涵蓋的案件（快照，公告發布後不隨案件端異動） */
export interface AnnouncementCaseRef {
  caseId: string
  sourceModule: PendingSourceModule
  subject: string
  detail: string
  approvedDate: string
}

export interface AnnouncementHistoryEntry {
  at: string
  by: string
  action: string
}

export interface Announcement {
  id: string
  title: string
  category: AnnouncementCategory
  year: string
  status: AnnouncementStatus
  /** 公文文號，人工輸入，發布必填 */
  docNumber: string
  /** 發文日期（公文上的日期），ISO */
  issueDate: string | null
  /** 上架日期；未來日期＝已排程 */
  publishDate: string | null
  /** 生效／施行日期 */
  effectiveDate: string | null
  isPinned: boolean
  content: string
  attachments: AnnouncementAttachment[]
  cases: AnnouncementCaseRef[]
  publisher: string
  publisherUnit: string
  /** 更正版本鏈 */
  correctionOf: string | null
  correctedBy: string | null
  version: number
  history: AnnouncementHistoryEntry[]
  createdAt: string
}

// ── 日期工具 ──────────────────────────────────────────────────
// 內部一律存西元 ISO（yyyy-mm-dd），管理端顯示民國。

export function toRocDate(iso: string | null): string {
  if (!iso) return "—"
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!m) return iso
  return `${Number(m[1]) - 1911}/${m[2]}/${m[3]}`
}

/** 今天（mock 用固定值，避免 SSR 與 client 取得不同時間而 hydration 不一致） */
export const TODAY_ISO = "2026-07-23"

// ── 種子資料 ──────────────────────────────────────────────────

const DEFAULT_UNIT = "醫事司第五科"

function seedHistory(createdAt: string, published: boolean): AnnouncementHistoryEntry[] {
  const history: AnnouncementHistoryEntry[] = [
    { at: createdAt, by: "醫事司 王小明", action: "建立公告" },
  ]
  if (published) history.push({ at: createdAt, by: "醫事司 王小明", action: "發布公告" })
  return history
}

const announcements: Announcement[] = [
  {
    id: "1",
    title: "115 年度專科醫師訓練計畫認定基準修訂公告",
    category: "training-document",
    year: "115 年度",
    status: "已發布",
    docNumber: "衛部醫字第 1151660321 號",
    issueDate: "2026-03-13",
    publishDate: "2026-03-15",
    effectiveDate: "2026-04-01",
    isPinned: true,
    content: `一、公告依據：
依據專科醫師分科及甄審辦法第五條規定，公告 115 年度各專科醫師訓練計畫認定基準修訂內容。

二、修訂重點：
（一）調整訓練期程規定，明確規範各專科訓練年限及階段要求
（二）新增臨床技能評核機制，強化實務訓練品質管控
（三）增訂跨領域整合訓練課程要求，培養全人照護能力
（四）修正師資資格條件，提升教學品質

三、適用對象：
本修訂基準適用於 115 年度申請專科醫師訓練計畫認定之各專科醫學會，涵蓋醫學會名單詳如附件。

四、施行日期：
本修訂基準自 115 年 4 月 1 日起施行。

五、聯絡窗口：
如有疑問，請洽醫事司第五科，電話：(02)8590-6666 分機 7100。`,
    attachments: [
      { id: "1-1", name: "115年度專科醫師訓練計畫認定基準修訂對照表.pdf", size: "2.3 MB" },
      { id: "1-2", name: "涵蓋醫學會名單.xlsx", size: "128 KB" },
    ],
    cases: [],
    publisher: "醫事司",
    publisherUnit: DEFAULT_UNIT,
    correctionOf: null,
    correctedBy: null,
    version: 1,
    history: seedHistory("2026-03-15", true),
    createdAt: "2026-03-10",
  },
  {
    id: "2",
    title: "115 年度訓練醫院容額分配核定公告",
    category: "hospital-quota",
    year: "115 年度",
    status: "已發布",
    docNumber: "衛部醫字第 1151660208 號",
    issueDate: "2026-03-04",
    publishDate: "2026-03-05",
    effectiveDate: "2026-08-01",
    isPinned: true,
    content: `一、公告本部 115 年度各專科醫學會所屬訓練醫院容額分配核定結果，核定名單詳如附件。

二、本次核定容額之訓練效期為 115 年 8 月 1 日至 116 年 7 月 31 日。

三、各醫學會應依核定容額辦理招收作業，如有異動應另行報部。`,
    attachments: [
      { id: "2-1", name: "115年度訓練醫院容額分配核定名單.pdf", size: "3.6 MB" },
      { id: "2-2", name: "容額分配統計表.xlsx", size: "412 KB" },
    ],
    // 已發布公告的涵蓋案件為快照（案件本身已離開待公告池）
    cases: [
      {
        caseId: "quota-archived-2",
        sourceModule: "quota-filing",
        subject: "台灣內科醫學會",
        detail: "115 年度",
        approvedDate: "2026-02-18",
      },
      {
        caseId: "quota-archived-3",
        sourceModule: "quota-filing",
        subject: "台灣外科醫學會",
        detail: "115 年度",
        approvedDate: "2026-02-19",
      },
      {
        caseId: "quota-archived-4",
        sourceModule: "quota-filing",
        subject: "臺灣兒科醫學會",
        detail: "115 年度",
        approvedDate: "2026-02-20",
      },
    ],
    publisher: "醫事司",
    publisherUnit: DEFAULT_UNIT,
    correctionOf: null,
    correctedBy: null,
    version: 1,
    history: seedHistory("2026-03-05", true),
    createdAt: "2026-02-28",
  },
  {
    id: "3",
    title: "115 年度第一批外加容額核定公告",
    category: "additional-quota",
    year: "115 年度",
    status: "已發布",
    docNumber: "衛部醫字第 1151670115 號",
    issueDate: "2026-02-25",
    publishDate: "2026-02-28",
    effectiveDate: null,
    isPinned: false,
    content: `一、公告本部 115 年度第一批訓練醫院外加容額核定結果，核定名單詳如附件。

二、外加容額之訓練效期比照當年度核定容額，執行滿一年後，屬應提報成果報告之分類原則者，
　　應依規定提送外加容額成果報告。

三、本批次未及納入之申請案，俟後續審查完成後另行公告。`,
    attachments: [{ id: "3-1", name: "115年度第一批外加容額核定名單.pdf", size: "1.2 MB" }],
    cases: [
      {
        caseId: "aq-archived-1",
        sourceModule: "additional-quota",
        subject: "台大醫院",
        detail: "急診醫學科",
        approvedDate: "2026-01-22",
      },
      {
        caseId: "aq-archived-2",
        sourceModule: "additional-quota",
        subject: "林口長庚醫院",
        detail: "重症醫學科",
        approvedDate: "2026-01-24",
      },
    ],
    publisher: "醫事司",
    publisherUnit: DEFAULT_UNIT,
    correctionOf: null,
    correctedBy: null,
    version: 1,
    history: seedHistory("2026-02-28", true),
    createdAt: "2026-02-20",
  },
  {
    id: "4",
    title: "115 年度專科醫師訓練容額填報作業時程公告",
    category: "general",
    year: "115 年度",
    status: "已發布",
    docNumber: "衛部醫字第 1151650088 號",
    issueDate: "2026-01-05",
    publishDate: "2026-01-08",
    effectiveDate: null,
    isPinned: false,
    content: `一、115 年度專科醫師訓練容額填報作業自 115 年 1 月 15 日起開放，至 115 年 2 月 28 日止。

二、請各專科醫學會於期限內完成填報並送出，逾期系統將關閉填報功能。

三、作業說明會訂於 115 年 1 月 20 日以視訊方式辦理，請各醫學會派員參加。`,
    attachments: [{ id: "4-1", name: "115年度填報作業說明簡報.pdf", size: "5.1 MB" }],
    cases: [],
    publisher: "醫事司",
    publisherUnit: DEFAULT_UNIT,
    correctionOf: null,
    correctedBy: null,
    version: 1,
    history: seedHistory("2026-01-08", true),
    createdAt: "2026-01-05",
  },
  {
    id: "5",
    title: "114 年度訓練醫院容額分配核定公告",
    category: "hospital-quota",
    year: "114 年度",
    status: "已下架",
    docNumber: "衛部醫字第 1141660512 號",
    issueDate: "2025-03-06",
    publishDate: "2025-03-08",
    effectiveDate: "2025-08-01",
    isPinned: false,
    content: `一、公告本部 114 年度各專科醫學會所屬訓練醫院容額分配核定結果，核定名單詳如附件。

二、本公告已為 115 年度公告取代，僅供查詢參考。`,
    attachments: [{ id: "5-1", name: "114年度訓練醫院容額分配核定名單.pdf", size: "3.2 MB" }],
    cases: [],
    publisher: "醫事司",
    publisherUnit: DEFAULT_UNIT,
    correctionOf: null,
    correctedBy: null,
    version: 1,
    history: [
      { at: "2025-03-08", by: "醫事司 王小明", action: "建立公告" },
      { at: "2025-03-08", by: "醫事司 王小明", action: "發布公告" },
      { at: "2026-03-05", by: "醫事司 王小明", action: "下架公告" },
    ],
    createdAt: "2025-03-01",
  },
  {
    id: "6",
    title: "115 年度專科醫師訓練計畫評核標準修訂公告（草稿）",
    category: "training-document",
    year: "115 年度",
    status: "草稿",
    docNumber: "",
    issueDate: null,
    publishDate: null,
    effectiveDate: null,
    isPinned: false,
    content: `一、公告依據：

二、修訂重點：

（撰寫中）`,
    attachments: [],
    cases: [],
    publisher: "醫事司",
    publisherUnit: DEFAULT_UNIT,
    correctionOf: null,
    correctedBy: null,
    version: 1,
    history: [{ at: "2026-07-20", by: "醫事司 王小明", action: "建立公告" }],
    createdAt: "2026-07-20",
  },
]

let nextId = 100

// ── 查詢 ────────────────────────────────────────────────────

export function getAnnouncementList(): Announcement[] {
  return announcements
}

export function getAnnouncement(id: string): Announcement | undefined {
  return announcements.find((a) => a.id === id)
}

export function getDraftCount(): number {
  return announcements.filter((a) => a.status === "草稿").length
}

/** 摘要：取內文第一段，供列表與前台卡片使用 */
export function getExcerpt(a: Announcement): string {
  const firstLine = a.content
    .split("\n")
    .map((l) => l.trim())
    .find((l) => l.length > 0)
  return firstLine ?? ""
}

// ── 變更 ────────────────────────────────────────────────────

export interface AnnouncementDraftInput {
  title: string
  category: AnnouncementCategory
  year: string
  docNumber: string
  issueDate: string | null
  publishDate: string | null
  effectiveDate: string | null
  isPinned: boolean
  content: string
  attachments: AnnouncementAttachment[]
  cases: AnnouncementCaseRef[]
  correctionOf?: string | null
}

export function createDraft(input: AnnouncementDraftInput): Announcement {
  const draft: Announcement = {
    id: `a-${nextId++}`,
    ...input,
    status: "草稿",
    publisher: "醫事司",
    publisherUnit: DEFAULT_UNIT,
    correctionOf: input.correctionOf ?? null,
    correctedBy: null,
    version: 1,
    history: [{ at: TODAY_ISO, by: "醫事司 王小明", action: "建立公告草稿" }],
    createdAt: TODAY_ISO,
  }
  announcements.unshift(draft)
  return draft
}

export function updateAnnouncement(id: string, patch: Partial<AnnouncementDraftInput>): void {
  const a = getAnnouncement(id)
  if (!a) return
  Object.assign(a, patch)
  a.history.push({ at: TODAY_ISO, by: "醫事司 王小明", action: "儲存變更" })
}

/** 沒有文號不得發布。回傳 false 代表未通過檢核。 */
export function canPublish(a: Announcement): boolean {
  return a.docNumber.trim().length > 0
}

export function publishAnnouncement(id: string): boolean {
  const a = getAnnouncement(id)
  if (!a || !canPublish(a)) return false
  const scheduled = Boolean(a.publishDate && a.publishDate > TODAY_ISO)
  a.status = scheduled ? "已排程" : "已發布"
  if (!a.publishDate) a.publishDate = TODAY_ISO
  a.history.push({
    at: TODAY_ISO,
    by: "醫事司 王小明",
    action: scheduled ? `排程於 ${toRocDate(a.publishDate)} 上架` : "發布公告",
  })
  // 更正公告發布時，標記被更正的原公告
  if (a.correctionOf) {
    const origin = getAnnouncement(a.correctionOf)
    if (origin) {
      origin.correctedBy = a.id
      origin.history.push({ at: TODAY_ISO, by: "醫事司 王小明", action: `由更正公告 ${a.id} 取代` })
    }
  }
  return true
}

export function unpublishAnnouncement(id: string): void {
  const a = getAnnouncement(id)
  if (!a) return
  a.status = "已下架"
  a.history.push({ at: TODAY_ISO, by: "醫事司 王小明", action: "下架公告" })
}

export function republishAnnouncement(id: string): void {
  const a = getAnnouncement(id)
  if (!a) return
  a.status = "已發布"
  a.history.push({ at: TODAY_ISO, by: "醫事司 王小明", action: "重新上架" })
}

/**
 * 建立更正公告：複製原公告內容為新草稿，保留版本鏈。
 * 原公告不動（已發出的文件不改內容），待更正公告發布時再標記取代關係。
 */
export function createCorrection(originId: string): Announcement | null {
  const origin = getAnnouncement(originId)
  if (!origin) return null
  const correction = createDraft({
    title: `${origin.title}（更正）`,
    category: origin.category,
    year: origin.year,
    docNumber: "",
    issueDate: null,
    publishDate: null,
    effectiveDate: origin.effectiveDate,
    isPinned: origin.isPinned,
    content: origin.content,
    attachments: origin.attachments.map((f) => ({ ...f })),
    cases: origin.cases.map((c) => ({ ...c })),
    correctionOf: origin.id,
  })
  correction.version = origin.version + 1
  correction.history = [
    { at: TODAY_ISO, by: "醫事司 王小明", action: `自公告「${origin.title}」建立更正版本` },
  ]
  return correction
}

export function deleteDraft(id: string): void {
  const idx = announcements.findIndex((a) => a.id === id && a.status === "草稿")
  if (idx >= 0) announcements.splice(idx, 1)
}

// ── 前台公告欄相容層 ─────────────────────────────────────────
// /announcements 與 /announcements/[id] 目前仍吃舊形狀。前台改版時再收斂。

function isVisibleToPublic(a: Announcement): boolean {
  return a.status === "已發布"
}

export function getAnnouncements() {
  return announcements.filter(isVisibleToPublic).map((a) => ({
    id: a.id,
    title: a.title,
    category: a.category,
    publishDate: a.publishDate ?? "",
    publisher: a.publisher,
    isNew: Boolean(a.publishDate && daysBetween(a.publishDate, TODAY_ISO) <= 180),
    isPinned: a.isPinned,
    hasAttachments: a.attachments.length > 0,
    attachmentCount: a.attachments.length,
    excerpt: getExcerpt(a),
  }))
}

export function getAnnouncementDetail(id: string) {
  const a = getAnnouncement(id)
  if (!a || !isVisibleToPublic(a)) return undefined
  return {
    id: a.id,
    title: a.title,
    category: a.category,
    publishDate: a.publishDate ?? "",
    publisher: a.publisher,
    publisherUnit: a.publisherUnit,
    docNumber: a.docNumber,
    effectiveDate: a.effectiveDate,
    content: a.content,
    attachments: a.attachments.map((f) => ({
      id: f.id,
      name: f.name,
      size: f.size,
      uploadDate: a.publishDate ?? "",
    })),
    relatedAnnouncements: announcements
      .filter((o) => o.id !== a.id && o.category === a.category && isVisibleToPublic(o))
      .slice(0, 3)
      .map((o) => ({ id: o.id, title: o.title, date: o.publishDate ?? "" })),
  }
}

function daysBetween(from: string, to: string): number {
  const ms = new Date(to).getTime() - new Date(from).getTime()
  return Math.round(ms / 86400000)
}
