// Brand mark: a rounded amber tile with a wave-topped "F" (no hooks, server-safe).
export function LogoMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <div
      className={"relative shrink-0 select-none overflow-hidden " + (className ?? "")}
      style={{
        width: size,
        height: size,
        borderRadius: (size * 9) / 32,
        background: "linear-gradient(135deg, #F2A93B 0%, #E8792B 100%)",
      }}
      aria-hidden="true"
    >
      <span
        className="pointer-events-none absolute left-0 right-0 top-0"
        style={{
          height: "50%",
          background: "linear-gradient(rgba(255,255,255,0.35), rgba(255,255,255,0))",
        }}
      />
      <svg
        viewBox="0 0 32 32"
        width={size}
        height={size}
        aria-hidden="true"
        focusable="false"
        className="absolute inset-0"
      >
        <rect x="10" y="8" width="4.2" height="16" rx="2.1" fill="#1A1206" />
        <rect x="10" y="15" width="9" height="3.6" rx="1.8" fill="#1A1206" />
        <path
          d="M10 10 C 13 6.5, 16 13.5, 19 10 S 24 6.5, 25 10"
          fill="none"
          stroke="#1A1206"
          strokeWidth="4.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}

// Mark plus the "FeeFlow" wordmark, laid out in a row.
export function Logo({ className, markSize = 32 }: { className?: string; markSize?: number }) {
  return (
    <div className={"flex items-center gap-2.5 " + (className ?? "")}>
      <LogoMark size={markSize} />
      <span className="font-heading text-lg font-semibold tracking-tight text-foreground whitespace-nowrap">
        FeeFlow
      </span>
    </div>
  )
}
