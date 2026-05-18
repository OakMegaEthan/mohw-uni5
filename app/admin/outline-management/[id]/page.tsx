"use client"

import { useState, use } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Pencil,
  ArrowUp,
  ArrowDown,
  Plus,
  Trash2,
  Check,
  X,
  History,
  Eye,
  RotateCcw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

import {
  OutlineItem,
  outlineMeta,
  getInitialOutline,
  mockTemplates,
  mockVersions,
} from "@/lib/mock/review-outline"

// --------------- helpers ---------------

let _counter = 100

function nextId() {
  return String(++_counter)
}

function renumber(items: OutlineItem[], prefix = ""): OutlineItem[] {
  return items.map((item, i) => {
    const num = prefix ? `${prefix}.${i + 1}` : `${i + 1}`
    return {
      ...item,
      number: num,
      children: item.children ? renumber(item.children, num) : undefined,
    }
  })
}

// --------------- page component ---------------

export default function OutlineEditorPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const meta = outlineMeta[id] || { name: id }

  const [outline, setOutline] = useState<OutlineItem[]>(() => renumber(getInitialOutline()))
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [showVersionPanel, setShowVersionPanel] = useState(false)
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null)
  const [previewOutline, setPreviewOutline] = useState<OutlineItem[] | null>(null)
  const [activeTab, setActiveTab] = useState<"versions" | "templates">("versions")

  // ---- edit ----
  function startEdit(item: OutlineItem) {
    setEditingId(item.id)
    setEditTitle(item.title)
    setEditDescription(item.description)
  }

  function confirmEdit() {
    if (!editingId) return
    setOutline((prev) =>
      renumber(
        applyDeep(prev, editingId, (it) => ({
          ...it,
          title: editTitle,
          description: editDescription,
        })),
      ),
    )
    setEditingId(null)
  }

  function cancelEdit() {
    setEditingId(null)
  }

  // ---- move ----
  function moveUp(parentItems: OutlineItem[] | null, itemId: string) {
    setOutline((prev) => renumber(moveItem(prev, itemId, -1)))
  }

  function moveDown(parentItems: OutlineItem[] | null, itemId: string) {
    setOutline((prev) => renumber(moveItem(prev, itemId, 1)))
  }

  // ---- delete ----
  function deleteItem(itemId: string) {
    setOutline((prev) => renumber(removeDeep(prev, itemId)))
  }

  // ---- add ----
  function addOutlineItem() {
    const newItem: OutlineItem = {
      id: nextId(),
      number: "",
      title: "新大綱項目",
      description: "請填寫說明",
    }
    setOutline((prev) => renumber([...prev, newItem]))
  }

  // ---- version/template selection ----
  function handleSelectVersion(version: string, outlineData?: OutlineItem[]) {
    setSelectedVersion(version)
    setPreviewOutline(outlineData || null)
  }

  function handleApplyVersion() {
    if (previewOutline) {
      // Deep copy and renumber
      const copiedOutline = JSON.parse(JSON.stringify(previewOutline))
      setOutline(renumber(copiedOutline))
      setShowVersionPanel(false)
      setSelectedVersion(null)
      setPreviewOutline(null)
    }
  }

  function handleCloseVersionPanel() {
    setShowVersionPanel(false)
    setSelectedVersion(null)
    setPreviewOutline(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* breadcrumb */}
        <Link
          href="/admin/outline-management"
          className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          返回大綱規範管理
        </Link>

        {/* header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {meta.name}大綱規範
          </h1>

          <div className="flex items-center gap-3">
            <Button size="sm" variant="outline" onClick={() => setShowVersionPanel(true)}>
              <History className="w-4 h-4 mr-1.5" />
              版本紀錄
            </Button>
          </div>
        </div>

        {/* outline tree */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">大綱結構</h2>

          <div className="space-y-4">
            {outline.map((section, sIdx) => (
              <SectionBlock
                key={section.id}
                item={section}
                isFirst={sIdx === 0}
                isLast={sIdx === outline.length - 1}
                editingId={editingId}
                editTitle={editTitle}
                editDescription={editDescription}
                onEditTitleChange={setEditTitle}
                onEditDescriptionChange={setEditDescription}
                onStartEdit={startEdit}
                onConfirmEdit={confirmEdit}
                onCancelEdit={cancelEdit}
                onMoveUp={() => moveUp(null, section.id)}
                onMoveDown={() => moveDown(null, section.id)}
                onDelete={() => deleteItem(section.id)}
              />
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100">
            <Button variant="outline" className="w-full gap-2" onClick={addOutlineItem}>
              <Plus className="w-4 h-4" />
              新增大綱項目
            </Button>
          </div>
        </div>
      </div>

      {/* ---- Version History Panel (Google Sheets style) ---- */}
      <Dialog open={showVersionPanel} onOpenChange={handleCloseVersionPanel}>
        <DialogContent className="sm:max-w-4xl max-h-[85vh] p-0 gap-0">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle>版本紀錄</DialogTitle>
            <DialogDescription>查看歷史版本或範本，點擊預覽大綱結構後可選擇套用</DialogDescription>
          </DialogHeader>

          <div className="flex h-[60vh]">
            {/* Left: Version/Template List */}
            <div className="w-72 border-r bg-gray-50 flex flex-col">
              {/* Tab switcher */}
              <div className="flex border-b bg-white">
                <button
                  onClick={() => { setActiveTab("versions"); setSelectedVersion(null); setPreviewOutline(null); }}
                  className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${
                    activeTab === "versions" 
                      ? "text-primary border-b-2 border-primary bg-primary/5" 
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  版本紀錄
                </button>
                <button
                  onClick={() => { setActiveTab("templates"); setSelectedVersion(null); setPreviewOutline(null); }}
                  className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${
                    activeTab === "templates" 
                      ? "text-primary border-b-2 border-primary bg-primary/5" 
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  歷年範本
                </button>
              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {activeTab === "versions" ? (
                  mockVersions.map((v) => (
                    <button
                      key={v.version}
                      onClick={() => !v.isCurrent && handleSelectVersion(v.version, v.outline)}
                      disabled={v.isCurrent}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        v.isCurrent 
                          ? "border-amber-300 bg-amber-50 cursor-default"
                          : selectedVersion === v.version
                            ? "border-primary bg-primary/5"
                            : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900">{v.version}</span>
                        {v.isCurrent && (
                          <Badge className="bg-amber-500 text-white border-0 text-xs">目前</Badge>
                        )}
                      </div>
                      {v.date && <p className="text-sm text-gray-500 mt-0.5">{v.date}</p>}
                      <p className="text-sm text-gray-500">{v.operator}</p>
                    </button>
                  ))
                ) : (
                  mockTemplates.map((t) => (
                    <button
                      key={t.year}
                      onClick={() => handleSelectVersion(`template-${t.year}`, t.outline)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        selectedVersion === `template-${t.year}`
                          ? "border-primary bg-primary/5"
                          : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <span className="font-medium text-gray-900">{t.year} 年度</span>
                      <p className="text-sm text-gray-500">{t.label}</p>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Right: Preview Area */}
            <div className="flex-1 flex flex-col bg-white">
              {previewOutline ? (
                <>
                  <div className="px-6 py-3 border-b bg-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">大綱預覽</span>
                      <span className="text-sm text-gray-500">（共 {previewOutline.length} 項）</span>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6">
                    <div className="space-y-3">
                      {previewOutline.map((item) => (
                        <div key={item.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium shrink-0">
                            {item.number}
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{item.title}</h4>
                            <p className="text-sm text-gray-500 mt-0.5">{item.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="px-6 py-4 border-t bg-gray-50">
                    <Button className="w-full gap-2" onClick={handleApplyVersion}>
                      <RotateCcw className="w-4 h-4" />
                      套用此版本
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>請從左側選擇一個版本或範本</p>
                    <p className="text-sm mt-1">以預覽大綱結構</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// --------------- Section Block ---------------

function SectionBlock({
  item,
  isFirst,
  isLast,
  editingId,
  editTitle,
  editDescription,
  onEditTitleChange,
  onEditDescriptionChange,
  onStartEdit,
  onConfirmEdit,
  onCancelEdit,
  onMoveUp,
  onMoveDown,
  onDelete,
}: {
  item: OutlineItem
  isFirst: boolean
  isLast: boolean
  editingId: string | null
  editTitle: string
  editDescription: string
  onEditTitleChange: (v: string) => void
  onEditDescriptionChange: (v: string) => void
  onStartEdit: (item: OutlineItem) => void
  onConfirmEdit: () => void
  onCancelEdit: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  onDelete: () => void
}) {
  const isEditing = editingId === item.id

  return (
    <div>
      {/* section header */}
      <div className="flex items-start gap-3">
        <Check className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="space-y-2">
              <Input
                value={editTitle}
                onChange={(e) => onEditTitleChange(e.target.value)}
                className="font-semibold"
              />
              <Input
                value={editDescription}
                onChange={(e) => onEditDescriptionChange(e.target.value)}
              />
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={onConfirmEdit}>
                  儲存
                </Button>
                <Button size="sm" variant="ghost" onClick={onCancelEdit}>
                  取消
                </Button>
              </div>
            </div>
          ) : (
            <div>
              <h3 className="text-base font-semibold text-gray-900">
                {item.number}、{item.title}
                <button
                  onClick={() => onStartEdit(item)}
                  className="ml-2 text-gray-400 hover:text-gray-700 inline-flex"
                  aria-label="編輯章節"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </h3>
              <p className="text-sm text-gray-500">{item.description}</p>
            </div>
          )}
        </div>

        {/* action buttons (when not editing) */}
        {!isEditing && (
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              disabled={isFirst}
              onClick={onMoveUp}
              aria-label="上移"
            >
              <ArrowUp className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              disabled={isLast}
              onClick={onMoveDown}
              aria-label="下移"
            >
              <ArrowDown className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
              onClick={onDelete}
              aria-label="刪除章節"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* children section removed - outline now only supports single level */}
    </div>
  )
}

// --------------- tree utilities ---------------

function applyDeep(
  items: OutlineItem[],
  targetId: string,
  fn: (item: OutlineItem) => OutlineItem,
): OutlineItem[] {
  return items.map((item) => {
    if (item.id === targetId) return fn(item)
    if (item.children) {
      return { ...item, children: applyDeep(item.children, targetId, fn) }
    }
    return item
  })
}

function removeDeep(items: OutlineItem[], targetId: string): OutlineItem[] {
  return items
    .filter((item) => item.id !== targetId)
    .map((item) => {
      if (item.children) {
        return { ...item, children: removeDeep(item.children, targetId) }
      }
      return item
    })
}

function moveItem(items: OutlineItem[], targetId: string, direction: number): OutlineItem[] {
  const idx = items.findIndex((it) => it.id === targetId)
  if (idx !== -1) {
    const newIdx = idx + direction
    if (newIdx < 0 || newIdx >= items.length) return items
    const copy = [...items]
    const [removed] = copy.splice(idx, 1)
    copy.splice(newIdx, 0, removed)
    return copy
  }
  return items.map((item) => {
    if (item.children) {
      return { ...item, children: moveItem(item.children, targetId, direction) }
    }
    return item
  })
}
