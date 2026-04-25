import { getState, mutateState, resetState } from "./state.js";
import { escapeHTML, qs, safeHTML, safeValue } from "./utils.js";

const PINNABLE_TABS = [
  { id: "overview", label: "Hoje" },
  { id: "water", label: "Água" },
  { id: "study", label: "Foco" },
  { id: "work", label: "Tarefas" },
  { id: "health", label: "Saúde" },
  { id: "sleep", label: "Sono" },
  { id: "food", label: "Nutrição" },
  { id: "habits", label: "Hábitos" },
  { id: "mood", label: "Bem-estar" },
  { id: "settings", label: "Configurações" },
  { id: "menu", label: "Menu" }
];

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function ensureMenuPinned(nextTabs) {
  const tabs = nextTabs.filter((tab) => tab && tab !== "menu").slice(0, 4);
  return [...tabs, "menu"];
}

function togglePinnedTab(tabId) {
  if (tabId === "menu") return;

  mutateState((draft) => {
    const current = Array.isArray(draft.ui.pinnedTabs) ? [...draft.ui.pinnedTabs] : ["overview", "water", "study", "work", "menu"];
    const withoutMenu = current.filter((tab) => tab !== "menu");
    const hasTab = withoutMenu.includes(tabId);

    const next = hasTab
      ? withoutMenu.filter((tab) => tab !== tabId)
      : [...withoutMenu.slice(0, 4), tabId];

    draft.ui.pinnedTabs = ensureMenuPinned(next);
  }, { scope: "settings" });
}

function resetDaily() {
  if (!window.confirm("Resetar apenas os dados do dia atual?")) return;
  const key = todayKey();
  mutateState((draft) => {
    draft.water.ml = 0;
    if (draft.water.history) {
      draft.water.history[key] = 0;
    }

    draft.focus.isRunning = false;
    draft.focus.soundPlaying = false;
    draft.focus.sessionsToday = 0;
    draft.focus.secondsLeft = draft.focus.mode === "deep" ? 50 * 60 : draft.focus.mode === "short" ? 5 * 60 : draft.focus.mode === "long" ? 15 * 60 : 25 * 60;
    if (draft.focus.history) {
      delete draft.focus.history[key];
    }

    draft.health.steps = 0;
    draft.health.workoutMinutes = 0;
    draft.health.activityEntries = (draft.health.activityEntries || []).filter((entry) => entry.date !== key);

    draft.sleep.entries[key] = {
      start: "23:00",
      end: "07:00",
      quality: 3,
      notes: "",
      wakeMood: 3
    };

    draft.food.entries = (draft.food.entries || []).filter((entry) => entry.date !== key);

    draft.habits = (draft.habits || []).map((habit) => ({
      ...habit,
      doneDates: (habit.doneDates || []).filter((date) => date !== key)
    }));

    draft.mood.value = 0;
    draft.mood.gratitude = "";
    draft.mood.notes = "";
    draft.mood.dailyCheckinShownDate = "";
    delete draft.mood.history[key];
    delete draft.mood.journalEntries[key];
    delete draft.history[key];
  }, { scopes: ["water", "focus", "health", "sleep", "food", "habits", "mood", "settings"] });
}

export function initSettings() {
  qs("#saveSettingsBtn").addEventListener("click", () => {
    mutateState((draft) => {
      draft.goals.waterMl = Number(qs("#goalWater").value || draft.goals.waterMl);
      draft.goals.steps = Number(qs("#goalSteps").value || draft.goals.steps);
      draft.goals.sleepHours = Number(qs("#goalSleep").value || draft.goals.sleepHours);
      draft.goals.calories = Number(qs("#goalCalories").value || draft.goals.calories);
    }, { scope: "settings" });
  });

  qs("#resetDailyBtn").addEventListener("click", resetDaily);

  qs("#resetAppBtn").addEventListener("click", () => {
    if (!window.confirm("Resetar todos os dados do FLOW-APP-LIMPO?")) return;
    resetState();
  });

  qs("#pinnedTabsEditor").addEventListener("click", (event) => {
    const button = event.target.closest("[data-pin-tab]");
    if (button) {
      togglePinnedTab(button.dataset.pinTab);
    }
  });
}

export function renderSettings(state = getState()) {
  document.documentElement.dataset.theme = "dark";
  safeValue("#goalWater", state.goals.waterMl);
  safeValue("#goalSteps", state.goals.steps);
  safeValue("#goalSleep", state.goals.sleepHours);
  safeValue("#goalCalories", state.goals.calories);

  safeHTML("#pinnedTabsEditor", PINNABLE_TABS.map((tab) => {
    const active = (state.ui.pinnedTabs || []).includes(tab.id);
    const forced = tab.id === "menu";
    return `
      <button class="chip ${active ? "on" : ""}" type="button" data-pin-tab="${escapeHTML(tab.id)}" ${forced ? "disabled" : ""}>
        ${escapeHTML(tab.label)}
      </button>
    `;
  }).join(""));

  safeHTML("#profileSummary", `
    <strong>${escapeHTML(state.profile.emoji || ":)")} ${escapeHTML(state.profile.name || "Seu perfil")}</strong><br>
    Peso: ${escapeHTML(state.profile.weight || "-")} kg - Altura: ${escapeHTML(state.profile.height || "-")} cm - Idade: ${escapeHTML(state.profile.age || "-")}
  `);
}
