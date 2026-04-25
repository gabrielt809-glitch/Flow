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

## Functional Polish v1.1

- Resumo: fechamento do versionamento de estado para `v2` e melhoria do label visual do calendário.
- Arquivos principais: `assets/js/schema.js`, `assets/js/migrations.js`, `assets/js/selectors.js`, `assets/js/calendar.js`, `tests/storage.test.js`, `tests/selectors.test.js`, `STATE_SCHEMA.md`, `FUNCTIONAL_POLISH_REPORT_V1_1.md`.
- Resultado: `STATE_VERSION = 2`, migração oficial `v1 -> v2` criada para `ui.calendarAnchorDate` e calendário exibindo intervalo semanal em formato amigável.
- Impacto tecnico: compatibilidade histórica preservada com trilha formal de migração e uma UI de calendário mais clara sem mudar regra de negócio.

## Visual Premium v1

- Resumo: elevação da interface para um visual premium com mais atmosfera, profundidade, glassmorphism e microinterações.
- Arquivos principais: `assets/styles.css`, `index.html`, `CHANGELOG.md`, `VISUAL_PREMIUM_REPORT_V1.md`.
- Resultado: fundo com orbs ambientais, superfícies em vidro, header/nav/modais mais densos, cards com mais profundidade, glows contextuais e animações suaves com respeito a `prefers-reduced-motion`.
- Impacto tecnico: upgrade visual concentrado em CSS, com impacto mínimo na estrutura HTML e sem alterar lógica, persistência ou arquitetura.

## Visual Premium v1.1

- Resumo: refinamento visual dirigido por QA mobile para reduzir exageros e corrigir componentes quebrados no iPhone/PWA.
- Arquivos principais: `assets/styles.css`, `CHANGELOG.md`, `VISUAL_PREMIUM_REPORT_V1_1.md`.
- Resultado: bottom nav compactada e integrada, menu lateral corrigido como gaveta direita coerente, modais e superfícies menos agressivos, densidade visual melhor ajustada e atmosfera premium mais contida.
- Impacto tecnico: correção visual concentrada em CSS, preservando a arquitetura, a lógica e a base de testes sem necessidade de alterar JS.

## Visual Premium v1.2

- Resumo: refinamento sóbrio focado em iPhone/PWA, com redução de ruído visual, correção de overscroll branco e amadurecimento da linguagem visual.
- Arquivos principais: `assets/styles.css`, `index.html`, `CHANGELOG.md`, `VISUAL_PREMIUM_REPORT_V1_2.md`.
- Resultado: paleta migrada para base grafite/azul escuro, bottom nav mais madura, menu lateral mais elegante, modais mais adaptados ao mobile, ícones estáticos menos infantis e fundo escuro consistente durante bounce/overscroll.
- Impacto tecnico: ajustes visuais concentrados em CSS com pequenas trocas seguras de ícones estáticos no HTML, sem alterar regras de negócio, persistência ou módulos JS.

## Visual System Reset v2

- Resumo: troca real de direcao visual para uma linguagem dark premium sobria, com menos cor, menos glass e menos aparencia de app infantil.
- Arquivos principais: ssets/styles.css, index.html, CHANGELOG.md, VISUAL_SYSTEM_RESET_V2_REPORT.md.
- Resultado: paleta redefinida para quase preto/grafite/azul profundo, bottom nav minimalista com SVGs monocromaticos, side menu mais adulto, cards e modais mais solidos e correcoes agressivas no fundo para eliminar o overscroll branco do iPhone.
- Impacto tecnico: reset visual concentrado em CSS com troca segura de icones estaticos no HTML, sem alterar regras de negocio, storage, schema, state ou selectors.

## Visual + UX Polish V3

- Resumo: correcao definitiva de glyphs quebrados, refinamento mobile-first dos modais e polimento visual/UX nas abas sem perder a paleta sobria mais recente.
- Arquivos principais: index.html, ssets/styles.css, ssets/js/overview.js, ssets/js/calendar.js, ssets/js/timeblocks.js, ssets/js/tasks.js, CHANGELOG.md, VISUAL_UX_POLISH_V3_REPORT.md.
- Resultado: interface limpa de mojibake, icones estaticos mais seguros, formularios e listas mais consistentes, calendario e blocos com textos corrigidos e modais mais estaveis no iPhone.
- Impacto tecnico: ajustes concentrados em HTML/CSS e em poucos modulos de render para correcao de texto/apresentacao, sem alterar regras de negocio, persistencia ou arquitetura de estado.
