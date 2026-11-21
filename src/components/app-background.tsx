export default function AppBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {/* Dark: evening study glows (plum + lamp amber) */}
      <div className="hidden dark:block absolute inset-0">
        <div
          className="absolute -top-1/4 -left-1/4 h-[70%] w-[70%] rounded-full"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(42,31,61,0.55) 0%, rgba(42,31,61,0) 70%)",
            filter: "blur(80px)",
          }}
        />
        <div
          className="absolute -bottom-1/4 -right-1/4 h-[60%] w-[60%] rounded-full"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(242,169,59,0.22) 0%, rgba(242,169,59,0) 70%)",
            filter: "blur(80px)",
          }}
        />
      </div>

      {/* Light: morning mist glows (mint + sky) */}
      <div className="dark:hidden absolute inset-0">
        <div
          className="absolute -top-1/4 -left-1/4 h-[70%] w-[70%] rounded-full"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(61,217,168,0.25) 0%, rgba(61,217,168,0) 70%)",
            filter: "blur(80px)",
          }}
        />
        <div
          className="absolute -bottom-1/4 -right-1/4 h-[60%] w-[60%] rounded-full"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(124,196,240,0.30) 0%, rgba(124,196,240,0) 70%)",
            filter: "blur(80px)",
          }}
        />
      </div>
    </div>
  );
}
