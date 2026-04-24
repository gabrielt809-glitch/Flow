# FLOW Foundation v11.0

Esta etapa consolida a fundação técnica sem mudar a experiência visual do app.

## Objetivo da v11

A v11 não adiciona funcionalidades novas. Ela cria uma camada de governança técnica para facilitar a manutenção antes da remoção física do legado.

## Mudanças principais

- Adicionado `assets/foundation/manifest.js`.
- Adicionado `assets/foundation/diagnostics.js`.
- Atualizados os módulos para a marcação `v11.0.0`.
- Adicionado guard de inicialização no `bridge.js` para evitar boot duplicado pesado.
- Mantido `app.legacy.js` como fallback de segurança.
- Gerado `foundation_report_v11.json` com diagnóstico técnico.

## Estrutura

```txt
index.html
assets/
  styles.css
  app.legacy.js
  foundation/
    core.js
    storage.js
    history.js
    sleep.js
    timeblocks.js
    tasks.js
    calendar.js
    overview.js
    water.js
    food.js
    health.js
    focus.js
    habits.js
    mood.js
    settings.js
    onboarding.js
    manifest.js
    diagnostics.js
    ui.js
    bridge.js
```

## Diagnóstico em runtime

No console do navegador, é possível chamar:

```js
Flow.Diagnostics.print()
```

ou:

```js
Flow.Diagnostics.report()
```

Isso mostra:

- módulos carregados;
- formato atual do estado;
- funções globais ainda compatíveis com o legado;
- versão da fundação.

## Diretriz daqui para frente

A partir da v11, a regra recomendada é:

1. nenhuma funcionalidade nova deve entrar direto no `app.legacy.js`;
2. toda melhoria nova deve entrar no módulo oficial correspondente;
3. o legado deve continuar existindo apenas como fallback temporário;
4. a remoção física de legado deve acontecer em etapas pequenas, sempre com teste após cada etapa.

## Próximo passo recomendado

**Foundation v11 — Remoção controlada do legado.**

Começar por:

- remover comentários e patches antigos inativos;
- mapear funções sobrescritas no legado;
- criar um backup `app.legacy.full.js`;
- reduzir `app.legacy.js` aos trechos ainda realmente necessários.
