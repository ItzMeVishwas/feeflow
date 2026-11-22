// Page-shaped placeholder shown while the persisted store loads on the client.
// Contains no text, only shimmering blocks that match the real page layout.
export function SkeletonPage() {
  return (
    <div role="status" aria-busy="true" aria-label="Loading" className="space-y-8">
      <div className="space-y-3">
        <div className="skeleton h-8 w-56 max-w-full rounded-xl" />
        <div className="skeleton h-3.5 w-80 max-w-full rounded-lg" />
      </div>

      <div className="skeleton h-[180px] rounded-3xl" />

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="skeleton h-24 rounded-3xl" />
        <div className="skeleton h-24 rounded-3xl" />
        <div className="skeleton h-24 rounded-3xl" />
      </div>
    </div>
  )
}
