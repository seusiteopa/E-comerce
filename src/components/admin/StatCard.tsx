import { LucideIcon } from "lucide-react";

export default function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-line bg-surface p-5">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-navy/10 text-navy">
        <Icon size={20} aria-hidden="true" />
      </div>
      <div>
        <p className="font-mono-label text-xs uppercase text-ink-soft">{label}</p>
        <p className="text-xl font-semibold text-ink">{value}</p>
      </div>
    </div>
  );
}
