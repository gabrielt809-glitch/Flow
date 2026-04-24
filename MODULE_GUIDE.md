# FLOW-APP-LIMPO Module Guide

## Objetivo

Este guia define como manter e evoluir o app sem criar duplicacao, sem espalhar regra de negocio e sem reintroduzir legado.

## Onde Cada Tipo de Alteracao Deve Ser Feita

- mudar estrutura de estado: `assets/js/schema.js`
- mudar compatibilidade de dados antigos: `assets/js/migrations.js`
- mudar formato de persistencia: `assets/js/storage.js`
- mudar API do store: `assets/js/state.js`
- criar calculo derivado: `assets/js/selectors.js`
- mudar estrategia de renderizacao por dominio: `assets/js/render.js`
- criar helper generico: `assets/js/utils.js`
- mudar fluxo/eventos de uma area: modulo da area (`tasks.js`, `water.js`, etc.)
- mudar estrutura visual/markup base: `index.html`
- mudar estilos: `assets/styles.css`

## Como Criar Uma Nova Funcionalidade

Fluxo recomendado:

1. definir se precisa de novo campo no estado
2. adicionar o campo em `schema.js`
3. ajustar `normalizeState()` e `validateState()` se necessario
4. se houver compatibilidade historica, adicionar migracao em `migrations.js`
5. criar selectors se houver leitura derivada
6. criar ou atualizar modulo de dominio
7. conectar render e eventos
8. usar `mutateState()` com `scope` adequado
9. adicionar testes puros sempre que possivel
10. documentar no changelog e nos guias se o contrato mudou

## Quando Mexer em State / Schema / Storage

### Mexer em `schema.js` quando:

- um novo campo persistido entra no app
- um tipo precisa ser validado/normalizado
- `DEFAULT_STATE` precisa crescer
- um novo estado de UI precisa ser persistido, como `ui.calendarAnchorDate`

### Mexer em `migrations.js` quando:

- uma versao antiga precisa ser convertida para a nova

### Mexer em `storage.js` quando:

- o envelope salvo mudar
- a chave de persistencia mudar
- a leitura de payload precisar suportar outro formato

### Mexer em `state.js` quando:

- a API do store mudar
- for necessario adicionar metadados de notificacao
- for necessario ajustar politica de persistencia

## Quando Criar Selector

Crie selector quando houver:

- calculo derivado
- filtro reutilizavel
- agregacao de dados
- score, stats, progresso ou resumo
- necessidade de padronizar um formato para outro modulo

Nao crie selector quando a leitura for trivial e local, por exemplo `state.ui.theme`.

## Quando Criar Render

Crie ou ajuste render quando:

- um modulo precisa traduzir estado em DOM
- um novo bloco visual pertence claramente a um dominio
- um escopo precisa atualizar uma area especifica

Evite:

- calcular regra complexa dentro do render
- acessar `localStorage` no render
- duplicar calculos que ja existem em selectors

## Como Usar `mutateState()` com `scope` ou `scopes`

Formato recomendado:

```js
mutateState((draft) => {
  draft.tasks.push(newTask);
}, { scope: "tasks" });
```

Quando a mudanca afeta mais de um fluxo de forma explicita:

```js
mutateState((draft) => {
  // alteracoes
}, { scopes: ["tasks", "calendar"] });
```

Regras:

- prefira `scope` unico quando houver dono claro
- use `scopes` apenas quando a mudanca realmente atravessar dominios
- quando nao informar nada, o app cai em `renderAll()` como fallback
- use `persist: false` apenas em atualizacoes efemeras, como tick do timer
- para navegacao semanal do calendario, use `scope: "calendar"`

## Como Usar os Helpers de Seguranca

### `safeText(selector, value)`

Use para texto simples.

### `safeHTML(selector, value)`

Use apenas quando precisar inserir HTML montado conscientemente.
Dados vindos do usuario devem chegar escapados com `escapeHTML()` antes de entrar no template.

### `escapeHTML(value)`

Use em qualquer interpolacao de dados do usuario dentro de template string HTML.

### `safeStyle(selector, prop, value)`

Use para atualizar estilo inline de um elemento opcional sem quebrar a tela.

### `safeValue(selector, value)`

Use para preencher campos opcionais com seguranca.

### `safeToggleClass(selector, className, enabled)`

Use quando um elemento pode nao existir em determinada tela.

## Quando Usar `qs()` e Quando Usar `optionalQs()`

### Use `qs()` quando:

- o elemento e obrigatorio
- o modulo depende dele para funcionar
- a ausencia do elemento deve falhar cedo

### Use `optionalQs()` quando:

- o elemento pode nao existir
- a UI e condicional
- o codigo roda em telas diferentes

Regra importante:

- nunca acessar `.style`, `.value` ou `.classList` diretamente sobre o retorno de `optionalQs()` sem checagem previa

## Como Evitar Duplicacao de Logica

- se um calculo aparece em mais de um modulo, mover para `selectors.js`
- se um helper de DOM aparece em mais de um modulo, mover para `utils.js`
- se um fluxo de render depende de varios modulos, coordenar em `render.js`
- se um formato de dado e compartilhado, formalizar em `schema.js`

## Como Evitar Codigo Legado

- nao manter duas versoes da mesma funcao
- nao criar patches paralelos para contornar o store oficial
- nao ler/escrever `localStorage` fora de `storage.js`
- nao criar atalhos globais em `window`
- nao criar logica duplicada no calendario e nos timeblocks

## Padrao para Novos Modulos

Formato recomendado:

```js
import { getState, mutateState } from "./state.js";
import { qs, safeText } from "./utils.js";
import { selectSomething } from "./selectors.js";

export function initFeature() {
  qs("#featureBtn").addEventListener("click", onClick);
}

function onClick() {
  mutateState((draft) => {
    // alteracao
  }, { scope: "feature" });
}

export function renderFeature(state = getState()) {
  const data = selectSomething(state);
  safeText("#featureLabel", data.label);
}
```

## Padrao Recomendado para Novos Eventos

- bind de eventos em `initModulo()`
- usar funcoes pequenas e nomeadas para a acao
- preferir delegacao de evento para listas dinamicas
- toda mutacao deve passar pelo store

## Padrao Recomendado para Novos Renders

- receber `state = getState()` por padrao
- calcular dados complexos via selectors
- usar `safeText()` para texto simples
- usar `safeHTML()` apenas com cuidado
- preferir `createElement()` para listas simples e criticas quando isso reduzir risco

## Padrao Recomendado para Novos Campos no Estado

1. adicionar no `DEFAULT_STATE`
2. normalizar em `normalizeState()`
3. validar em `validateState()` quando fizer sentido
4. documentar em `STATE_SCHEMA.md`
5. testar compatibilidade se afetar persistencia
