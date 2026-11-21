"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  FileText,
  LayoutDashboard,
  Receipt,
  Settings,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"

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

// Bills is desktop-only, so the bottom bar shows the other five items.
const mobileNavItems = navItems.filter((item) => item.href !== "/bills")

// True for the exact route and for nested routes, e.g. "/invoices/abc".
function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function AppNav() {
  const pathname = usePathname()

  return (
    <div className="flex h-full flex-col gap-6">
      <div className="flex items-center gap-2 px-2">
        <span aria-hidden="true" className="size-7 rounded-md bg-primary" />
        <span className="font-heading text-lg font-semibold tracking-tight text-foreground">
          FeeFlow
        </span>
      </div>

      <nav aria-label="Main">
        <ul className="flex flex-col gap-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = isActivePath(pathname, item.href)
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-full px-3 py-2 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
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
    <aside className="glass hidden rounded-2xl p-4 md:sticky md:top-4 md:m-4 md:flex md:h-[calc(100vh-2rem)] md:w-60 md:shrink-0 md:flex-col">
      <AppNav />
    </aside>
  )
}

export function AppMobileNav() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Main"
      className="glass fixed inset-x-4 bottom-4 z-40 rounded-2xl p-2 md:hidden"
    >
      <ul className="grid grid-cols-5 gap-1">
        {mobileNavItems.map((item) => {
          const Icon = item.icon
          const isActive = isActivePath(pathname, item.href)
          return (
            <li key={item.href} className="min-w-0">
              <Link
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5 text-xs font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="size-5 shrink-0" aria-hidden="true" />
                <span className="truncate">{item.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
