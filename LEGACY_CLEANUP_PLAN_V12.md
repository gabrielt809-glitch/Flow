# LEGACY CLEANUP PLAN V12

## Grupo removido do runtime

Calendário + Blocos de Tempo legados duplicados.

## Motivo

A fundação já possui módulos oficiais:

- `Flow.Calendar`
- `Flow.TimeBlocks`

Esses módulos cobrem renderização semanal, detalhes do dia, seleção de dias, remoção/restauração de blocos e criação de blocos por tipo.

## Arquivos de segurança

- Backup completo: `assets/legacy/app.legacy.full-backup.v12.js`
- Trecho removido: `assets/legacy/calendar_timeblocks_duplicates_removed_v12.js`

## Próximo grupo candidato

Tarefas legadas duplicadas, após validar V12 em deploy real.
