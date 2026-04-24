# TECH DEBT AND NEXT STEPS

## Pendencias Herdadas do Sprint 5

- adicionar smoke tests com DOM fake para renderizacao critica
- adicionar testes de integracao para onboarding
- adicionar testes de integracao para navegacao
- adicionar testes de integracao para filtros de tarefas
- adicionar testes de integracao para skip/restore de timeblocks
- avaliar desacoplar `upsertDailyHistory()` de `render.js`
- criar uma camada futura de effects/event bus se fizer sentido
- ampliar testes para storage real/localStorage mockado
- validar renderizacao em ambiente mobile/PWA

## Outras Pendencias Futuras

- corrigir acentuacao e textos PT-BR em toda a base
- refinar funcionalidades simplificadas da versao limpa
- melhorar UX do modal de blocos de tempo
- adicionar edicao de blocos existentes
- adicionar navegacao semanal no calendario
- evoluir player de foco
- evoluir alimentacao
- evoluir saude
- aplicar Visual Premium 10/10 depois da fundacao
- adicionar testes de regressao antes de grandes mudancas
- manter o `CHANGELOG.md` atualizado em cada sprint

## Priorizacao Recomendada

### Curto prazo

- smoke tests com DOM fake
- testes de integracao dos fluxos principais
- validacao mobile/PWA

### Medio prazo

- melhorar modal de blocos
- editar blocos existentes
- navegacao semanal do calendario

### Longo prazo

- Visual Premium
- event bus/effects layer, se a complexidade justificar
- maior profundidade de testes automatizados
