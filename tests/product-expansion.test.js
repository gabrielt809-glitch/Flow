import assert from "node:assert/strict";
import { createDefaultState, normalizeState } from "../assets/js/schema.js";
import { selectExerciseWaterRecommendation } from "../assets/js/selectors.js";
import { calculateActivityCalories } from "../assets/js/health.js";
import { formatSleepDurationLabel } from "../assets/js/sleep.js";

export async function run() {
  assert.equal(calculateActivityCalories({ met: 8 }, 30, 70), 294);
  assert.equal(formatSleepDurationLabel(618), "10h18min");

  const hydratedState = normalizeState({
    ...createDefaultState(),
    health: {
      ...createDefaultState().health,
      activityEntries: [
        { name: "Corrida", minutes: 30, intensity: "intensa", date: "2026-04-25" },
        { name: "Yoga", minutes: 30, intensity: "leve", date: "2026-04-25" }
      ]
    }
  });

  const recommendation = selectExerciseWaterRecommendation(hydratedState);
  assert.equal(recommendation.extraMl, 900);
}
