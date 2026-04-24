# LEGACY CLEANUP PLAN v11

## Status

Legacy em quarantine seguro.

## Backup

Backup completo em:

`assets/legacy/app.legacy.full-backup.v11.js`

## Candidatos prioritários para remoção futura

Com base no inventário, os principais grupos com duplicidade são:

- calendário: `renderTaskCalendar`, `openCalendarDay`, `timeBlockOccurrences`, `allCalendarEventsForDate`;
- blocos: `saveTB`, `renderTimeBlocks`, remoção/restauração de ocorrências;
- tarefas: `addTask`, `renderTasks`, `updateWorkProgress`;
- foco/áudio: `setFocusVolume`, `setFocusSound`, `stopFocusAudio`;
- boot/render global: `boot`, `ensureState`, `initApp`.

## Regra de remoção

Nenhum grupo deve ser removido antes de:

1. existir função equivalente em `foundation/`;
2. `bridge.js` apontar para a função nova;
3. `Flow.Diagnostics.print()` não apontar missing crítico;
4. testar no iPhone/PWA e no Safari normal.

## Próxima etapa v12

Remover fisicamente o primeiro grupo seguro: duplicidades legadas de calendário e blocos já cobertas por `Flow.Calendar` e `Flow.TimeBlocks`.
