# FLOW Foundation v15.0 — Aggressive Clean

Esta versão muda a estratégia de limpeza: o `app.legacy.js` deixa de ser carregado no runtime principal.

## Estrutura principal

```txt
index.html
assets/
  styles.css
  app.legacy.js                 # stub informativo, não carregado
  foundation/
    core.js
    storage.js
    app.js                      # novo runtime limpo
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
    legacy-gate.js
    diagnostics.js
    ui.js
    bridge.js
  legacy/
    app.legacy.full-backup.v15.aggressive.js
```

## O que mudou

- `index.html` não carrega mais `assets/app.legacy.js`.
- O legado completo foi preservado em `assets/legacy/app.legacy.full-backup.v15.aggressive.js`.
- Novo runtime: `assets/foundation/app.js`.
- Boot centralizado em `Flow.App.start()` via `bridge.js`.
- Funções globais usadas pelo HTML foram mapeadas para módulos `Flow.*` ou stubs mínimos.
- `Storage`, `History`, `Calendar`, `TimeBlocks`, `Tasks`, `Sleep`, `Water`, `Food`, `Health`, `Focus`, `Habits`, `Mood`, `Settings` e `Onboarding` continuam como módulos oficiais.

## Observação importante

Esta é uma limpeza agressiva. Ela deve ser testada no navegador/Vercel. Caso alguma área específica falhe, a correção deve ser feita diretamente no módulo Foundation correspondente, não reativando o legado.

## Teste rápido no console

```js
Flow.version
Flow.Diagnostics?.print()
Flow.App?.start()
```
