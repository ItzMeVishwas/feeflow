"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  FileText,
  LayoutDashboard,
  Menu,
  Receipt,
  Settings,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

type NavItem = {
  label: string
  href: string
  icon: LucideIcon
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Students", href: "/students", icon: Users },
  { label: "Invoices", href: "/invoices", icon: FileText },
  { label: "Bills", href: "/bills", icon: Receipt },
  { label: "Forecast", href: "/forecast", icon: TrendingUp },
  { label: "Settings", href: "/settings", icon: Settings },
]

type AppNavProps = {
  onNavigate?: () => void
}

export function AppNav({ onNavigate }: AppNavProps) {
  const pathname = usePathname()

  return (
    <div className="flex h-full flex-col gap-6">
      <div className="flex items-center gap-2 px-2">
        <span
          aria-hidden="true"
          className="size-7 rounded-md bg-emerald-600"
        />
        <span className="text-base font-semibold tracking-tight text-neutral-900">
          FeeFlow
        </span>
      </div>

      <nav aria-label="Main">
        <ul className="flex flex-col gap-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
                    isActive
                      ? "bg-emerald-50 text-emerald-700"
                      : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                  )}
                >
                  <Icon className="size-4 shrink-0" aria-hidden="true" />
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}

export function AppSidebar() {
  return (
    <aside className="hidden md:flex md:w-60 md:flex-col md:sticky md:top-0 md:h-screen md:border-r md:border-neutral-200 md:bg-white p-4">
      <AppNav />
    </aside>
  )
}

export function AppMobileNav() {
  const [open, setOpen] = useState(false)

  return (
    <div className="md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              aria-label="Open navigation"
            />
          }
        >
          <Menu className="size-5" aria-hidden="true" />
        </SheetTrigger>
        <SheetContent side="left" showCloseButton>
          <SheetHeader>
            <SheetTitle className="sr-only">Navigation</SheetTitle>
          </SheetHeader>
          <div className="px-4 pb-4">
            <AppNav onNavigate={() => setOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
