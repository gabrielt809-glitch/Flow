import { getState } from "./state.js";
import { selectScore, selectStreak, selectWeeklyScoreSeries } from "./selectors.js";

export function calculateScore(state = getState()) {
  return selectScore(state);
}

export function getWeeklyScoreSeries(state = getState()) {
  return selectWeeklyScoreSeries(state);
}

export function getStreak(state = getState()) {
  return selectStreak(state);
}
