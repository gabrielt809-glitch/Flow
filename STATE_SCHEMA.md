# FLOW-APP-LIMPO State Schema

## Versão Atual

- `STATE_VERSION = 3`
- Chave atual do `localStorage`: `flow-app-limpo-v1`

## Envelope Persistido

O estado continua salvo em `localStorage` no formato:

```json
{
  "version": 3,
  "updatedAt": "2026-04-25T00:00:00.000Z",
  "data": {
    "...": "state"
  }
}
```

Compatibilidade:

- payload antigo sem envelope: suportado
- payload envelopado `version: 1`: suportado
- payload envelopado `version: 2`: suportado

## Estrutura Geral

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

## Profile

```js
{
  name: string,
  weight: string,
  height: string,
  age: string,
  emoji: string
}
```

## Goals

```js
{
  waterMl: number,
  steps: number,
  sleepHours: number,
  calories: number
}
```

## UI

```js
{
  activeSection: "overview" | "water" | "study" | "work" | "health" | "sleep" | "food" | "habits" | "mood" | "settings",
  theme: "dark",
  taskFilter: "all" | "pending" | "done" | "high",
  calendarAnchorDate: string,
  pinnedTabs: string[]
}
```

Observações:

- `calendarAnchorDate` usa `YYYY-MM-DD` e controla a semana ativa do calendário.
- `pinnedTabs` foi formalizado na versão 3 para permitir personalização da bottom nav.
- `theme` passou a ser tratado como `dark` fixo na versão 3.

## Water

```js
{
  ml: number,
  cupMl: number,
  customVolumes: number[],
  history: {
    [dateKey]: number
  }
}
```

## Focus

```js
{
  mode: "focus" | "deep" | "short" | "long",
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

## Tasks

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

## Timeblocks

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

Modelo:

- `single`: usa `date` e replica a data em `startDate`
- `recurring_period`: usa `startDate`, `endDate` e opcionalmente `daysOfWeek`
- `recurring_forever`: usa `startDate` e opcionalmente `daysOfWeek`
- `skippedDates`: lista de ocorrências ocultadas sem apagar o bloco inteiro
- `allDay`: força `00:00` até `23:59`

## Health

```js
{
  steps: number,
  workoutMinutes: number,
  activityEntries: [
    {
      id: string,
      name: string,
      activityId: string,
      minutes: number,
      calories: number,
      intensity: "leve" | "moderada" | "intensa",
      date: string
    }
  ],
  workouts: [
    {
      id: string,
      name: string,
      daysOfWeek: string[],
      notes: string,
      exercises: [
        {
          name: string,
          sets: string,
          reps: string,
          load: string,
          notes: string
        }
      ]
    }
  ]
}
```

## Sleep

```js
{
  start: string,
  end: string,
  quality: number,
  notes: string,
  wakeMood: number,
  entries: {
    [dateKey]: {
      start: string,
      end: string,
      quality: number,
      notes: string,
      wakeMood: number
    }
  },
  history: {
    [dateKey]: {
      hours: number,
      quality: number,
      notes: string
    }
  }
}
```

## Food

```js
{
  entries: [
    {
      id: string,
      name: string,
      calories: number,
      date: string,
      category: string,
      portionLabel: string,
      source: string
    }
  ],
  savedMeals: [
    {
      id: string,
      name: string,
      category: string,
      notes: string,
      items: FoodEntry[],
      calories: number
    }
  ],
  dietMeals: [
    {
      id: string,
      name: string,
      calories: number,
      notes: string
    }
  ],
  history: {
    [dateKey]: unknown
  }
}
```

## Habits

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

## Mood

```js
{
  value: number,
  gratitude: string,
  notes: string,
  dailyCheckinShownDate: string,
  journalEntries: {
    [dateKey]: {
      summary: string,
      highs: string,
      lows: string,
      lessons: string,
      gratitude: string,
      notes: string
    }
  },
  history: {
    [dateKey]: {
      value: number,
      gratitude: string,
      notes: string
    }
  }
}
```

## History

Snapshot diário usado por overview e selectors:

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

## Migrações Futuras

Sempre que um campo persistido novo for adicionado:

1. atualizar `STATE_VERSION` em `assets/js/schema.js`
2. criar migração explícita em `assets/js/migrations.js`
3. normalizar o novo campo em `normalizeState()`
4. documentar a mudança neste arquivo
5. cobrir a migração com teste quando possível

## Compatibilidade com Dados Antigos

- `migrateState()` aplica apenas migrações pendentes enquanto `currentVersion < STATE_VERSION`
- payloads sem envelope continuam aceitos e passam por normalização
- payloads antigos de `timeblocks`, `food`, `sleep`, `mood` e `ui` são completados com defaults seguros na normalização
