import { getState, mutateState } from "./state.js";
import { selectSleepToday, selectTodayKey } from "./selectors.js";
import { diffHours, formatHours, optionalQs, qs, qsa, safeStyle, safeText } from "./utils.js";

function saveSleep() {
  mutateState((draft) => {
    draft.sleep.start = qs("#sleepStart").value || "23:00";
    draft.sleep.end = qs("#sleepEnd").value || "07:00";
    draft.sleep.notes = qs("#dreamNotes").value;
    draft.sleep.history[selectTodayKey()] = {
      hours: diffHours(draft.sleep.start, draft.sleep.end),
      quality: draft.sleep.quality,
      notes: draft.sleep.notes
    };
  }, { scope: "sleep" });
}

export function initSleep() {
  ["input", "change", "blur"].forEach((eventName) => {
    qs("#sleepStart").addEventListener(eventName, saveSleep);
    qs("#sleepEnd").addEventListener(eventName, saveSleep);
    qs("#dreamNotes").addEventListener(eventName, saveSleep);
  });

  qsa("[data-sleep-quality]").forEach((button) => {
    button.addEventListener("click", () => {
      mutateState((draft) => {
        draft.sleep.quality = Number(button.dataset.sleepQuality);
        draft.sleep.history[selectTodayKey()] = {
          hours: diffHours(draft.sleep.start, draft.sleep.end),
          quality: draft.sleep.quality,
          notes: draft.sleep.notes
        };
      }, { scope: "sleep" });
    });
  });
}

export function renderSleep(state = getState()) {
  const sleep = selectSleepToday(state);
  qs("#sleepStart").value = sleep.start;
  qs("#sleepEnd").value = sleep.end;
  qs("#dreamNotes").value = sleep.notes;
  safeText("#sleepHrs", sleep.hours.toFixed(1));
  safeStyle("#sleepBar", "width", `${sleep.percent}%`);
  safeText("#sleepDebt", sleep.debt >= 0 ? `${formatHours(sleep.debt)} acima da meta` : `${formatHours(Math.abs(sleep.debt))} abaixo da meta`);
  safeText("#alarmSugg", `Dormir ${sleep.start}`);
  const sleepRing = optionalQs(".sleep-ring");
  if (sleepRing) {
    sleepRing.style.setProperty("--sleep-progress", `${sleep.percent}%`);
  }
  qsa("[data-sleep-quality]").forEach((button) => {
    button.classList.toggle("on", Number(button.dataset.sleepQuality) === Number(state.sleep.quality));
  });
}
