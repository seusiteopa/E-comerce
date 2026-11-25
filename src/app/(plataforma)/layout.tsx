import { requirePlatformPage } from "@/lib/platform";

/** Segunda camada de proteção: nada da plataforma é mostrado a quem não for o dono. */
export default async function PlataformaLayout({ children }: { children: React.ReactNode }) {
  await requirePlatformPage();
  return <>{children}</>;
}
