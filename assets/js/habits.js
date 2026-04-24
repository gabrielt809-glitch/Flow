import { getState, mutateState } from "./state.js";
import { selectHabitStatsToday, selectTodayKey } from "./selectors.js";
import { escapeHTML, qs, safeHTML, uid } from "./utils.js";
import { closeModal, openModal } from "./timeblocks.js";

export function initHabits() {
  qs("#openHabitBtn").addEventListener("click", () => openModal("habitModal"));
  qs("#saveHabitBtn").addEventListener("click", saveHabit);
  qs("#habitsList").addEventListener("click", (event) => {
    const toggle = event.target.closest("[data-habit-toggle]");
    if (toggle) toggleHabit(toggle.dataset.habitToggle);
  });
}

function saveHabit() {
  const name = qs("#habitName").value.trim();
  if (!name) return;
  mutateState((draft) => {
    draft.habits.push({
      id: uid("habit"),
      name,
      icon: qs("#habitIcon").value.trim() || "✨",
      doneDates: []
    });
  }, { scope: "habits" });
  qs("#habitName").value = "";
  qs("#habitIcon").value = "";
  closeModal("habitModal");
}

function toggleHabit(id) {
  const key = selectTodayKey();
  mutateState((draft) => {
    const habit = draft.habits.find((item) => item.id === id);
    if (!habit) return;
    const alreadyDone = habit.doneDates.includes(key);
    habit.doneDates = alreadyDone
      ? habit.doneDates.filter((date) => date !== key)
      : [...habit.doneDates, key];
  }, { scope: "habits" });
}

export function renderHabits(state = getState()) {
  const stats = selectHabitStatsToday(state);
  const today = stats.key;
  const enrichedHabits = state.habits.map((habit) => {
    const doneDates = habit.doneDates || [];
    return {
      ...habit,
      doneToday: doneDates.includes(today)
    };
  });

  safeHTML("#habitsList", enrichedHabits.length
    ? enrichedHabits.map((habit) => `
      <div class="habit-item">
        <div class="task-row">
          <div class="task-main">
            <button class="habit-check ${habit.doneToday ? "done" : ""}" type="button" data-habit-toggle="${escapeHTML(habit.id)}"></button>
            <div>
              <div class="habit-name">${escapeHTML(habit.icon)} ${escapeHTML(habit.name)}</div>
              <div class="item-meta">${escapeHTML(habit.doneDates.length)} registro(s)</div>
            </div>
          </div>
        </div>
      </div>
    `).join("")
    : `<div class="habit-item"><div class="item-meta">Crie o primeiro hábito para acompanhar sua consistência.</div></div>`);
}
