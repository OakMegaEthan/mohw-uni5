import type { DocContent, ComparisonContent } from "@/lib/mock/filing-upload-content"

// 單一份文件內容的呈現（情境無關，填報與審查共用）
export function DocumentPane({ content }: { content: DocContent }) {
  return (
    <article className="mx-auto max-w-3xl px-6 py-6">
      <p className="mb-6 text-sm font-medium text-muted-foreground">{content.meta}</p>
      <div className="flex flex-col gap-6">
        {content.sections.map((section, index) => (
          <section key={index}>
            <h3 className="mb-2 text-lg font-semibold text-foreground">{section.heading}</h3>
            <p className="whitespace-pre-wrap text-base leading-relaxed text-muted-foreground">{section.body}</p>
          </section>
        ))}
      </div>
    </article>
  )
}

// 修正對照表的呈現（情境無關，填報與審查共用）
export function ComparisonPane({ content }: { content: ComparisonContent }) {
  return (
    <div className="mx-auto max-w-4xl px-6 py-6">
      <div className="overflow-hidden rounded-lg border">
        <table className="w-full border-collapse text-base">
          <thead>
            <tr className="bg-muted/60 text-left">
              <th className="w-40 border-b px-4 py-3 font-semibold">修正項目</th>
              <th className="border-b px-4 py-3 font-semibold">修正前</th>
              <th className="border-b px-4 py-3 font-semibold">修正後</th>
              <th className="w-48 border-b px-4 py-3 font-semibold">說明</th>
            </tr>
          </thead>
          <tbody>
            {content.rows.map((row, index) => (
              <tr key={index} className="align-top">
                <td className="border-b px-4 py-3 font-medium text-foreground">{row.item}</td>
                <td className="border-b px-4 py-3 text-muted-foreground">{row.before}</td>
                <td className="border-b px-4 py-3 text-foreground">{row.after}</td>
                <td className="border-b px-4 py-3 text-sm text-muted-foreground">{row.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
