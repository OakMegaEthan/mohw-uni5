"use client"

import { Info } from "lucide-react"

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

/**
 * 「微調原因」欄位的規則說明。
 *
 * 用 Popover 而非 Tooltip：說明文字近百字，Tooltip 容納不下也不好讀；
 * 且 Tooltip 靠 hover 觸發，觸控裝置點不出來。
 *
 * 填報端與審查端共用——醫事司在審查頁看到微調原因空白時，同樣需要知道那是合規的。
 *
 * ⚠️ 目前**只做說明、系統不依此驗證**。要做成條件必填需先定義「當年度 10 月 31 日」
 * 是哪一個 10/31（年度效期為 8/1～次年 7/31），且需逐次以本次送出日判斷。
 * 使用者 2026-08-17 決定先不處理日期邏輯。
 */
export function AdjustmentReasonHint() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="微調原因填報規則說明"
          className="ml-1 inline-flex align-middle text-gray-400 transition-colors hover:text-blue-600"
        >
          <Info className="h-4 w-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-96">
        <p className="text-base font-medium text-gray-900">微調原因何時須填報</p>
        <p className="mt-2 text-base leading-relaxed text-gray-700">
          依據 93 年 3 月 23 日「專科醫師容額管制計畫及專科醫師甄審原則檢討會議」決議，於當年度
          10 月 31 日前申請微調容額之訓練醫院，<strong className="text-gray-900">毋須填報微調原因</strong>
          ；已逾當年度 10 月 31 日申請微調者，
          <strong className="text-gray-900">須填報微調原因</strong>。
        </p>
      </PopoverContent>
    </Popover>
  )
}
