// 公告匯出：客戶端直接產檔下載（不經後端），供醫事司把文稿貼進公文系統、
// 或把涵蓋案件名單交給承辦人核對。

import { toRocDate, type Announcement } from "@/lib/mock/announcements"
import { getSourceConfig } from "@/lib/mock/announcement-cases"

function download(filename: string, content: string, mime: string) {
  // CSV 加 BOM，否則 Excel 開中文會亂碼
  const blob = new Blob([mime.includes("csv") ? `﻿${content}` : content], {
    type: `${mime};charset=utf-8`,
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/** 公告文稿（純文字），欄位順序比照公文格式 */
export function buildAnnouncementDocument(a: Announcement): string {
  const lines = [
    `衛生福利部　公告`,
    ``,
    `發文日期：${toRocDate(a.issueDate)}`,
    `發文字號：${a.docNumber || "（未填）"}`,
    `主　　旨：${a.title}`,
    a.effectiveDate ? `生效日期：${toRocDate(a.effectiveDate)}` : null,
    `發布單位：${a.publisherUnit}`,
    ``,
    `公告事項：`,
    a.content,
  ].filter((l): l is string => l !== null)

  const attachmentBlock = a.attachments.length
    ? [``, `附件：`, ...a.attachments.map((f, i) => `　${i + 1}. ${f.name}（${f.size}）`)]
    : []

  const caseBlock = a.cases.length
    ? [``, `本公告涵蓋案件共 ${a.cases.length} 筆，名單詳如所附清單。`]
    : []

  return [...lines, ...attachmentBlock, ...caseBlock].join("\n")
}

/** 涵蓋案件名單（CSV），供核對與併入附件 */
export function buildCaseListCsv(a: Announcement): string {
  const header = ["來源", "主體", "項目", "審查通過日"]
  const rows = a.cases.map((c) => [
    getSourceConfig(c.sourceModule).label,
    c.subject,
    c.detail,
    toRocDate(c.approvedDate),
  ])
  return [header, ...rows]
    .map((cols) => cols.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
    .join("\n")
}

function safeName(title: string): string {
  return title.replace(/[\\/:*?"<>|]/g, "").slice(0, 60)
}

export function downloadAnnouncementDocument(a: Announcement): void {
  download(`${safeName(a.title)}.txt`, buildAnnouncementDocument(a), "text/plain")
}

export function downloadCaseList(a: Announcement): void {
  download(`${safeName(a.title)}_涵蓋案件名單.csv`, buildCaseListCsv(a), "text/csv")
}
