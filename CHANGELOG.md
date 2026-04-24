# CHANGELOG

## Clean Foundation

- Resumo: reconstrução inicial do FLOW em estrutura modular limpa dentro de `FLOW-APP-LIMPO`.
- Arquivos principais: `index.html`, `assets/styles.css`, `assets/js/*`, `REFACTOR_REPORT.md`.
- Resultado: app reorganizado por dominio, com entrada unica e persistencia funcional.
- Impacto tecnico: base modular criada para evolucao controlada sem depender do HTML legado original.

## Sprint 1

- Resumo: fortalecimento de state, storage e migrations.
- Arquivos principais: `assets/js/schema.js`, `assets/js/migrations.js`, `assets/js/storage.js`, `assets/js/state.js`, `CODE_QUALITY_REPORT_SPRINT_1.md`.
- Resultado: estado padronizado, envelope versionado no storage e compatibilidade com formato antigo.
- Impacto tecnico: o restante do app deixou de depender diretamente do formato salvo no `localStorage`.

## Sprint 2

- Resumo: safety layer, sanitizacao e robustez dos renders.
- Arquivos principais: `assets/js/utils.js`, `assets/js/tasks.js`, `assets/js/food.js`, `assets/js/habits.js`, `assets/js/settings.js`, `assets/js/calendar.js`, `assets/js/timeblocks.js`, `CODE_QUALITY_REPORT_SPRINT_2.md`.
- Resultado: helpers seguros adicionados e renders criticos protegidos contra HTML quebrado ou injecao simples.
- Impacto tecnico: a base passou a ter contrato explicito para DOM opcional, texto simples e HTML escapado.

## Sprint 3

- Resumo: criacao da camada oficial de selectors e reducao de duplicacao de calculos.
- Arquivos principais: `assets/js/selectors.js`, `assets/js/overview.js`, `assets/js/history.js`, `assets/js/calendar.js`, `assets/js/tasks.js`, `CODE_QUALITY_REPORT_SPRINT_3.md`.
- Resultado: score, serie semanal, tarefas visiveis e eventos do calendario passaram a ter fonte oficial unica.
- Impacto tecnico: regras derivadas ficaram centralizadas e mais testaveis.

## Sprint 4

- Resumo: evolucao robusta de calendario e timeblocks.
- Arquivos principais: `assets/js/schema.js`, `assets/js/timeblocks.js`, `assets/js/calendar.js`, `index.html`, `assets/js/selectors.js`, `CODE_QUALITY_REPORT_SPRINT_4.md`.
- Resultado: suporte a blocos `single`, `recurring_period`, `recurring_forever`, `allDay` e `skippedDates`.
- Impacto tecnico: calendario passou a depender de occurrence generator padronizado e modelo consistente de blocos.

## Sprint 4.1

- Resumo: validacoes e correcoes finais de integracao do Sprint 4.
- Arquivos principais: `assets/js/main.js`, `assets/js/calendar.js`, `assets/js/timeblocks.js`, `CODE_QUALITY_REPORT_SPRINT_4_1.md`.
- Resultado: integracao final validada, incluindo `initCalendar()`, skip no calendario e restore na lista de blocos.
- Impacto tecnico: consolidacao segura da entrega anterior sem expandir escopo funcional.

## Sprint 5

- Resumo: render scopes e testes basicos de regressao.
- Arquivos principais: `assets/js/render.js`, `assets/js/state.js`, `assets/js/main.js`, modulos de dominio com `scope`, `tests/*`, `package.json`, `CODE_QUALITY_REPORT_SPRINT_5.md`.
- Resultado: renderizacao incremental por escopo, fallback global preservado e suite minima de testes em Node.
- Impacto tecnico: menos renders desnecessarios, base melhor para manutencao e protecao inicial contra regressao.

## Sprint 6

- Resumo: documentacao tecnica, governanca e registro formal de pendencias.
- Arquivos principais: `ARCHITECTURE.md`, `STATE_SCHEMA.md`, `MODULE_GUIDE.md`, `TEST_CHECKLIST.md`, `CHANGELOG.md`, `TECH_DEBT_AND_NEXT_STEPS.md`, `README.md`, `CODE_QUALITY_REPORT_SPRINT_6.md`.
- Resultado: fundacao tecnica documentada, fluxo de manutencao definido e proxima fase preparada.
- Impacto tecnico: reduz risco de mudancas desorganizadas e fecha oficialmente a etapa de fundacao.

## Functional Polish v1

- Resumo: ajustes funcionais finos antes da fase visual premium.
- Arquivos principais: `index.html`, `assets/js/schema.js`, `assets/js/selectors.js`, `assets/js/calendar.js`, `assets/js/timeblocks.js`, `assets/js/tasks.js`, `assets/js/focus.js`, `assets/js/overview.js`, `tests/*`, `STATE_SCHEMA.md`, `MODULE_GUIDE.md`, `TEST_CHECKLIST.md`.
- Resultado: calendário com navegação semanal, edição de blocos, UX melhor do modal de blocos, tarefa sem data tratada com clareza e textos PT-BR revisados.
- Impacto tecnico: a base ganhou mais usabilidade sem quebrar a arquitetura modular nem a estratégia de render por escopo.
