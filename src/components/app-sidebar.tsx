"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, useReducedMotion } from "framer-motion"
import { useEffect, useRef, useState } from "react"
import {
  CalendarCheck,
  CalendarDays,
  FileText,
  LayoutDashboard,
  MoreHorizontal,
  Pin,
  PinOff,
  Receipt,
  Settings,
  Sparkles,
  TrendingUp,
  User,
  Users,
  type LucideIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { useStore } from "@/lib/store"
import { Logo, LogoMark } from "@/components/brand/logo"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

type NavItem = {
  label: string
  href: string
  icon: LucideIcon
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Students", href: "/students", icon: Users },
  { label: "Attendance", href: "/attendance", icon: CalendarCheck },
  { label: "Calendar", href: "/calendar", icon: CalendarDays },
  { label: "Invoices", href: "/invoices", icon: FileText },
  { label: "Bills", href: "/bills", icon: Receipt },
  { label: "Forecast", href: "/forecast", icon: TrendingUp },
  { label: "Insights", href: "/insights", icon: Sparkles },
]

// Phone bottom bar: four main tabs plus a "More" button that opens a sheet
// with the remaining pages. Hrefs and icons match navItems.
const mobileTabItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Students", href: "/students", icon: Users },
  { label: "Invoices", href: "/invoices", icon: FileText },
  { label: "Calendar", href: "/calendar", icon: CalendarDays },
]

// Pages shown in the "More" sheet on phones.
const moreNavItems: NavItem[] = [
  { label: "Attendance", href: "/attendance", icon: CalendarCheck },
  { label: "Bills", href: "/bills", icon: Receipt },
  { label: "Forecast", href: "/forecast", icon: TrendingUp },
  { label: "Insights", href: "/insights", icon: Sparkles },
  { label: "Settings", href: "/settings", icon: Settings },
]


