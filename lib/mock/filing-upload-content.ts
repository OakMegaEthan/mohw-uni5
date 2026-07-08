// 上傳版型（single-upload / evaluation-upload）的文件內容與修正對照表 mock 來源
// 原型階段以結構化文字模擬 Word/PDF 內容，日後可替換為真實檔案渲染。
// 供填報專區與（未來）審查專區共用。

export interface DocSection {
  heading: string
  body: string
}

// 單一份文件的內容（某文件、某年度）
export interface DocContent {
  // 年度／版本標示，例如「114 年度版本」
  meta: string
  sections: DocSection[]
}

// 修正對照表的單列（本次修訂前後對照）
export interface ComparisonRow {
  item: string
  before: string
  after: string
  note: string
}

export interface ComparisonContent {
  rows: ComparisonRow[]
}

// 邏輯文件鍵：版型 B 只有 main；版型 C 有 standards（評核標準）與 form（評核表）
export type UploadDocKey = "main" | "standards" | "form"
export type DocYear = "previous" | "current"

interface UploadDocEntry {
  label: string
  previous: DocContent
  current: DocContent
  comparison: ComparisonContent
}

// 依「文件標題」產生擬真的結構化內容，維持 DRY 又能區分年度
function buildContent(docLabel: string, year: DocYear): DocContent {
  const yearLabel = year === "previous" ? "113 年度版本" : "114 年度版本"
  const revisionNote =
    year === "previous"
      ? "本版為前一年度公告版本，內容僅供對照參考。"
      : "本版為本年度提報版本，已依審查意見與法規更新調整。"
  return {
    meta: yearLabel,
    sections: [
      {
        heading: "第一章　總則",
        body: `${revisionNote}\n\n一、本${docLabel}依專科醫師訓練相關法規訂定，作為各訓練機構辦理之依循。\n二、本${docLabel}適用於經認定之專科醫師訓練醫院及其合作機構。`,
      },
      {
        heading: "第二章　訓練條件與資格",
        body:
          year === "previous"
            ? "一、訓練醫院應具備合格之指導醫師至少三名。\n二、每一訓練容額應配置對應之臨床訓練設施與病床數。\n三、訓練期間不得少於規定之最低月數。"
            : "一、訓練醫院應具備合格之指導醫師至少四名（本年度由三名調整為四名）。\n二、每一訓練容額應配置對應之臨床訓練設施與病床數，並新增門診訓練時數規範。\n三、訓練期間不得少於規定之最低月數。",
      },
      {
        heading: "第三章　評核與考核",
        body: `一、訓練機構應建立定期評核機制，每年至少辦理二次。\n二、評核結果應納入年度訓練品質檢討。\n三、${docLabel}相關表單應完整保存備查。`,
      },
      {
        heading: "第四章　附則",
        body: `本${docLabel}經衛生福利部公告後施行，修正時亦同。`,
      },
    ],
  }
}

function buildComparison(docLabel: string): ComparisonContent {
  return {
    rows: [
      {
        item: "指導醫師人數",
        before: "至少三名",
        after: "至少四名",
        note: "依審查意見提高師資門檻",
      },
      {
        item: "門診訓練時數",
        before: "未規範",
        after: "新增每週至少四小時",
        note: "本年度新增條文",
      },
      {
        item: "評核頻率",
        before: "每年一次",
        after: "每年二次",
        note: "強化訓練品質追蹤",
      },
      {
        item: `${docLabel}適用範圍`,
        before: "訓練醫院",
        after: "訓練醫院及其合作機構",
        note: "擴大適用對象",
      },
    ],
  }
}

function makeEntry(label: string): UploadDocEntry {
  return {
    label,
    previous: buildContent(label, "previous"),
    current: buildContent(label, "current"),
    comparison: buildComparison(label),
  }
}

// 依文件 id 對應各邏輯文件的內容
// 版型 B：main；版型 C：standards + form
const UPLOAD_CONTENT: Record<string, Partial<Record<UploadDocKey, UploadDocEntry>>> = {
  "training-curriculum": {
    main: makeEntry("訓練課程基準"),
  },
  "screening-principle": {
    main: makeEntry("甄審原則"),
  },
  "evaluation-standards": {
    standards: makeEntry("評核標準"),
    form: makeEntry("評核表"),
  },
}

export function getUploadDocEntry(docId: string, key: UploadDocKey): UploadDocEntry | undefined {
  return UPLOAD_CONTENT[docId]?.[key]
}
