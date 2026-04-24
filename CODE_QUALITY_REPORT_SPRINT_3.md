# Code Quality Report Sprint 3

## Selectors criados

Foi criado `assets/js/selectors.js` com a camada oficial de leituras e calculos derivados:

- `selectTodayKey()`
- `selectCompletedTasks(state)`
- `selectTaskStats(state)`
- `selectVisibleTasks(state)`
- `selectNextTask(state)`
- `selectWaterProgress(state)`
- `selectSleepToday(state)`
- `selectFoodCaloriesToday(state)`
- `selectHabitStatsToday(state)`
- `selectMoodToday(state)`
- `selectFocusStatsToday(state)`
- `selectHealthStatsToday(state)`
- `selectCalendarEventsForDate(state, date)`
- `selectWeeklyScoreSeries(state)`
- `selectScore(state)`

## Modulos atualizados

- `overview.js`
- `history.js`
- `calendar.js`
- `tasks.js`
- `water.js`
- `sleep.js`
- `food.js`
- `habits.js`
- `health.js`
- `focus.js`
- `state.js`

## Calculos removidos de modulos

- O score agora tem fonte oficial em `selectors.js`.
- A serie semanal agora tem fonte oficial em `selectors.js`.
- `overview.js` deixou de recalcular manualmente agua, tarefas, foco, sono, comida, habitos, humor e saude.
- `calendar.js` deixou de montar sua propria logica de eventos e passou a usar `selectCalendarEventsForDate()`.
- `tasks.js` passou a usar `selectVisibleTasks()` para respeitar o filtro atual.
- `state.js` passou a usar selectors em `upsertDailyHistory()`.

## Ajustes em safeHTML/safeText/createElement

- Onde era texto simples, o render foi movido para `safeText()` em varios pontos do overview, foco, sono e saude.
- `safeHTML()` foi mantido para listas e blocos de markup controlado.
- Nos fluxos criticos, os dados do usuario continuam escapados com `escapeHTML()` antes de entrar em `safeHTML()`.

## Ajustes em qs/optionalQs

- `qs()` continua sendo o seletor obrigatorio.
- `optionalQs()` passou a ser usado onde a leitura e defensiva, como em alguns pontos de barra/progresso e helpers de render.
- Isso reduz o risco de quebra quando um seletor nao for estritamente obrigatorio.

## Riscos restantes

- Ainda existem renders com `safeHTML()` para estruturas de lista; embora os dados de usuario estejam escapados, uma migracao futura para `createElement()` reduziria ainda mais o risco.
- `getStreak()` continua em `history.js`; ele ja usa a mesma base de score/snapshot, mas ainda pode ser movido para selectors numa rodada futura se quisermos concentrar 100% dos derivados.
- Ainda faltam testes automatizados de browser para smoke completo da app.

## Proximos passos

- Adicionar testes automatizados para selectors e regressao de filtros.
- Migrar listas mais criticas para `document.createElement()`/`DocumentFragment`.
- Revisar o restante dos modulos para adotar selectors em qualquer derivacao residual.