// True for the exact route and for nested routes, e.g. "/invoices/abc".
function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function AppSidebar() {
  const pathname = usePathname()
  const reduce = useReducedMotion()
  const [pinned, setPinned] = useState(false)
  const [hoverExpanded, setHoverExpanded] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const tutorName = useStore((s) => s.settings.tutorName).trim()

  useEffect(() => {
    try {
      setPinned(window.localStorage.getItem("feeflow.sidebarPinned") === "1")
    } catch {}
  }, [])

  useEffect(() => {
    try {
      document.documentElement.style.setProperty(
        "--rail-width",
        pinned ? "15rem" : "5.5rem"
      )
    } catch {}
  }, [pinned])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  function togglePinned() {
    const next = !pinned
    setPinned(next)
    try {
      window.localStorage.setItem("feeflow.sidebarPinned", next ? "1" : "0")
    } catch {}
  }

  function onMouseEnter() {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setHoverExpanded(true), 300)
  }

  function onMouseLeave() {
    if (timerRef.current) clearTimeout(timerRef.current)
    setHoverExpanded(false)
  }

  const expanded = pinned || hoverExpanded
  const initials = tutorName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("")
  const settingsActive = isActivePath(pathname, "/settings")

  return (
    <motion.aside
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      initial={false}
      animate={{ width: expanded ? 220 : 72 }}
      transition={{ duration: reduce ? 0 : 0.25, ease: "easeOut" }}
      className="glass fixed left-4 top-4 bottom-4 z-30 hidden flex-col items-center gap-4 rounded-2xl py-4 md:flex"
    >
      <div className="flex w-full items-center justify-between px-2">
        {expanded ? <Logo markSize={32} /> : <LogoMark size={32} />}
        <button
          type="button"
          aria-label={pinned ? "Unpin sidebar" : "Pin sidebar open"}
          aria-pressed={pinned}
          onClick={togglePinned}
          className="flex size-7 shrink-0 items-center justify-center rounded-xl text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          {pinned ? (
            <PinOff className="size-4" aria-hidden="true" />
          ) : (
            <Pin className="size-4" aria-hidden="true" />
          )}
        </button>
      </div>

      <nav aria-label="Main" className="w-full px-2">
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
                    "group relative flex h-11 w-full items-center gap-3 rounded-xl px-2.5 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    isActive
                      ? "text-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {isActive && (
                    <motion.span
                      layoutId="nav-pill-desktop"
                      className="absolute inset-0 -z-0 rounded-xl bg-[#1E3A6E]/10 dark:bg-white/10"
                      aria-hidden="true"
                      transition={{ duration: reduce ? 0 : 0.2 }}
                    />
                  )}
                  <Icon className="relative z-10 size-5 shrink-0" aria-hidden="true" />
                  <span
                    className={cn(
                      "relative z-10 whitespace-nowrap text-sm transition-opacity",
                      expanded ? "opacity-100" : "opacity-0"
                    )}
                  >
                    {item.label}
                  </span>
                  {!expanded && (
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute left-full top-1/2 z-40 ml-3 -translate-y-1/2 whitespace-nowrap rounded-xl glass px-2.5 py-1 text-xs font-medium text-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
                    >
                      {item.label}
                    </span>
                  )}
                </Link>

              </li>
            )
          })}
        </ul>
      </nav>

      <div aria-hidden="true" className="h-px w-8 bg-border" />

      <div className="mt-auto flex w-full flex-col items-center gap-3 px-2">
        <Link
          href="/settings"
          aria-current={settingsActive ? "page" : undefined}
          className={cn(
            "group relative flex h-11 w-full items-center gap-3 rounded-xl px-2.5 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
            settingsActive
              ? "bg-primary text-primary-foreground shadow-[0_0_20px_-4px_rgba(242,169,59,0.55)]"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <Settings className="size-5 shrink-0" aria-hidden="true" />
          <span
            className={cn(
              "whitespace-nowrap text-sm transition-opacity",
              expanded ? "opacity-100" : "opacity-0"
            )}
          >
            Settings
          </span>
          {!expanded && (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute left-full top-1/2 z-40 ml-3 -translate-y-1/2 whitespace-nowrap rounded-xl glass px-2.5 py-1 text-xs font-medium text-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
            >
              Settings
            </span>
          )}
        </Link>

        <Link
          href="/settings"
          aria-label={tutorName ? `Settings, ${tutorName}` : "Settings"}
          className="group relative flex size-9 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {initials ? initials : <User className="size-4" aria-hidden="true" />}
          <span
            aria-hidden="true"
            className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-[#3DD9A8] ring-2 ring-background"
          />
          <span className="sr-only">Pro trial</span>
          {!expanded && (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute left-full top-1/2 z-40 ml-3 -translate-y-1/2 whitespace-nowrap rounded-xl glass px-2.5 py-1 text-xs font-medium text-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
            >
              Pro trial
            </span>
          )}
        </Link>
      </div>
    </motion.aside>
  )
}

export function AppMobileNav() {
  const pathname = usePathname()
  const reduce = useReducedMotion()
  const [moreOpen, setMoreOpen] = useState(false)
  const moreActive = moreNavItems.some((item) =>
    isActivePath(pathname, item.href)
  )

  return (
    <>
      <nav
        aria-label="Main"
        className="glass fixed inset-x-4 bottom-4 z-40 rounded-2xl p-2 md:hidden"
      >
        <ul className="grid grid-cols-5 gap-1">
          {mobileTabItems.map((item) => {
            const Icon = item.icon
            const isActive = isActivePath(pathname, item.href)
            return (
              <li key={item.href} className="min-w-0">
                <Link
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "relative flex min-h-11 w-full flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5 text-[11px] font-medium transition-colors outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F2A93B]",
                    isActive
                      ? "text-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {isActive && (
                    <motion.span
                      layoutId="nav-pill-mobile"
                      className="absolute inset-0 -z-0 rounded-xl bg-[#1E3A6E]/10 dark:bg-white/10"
                      aria-hidden="true"
                      transition={{ duration: reduce ? 0 : 0.2 }}
                    />
                  )}
                  <Icon className="relative z-10 size-5 shrink-0" aria-hidden="true" />
                  <span className="relative z-10 max-w-full truncate">{item.label}</span>
                </Link>
              </li>
            )
          })}
          <li className="min-w-0">
            <button
              type="button"
              aria-haspopup="dialog"
              aria-expanded={moreOpen}
              onClick={() => setMoreOpen(true)}
              className={cn(
                "flex min-h-11 w-full flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5 text-[11px] font-medium transition-colors outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F2A93B]",
                moreActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <MoreHorizontal className="size-5 shrink-0" aria-hidden="true" />
              <span className="max-w-full truncate">More</span>
            </button>
          </li>
        </ul>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl pb-4">
          <SheetHeader>
            <SheetTitle>More</SheetTitle>
          </SheetHeader>
          <nav aria-label="More pages" className="px-2">
            <ul className="flex flex-col gap-1">
              {moreNavItems.map((item) => {
                const Icon = item.icon
                const isActive = isActivePath(pathname, item.href)
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={isActive ? "page" : undefined}
                      onClick={() => setMoreOpen(false)}
                      className={cn(
                        "flex h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F2A93B]",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <Icon className="size-5 shrink-0" aria-hidden="true" />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>
        </SheetContent>
      </Sheet>
    </>
  )
}

