-- ============================================================================
-- Seed de desenvolvimento — categorias iniciais (briefing, Seção 10)
-- Não inclui produtos reais: cadastro é manual pelo admin (Etapa 1, confirmado).
-- ============================================================================

insert into categories (slug, name, description, product_type, parent_slug, display_order) values
  ('produtos-fisicos', 'Produtos Físicos', 'Vestuário, acessórios e itens da marca Vecorion.', 'fisico', null, 1),
  ('vestuario', 'Vestuário', 'Camisetas, bonés e peças com a identidade Vecorion.', 'fisico', 'produtos-fisicos', 1),
  ('acessorios', 'Acessórios', 'Canecas e objetos de uso diário.', 'fisico', 'produtos-fisicos', 2),

  ('produtos-digitais', 'Produtos Digitais', 'E-books, templates, prompts e kits digitais.', 'digital', null, 2),
  ('templates', 'Templates', 'Modelos prontos para usar em seus projetos.', 'digital', 'produtos-digitais', 1),
  ('ebooks', 'E-books', 'Materiais educativos em formato digital.', 'digital', 'produtos-digitais', 2),

  ('cursos', 'Cursos', 'Formações e treinamentos Vecorion.', 'curso', null, 3),
  ('cursos-tecnologia', 'Tecnologia', 'Cursos de tecnologia e ferramentas digitais.', 'curso', 'cursos', 1),
  ('cursos-ia', 'Inteligência Artificial', 'Cursos sobre IA aplicada.', 'curso', 'cursos', 2),

  ('servicos', 'Serviços', 'Sites, sistemas e soluções sob medida.', 'servico', null, 4)
on conflict (slug) do nothing;

insert into site_settings (key, value) values
  ('whatsapp_number', '5519991892801'),
  ('contact_email', 'contato@vecorion.com.br'),
  ('instagram_url', 'https://instagram.com/vecorion')
on conflict (key) do nothing;
