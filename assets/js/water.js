import { mutateState, getState } from "./state.js";
import { selectTodayKey, selectWaterProgress } from "./selectors.js";
import { escapeHTML, qs, qsa, safeHTML, safeStyle, safeText } from "./utils.js";

const DEFAULT_VOLUMES = [150, 250, 350, 500];

function syncWaterHistory(draft) {
  draft.water.history[selectTodayKey()] = draft.water.ml;
}

function readCustomWaterMl() {
  const rawValue = Number(qs("#waterCustomMl").value);
  return Number.isFinite(rawValue) && rawValue > 0 ? Math.round(rawValue) : null;
}

function getAllVolumes(state = getState()) {
  return [...DEFAULT_VOLUMES, ...(state.water.customVolumes || [])].sort((left, right) => left - right);
}

function handleAddWater() {
  const customMl = readCustomWaterMl();
  addWater(1, customMl);
}

function saveCustomVolume() {
  const customMl = readCustomWaterMl();
  if (!customMl) return;

  mutateState((draft) => {
    const current = Array.isArray(draft.water.customVolumes) ? draft.water.customVolumes : [];
    const allValues = new Set([...DEFAULT_VOLUMES, ...current]);
    if (allValues.has(customMl)) {
      draft.water.cupMl = customMl;
      return;
    }

    draft.water.customVolumes = [...current, customMl].sort((left, right) => left - right);
    draft.water.cupMl = customMl;
  }, { scope: "water" });

  qs("#waterCustomMl").value = "";
}

function removeCustomVolume(valueToRemove) {
  mutateState((draft) => {
    draft.water.customVolumes = (draft.water.customVolumes || []).filter((value) => value !== valueToRemove);
    if (draft.water.cupMl === valueToRemove) {
      draft.water.cupMl = DEFAULT_VOLUMES.includes(250) ? 250 : DEFAULT_VOLUMES[0];
    }
  }, { scope: "water" });
}

export function initWater() {
  qs("#quickAddWaterBtn").addEventListener("click", () => addWater(1));
  qs("#addWaterBtn").addEventListener("click", handleAddWater);
  qs("#removeWaterBtn").addEventListener("click", () => addWater(-1));
  qs("#saveWaterCustomBtn").addEventListener("click", saveCustomVolume);
  qs("#waterCustomMl").addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      saveCustomVolume();
    }
  });

  qs("#waterVolumes").addEventListener("click", (event) => {
    const removeButton = event.target.closest("[data-remove-custom-volume]");
    if (removeButton) {
      removeCustomVolume(Number(removeButton.dataset.removeCustomVolume));
      return;
    }

    const volumeButton = event.target.closest("[data-cup-size]");
    if (volumeButton) {
      const value = Number(volumeButton.dataset.cupSize);
      mutateState((draft) => {
        draft.water.cupMl = value;
      }, { scope: "water" });
    }
  });
}

export function addWater(direction, customMl = null) {
  mutateState((draft) => {
    const amountMl = Number.isFinite(customMl) && customMl > 0 ? customMl : draft.water.cupMl;
    draft.water.ml = Math.max(0, draft.water.ml + (amountMl * direction));
    syncWaterHistory(draft);
  }, { scope: "water" });

  if (customMl) {
    qs("#waterCustomMl").value = "";
  }
}

export function renderWater(state = getState()) {
  const water = selectWaterProgress(state);
  const selectedVolume = water.cupMl;
  const allVolumes = getAllVolumes(state);

  safeText("#waterNum", String(water.cupCount));
  safeHTML("#waterUnit", `${water.currentMl}ml consumidos - ${water.cupCount} copos de ${selectedVolume}ml`);
  safeText("#waterMl", `${water.currentMl}ml`);
  safeText("#waterMax", `${water.goalMl}ml`);
  safeText("#waterPercentLabel", `${water.percent}%`);
  safeText("#waterMetricConsumed", `${water.currentMl}ml`);
  safeText("#waterMetricGoal", `${water.goalMl}ml`);
  safeText("#waterMetricCups", `${water.cupCount} copos`);
  safeStyle("#waterBar", "width", `${water.percent}%`);
  safeHTML("#waterCups", Array.from({ length: Math.max(water.goalCups, 8) }, (_, index) => (
    `<div class="cup ${index < water.cupCount ? "fill" : ""}"></div>`
  )).join(""));

  safeHTML("#waterVolumes", allVolumes.map((volume) => {
    const isCustom = !DEFAULT_VOLUMES.includes(volume);
    return `
      <button class="chip water-chip ${selectedVolume === volume ? "on" : ""}" type="button" data-cup-size="${escapeHTML(volume)}">
        <span>${escapeHTML(volume)}ml</span>
        ${isCustom ? `<span class="water-chip-remove" data-remove-custom-volume="${escapeHTML(volume)}" aria-label="Remover volume ${escapeHTML(volume)}ml">&times;</span>` : ""}
      </button>
    `;
  }).join(""));
}
