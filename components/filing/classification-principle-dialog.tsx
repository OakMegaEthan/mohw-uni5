"use client"

import { useState } from "react"
import { Plus, X, Pencil, Check } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

interface ClassificationPrincipleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  options: string[]
  onChange: (next: string[]) => void
}

/**
 * 分類原則選項的維護彈窗（新增／改名／刪除）。
 * 選項以字串存放，故增刪不涉及 key 對應問題。
 * 目前放在新增申請頁的下拉旁；若未來需要選項啟用狀態等更複雜的維護，
 * 再考慮移至管理專區。
 */
export function ClassificationPrincipleDialog({
  open,
  onOpenChange,
  options,
  onChange,
}: ClassificationPrincipleDialogProps) {
  const [newValue, setNewValue] = useState("")
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editingValue, setEditingValue] = useState("")

  const handleAdd = () => {
    const value = newValue.trim()
    if (!value || options.includes(value)) return
    onChange([...options, value])
    setNewValue("")
  }

  const handleRemove = (index: number) => {
    onChange(options.filter((_, i) => i !== index))
  }

  const startEdit = (index: number) => {
    setEditingIndex(index)
    setEditingValue(options[index])
  }

  const commitEdit = () => {
    const value = editingValue.trim()
    if (editingIndex === null) return
    if (value && !options.some((o, i) => o === value && i !== editingIndex)) {
      onChange(options.map((o, i) => (i === editingIndex ? value : o)))
    }
    setEditingIndex(null)
    setEditingValue("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>管理分類原則選項</DialogTitle>
          <DialogDescription>新增、修改或刪除分類原則。變更後即可於申請表單的下拉選單使用。</DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          {options.map((option, index) => (
            <div
              key={index}
              className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2"
            >
              {editingIndex === index ? (
                <>
                  <Input
                    value={editingValue}
                    onChange={(e) => setEditingValue(e.target.value)}
                    className="h-8 bg-white"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitEdit()
                      if (e.key === "Escape") setEditingIndex(null)
                    }}
                  />
                  <Button size="sm" variant="ghost" className="h-8 shrink-0 px-2" onClick={commitEdit}>
                    <Check className="h-4 w-4 text-green-600" />
                  </Button>
                </>
              ) : (
                <>
                  <span className="truncate text-sm text-gray-900">{option}</span>
                  <div className="flex shrink-0 items-center">
                    <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => startEdit(index)}>
                      <Pencil className="h-3.5 w-3.5 text-gray-500" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => handleRemove(index)}>
                      <X className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          ))}

          {options.length === 0 && (
            <p className="rounded-lg border border-dashed border-gray-200 p-4 text-center text-sm text-gray-400">
              尚無分類原則，請於下方新增
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 border-t pt-4">
          <Input
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            placeholder="輸入新的分類原則..."
            className="h-9"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAdd()
            }}
          />
          <Button onClick={handleAdd} className="h-9 shrink-0 gap-1" disabled={!newValue.trim()}>
            <Plus className="h-4 w-4" />
            新增
          </Button>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            完成
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
