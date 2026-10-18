# Critérios de conclusão — atualização da plataforma (pacote release/tudo)

Estado em relação às 13 etapas combinadas. "Pronto" = implementado, validado no build e testado na prévia.

| Etapa | Tema | Estado | Falta para concluir |
|---|---|---|---|
| 1 | Rotas por loja (`/lojas/<loja>/...`) e isolamento | Pronto | — |
| 2 | Minhas lojas e painel por loja | Pronto (aguarda teste do dono) | Confirmar teste no pacote |
| 3 | Personalização (cores, ordem da home, destaques, banners) | Pronto | — |
| 4 | Compra e pagamento | Parcial | Cartão de produtos (diagnóstico), frete e entrega física |
| 5 | Compartilhamento | Pronto | — |
| 6 | Prévias (OG) por loja e produto | Pronto | — |
| 7 | Painel do lojista (produtos, pedidos, clientes, cupons) | Pronto | — |
| 8 | Central de divulgação (briefings e campanhas de texto) | Pronto (texto) | Imagens (depende da ferramenta escolhida) |
| 9 | Integração com gerador de imagens | Não iniciada | Ferramenta e interface a definir |
| 10 | Assinaturas por loja | Parcial | Pix Automático (não confirmado na API); conferência do desconto automático |
| 11 | Métricas | Pronto | — |
| 12 | Segurança, qualidade e testes | Parcial | Balcão (alteração de pagamento) e demais chaves de serviço listadas como sistema |
| 13 | Critérios e documentação | Pronto (este arquivo) | Fechar após as pendências acima |

## Pendências que exigem aprovação do dono da plataforma
- Regra do banco para o Balcão alterar o pagamento (campo `external_reference` do Pix).
- Ajuste automático da mensalidade com desconto de indicação (após conferência manual da primeira cobrança).
- Tabela de imagens da central de divulgação (se a ferramenta exigir armazenamento próprio).

## Pendências técnicas
- Variáveis `MP_CLIENT_ID` e `MP_CLIENT_SECRET` com escopo de prévia (Builds, Functions e Runtime).
- Diagnóstico da recusa do cartão de produtos (motivo registrado nos logs na próxima tentativa).

## Verificação mínima antes de publicar na `main`
1. `npm test` passa.
2. `npx tsc --noEmit` passa.
3. `npm run build` passa.
4. Lojas de clientes existentes (Lanche, Dtbb, Pama Kakis, Sativo) decidem: liberar ou exigir autorização da mensalidade.
