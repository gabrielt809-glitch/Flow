# FLOW-APP-LIMPO State Schema

## Versao Atual

- `STATE_VERSION = 2`
- Chave atual do `localStorage`: `flow-app-limpo-v1`

## Envelope Persistido

O estado e salvo em `localStorage` no seguinte formato:

```json
{
  "version": 2,
  "updatedAt": "2026-04-24T00:00:00.000Z",
  "data": {
    "...": "state"
  }
}
```

Compatibilidade:

- formato novo com envelope: suportado
- formato antigo salvando o state direto: suportado

## Estrutura Geral do Estado

```js
{
  onboarded: boolean,
  profile: { ... },
  goals: { ... },
  ui: { ... },
  streak: number,
  water: { ... },
  focus: { ... },
  tasks: [],
  timeblocks: [],
  health: { ... },
  sleep: { ... },
  food: { ... },
  habits: [],
  mood: { ... },
  history: {}
}
```

## Campos

### `profile`

```js
{
  name: string,
  weight: string,
  height: string,
  age: string,
  emoji: string
}
```

### `goals`

```js
{
  waterMl: number,
  steps: number,
  sleepHours: number,
  calories: number
}
```

### `ui`

```js
{
  activeSection: "overview" | "water" | "study" | "work" | "health" | "sleep" | "food" | "habits" | "mood" | "settings",
  theme: "dark" | "light",
  taskFilter: "all" | "pending" | "done" | "high",
  calendarAnchorDate: string
}
```

`calendarAnchorDate` usa formato `YYYY-MM-DD` e define a semana atualmente exibida no calendário.
Na versão 2 do estado, esse campo foi formalizado como parte oficial da UI persistida.

### `water`

```js
{
  ml: number,
  cupMl: number,
  history: {
    [dateKey]: number
  }
}
```

### `focus`

```js
{
  mode: "focus" | "short" | "long",
  secondsLeft: number,
  isRunning: boolean,
  sessionsToday: number,
  soundMode: "lofi" | "rain" | "deep",
  soundPlaying: boolean,
  volume: number,
  history: {
    [dateKey]: number
  }
}
```

### `tasks`

```js
[
  {
    id: string,
    title: string,
    category: string,
    priority: "high" | "mid" | "low",
    dueDate: string,
    done: boolean,
    createdAt: string
  }
]
```

### `timeblocks`

```js
[
  {
    id: string,
    title: string,
    type: "single" | "recurring_period" | "recurring_forever",
    date: string,
    startDate: string,
    endDate: string,
    daysOfWeek: number[],
    start: string,
    end: string,
    color: string,
    allDay: boolean,
    skippedDates: string[],
    createdAt: string
  }
]
```

### `health`

```js
{
  steps: number,
  workoutMinutes: number
}
```

### `sleep`

```js
{
  start: string,
  end: string,
  quality: number,
  notes: string,
  history: {
    [dateKey]: {
      hours: number,
      quality: number,
      notes: string
    }
  }
}
```

### `food`

```js
{
  entries: [
    {
      id: string,
      name: string,
      calories: number
    }
  ],
  history: {
    [dateKey]: unknown
  }
}
```

### `habits`

```js
[
  {
    id: string,
    name: string,
    icon: string,
    doneDates: string[]
  }
]
```

### `mood`

```js
{
  value: number,
  gratitude: string,
  notes: string,
  history: {
    [dateKey]: {
      value: number,
      gratitude: string,
      notes: string
    }
  }
}
```

### `history`

Snapshot diario usado por overview/history/selectors:

```js
{
  [dateKey]: {
    waterMl: number,
    focusSessions: number,
    completedTasks: number,
    steps: number,
    sleepHours: number,
    mood: number,
    calories: number
  }
}
```

## Modelo de Timeblocks

### `single`

- representa um bloco de dia unico
- usa `date`
- `startDate` e preenchido com a mesma data por compatibilidade
- nao depende de `daysOfWeek`

### `recurring_period`

- representa recorrencia entre `startDate` e `endDate`
- pode usar `daysOfWeek`
- desaparece apos `endDate`

### `recurring_forever`

- representa recorrencia continua a partir de `startDate`
- pode usar `daysOfWeek`
- nao precisa de `endDate`

### `skippedDates`

- array de datas ISO (`YYYY-MM-DD`)
- remove apenas ocorrencias especificas
- nao remove o bloco inteiro

### `daysOfWeek`

- array numerico no padrao JS `Date.getDay()`
- `0 = domingo`
- `1 = segunda`
- ...
- `6 = sabado`

### `allDay`

- quando `true`, o bloco representa dia inteiro
- a ocorrencia e marcada como `allDay`
- a exibicao textual usa a indicacao correspondente no selector/render

## Normalizacao e Compatibilidade

`normalizeState(state)` e obrigatorio antes de usar qualquer payload.

Ele garante:

- merge com `DEFAULT_STATE`
- tipos consistentes
- arrays e objetos padrao
- filtros validos
- blocos antigos convertidos
- IDs deterministas para registros sem `id`

Compatibilidade com dados antigos:

- tarefas, habitos, comidas e blocos sem `id` ganham IDs deterministas
- timeblocks antigos com `date` viram `type: "single"`
- payload antigo sem envelope ainda carrega normalmente

## Como Criar Migracoes Futuras

Quando houver mudanca estrutural real:

1. incrementar `STATE_VERSION` em `schema.js`
2. adicionar migracao em `migrations.js`
3. a migracao deve transformar apenas da versao N para N+1
4. `migrateState(payload)` deve rodar somente enquanto `currentVersion < STATE_VERSION`
5. depois disso, sempre retornar `normalizeState(currentData)`

Exemplo recente:

- `v2` formalizou `ui.calendarAnchorDate`
- payloads `v1` sem esse campo passam por migração dedicada antes da normalização final

Regra importante:

- migracao corrige compatibilidade historica
- normalizacao corrige formato, defaults e higiene do dado atual

## Boas Praticas para Compatibilidade

- nunca remover suporte a payload antigo sem migracao correspondente
- nunca depender do formato bruto de `localStorage` fora de `storage.js`
- nunca gerar IDs aleatorios em `normalizeState()`
- sempre documentar novos campos em `STATE_SCHEMA.md`
- sempre cobrir mudancas estruturais com testes em `storage.test.js` ou `state.test.js`
