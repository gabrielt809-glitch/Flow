import { getState, mutateState } from "./state.js";
import { selectJournalEntry } from "./selectors.js";
import { formatDateInput, formatDurationMinutes, qs, qsa, safeText, safeValue, todayKey } from "./utils.js";
import { closeModal, openModal } from "./timeblocks.js";

const BREATHING_PROGRAMS = {
  box: {
    cycleSeconds: 16,
    steps: [
      { until: 4, label: "Inspirar por 4s" },
      { until: 8, label: "Segurar por 4s" },
      { until: 12, label: "Expirar por 4s" },
      { until: 16, label: "Segurar por 4s" }
    ]
  },
  478: {
    cycleSeconds: 19,
    steps: [
      { until: 4, label: "Inspirar por 4s" },
      { until: 11, label: "Segurar por 7s" },
      { until: 19, label: "Expirar por 8s" }
    ]
  },
  calm: {
    cycleSeconds: 10,
    steps: [
      { until: 4, label: "Inspirar por 4s" },
      { until: 10, label: "Expirar por 6s" }
    ]
  }
};

let breathingInterval = null;
let breathingSeconds = 0;
let selectedDailyMood = 0;

function journalDate() {
  return qs("#journalDate").value || todayKey();
}

function saveMoodHistory() {
  mutateState((draft) => {
    draft.mood.gratitude = qs("#gratitudeInput").value.trim();
    draft.mood.notes = qs("#moodNotesInput").value.trim();
    draft.mood.history[todayKey()] = {
      value: draft.mood.value,
      gratitude: draft.mood.gratitude,
      notes: draft.mood.notes
    };
  }, { scope: "mood" });
}

function markDailyModalSeen(moodValue = null) {
  mutateState((draft) => {
    draft.mood.dailyCheckinShownDate = todayKey();
    if (moodValue != null) {
      draft.mood.value = Number(moodValue);
      draft.mood.history[todayKey()] = {
        value: draft.mood.value,
        gratitude: draft.mood.gratitude,
        notes: draft.mood.notes
      };
    }
  }, { scope: "mood" });
  closeModal("dailyMoodModal");
}

function toggleBreathing() {
  if (breathingInterval) {
    clearInterval(breathingInterval);
    breathingInterval = null;
    breathingSeconds = 0;
    safeText("#breathingTimer", "00:00");
    safeText("#breathingInstruction", "Escolha um modo e toque em iniciar.");
    safeText("#toggleBreathingBtn", "Iniciar");
    return;
  }

  const mode = qs("#breathingMode").value;
  const program = BREATHING_PROGRAMS[mode] || BREATHING_PROGRAMS.box;
  safeText("#toggleBreathingBtn", "Parar");
  breathingInterval = window.setInterval(() => {
    breathingSeconds += 1;
    const cycleProgress = ((breathingSeconds - 1) % program.cycleSeconds) + 1;
    const step = program.steps.find((entry) => cycleProgress <= entry.until) || program.steps.at(-1);
    safeText("#breathingInstruction", step.label);
    safeText("#breathingTimer", formatDurationMinutes(breathingSeconds));
  }, 1000);
}

function saveJournal() {
  const dateKey = journalDate();
  mutateState((draft) => {
    draft.mood.journalEntries[dateKey] = {
      summary: qs("#journalDayInput").value.trim(),
      highs: qs("#journalHighsInput").value.trim(),
      lows: qs("#journalLowsInput").value.trim(),
      lessons: qs("#journalLearningsInput").value.trim(),
      gratitude: qs("#journalGratitudeInput").value.trim(),
      notes: qs("#journalNotesInput").value.trim()
    };
  }, { scope: "mood" });
}

export function initMood() {
  safeValue("#journalDate", formatDateInput());

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

  qsa("[data-daily-mood]").forEach((button) => {
    button.addEventListener("click", () => {
      selectedDailyMood = Number(button.dataset.dailyMood);
      qsa("[data-daily-mood]").forEach((entry) => {
        entry.classList.toggle("on", Number(entry.dataset.dailyMood) === selectedDailyMood);
      });
    });
  });

  qs("#saveMoodBtn").addEventListener("click", saveMoodHistory);
  qs("#toggleBreathingBtn").addEventListener("click", toggleBreathing);
  qs("#saveJournalBtn").addEventListener("click", saveJournal);
  qs("#journalDate").addEventListener("change", () => renderMood());
  qs("#skipDailyMoodBtn").addEventListener("click", () => markDailyModalSeen());
  qs("#saveDailyMoodBtn").addEventListener("click", () => markDailyModalSeen(selectedDailyMood || 3));
}

export function renderMood(state = getState()) {
  const journal = selectJournalEntry(state, journalDate());
  safeValue("#gratitudeInput", state.mood.gratitude);
  safeValue("#moodNotesInput", state.mood.notes);
  safeValue("#journalDayInput", journal.summary);
  safeValue("#journalHighsInput", journal.highs);
  safeValue("#journalLowsInput", journal.lows);
  safeValue("#journalLearningsInput", journal.lessons);
  safeValue("#journalGratitudeInput", journal.gratitude);
  safeValue("#journalNotesInput", journal.notes);

  qsa("[data-mood]").forEach((button) => {
    button.classList.toggle("on", Number(button.dataset.mood) === Number(state.mood.value));
  });

  if (state.onboarded && state.mood.dailyCheckinShownDate !== todayKey()) {
    openModal("dailyMoodModal");
  }
}
