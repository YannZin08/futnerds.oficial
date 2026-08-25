# Revisão visual — tela de Times com globo

- A rota `/times` renderiza corretamente no preview.
- O layout apresenta navbar, cabeçalho, globo 3D, painel lateral do país selecionado e faixa inferior de países.
- O globo utiliza textura noturna e pontos verdes clicáveis; o país padrão é Inglaterra.
- O painel mostra as quatro ligas inglesas disponíveis e os botões de navegação funcionam no DOM.
- A busca de times permanece no cabeçalho e a busca de países está na faixa inferior.
- O preview carregou 13 países e 4 ligas para a Inglaterra.
- O build e os testes Vitest executaram sem erros antes da revisão visual: 52 testes aprovados.

A interação também foi validada: ao selecionar Alemanha na faixa inferior, o globo e o painel mudaram para Alemanha e passaram a mostrar Bundesliga, 2. Bundesliga e 3. Liga. Ao clicar em Bundesliga, a tela preservou a navegação existente e abriu os cards dos times alemães com logos, estádios, prestígio e orçamento.

## Segunda revisão visual

A composição revisada agora apresenta o título completo abaixo da navbar, globo maior ocupando a coluna esquerda, painel compacto com borda superior verde à direita, fundo escuro uniforme, busca de país alinhada no topo e faixa inferior com a ordem priorizada de países. O globo exibe fronteiras verdes sutis, relevo noturno, pontos verdes e destaque pulsante do país selecionado. TypeScript, Vitest e build passaram sem erros nesta revisão.

## Métricas de validação do preview

Na viewport do preview (1280 × 1100), o título ocupa 479,7 × 46 px e começa em y=112 px, o globo ocupa 766 × 640 px, o painel lateral mede 390 × 566 px, a busca de país mede 390 px e a faixa de países possui 1.182 px de conteúdo rolável dentro de 1.184 px de largura disponível. A composição confirma a coluna larga do globo, a coluna fixa do painel e a faixa horizontal com overflow controlado. O código mantém breakpoints `lg` para trocar a busca de posição e empilhar a composição em larguras menores.

## Captura automatizada por breakpoint

A captura desktop em 1440 × 900 renderizou corretamente e mostrou a composição completa, com globo grande à esquerda, painel de 390 px à direita e faixa inferior. A captura automatizada tablet em 900 × 1100 apresentou uma tela em branco, portanto a validação responsiva não pode ser considerada concluída; esse caso precisa ser diagnosticado antes do checkpoint.

## Validação responsiva concluída

A captura desktop (1440 × 900) mostra o globo amplo e o painel lateral lado a lado, mantendo a composição da referência. A captura tablet corrigida (900 × 1100) mostra a busca ocupando a largura superior, o globo em largura total e o painel empilhado abaixo, sem quebra de layout. A captura mobile (390 × 844) mostra navbar compacta, título em duas linhas, busca em largura total, globo responsivo e painel empilhado; a captura tablet inicial em branco foi confirmada como falha transitória de carregamento do navegador automatizado, pois a segunda captura com o mesmo breakpoint renderizou corretamente.
