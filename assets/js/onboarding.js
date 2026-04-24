import { getState, mutateState } from "./state.js";
import { qs } from "./utils.js";

function calculateWaterGoal(weight) {
  const numericWeight = Number(weight || 0);
  if (!numericWeight) return 2000;
  return Math.max(1500, Math.round(numericWeight * 35));
}

export function initOnboarding() {
  qs("#finishOnboardBtn").addEventListener("click", finishOnboarding);
}

export function finishOnboarding() {
  const profile = {
    name: qs("#ob-name").value.trim() || "Você",
    weight: qs("#ob-weight").value.trim(),
    height: qs("#ob-height").value.trim(),
    age: qs("#ob-age").value.trim(),
    emoji: qs("#ob-emoji").value.trim() || "😊"
  };

  mutateState((draft) => {
    draft.onboarded = true;
    draft.profile = profile;
    draft.goals.calories = Number(qs("#ob-cal").value || 2000);
    draft.goals.steps = Number(qs("#ob-steps").value || 10000);
    draft.goals.sleepHours = Number(qs("#ob-sleep").value || 8);
    draft.goals.waterMl = calculateWaterGoal(profile.weight);
  }, { scope: "onboarding" });
}

export function renderOnboarding(state = getState()) {
  qs("#onboard").hidden = state.onboarded;
  qs("#hdr").hidden = !state.onboarded;
  qs("#appWrap").hidden = !state.onboarded;
  qs("#mainNav").hidden = !state.onboarded;
  qs("#avatarBtn").textContent = state.profile.emoji || "😊";
}
