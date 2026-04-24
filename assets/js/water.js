import { mutateState, getState } from "./state.js";
import { selectTodayKey, selectWaterProgress } from "./selectors.js";
import { qs, qsa, safeHTML, safeStyle, safeText } from "./utils.js";

function syncWaterHistory(draft) {
  draft.water.history[selectTodayKey()] = draft.water.ml;
}

export function initWater() {
  qs("#quickAddWaterBtn").addEventListener("click", () => addWater(1));
  qs("#addWaterBtn").addEventListener("click", () => addWater(1));
  qs("#removeWaterBtn").addEventListener("click", () => addWater(-1));

  qsa("[data-cup-size]").forEach((button) => {
    button.addEventListener("click", () => {
      const value = Number(button.dataset.cupSize);
      mutateState((draft) => {
        draft.water.cupMl = value;
      }, { scope: "water" });
    });
  });
}

export function addWater(direction) {
  mutateState((draft) => {
    draft.water.ml = Math.max(0, draft.water.ml + (draft.water.cupMl * direction));
    syncWaterHistory(draft);
  }, { scope: "water" });
}

export function renderWater(state = getState()) {
  const water = selectWaterProgress(state);
  safeText("#waterNum", String(water.cupCount));
  safeHTML("#waterUnit", `copos • ${water.currentMl}ml / <span id="waterGoalDisp">${water.goalMl}</span>ml`);
  safeText("#waterMl", `${water.currentMl}ml`);
  safeText("#waterMax", `${water.goalMl}ml`);
  safeStyle("#waterBar", "width", `${water.percent}%`);
  safeHTML("#waterCups", Array.from({ length: Math.max(water.goalCups, 8) }, (_, index) => (
    `<div class="cup ${index < water.cupCount ? "fill" : ""}"></div>`
  )).join(""));
  qsa("[data-cup-size]").forEach((button) => {
    button.classList.toggle("on", Number(button.dataset.cupSize) === state.water.cupMl);
  });
}
