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
      <section className="bg-paper py-16 sm:py-24">
        <Container className="flex flex-col items-center text-center">
          <div className="relative aspect-square w-full max-w-[220px]">
            <Image
              src="/brand/vecorion-icone-navy-transparente.png"
              alt=""
              fill
              className="object-contain"
              priority
              aria-hidden="true"
            />
          </div>
          <h1 className="mt-6 text-3xl font-semibold text-ink sm:text-4xl">Loja Vecorion</h1>
          <LinkButton href="/produtos" variant="primary" className="mt-6">
            Explorar produtos
          </LinkButton>
        </Container>
      </section>
    );
  }

  return (
    <section>
      <HomeBannerCarousel banners={banners} variant="principal" />
    </section>
  );
}
