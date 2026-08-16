import Container from "@/components/ui/Container";
import { LinkButton } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <Container className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <p className="font-mono-label text-sm text-farol-deep">404</p>
      <h1 className="mt-3 text-3xl font-semibold text-ink">Página não encontrada</h1>
      <p className="mt-4 max-w-md text-sm text-ink-soft">
        O que você procura pode ter mudado de endereço. Que tal explorar o catálogo?
      </p>
      <LinkButton href="/produtos" className="mt-8">Ver produtos</LinkButton>
    </Container>
  );
}
