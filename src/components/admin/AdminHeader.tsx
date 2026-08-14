import Link from "next/link";

export default function AdminHeader({ title }: { title: string }) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-line bg-surface px-5 sm:px-8">
      <h1 className="text-lg font-semibold text-ink">{title}</h1>
      <Link href="/" className="text-xs font-medium text-navy hover:underline">
        Ver loja
      </Link>
    </header>
  );
}
