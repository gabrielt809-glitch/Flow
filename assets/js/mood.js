import { getState, mutateState } from "./state.js";
import { qs, qsa, todayKey } from "./utils.js";

export function initMood() {
  qsa("[data-mood]").forEach((button) => {
    button.addEventListener("click", () => {
      mutateState((draft) => {
        draft.mood.value = Number(button.dataset.mood);
        draft.mood.history[todayKey()] = {
          value: draft.mood.value,
          gratitude: draft.mood.gratitude,
          notes: draft.mood.notes
        };
      }, { scope: "mood" });
    });
  });

  qs("#saveMoodBtn").addEventListener("click", () => {
    mutateState((draft) => {
      draft.mood.gratitude = qs("#gratitudeInput").value;
      draft.mood.notes = qs("#moodNotesInput").value;
      draft.mood.history[todayKey()] = {
        value: draft.mood.value,
        gratitude: draft.mood.gratitude,
        notes: draft.mood.notes
      };
    }, { scope: "mood" });
  });
}

export function renderMood(state = getState()) {
  qs("#gratitudeInput").value = state.mood.gratitude;
  qs("#moodNotesInput").value = state.mood.notes;
  qsa("[data-mood]").forEach((button) => {
    button.classList.toggle("on", Number(button.dataset.mood) === Number(state.mood.value));
  });
}
