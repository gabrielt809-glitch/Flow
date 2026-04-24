import { getState, mutateState, resetState } from "./state.js";
import { escapeHTML, qs, safeHTML } from "./utils.js";

export function initSettings() {
  qs("#themeToggle").addEventListener("click", () => {
    mutateState((draft) => {
      draft.ui.theme = draft.ui.theme === "light" ? "dark" : "light";
    }, { scope: "settings" });
  });

  qs("#saveSettingsBtn").addEventListener("click", () => {
    mutateState((draft) => {
      draft.goals.waterMl = Number(qs("#goalWater").value || draft.goals.waterMl);
      draft.goals.steps = Number(qs("#goalSteps").value || draft.goals.steps);
      draft.goals.sleepHours = Number(qs("#goalSleep").value || draft.goals.sleepHours);
      draft.goals.calories = Number(qs("#goalCalories").value || draft.goals.calories);
    }, { scope: "settings" });
  });

  qs("#resetAppBtn").addEventListener("click", () => {
    if (!window.confirm("Resetar todos os dados do FLOW-APP-LIMPO?")) return;
    resetState();
  });
}

export function renderSettings(state = getState()) {
  document.documentElement.dataset.theme = state.ui.theme;
  qs("#themeToggle").classList.toggle("on", state.ui.theme === "light");
  qs("#goalWater").value = state.goals.waterMl;
  qs("#goalSteps").value = state.goals.steps;
  qs("#goalSleep").value = state.goals.sleepHours;
  qs("#goalCalories").value = state.goals.calories;
  safeHTML("#profileSummary", `
    <strong>${escapeHTML(state.profile.emoji || "😊")} ${escapeHTML(state.profile.name || "Seu perfil")}</strong><br>
    Peso: ${escapeHTML(state.profile.weight || "-")} kg • Altura: ${escapeHTML(state.profile.height || "-")} cm • Idade: ${escapeHTML(state.profile.age || "-")}
  `);
}
