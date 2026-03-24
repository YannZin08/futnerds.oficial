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

## Posições Secundárias
- [x] Adicionar coluna altPositions (JSON) no schema e migrar banco
- [x] Popular dados seed com posições alternativas realistas
- [x] Exibir posições secundárias no card ao lado da posição principal

## Jogadores
- [x] Inserir goleiros da tabela PDF no banco de dados (59 jogadores)
- [ ] Adicionar imagens dos jogadores quando enviadas
- [x] Corrigir formatação dos valores de mercado nos cards (ex: €37.5M, €925K)

## Ajustes Visuais
- [x] Corrigir fundo do rodapé para preto sólido igual à página inicial

## Correção de Duplicatas no Banco (2026-03-24)
- [x] Identificar e remover 7 jogadores duplicados do banco de dados
  - [x] Remover Dean Huijsen (manter D. Huijsen com imagem)
  - [x] Remover Álvaro Carreras (manter Á. Carreras com imagem)
  - [x] Remover M. Zaire-Emery (manter W. Zaïre-Emery com imagem)
  - [x] Remover Savinho (manter Sávio - nome correto)
  - [x] Remover Tino Livramento (manter T. Livramento com imagem)
  - [x] Remover Givairo Read (manter G. Read com imagem)
  - [x] Remover Kobbie Mainoo duplicado (manter K. Mainoo com imagem, atualizar dados)
- [x] Atualizar contador de jogadores na Home para valor dinâmico do banco

## Bug - Cor do Overall nos Cards
- [x] Corrigir lógica de cores do overall nos cards de jogadores (cor calculada dinamicamente pelo overall: gold 75+, silver 65-74, bronze <65)

## Limpeza e Correção de Dados
- [x] Remover 10 jogadores não fornecidos pelo usuário (ligas incomuns: Ucrânia, Noruega, Coreia, Polônia, Argentina, Equador, MLS, Escócia)
- [x] Remover A. Cambiaso, P. Schick e N. Nkunku (não fornecidos pelo usuário, inseridos automaticamente)

## Inserção de Jogadores Faltantes
- [x] Inserir ~71 jogadores com imagem mas sem registro no banco (total: 399 jogadores)
- [x] Corrigir ligas incorretas (Hamburg SV → Bundesliga 2, e outros)

## Ajuste de Cores dos Cards
- [x] Ajustar faixas: bronze (<75), ouro (75-89), diamante (90+) com gradiente ciano-azul-roxo e brilho especial

## Correção de Faixas de Cor dos Cards
- [x] Ajustar faixas: bronze (50-69), prata (70-79), ouro (80-89), diamante (90+)
