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
    <div className="group relative flex items-center gap-4 overflow-hidden rounded-2xl border border-line bg-surface p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
      <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-navy to-farol" />
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-navy text-white shadow-sm">
        <Icon size={20} aria-hidden="true" />
      </div>
      <div>
        <p className="font-mono-label text-xs uppercase text-ink-soft">{label}</p>
        <p className="text-xl font-semibold text-ink">{value}</p>
      </div>
    </div>
  );
}
