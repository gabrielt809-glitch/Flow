import { renderNavigation } from "./navigation.js";
import { renderOnboarding } from "./onboarding.js";
import { renderOverview } from "./overview.js";
import { renderWater } from "./water.js";
import { renderFocus } from "./focus.js";
import { renderTasks } from "./tasks.js";
import { renderCalendar } from "./calendar.js";
import { renderTimeblocks } from "./timeblocks.js";
import { renderHealth } from "./health.js";
import { renderSleep } from "./sleep.js";
import { renderFood } from "./food.js";
import { renderHabits } from "./habits.js";
import { renderMood } from "./mood.js";
import { renderSettings } from "./settings.js";
import { upsertDailyHistory } from "./state.js";

const scopeDependencies = {
  all: ["all"],
  onboarding: ["onboarding", "navigation", "overview"],
  navigation: ["navigation"],
  overview: ["overview"],
  water: ["water", "overview", "history"],
  focus: ["focus", "overview", "history"],
  tasks: ["tasks", "calendar", "overview", "history"],
  calendar: ["calendar"],
  timeblocks: ["timeblocks", "calendar"],
  health: ["health", "overview", "history"],
  sleep: ["sleep", "overview", "history"],
  food: ["food", "overview", "history"],
  habits: ["habits", "overview", "history"],
  mood: ["mood", "overview", "history"],
  settings: ["settings", "overview"],
  history: ["history"]
};

const renderers = {
  onboarding: renderOnboarding,
  navigation: renderNavigation,
  overview: renderOverview,
  water: renderWater,
  focus: renderFocus,
  tasks: renderTasks,
  calendar: renderCalendar,
  timeblocks: renderTimeblocks,
  health: renderHealth,
  sleep: renderSleep,
  food: renderFood,
  habits: renderHabits,
  mood: renderMood,
  settings: renderSettings
};

function expandScopes(scopes = ["all"]) {
  const input = Array.isArray(scopes) ? scopes : [scopes];
  const expanded = new Set();

  for (const scope of input) {
    const dependencies = scopeDependencies[scope] ?? ["all"];
    dependencies.forEach((entry) => expanded.add(entry));
  }

  if (expanded.has("all")) {
    return new Set(["all"]);
  }

  return expanded;
}

export function renderScopes(scopes, state) {
  const expanded = expandScopes(scopes);

  if (expanded.has("all")) {
    upsertDailyHistory();
    Object.values(renderers).forEach((render) => render(state));
    return;
  }

  if (expanded.has("history")) {
    upsertDailyHistory();
    expanded.delete("history");
  }

  expanded.forEach((scope) => {
    const render = renderers[scope];
    if (typeof render === "function") {
      render(state);
    }
  });
}

export function renderAll(state) {
  renderScopes(["all"], state);
}
