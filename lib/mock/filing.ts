export type FilingDocumentStatus = "待審查" | "需補件" | "通過"

export interface FilingDocument {
  id: string
  title: string
  status: FilingDocumentStatus
  deadline: string
}

export interface HospitalQuotaRow {
  id: number | string
  code: string
  name: string
  county?: string
  expiry: string
  extension: string
  limit: number | null
  prevQuota: number | null
  currentQuota: number | null
  isSubRow?: boolean
  note?: string
}

export interface DisqualifiedHospitalRow {
  id: number
  code: string
  name: string
  reason: string
}

export interface FilingHospitalOption {
  code: string
  name: string
}

export const filingDocuments: FilingDocument[] = [
  { id: "plan", title: "計畫認定基準", status: "需補件", deadline: "2025/03/31" },
  { id: "course", title: "訓練課程基準", status: "需補件", deadline: "2025/03/31" },
  { id: "evaluation", title: "評核標準", status: "待審查", deadline: "2025/04/15" },
  { id: "quota-principle", title: "容額分配原則", status: "通過", deadline: "2025/03/15" },
  { id: "guidelines", title: "精進指南", status: "待審查", deadline: "2025/04/30" },
  { id: "review-principles", title: "甄審原則", status: "通過", deadline: "2025/03/15" },
]

export const filingAvailableHospitals: FilingHospitalOption[] = [
  { code: "0401180014", name: "台大醫院" },
  { code: "0401180015", name: "台北榮民總醫院" },
  { code: "0401180016", name: "三軍總醫院" },
  { code: "0401180017", name: "馬偕紀念醫院" },
  { code: "0401180018", name: "新光醫院" },
  { code: "0401180019", name: "國泰醫院" },
  { code: "0401180020", name: "亞東醫院" },
  { code: "0401180021", name: "慈濟醫院" },
  { code: "0401180022", name: "奇美醫院" },
  { code: "0401180023", name: "成大醫院" },
  { code: "0401180024", name: "高雄長庚醫院" },
  { code: "0401180025", name: "高雄榮民總醫院" },
]

export const filingQuotaHospitals: HospitalQuotaRow[] = [
  {
    id: 1,
    code: "0401180014",
    name: "台大醫院",
    expiry: "有效至 2026/7/31",
    extension: "4 年 (至 2030/7/31)",
    limit: 50,
    prevQuota: 42,
    currentQuota: 45,
  },
  {
    id: 2,
    code: "0401180015",
    name: "榮民總醫院",
    expiry: "有效至 2026/7/31",
    extension: "-",
    limit: 40,
    prevQuota: 35,
    currentQuota: 38,
  },
  {
    id: 3,
    code: "0401180016",
    name: "長庚醫院",
    expiry: "有效至 2024/7/31",
    extension: "4 年 (至 2028/7/31)",
    limit: 40,
    prevQuota: 30,
    currentQuota: 40,
  },
  {
    id: 4,
    code: "0401180017",
    name: "中國醫藥大學附醫",
    expiry: "有效至 2026/7/31",
    extension: "4 年 (至 2030/7/31)",
    limit: 45,
    prevQuota: 35,
    currentQuota: 35,
  },
  {
    id: "5.1",
    code: "0401180018",
    name: "聯合申請 (仁愛院區)",
    expiry: "有效至 2026/7/31",
    extension: "4 年 (至 2030/7/31)",
    limit: 60,
    prevQuota: 50,
    currentQuota: 55,
    isSubRow: false,
  },
  {
    id: "5.2",
    code: "0401180019",
    name: "聯合申請 (和平院區)",
    expiry: "",
    extension: "",
    limit: null,
    prevQuota: null,
    currentQuota: null,
    isSubRow: true,
  },
]

export const filingDisqualifiedHospitals: DisqualifiedHospitalRow[] = [
  {
    id: 1,
    code: "0401180020",
    name: "新光醫院",
    reason: "未符合訓練醫院認證基準第3條：專任主治醫師人數不足",
  },
]

