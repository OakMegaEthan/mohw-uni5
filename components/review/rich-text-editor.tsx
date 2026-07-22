"use client"

import type React from "react"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Link from "@tiptap/extension-link"
// @tiptap/extension-table v3 只提供具名匯出，無 default
import { Table } from "@tiptap/extension-table"
import TableRow from "@tiptap/extension-table-row"
import TableCell from "@tiptap/extension-table-cell"
import TableHeader from "@tiptap/extension-table-header"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import {
  Bold,
  Italic,
  UnderlineIcon,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  LinkIcon,
  TableIcon,
  Eraser,
  Upload,
  Eye,
  Edit3,
} from "lucide-react"
import { useState, useEffect, useCallback } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  label?: string
}

export function RichTextEditor({ value, onChange, placeholder, label }: RichTextEditorProps) {
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit")
  const [linkDialogOpen, setLinkDialogOpen] = useState(false)
  const [linkUrl, setLinkUrl] = useState("")
  const [wordCount, setWordCount] = useState(0)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      onChange(html)
      setWordCount(editor.getText().length)
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[200px] max-w-none p-4",
      },
    },
  })

  // Auto-save draft every 30 seconds
  useEffect(() => {
    if (!editor) return

    const interval = setInterval(() => {
      const content = editor.getHTML()
      // Save to localStorage or backend
      localStorage.setItem("rich-text-draft", content)
      console.log("[v0] Draft auto-saved")
    }, 30000)

    return () => clearInterval(interval)
  }, [editor])

  // Load draft on mount
  useEffect(() => {
    if (!editor) return

    const draft = localStorage.getItem("rich-text-draft")
    if (draft && !value) {
      editor.commands.setContent(draft)
    }
  }, [editor, value])

  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file) return

      if (!file.name.endsWith(".docx") && !file.name.endsWith(".doc")) {
        alert("請上傳 Word 文件（.doc 或 .docx）")
        return
      }

      // Mock conversion - in production, use mammoth.js or similar
      const reader = new FileReader()
      reader.onload = () => {
        // Simulate Word content conversion
        const mockContent = `<h2>從 Word 匯入的內容</h2><p>檔案名稱：${file.name}</p><p>這裡會顯示從 Word 文件轉換的內容。在實際環境中，會使用 mammoth.js 或類似工具進行轉換。</p>`
        editor?.commands.setContent(mockContent)
        alert("Word 文件已成功匯入")
      }
      reader.readAsArrayBuffer(file)
    },
    [editor],
  )

  const addLink = useCallback(() => {
    if (!linkUrl) return
    editor?.chain().focus().setLink({ href: linkUrl }).run()
    setLinkDialogOpen(false)
    setLinkUrl("")
  }, [editor, linkUrl])

  if (!editor) {
    return null
  }

  return (
    <div className="space-y-2">
      {label && <Label className="text-gray-700 font-medium">{label}</Label>}

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "edit" | "preview")}>
        <div className="flex items-center justify-between mb-2">
          <TabsList>
            <TabsTrigger value="edit" className="flex items-center gap-1">
              <Edit3 className="w-4 h-4" />
              編輯
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              預覽
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">{wordCount} 字</span>
            <label htmlFor="word-upload">
              <Button type="button" variant="outline" size="sm" asChild>
                <span>
                  <Upload className="w-4 h-4 mr-2" />
                  上傳 Word
                </span>
              </Button>
              <input id="word-upload" type="file" accept=".doc,.docx" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>
        </div>

        <TabsContent value="edit" className="mt-0">
          {/* Toolbar */}
          <div className="border rounded-t-lg bg-gray-50 p-2 flex flex-wrap gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              className={editor.isActive("heading", { level: 1 }) ? "bg-gray-200" : ""}
            >
              <Heading1 className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              className={editor.isActive("heading", { level: 2 }) ? "bg-gray-200" : ""}
            >
              <Heading2 className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              className={editor.isActive("heading", { level: 3 }) ? "bg-gray-200" : ""}
            >
              <Heading3 className="w-4 h-4" />
            </Button>

            <div className="w-px h-6 bg-gray-300 mx-1" />

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={editor.isActive("bold") ? "bg-gray-200" : ""}
            >
              <Bold className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={editor.isActive("italic") ? "bg-gray-200" : ""}
            >
              <Italic className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleStrike().run()}
              className={editor.isActive("strike") ? "bg-gray-200" : ""}
            >
              <UnderlineIcon className="w-4 h-4" />
            </Button>

            <div className="w-px h-6 bg-gray-300 mx-1" />

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={editor.isActive("bulletList") ? "bg-gray-200" : ""}
            >
              <List className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={editor.isActive("orderedList") ? "bg-gray-200" : ""}
            >
              <ListOrdered className="w-4 h-4" />
            </Button>

            <div className="w-px h-6 bg-gray-300 mx-1" />

            <Button type="button" variant="ghost" size="sm" onClick={() => setLinkDialogOpen(true)}>
              <LinkIcon className="w-4 h-4" />
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
            >
              <TableIcon className="w-4 h-4" />
            </Button>

            <div className="w-px h-6 bg-gray-300 mx-1" />

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
            >
              <Eraser className="w-4 h-4" />
            </Button>
          </div>

          {/* Editor Content */}
          <div className="border border-t-0 rounded-b-lg bg-white">
            <EditorContent editor={editor} />
          </div>
        </TabsContent>

        <TabsContent value="preview" className="mt-0">
          <div className="border rounded-lg bg-white p-6 min-h-[300px]">
            <div
              className="prose prose-sm sm:prose lg:prose-lg xl:prose-2xl max-w-none"
              dangerouslySetInnerHTML={{ __html: editor.getHTML() }}
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* Link Dialog */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>插入連結</DialogTitle>
            <DialogDescription>請輸入連結網址</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="https://example.com"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  addLink()
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={addLink}>確認</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
