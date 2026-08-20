# Revisão visual — tela de Times com globo

- A rota `/times` renderiza corretamente no preview.
- O layout apresenta navbar, cabeçalho, globo 3D, painel lateral do país selecionado e faixa inferior de países.
- O globo utiliza textura noturna e pontos verdes clicáveis; o país padrão é Inglaterra.
- O painel mostra as quatro ligas inglesas disponíveis e os botões de navegação funcionam no DOM.
- A busca de times permanece no cabeçalho e a busca de países está na faixa inferior.
- O preview carregou 13 países e 4 ligas para a Inglaterra.
- O build e os testes Vitest executaram sem erros antes da revisão visual: 52 testes aprovados.

A interação também foi validada: ao selecionar Alemanha na faixa inferior, o globo e o painel mudaram para Alemanha e passaram a mostrar Bundesliga, 2. Bundesliga e 3. Liga. Ao clicar em Bundesliga, a tela preservou a navegação existente e abriu os cards dos times alemães com logos, estádios, prestígio e orçamento.
