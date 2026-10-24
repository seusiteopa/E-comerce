import Image from "next/image";
import Container from "@/components/ui/Container";
import { LinkButton } from "@/components/ui/Button";
import { BannerRow } from "@/lib/data/banners";
import HomeBannerCarousel from "@/components/loja/HomeBannerCarousel";

/**
 * Banner principal da home. Se existir banner cadastrado no admin, mostra
 * um carrossel (foto ou vídeo, girando automaticamente se houver mais de
 * uma mídia). Se não existir nenhum ainda, mostra um estado padrão simples
 * — a loja nunca fica com um espaço vazio.
 */
export default function HomeBanner({ banners }: { banners: BannerRow[] }) {
  if (banners.length === 0) {
    return (
      <section className="relative overflow-hidden bg-navy-deep py-16 text-white sm:py-28">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(232,163,62,0.18),transparent_60%)]" />
        <Container className="relative flex flex-col items-center text-center">
          <div className="relative aspect-square w-full max-w-[200px]">
            <Image
              src="/brand/vecorion-icone-navy-transparente.png"
              alt=""
              fill
              className="object-contain drop-shadow-[0_0_24px_rgba(255,255,255,0.25)]"
              priority
              aria-hidden="true"
            />
          </div>
          <h1 className="mt-6 text-3xl font-semibold sm:text-5xl">Vecorion</h1>
          <p className="mt-3 max-w-md text-sm text-white/75 sm:text-base">Produtos e experiências escolhidos para você.</p>
          <LinkButton href="/produtos" variant="primary" className="mt-8 !bg-farol !text-navy-deep hover:!bg-farol-deep">
            Explorar produtos
          </LinkButton>
        </Container>
      </section>
    );
  }

  return (
    <section className="pt-4 sm:pt-6">
      <Container>
        <HomeBannerCarousel banners={banners} variant="principal" />
      </Container>
    </section>
  );
}
