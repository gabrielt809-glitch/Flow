# FLOW Foundation v11.0

Esta etapa inicia a remoção física controlada do legado com foco em segurança.

## O que mudou

- O legado completo foi copiado para `assets/legacy/app.legacy.full-backup.v11.js`.
- `assets/app.legacy.js` permanece como runtime de compatibilidade, com marcação explícita de quarantine.
- Foi criado `assets/foundation/legacy-gate.js`.
- Foi criado `assets/legacy/legacy_inventory_v11.json`, com inventário de duplicidades.
- `Flow.Diagnostics.report()` agora inclui `legacyGate`.

## Como validar no navegador

Abra o app e rode no console:

```js
Flow.Diagnostics.print()
Flow.LegacyGate.print()
```

## Direção técnica

A partir da v11, a limpeza deixa de ser apenas organização e passa a ter governança:

1. identificar funções globais já assumidas pela fundação;
2. manter backup completo do legado;
3. validar runtime com diagnóstico;
4. remover blocos legados por grupos pequenos;
5. testar app após cada remoção.

## Observação

Esta versão ainda não remove agressivamente trechos do runtime para evitar quebrar o app. Ela prepara a remoção física com backup, inventário e gate.
