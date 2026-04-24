import { getState, mutateState } from "./state.js";
import { selectHealthStatsToday } from "./selectors.js";
import { qs, safeStyle, safeText } from "./utils.js";

export function initHealth() {
  qs("#saveStepsBtn").addEventListener("click", () => {
    mutateState((draft) => {
      draft.health.steps = Number(qs("#stepsInput").value || 0);
    }, { scope: "health" });
  });
  qs("#saveWorkoutBtn").addEventListener("click", () => {
    mutateState((draft) => {
      draft.health.workoutMinutes = Number(qs("#workoutInput").value || 0);
    }, { scope: "health" });
  });
}

export function renderHealth(state = getState()) {
  const health = selectHealthStatsToday(state);
  safeText("#stepsVal", String(health.steps));
  safeText("#workoutVal", String(health.workoutMinutes));
  qs("#stepsInput").value = health.steps || "";
  qs("#workoutInput").value = health.workoutMinutes || "";
  safeStyle("#ovb-health", "width", `${health.percent}%`);
}
