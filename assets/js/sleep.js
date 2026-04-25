import { getState, mutateState } from "./state.js";
import { selectSleepEntry, selectSleepWeek, selectTodayKey } from "./selectors.js";
import { diffHours, escapeHTML, formatDateInput, formatDurationMinutes, qs, qsa, safeHTML, safeStyle, safeText, safeValue } from "./utils.js";

let selectedSleepDate = selectTodayKey();

function getCurrentDateKey() {
  return qs("#sleepDate").value || selectedSleepDate || selectTodayKey();
}

export function formatSleepDurationLabel(totalMinutes) {
  const formatted = formatDurationMinutes(totalMinutes);
  const [hours, minutes] = formatted.split(":");
  return `${Number(hours)}h${String(minutes).padStart(2, "0")}min`;
}

function persistSleepEntry() {
  const key = getCurrentDateKey();
  mutateState((draft) => {
    const currentEntry = draft.sleep.entries[key] || {};
    const nextEntry = {
      ...currentEntry,
      start: qs("#sleepStart").value || "23:00",
      end: qs("#sleepEnd").value || "07:00",
      quality: Number(currentEntry.quality || draft.sleep.quality || 3),
      notes: qs("#dreamNotes").value.trim(),
      wakeMood: Number(currentEntry.wakeMood || draft.sleep.wakeMood || 3)
    };
    draft.sleep.entries[key] = nextEntry;
    draft.sleep.history[key] = {
      hours: Number(diffHours(nextEntry.start, nextEntry.end)),
      quality: nextEntry.quality,
      notes: nextEntry.notes
    };

    if (key === selectTodayKey()) {
      draft.sleep.start = nextEntry.start;
      draft.sleep.end = nextEntry.end;
      draft.sleep.notes = nextEntry.notes;
      draft.sleep.quality = nextEntry.quality;
      draft.sleep.wakeMood = nextEntry.wakeMood;
    }
  }, { scope: "sleep" });
}

function setSleepQuality(value) {
  const key = getCurrentDateKey();
  mutateState((draft) => {
    const currentEntry = draft.sleep.entries[key] || {};
    draft.sleep.entries[key] = {
      ...currentEntry,
      start: currentEntry.start || qs("#sleepStart").value || draft.sleep.start,
      end: currentEntry.end || qs("#sleepEnd").value || draft.sleep.end,
      notes: currentEntry.notes ?? qs("#dreamNotes").value.trim(),
      quality: Number(value),
      wakeMood: Number(currentEntry.wakeMood || draft.sleep.wakeMood || 3)
    };

    if (key === selectTodayKey()) {
      draft.sleep.quality = Number(value);
    }
  }, { scope: "sleep" });
}

function setWakeMood(value) {
  const key = getCurrentDateKey();
  mutateState((draft) => {
    const currentEntry = draft.sleep.entries[key] || {};
    draft.sleep.entries[key] = {
      ...currentEntry,
      start: currentEntry.start || qs("#sleepStart").value || draft.sleep.start,
      end: currentEntry.end || qs("#sleepEnd").value || draft.sleep.end,
      notes: currentEntry.notes ?? qs("#dreamNotes").value.trim(),
      quality: Number(currentEntry.quality || draft.sleep.quality || 3),
      wakeMood: Number(value)
    };

    if (key === selectTodayKey()) {
      draft.sleep.wakeMood = Number(value);
    }
  }, { scope: "sleep" });
}

function handleSleepDateChange() {
  selectedSleepDate = qs("#sleepDate").value || selectTodayKey();
  renderSleep();
}

export function initSleep() {
  safeValue("#sleepDate", formatDateInput());

  ["input", "change", "blur"].forEach((eventName) => {
    qs("#sleepStart").addEventListener(eventName, persistSleepEntry);
    qs("#sleepEnd").addEventListener(eventName, persistSleepEntry);
    qs("#dreamNotes").addEventListener(eventName, persistSleepEntry);
  });

  qs("#sleepDate").addEventListener("change", handleSleepDateChange);

  qsa("[data-sleep-quality]").forEach((button) => {
    button.addEventListener("click", () => setSleepQuality(button.dataset.sleepQuality));
  });

  qsa("[data-wake-mood]").forEach((button) => {
    button.addEventListener("click", () => setWakeMood(button.dataset.wakeMood));
  });
}

export function renderSleep(state = getState()) {
  const dateKey = getCurrentDateKey();
  const sleep = selectSleepEntry(state, dateKey);
  const weekly = selectSleepWeek(state, dateKey);

  safeValue("#sleepDate", dateKey);
  safeValue("#sleepStart", sleep.start);
  safeValue("#sleepEnd", sleep.end);
  safeValue("#dreamNotes", sleep.notes);
  safeText("#sleepHrs", formatSleepDurationLabel(sleep.totalMinutes));
  safeStyle("#sleepBar", "width", `${sleep.percent}%`);
  safeText("#sleepDebt", sleep.debt >= 0 ? `${formatSleepDurationLabel(Math.round(sleep.debt * 60))} acima da meta` : `${formatSleepDurationLabel(Math.round(Math.abs(sleep.debt) * 60))} abaixo da meta`);
  safeText("#alarmSugg", `Dormir ${sleep.start}`);

  safeHTML("#sleepWeekList", weekly.map((entry) => `
    <div class="task-item">
      <div class="item-top">
        <div>
          <div class="task-title">${escapeHTML(entry.date.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" }))}</div>
          <div class="item-meta">Qualidade ${escapeHTML(String(entry.quality || 0))}/5 - sensação ${escapeHTML(String(entry.wakeMood || 0))}/4</div>
        </div>
        <div class="task-badge">${escapeHTML(formatSleepDurationLabel(Math.round(entry.hours * 60)))}</div>
      </div>
    </div>
  `).join(""));

  qsa("[data-sleep-quality]").forEach((button) => {
    button.classList.toggle("on", Number(button.dataset.sleepQuality) === Number(sleep.quality));
  });

  qsa("[data-wake-mood]").forEach((button) => {
    button.classList.toggle("on", Number(button.dataset.wakeMood) === Number(sleep.wakeMood));
  });
}
