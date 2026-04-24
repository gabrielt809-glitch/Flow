# CODE QUALITY REPORT — SPRINT 5

## Objetivo

Adicionar uma camada de renderizacao por escopo e uma base minima de testes de regressao, sem alterar o visual ou as regras de negocio do FLOW-APP-LIMPO.

## Render Scopes

- Foi criado o arquivo `assets/js/render.js` como camada oficial de renderizacao por escopo.
- `renderAll(state)` foi mantido para o boot inicial e como fallback seguro.
- `renderScopes(scopes, state)` agora expande dependencias por dominio antes de renderizar.
- O mapa de dependencias implementado segue os escopos pedidos:
  - `water -> water, overview, history`
  - `focus -> focus, overview, history`
  - `tasks -> tasks, calendar, overview, history`
  - `calendar -> calendar`
  - `timeblocks -> timeblocks, calendar`
  - `health -> health, overview, history`
  - `sleep -> sleep, overview, history`
  - `food -> food, overview, history`
  - `habits -> habits, overview, history`
  - `mood -> mood, overview, history`
  - `settings -> settings, overview`
  - `onboarding -> onboarding, navigation, overview`
  - `navigation -> navigation`
- Quando o escopo inclui `history`, a atualizacao diaria continua passando por `upsertDailyHistory()`, sem criar loop de `subscribe`, porque essa funcao persiste direto no storage e nao dispara listeners.

## Mudancas em State

- `assets/js/state.js` passou a aceitar `options.scope` e `options.scopes` em `setState()` e `mutateState()`.
- Quando nenhum escopo e informado, o fallback continua sendo `["all"]`.
- O `subscribe()` agora recebe `meta.scopes`, que o `main.js` usa para chamar `renderScopes(meta.scopes || ["all"], state)`.

## Modulos Atualizados

Os seguintes modulos passaram a informar escopo nas mutacoes principais:

- `assets/js/water.js`
- `assets/js/focus.js`
- `assets/js/tasks.js`
- `assets/js/timeblocks.js`
- `assets/js/health.js`
- `assets/js/sleep.js`
- `assets/js/food.js`
- `assets/js/habits.js`
- `assets/js/mood.js`
- `assets/js/settings.js`
- `assets/js/onboarding.js`
- `assets/js/navigation.js`

## Tratamento de History

- O historico diario continua sendo atualizado quando um escopo dependente de `history` e renderizado.
- O timer de foco por segundo foi preservado com `persist: false` e agora usa `scope: "focus"`, evitando writes desnecessarios e impedindo que `history` rode a cada tick do contador.
- A conclusao de sessao de foco continua persistindo normalmente.

## Testes Criados

Foi criada a pasta `tests/` com um runner simples em Node nativo:

- `tests/run-tests.js`
- `tests/utils.test.js`
- `tests/selectors.test.js`
- `tests/timeblocks.test.js`
- `tests/storage.test.js`
- `tests/state.test.js`

Coberturas minimas adicionadas:

- `diffHours("23:00", "07:00") === 8`
- `percent(50, 100) === 50`
- `selectScore()` nao quebra com estado default
- `selectCalendarEventsForDate()` mostra tarefa com data
- `selectTimeblockOccurrencesForDate()` gera bloco `single`
- `selectTimeblockOccurrencesForDate()` gera bloco recorrente com periodo
- `selectTimeblockOccurrencesForDate()` respeita `skippedDates`
- `migrateState()` aceita payload antigo sem envelope
- `normalizeState()` retorna formato valido e IDs deterministas
- `mutateState()` publica `meta.scopes` e respeita `persist: false`

## Como Rodar

1. Abrir a pasta `FLOW-APP-LIMPO`
2. Executar `npm test`

O projeto agora tem um `package.json` minimo com:

- `npm test -> node tests/run-tests.js`

## Riscos Restantes

- Os testes desta sprint sao focados em funcoes puras e no contrato basico de state/storage; eles nao exercitam renderizacao real com DOM do navegador.
- Ainda nao ha cobertura automatica para fluxos completos de onboarding, navegacao e modais.
- `upsertDailyHistory()` continua acoplado ao ciclo de render fallback, o que funciona bem hoje, mas pode ser desacoplado em uma sprint futura se quisermos separar totalmente render e snapshot diario.

## Proximos Passos

- Adicionar smoke tests leves com DOM fake para validacao de renderizacao critica.
- Cobrir onboarding, filtros de tarefas e skip/restore de timeblocks em testes de integracao.
- Avaliar desacoplamento de `upsertDailyHistory()` para uma camada de efeitos/eventos.
