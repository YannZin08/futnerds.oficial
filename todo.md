# FUTNERDS - TODO

## Fase 1: Setup e Banco de Dados
- [x] Upload do logo para CDN
- [x] Schema do banco de dados (users, posts, players, news)
- [x] Migração SQL aplicada

## Fase 2: Design System e Layout Global
- [x] Paleta de cores FIFA (verde #22c55e, branco, tons escuros) em index.css
- [x] Fonte moderna (Inter/Rajdhani) via Google Fonts
- [x] Navbar global com logo FUTNERDS
- [x] Footer global
- [x] Página Home (landing page) com hero, features, CTA

## Fase 3: Autenticação
- [x] Tela de Login com email/senha (via Manus OAuth)
- [x] Tela de Cadastro com email/senha (via Manus OAuth)
- [x] Rotas protegidas para usuários autenticados
- [x] Dashboard do usuário autenticado
- [x] Perfil do usuário

## Fase 4: Conteúdo FIFA
- [x] Página de Notícias FIFA (Ultimate Team, patches, modos de jogo)
- [x] Página de Análise de Jogadores com estatísticas
- [x] Página de Times com análise
- [x] Dados seed de notícias e jogadores no banco

## Fase 5: Testes e Entrega
- [x] Testes Vitest para routers principais (14 testes passando)
- [x] Checkpoint final
- [x] Entrega ao usuário

## Simplificação (solicitado pelo usuário)
- [x] Remover página de Notícias e rota /noticias
- [x] Remover página de Dashboard e rota /dashboard
- [x] Remover links de Notícias e Dashboard da Navbar
- [x] Remover links de Notícias e Dashboard do Footer
- [x] Remover seção de Notícias da Home
- [x] Remover seção de preview de jogadores da Home (manter foco no CTA)
- [x] Remover routers de news do servidor (manter no banco para uso futuro)
- [x] Ajustar App.tsx removendo rotas desnecessárias

## Correções
- [x] Corrigir 404 na rota /noticias — adicionar redirect para Home
- [x] Corrigir 404 na rota /dashboard — adicionar redirect para Home

## Melhorias de Cards
- [x] Adicionar overall, potencial e idade nos cards de jogadores
