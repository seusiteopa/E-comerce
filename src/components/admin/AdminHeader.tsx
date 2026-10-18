import Link from "next/link";
import { getCurrentStore } from "@/lib/store/current";

export default async function AdminHeader({ title }: { title: string }) {
  const store = await getCurrentStore();
  return (
    <header className="flex h-16 items-center justify-between border-b border-line bg-surface px-5 sm:px-8">
      <h1 className="text-lg font-semibold text-ink">{title}</h1>
      <Link href={`/lojas/${store.slug}`} className="text-xs font-medium text-navy hover:underline">
        Ver loja
      </Link>
    </header>
  );
}
