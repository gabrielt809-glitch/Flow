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

## Visual Refinement V4

- Resumo: revisão completa de UX visual em todas as abas, com ícones premium discretos, mais densidade mobile e menos sensação de placeholder.
- Arquivos principais: `index.html`, `assets/styles.css`, `assets/js/onboarding.js`, `assets/js/overview.js`, `assets/js/water.js`, `assets/js/focus.js`, `assets/js/tasks.js`, `assets/js/timeblocks.js`, `assets/js/calendar.js`, `assets/js/food.js`, `assets/js/habits.js`, `assets/js/settings.js`, `CHANGELOG.md`, `VISUAL_REFINEMENT_V4_REPORT.md`.
- Resultado: siglas-placeholder removidas, textos PT-BR corrigidos, cards e formulários compactados, calendário e blocos mais legíveis, água e foco mais proporcionais, modais mais estáveis no mobile e consistência visual melhor entre onboarding, Hoje, Água, Foco, Tarefas, Saúde, Sono, Nutrição, Hábitos, Bem-estar e Configurações.
- Impacto técnico: refinamento concentrado em HTML/CSS e em módulos de render com correções seguras de texto/apresentação, preservando regras de negócio, estado, storage, selectors e a arquitetura modular.

## Ajuste fino da aba Água

- Resumo: refinamento visual e funcional focado na aba Água, com correção estrutural da bottom nav nas telas internas.
- Arquivos principais: `index.html`, `assets/styles.css`, `assets/js/water.js`, `CHANGELOG.md`, `WATER_TAB_POLISH_REPORT.md`.
- Resultado: bottom nav mais estável no rodapé visual das abas internas, aba Água reorganizada em blocos mais claros, progresso mais legível, ações mais proporcionais e suporte a volume personalizado em ml.
- Impacto técnico: ajustes concentrados em layout/CSS e no módulo da Água, sem alterar schema, migrations, storage, state ou selectors.

## Refinamento visual e UX da aba Agua v2

- Resumo: segunda rodada de polish da Agua com melhor espacamento, resumo de consumo/meta reorganizado e suporte a volumes personalizados reutilizaveis.
- Arquivos principais: `index.html`, `assets/styles.css`, `assets/js/schema.js`, `assets/js/water.js`, `tests/storage.test.js`, `CHANGELOG.md`, `WATER_TAB_POLISH_V2_REPORT.md`.
- Resultado: aba Agua com mais respiro entre blocos, mini resumo de consumo/meta/progresso mais claro, chips mais bem distribuidos e possibilidade de salvar volumes personalizados persistidos como chips selecionaveis.
- Impacto tecnico: mudancas localizadas na estrutura visual da Agua, normalizacao do estado da agua para volumes customizados persistidos e cobertura de teste para persistencia sem alterar logica global do app.

## Water Tab Polish v3

- Resumo: reorganizacao obrigatoria da aba Agua para remover subcards pesados, compactar metricas e limpar a hierarquia do progresso.
- Arquivos principais: `index.html`, `assets/styles.css`, `assets/js/water.js`, `CHANGELOG.md`, `WATER_TAB_POLISH_V3_REPORT.md`.
- Resultado: resumo principal mais limpo, metricas de Consumido/Meta/Progresso em linha compacta, barra com labels alinhados, secao de copos mais alta na tela e plural de copo corrigido.
- Impacto tecnico: mudancas localizadas na apresentacao e no render da Agua, preservando persistencia dos volumes personalizados e sem alterar a aba Hoje.

## Water Tab Final Polish v4

- Resumo: polish final de ritmo visual na aba Agua, preservando o layout atual e separando melhor resumo, metricas, progresso, copos e registro.
- Arquivos principais: `index.html`, `assets/styles.css`, `CHANGELOG.md`, `WATER_TAB_FINAL_POLISH_V4_REPORT.md`.
- Resultado: secoes da Agua com pausas visuais mais claras, faixa de metricas mais legivel, progresso diario com mais respiro e blocos de copos/registro menos colados.
- Impacto tecnico: ajuste concentrado em apresentacao e espacamento da aba Agua, sem mudar regras de negocio, persistencia ou a aba Hoje.

## Product UI/UX QA Sprint

