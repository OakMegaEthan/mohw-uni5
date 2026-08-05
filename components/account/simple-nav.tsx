"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Users, FileText, FilePlus2, Megaphone, ShieldCheck } from "lucide-react"

const navItems = [
  {
    title: "填報項目管理",
    href: "/admin/outline-management",
    icon: FileText,
  },
  {
    title: "使用者管理",
    href: "/account/users",
    icon: Users,
  },
  {
    title: "角色模板管理",
    href: "/account/role-templates",
    icon: ShieldCheck,
  },
  {
    title: "公告文件製作",
    href: "/announcement-documents",
    icon: FilePlus2,
  },
  {
    title: "站內公告管理",
    href: "/announcement-management",
    icon: Megaphone,
  },
]

export function SimpleNav() {
  const pathname = usePathname()

  return (
    <nav className="border-b border-border bg-background">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-6">
          <div className="flex gap-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 px-4 py-4 text-sm font-medium transition-colors border-b-2",
                    isActive
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.title}
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </nav>
  )
}
