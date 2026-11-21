const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
})

// Formats a number as Indian rupees, e.g. 150000 -> "₹1,50,000.00".
export function formatINR(amount: number): string {
  return inrFormatter.format(amount)
}
