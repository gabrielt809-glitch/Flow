# FLOW Foundation v12.0

Nesta etapa começou a remoção física controlada do primeiro grupo seguro do legado: duplicidades antigas de Calendário e Blocos de Tempo.

## O que mudou

- `assets/app.legacy.js` foi reduzido.
- Trechos antigos que redefiniam `renderTaskCalendar`, `openCalendarDay`, `timeBlockOccurrences`, `saveTB` e fluxos antigos de remoção de blocos foram movidos para arquivo de backup.
- `Flow.Calendar` permanece como fonte oficial do calendário semanal.
- `Flow.TimeBlocks` permanece como fonte oficial de criação, ocorrência, remoção e restauração de blocos.
- O backup integral do legado foi preservado em `assets/legacy/app.legacy.full-backup.v12.js`.
- O trecho removido foi preservado em `assets/legacy/calendar_timeblocks_duplicates_removed_v12.js`.

## Como testar depois do deploy

No console do navegador:

```js
Flow.Diagnostics.print()
Flow.LegacyGate.print()
```

Teste manual recomendado:

1. abrir a aba de tarefas;
2. criar bloco de tempo de dia único;
3. criar bloco recorrente sem período;
4. criar bloco recorrente com período;
5. remover um bloco de um dia pelo calendário;
6. restaurar o bloco removido;
7. navegar semanas anteriores e posteriores.

## Observação

Esta versão ainda mantém o legado em quarantine. A remoção foi limitada ao grupo Calendário + Blocos porque esses módulos já possuem fonte oficial na Foundation.
