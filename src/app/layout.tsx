import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import SeedOnFirstVisit from "../components/seed-on-first-visit";
import { ThemeProvider } from "../components/theme-provider";
import { TooltipProvider } from "../components/ui/tooltip";
import { Toaster } from "../components/ui/sonner";
import AppBackground from "../components/app-background";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "FeeFlow, fees and cash flow for home tutors",
  description:
    "FeeFlow helps home tutors in India send WhatsApp reminders, share UPI pay links and plan with a 90-day cash forecast.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${jakarta.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <TooltipProvider>
            <AppBackground />
            <SeedOnFirstVisit />
            {children}
            <Toaster />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
