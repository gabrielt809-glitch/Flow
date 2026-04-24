import { createDefaultState, normalizeState } from "./schema.js";
import { loadPersistedState, persistState, clearPersistedState } from "./storage.js";
import { clone } from "./utils.js";
import {
  selectCompletedTasks,
  selectFoodCaloriesToday,
  selectFocusStatsToday,
  selectHealthStatsToday,
  selectMoodToday,
  selectSleepToday,
  selectTodayKey,
  selectWaterProgress
} from "./selectors.js";

const listeners = new Set();

let state = normalizeState(loadPersistedState() ?? createDefaultState());

function normalizeScopes(options = {}) {
  if (Array.isArray(options.scopes) && options.scopes.length) {
    return options.scopes;
  }
  if (typeof options.scope === "string" && options.scope) {
    return [options.scope];
  }
  return ["all"];
}

export function getState() {
  return state;
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setState(updater, options = {}) {
  const next = typeof updater === "function" ? updater(clone(state)) : updater;
  state = normalizeState(next);
  if (options.persist !== false) {
    persistState(state);
  }
  const meta = {
    scopes: normalizeScopes(options)
  };
  listeners.forEach((listener) => listener(state, meta));
}

export function mutateState(mutator, options = {}) {
  const draft = clone(state);
  mutator(draft);
  setState(draft, options);
}

export function resetState() {
  state = createDefaultState();
  clearPersistedState();
  listeners.forEach((listener) => listener(state, { scopes: ["all"] }));
}

export function upsertDailyHistory() {
  const key = selectTodayKey();
  const water = selectWaterProgress(state);
  const focus = selectFocusStatsToday(state);
  const completedTasks = selectCompletedTasks(state);
  const health = selectHealthStatsToday(state);
  const sleep = selectSleepToday(state);
  const mood = selectMoodToday(state);
  const food = selectFoodCaloriesToday(state);
  state.history[key] = {
    waterMl: water.currentMl,
    focusSessions: focus.sessions,
    completedTasks,
    steps: health.steps,
    sleepHours: sleep.hours,
    mood: mood.value,
    calories: food.total
  };
  persistState(state);
}
