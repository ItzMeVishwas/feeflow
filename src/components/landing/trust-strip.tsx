import { MessageCircle, ShieldCheck, Smartphone } from "lucide-react";

const items = [
  { icon: ShieldCheck, label: "Your data stays on your device" },
  { icon: Smartphone, label: "Works with any UPI app" },
  { icon: MessageCircle, label: "Built around WhatsApp" },
];

export function TrustStrip() {
  return (
    <section aria-label="Why FeeFlow" className="mx-auto max-w-5xl px-5 sm:px-8">
      <ul className="grid gap-3 sm:grid-cols-3">
        {items.map(({ icon: Icon, label }) => (
          <li
            key={label}
            className="glass flex items-center gap-3 rounded-xl px-4 py-3"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#3DD9A8]/15 text-[#3DD9A8]">
              <Icon className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="text-sm font-medium">{label}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
