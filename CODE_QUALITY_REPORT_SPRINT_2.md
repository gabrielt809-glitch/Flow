# Code Quality Report Sprint 2

## Ajustes em schema.js

- Removida a geracao nao deterministica de IDs dentro de `normalizeState()`.
- IDs faltantes agora sao derivados de forma estavel com prefixo por tipo e fallback previsivel, por exemplo `task-migrated-0`.
- A normalizacao do mesmo estado passa a produzir os mesmos IDs.

## Ajustes em migrations.js

- `migrateState()` agora executa migracoes apenas enquanto `currentVersion < STATE_VERSION`.
- A versao atual nao roda migracao novamente.
- Continua compativel com payload antigo sem envelope e payload novo com `{ version, updatedAt, data }`.

## Utilitarios adicionados em utils.js

- `optionalQs(selector, root)`
- `requiredQs(selector, root)`
- `safeText(selector, value, root)`
- `safeHTML(selector, value, root)`
- `escapeHTML(value)`
- `createLogger(namespace)`

`qs()` e `qsa()` foram mantidos compativeis com o restante do app.

## Renders protegidos

Os renders com interpolacao direta de dados do usuario foram protegidos com `escapeHTML()` e/ou `safeHTML()`:

- `tasks.js`
- `food.js`
- `habits.js`
- `settings.js`
- `calendar.js`
- `timeblocks.js`

Isso evita que entradas como `<script>`, `Gabriel & Gi`, `"teste"` ou `<b>negrito</b>` quebrem o HTML renderizado.

## Riscos restantes

- Ainda existem pontos do app que usam `innerHTML` com dados internos; embora nao sejam os campos mais expostos, vale revisar todo o restante em uma rodada futura.
- Ainda faltam testes automatizados de browser para cobertura completa de onboarding, persistencia e renderizacao.
- `createLogger()` foi adicionado, mas ainda nao foi adotado amplamente nos modulos.

## Proximos passos

- Avancar para uma camada de render mais segura com `createElement` nos fluxos mais criticos.
- Adicionar testes automatizados para normalizacao deterministica e migracao de storage.
- Revisar o restante dos modulos para reduzir dependencias de `innerHTML`.