- Resumo: rodada de fechamento visual e funcional das abas restantes, usando a Agua como referencia de organizacao e separacao visual.
- Arquivos principais: `index.html`, `assets/styles.css`, `assets/js/focus.js`, `assets/js/schema.js`, `assets/js/tasks.js`, `assets/js/calendar.js`, `assets/js/timeblocks.js`, `assets/js/food.js`, `assets/js/habits.js`, `assets/js/settings.js`, `assets/js/onboarding.js`, `tests/storage.test.js`, `PRODUCT_UI_UX_QA_REPORT.md`.
- Resultado: Foco com modo Deep 50m e audio interno funcional, cards e formularios compactados nas demais abas, estados vazios refinados, modais mais consistentes no mobile e fim das siglas-placeholder como icones principais.
- Impacto tecnico: ajustes concentrados em apresentacao, renders e na base de foco/schema para suportar o novo modo, preservando a paleta atual, a aba Hoje e a arquitetura modular.

## Product Expansion + UX Refinement v1

- Resumo: expansao funcional das abas de Configuracoes, Saude, Sono, Nutricao, Habitos e Bem-estar, com correcoes urgentes de audio, modal e navegacao.
- Arquivos principais: `index.html`, `assets/styles.css`, `assets/js/health.js`, `assets/js/sleep.js`, `assets/js/food.js`, `assets/js/habits.js`, `assets/js/mood.js`, `assets/js/settings.js`, `assets/js/schema.js`, `assets/js/migrations.js`, `assets/js/selectors.js`, `assets/js/navigation.js`, `assets/js/water.js`, `STATE_SCHEMA.md`, `tests/storage.test.js`, `tests/product-expansion.test.js`, `PRODUCT_EXPANSION_V1_REPORT.md`.
- Resultado: player de foco com audio interno corrigido, modo Deep 50m ativo, configuracoes com reset diario e abas fixadas, Saude com biblioteca de atividades e area Academia, Sono com registro por data e resumo semanal, Nutricao com biblioteca/modelos/refeicoes planejadas, Habitos com sugestoes e leitura semanal/mensal, Bem-estar com respiracao, modal diario e diario noturno.
- Impacto tecnico: `STATE_VERSION` subiu para 3 com migracao oficial `v2 -> v3`, novos campos persistidos foram normalizados e documentados, a bottom nav passou a ser personalizada por estado, e a base ganhou novos testes de regressao para a expansao funcional.

## Final UX Intensive

- Resumo: rodada intensiva de QA visual mobile e refinamento de UX em todas as abas, preservando a aba Hoje e a paleta dark premium atual.
- Arquivos principais: `index.html`, `assets/styles.css`, `assets/js/navigation.js`, `assets/js/food.js`, `qa-screenshots/*`, `FINAL_UX_INTENSIVE_REPORT.md`.
- Resultado: banners globais removidos das abas internas para ganhar altura útil, formulários críticos reorganizados, Foco/Tarefas/Saúde/Sono/Nutrição/Hábitos/Bem-estar/Configurações mais compactos e legíveis, menu lateral e modal de bloco mais proporcionais, e screenshots locais geradas para auditoria visual por aba.
- Impacto tecnico: ajustes concentrados em apresentação e layout responsivo, com mudanças pequenas em JS apenas para suportar o estado visual por seção e alinhar a biblioteca de Nutrição à regra do usuário, sem tocar em schema, migrations, storage, state ou selectors.

## Final UX/UI Overhaul

- Resumo: rodada final de QA visual rigoroso com screenshots mobile novas, correção real de contraste, onboarding mais compacto, badges traduzidos e validação honesta por aba.
- Arquivos principais: `assets/styles.css`, `assets/js/tasks.js`, `assets/js/navigation.js`, `assets/js/food.js`, `qa-final-screenshots/*`, `FINAL_UX_OVERHAUL_REPORT.md`.
- Resultado: Sono e Bem-estar deixaram de ter botões escuros ilegíveis, Tarefas perdeu `HIGH/MID/LOW`, Configurações passou a expor ações finais acima da nav, o onboarding ficou mais confiável no iPhone e o pacote final de screenshots passou a refletir melhor o fundo real das telas.
- Impacto tecnico: refinamento concentrado em CSS e em poucos módulos de render, sem alterar schema, migrations, storage, state ou selectors; o app ganhou evidência visual final por aba sem reintroduzir legado.
