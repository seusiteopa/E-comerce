import Image from "next/image";
import Link from "next/link";
import Container from "@/components/ui/Container";
import { LinkButton } from "@/components/ui/Button";
import { BannerRow } from "@/lib/data/banners";

/**
 * Banner principal da home. Se existir banner cadastrado no admin, mostra a
 * imagem em tela cheia (com link, se houver). Se não existir nenhum ainda,
 * mostra um estado padrão simples — a loja nunca fica com um espaço vazio.
 */
export default function HomeBanner({ banners }: { banners: BannerRow[] }) {
  const banner = banners[0];

  if (!banner) {
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

  const image = (
    <div className="relative aspect-[16/7] w-full sm:aspect-[21/7]">
      <Image
        src={banner.image_url}
        alt={banner.title ?? ""}
        fill
        className="object-cover"
        priority
        sizes="100vw"
      />
    </div>
  );

  return (
    <section>
      {banner.link_url ? <Link href={banner.link_url}>{image}</Link> : image}
    </section>
  );
}
