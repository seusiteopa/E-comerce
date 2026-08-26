import Image from "next/image";
import Link from "next/link";

export const metadata = { title: "Sem conexão" };

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-paper px-6 text-center">
      <div className="relative h-20 w-20 opacity-80">
        <Image src="/icon-192.png" alt="" fill className="object-contain" />
      </div>
      <div>
        <h1 className="text-xl font-semibold text-ink">Você está sem conexão</h1>
        <p className="mt-2 max-w-sm text-sm text-ink-soft">
          Não conseguimos carregar esta página agora. Verifique sua internet e tente de novo — o que já foi visitado antes pode continuar disponível.
        </p>
      </div>
      <Link
        href="/"
        className="rounded-xl bg-navy px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
      >
        Tentar novamente
      </Link>
    </div>
  );
}
