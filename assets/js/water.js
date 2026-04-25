import { mutateState, getState } from "./state.js";
import { selectTodayKey, selectWaterProgress } from "./selectors.js";
import { qs, qsa, safeHTML, safeStyle, safeText } from "./utils.js";

function syncWaterHistory(draft) {
  draft.water.history[selectTodayKey()] = draft.water.ml;
}

function readCustomWaterMl() {
  const rawValue = Number(qs("#waterCustomMl").value);
  return Number.isFinite(rawValue) && rawValue > 0 ? Math.round(rawValue) : null;
}

function handleAddWater() {
  const customMl = readCustomWaterMl();
  addWater(1, customMl);
  if (customMl) {
    qs("#waterCustomMl").value = "";
  }
}

export function initWater() {
  qs("#quickAddWaterBtn").addEventListener("click", () => addWater(1));
  qs("#addWaterBtn").addEventListener("click", handleAddWater);
  qs("#removeWaterBtn").addEventListener("click", () => addWater(-1));
  qs("#waterCustomMl").addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleAddWater();
    }
  });

  qsa("[data-cup-size]").forEach((button) => {
    button.addEventListener("click", () => {
      const value = Number(button.dataset.cupSize);
      mutateState((draft) => {
        draft.water.cupMl = value;
      }, { scope: "water" });
    });
  });
}

export function addWater(direction, customMl = null) {
  mutateState((draft) => {
    const amountMl = Number.isFinite(customMl) && customMl > 0 ? customMl : draft.water.cupMl;
    draft.water.ml = Math.max(0, draft.water.ml + (amountMl * direction));
    syncWaterHistory(draft);
  }, { scope: "water" });
}

export function renderWater(state = getState()) {
  const water = selectWaterProgress(state);
  safeText("#waterNum", String(water.cupCount));
  safeHTML("#waterUnit", `${water.currentMl}ml consumidos · meta <span id="waterGoalDisp">${water.goalMl}</span>ml`);
  safeText("#waterMl", `${water.currentMl}ml consumidos`);
  safeText("#waterMax", `Meta ${water.goalMl}ml`);
  safeText("#waterPercentLabel", `${water.percent}%`);
  safeStyle("#waterBar", "width", `${water.percent}%`);
  safeHTML("#waterCups", Array.from({ length: Math.max(water.goalCups, 8) }, (_, index) => (
    `<div class="cup ${index < water.cupCount ? "fill" : ""}"></div>`
  )).join(""));
  qsa("[data-cup-size]").forEach((button) => {
    button.classList.toggle("on", Number(button.dataset.cupSize) === state.water.cupMl);
  });
}
