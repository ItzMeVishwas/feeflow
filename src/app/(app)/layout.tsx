import { AppMobileNav, AppSidebar } from "@/components/app-sidebar"
import { CommandPalette } from "@/components/command-palette"
import { TopBar } from "@/components/top-bar"

// No opaque background here, so the theme background and AppBackground
// (mounted once in the root layout) show through.
export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col gap-4 px-4 pt-4 pb-28 sm:px-6 sm:pt-6 md:pb-6 lg:px-8 lg:pt-8 lg:pb-8">
        <TopBar />
        <main className="flex-1">{children}</main>
      </div>
      <AppMobileNav />
      <CommandPalette />
    </div>
  )
}
