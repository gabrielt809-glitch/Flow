# FLOW-APP-LIMPO Architecture

## Visao Geral

FLOW-APP-LIMPO e uma reconstrução modular do app FLOW em HTML, CSS e JavaScript nativo. O objetivo da fundacao tecnica foi organizar o app por camadas, centralizar estado e persistencia, proteger renders e preparar a base para evolucoes futuras sem reintroduzir legado.

O app abre localmente a partir de `index.html`, carrega `assets/styles.css` e inicializa os modulos JavaScript por `assets/js/main.js`.

## Estrutura de Pastas

```text
index.html
assets/
  styles.css
  js/
    main.js
    state.js
    schema.js
    migrations.js
    storage.js
    selectors.js
    render.js
    utils.js
    navigation.js
    onboarding.js
    overview.js
    water.js
    focus.js
    tasks.js
    calendar.js
    timeblocks.js
    health.js
    sleep.js
    food.js
    habits.js
    mood.js
    settings.js
    history.js
tests/
  run-tests.js
  utils.test.js
  selectors.test.js
  timeblocks.test.js
  storage.test.js
  state.test.js
```

## Funcao de Cada Camada

- `index.html`: estrutura do app, modais e pontos de montagem da interface.
- `assets/styles.css`: todo o CSS da aplicacao.
- `main.js`: ponto de entrada, inicializacao de modulos, bind do ciclo de render.
- `schema.js`: contrato oficial do estado, `STATE_VERSION`, `DEFAULT_STATE`, normalizacao e validacao.
- `migrations.js`: compatibilidade entre versoes de payload e formatos antigos de storage.
- `storage.js`: leitura, escrita e limpeza do `localStorage`.
- `state.js`: store central, `getState()`, `setState()`, `mutateState()`, `resetState()`, `subscribe()`.
- `selectors.js`: fonte oficial de leituras derivadas e calculos do app.
- `render.js`: orquestracao de render por escopo e fallback global.
- `utils.js`: helpers gerais de DOM, sanitizacao e utilitarios puros.
- Modulos de dominio (`water.js`, `tasks.js`, `timeblocks.js`, etc.): bind de eventos, mutacoes do estado e render da propria area.
- `tests/`: suites de regressao para funcoes puras e contratos basicos do estado.

## Fluxo de Inicializacao

1. O navegador abre `index.html`.
2. `main.js` e carregado como modulo.
3. No `DOMContentLoaded`, `initApp()` roda.
4. `initApp()` inicializa:
   - onboarding
   - navegacao
   - agua
   - foco
   - tarefas
   - calendario
   - blocos de tempo
   - saude
   - sono
   - alimentacao
   - habitos
   - humor
   - configuracoes
   - comportamento padrao de modais
5. `main.js` registra `subscribe((state, meta) => renderScopes(meta.scopes || ["all"], state))`.
6. `renderAll(getState())` roda no boot para garantir render completo inicial.

## Fluxo de Estado

1. O estado inicial e criado em `state.js` usando:
   - `loadPersistedState()`
   - fallback para `createDefaultState()`
   - `normalizeState(...)`
2. Modulos alteram dados com `mutateState()` ou `setState()`.
3. O proximo estado sempre passa por `normalizeState()`.
4. Se `persist !== false`, `storage.js` salva o estado.
5. `state.js` publica a mudanca para todos os listeners via `subscribe()`.
6. O listener principal em `main.js` chama a camada de render por escopo.

## Fluxo de Renderizacao

`render.js` e a camada oficial de renderizacao.

- `renderAll(state)` existe para boot inicial e fallback.
- `renderScopes(scopes, state)` expande dependencias entre areas.
- Cada escopo renderiza apenas os modulos necessarios.

Mapa atual de dependencias:

- `onboarding -> onboarding, navigation, overview`
- `navigation -> navigation`
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
- `all -> render completo`

Quando a mudanca nao informa escopo, o fallback continua sendo `all`.

## Fluxo de Persistencia

`storage.js` usa a chave atual:

```text
flow-app-limpo-v1
```

Formato persistido:

```json
{
  "version": 1,
  "updatedAt": "2026-04-24T00:00:00.000Z",
  "data": {}
}
```

Fluxo:

1. `persistState(state)` normaliza o estado.
2. Salva envelope com `version`, `updatedAt` e `data`.
3. `loadPersistedState()` le o JSON salvo.
4. `migrateState(payload)` aceita payload novo com envelope e payload antigo sem envelope.
5. `validateState()` e `normalizeState()` garantem formato seguro antes do uso.

## Fluxo de Selectors

`selectors.js` e a fonte oficial de dados derivados do app. Os modulos devem preferir selectors sempre que houver leitura composta ou calculo reutilizavel.

Exemplos de responsabilidades atuais:

- tarefas concluidas, filtro atual e proxima tarefa
- progresso de agua
- sono e debito de sono
- calorias do dia
- estatisticas de habitos, humor, foco e saude
- score geral e serie semanal
- ocorrencias de blocos de tempo
- eventos do calendario por data

Regra pratica:

- leitura direta simples: pode ler do `state`
- calculo derivado ou reutilizado: criar ou usar selector

## Calendario e Blocos de Tempo

### Modelo de Timeblocks

`schema.js` suporta:

- `single`
- `recurring_period`
- `recurring_forever`
- `daysOfWeek`
- `startDate`
- `endDate`
- `skippedDates`
- `allDay`

Blocos antigos com apenas `date` continuam compativeis porque `normalizeState()` converte para o formato novo.

### Geracao de Ocorrencias

`selectors.js` expõe `selectTimeblockOccurrencesForDate(state, date)`.

Essa funcao:

- resolve blocos unicos
- resolve blocos recorrentes com periodo
- resolve blocos recorrentes sem periodo
- respeita `daysOfWeek`
- respeita `startDate`
- respeita `endDate`
- respeita `skippedDates`
- respeita `allDay`

### Eventos do Calendario

`selectCalendarEventsForDate(state, date)` combina:

- tarefas com `dueDate`
- ocorrencias de timeblocks daquela data

O retorno e padronizado para o `calendar.js`, evitando duplicacao de regra na UI.

## Fluxo de Testes

O projeto usa testes leves em Node nativo, sem framework pesado.

Arquivos:

- `tests/run-tests.js`
- `tests/utils.test.js`
- `tests/selectors.test.js`
- `tests/timeblocks.test.js`
- `tests/storage.test.js`
- `tests/state.test.js`

Execucao:

```bash
npm test
```

Cobertura atual:

- utilitarios puros
- selectors importantes
- ocorrencias de timeblocks
- compatibilidade de storage legado/novo
- contrato basico de `state.js` com `scope` e `persist: false`

## Status Atual

A fundacao tecnica esta fechada em:

- estado centralizado
- persistencia versionada
- migrations compativeis
- selectors oficiais
- render por escopo
- sanitizacao e safety layer
- testes basicos de regressao

As proximas evolucoes devem priorizar testes de integracao, refinamento funcional e a futura fase Visual Premium.
