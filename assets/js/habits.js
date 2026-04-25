import { getState, mutateState } from "./state.js";
import { selectHabitMonth, selectHabitStatsToday, selectHabitWeek, selectTodayKey } from "./selectors.js";
import { escapeHTML, formatDateInput, qs, safeHTML, safeText, safeValue, uid } from "./utils.js";
import { closeModal, openModal } from "./timeblocks.js";

const HABIT_SUGGESTIONS = [
  "Beber água",
  "Caminhar",
  "Leitura",
  "Meditar",
  "Dormir cedo",
  "Estudar",
  "Alongar",
  "Organizar finanças",
  "Evitar açúcar",
  "Skincare",
  "Treino"
];

function selectedHabitDate() {
  return qs("#habitDate").value || selectTodayKey();
}

function saveHabit(nameOverride = "") {
  const name = (nameOverride || qs("#habitName").value).trim();
  if (!name) return;
  mutateState((draft) => {
    draft.habits.push({
      id: uid("habit"),
      name,
      icon: qs("#habitIcon")?.value.trim() || "",
      doneDates: []
    });
  }, { scope: "habits" });
  safeValue("#habitName", "");
  safeValue("#habitIcon", "");
  closeModal("habitModal");
}

function toggleHabit(id) {
  const key = selectedHabitDate();
  mutateState((draft) => {
    const habit = draft.habits.find((item) => item.id === id);
    if (!habit) return;
    const alreadyDone = (habit.doneDates || []).includes(key);
    habit.doneDates = alreadyDone
      ? habit.doneDates.filter((date) => date !== key)
      : [...(habit.doneDates || []), key];
  }, { scope: "habits" });
}

function addSuggestion(name) {
  const exists = getState().habits.some((habit) => habit.name.toLowerCase() === String(name).toLowerCase());
  if (exists) return;
  saveHabit(name);
}

export function initHabits() {
  safeValue("#habitDate", formatDateInput());
  safeHTML("#habitSuggestions", HABIT_SUGGESTIONS.map((suggestion) => (
    `<button class="chip" type="button" data-habit-suggestion="${escapeHTML(suggestion)}">${escapeHTML(suggestion)}</button>`
  )).join(""));

  qs("#openHabitBtn").addEventListener("click", () => openModal("habitModal"));
  qs("#saveHabitBtn").addEventListener("click", () => saveHabit());

  qs("#habitsList").addEventListener("click", (event) => {
    const toggle = event.target.closest("[data-habit-toggle]");
    if (toggle) toggleHabit(toggle.dataset.habitToggle);
  });

  qs("#habitSuggestions").addEventListener("click", (event) => {
    const button = event.target.closest("[data-habit-suggestion]");
    if (button) {
      addSuggestion(button.dataset.habitSuggestion);
    }
  });
}

export function renderHabits(state = getState()) {
  const selectedDate = selectedHabitDate();
  const todayStats = selectHabitStatsToday(state);
  const weekly = selectHabitWeek(state, selectedDate);
  const monthly = selectHabitMonth(state, selectedDate);
  const completedMonth = monthly.reduce((total, day) => total + Number(day.completed || 0), 0);
  const completedWeek = weekly.reduce((total, day) => total + Number(day.completed || 0), 0);

  const enrichedHabits = state.habits.map((habit) => ({
    ...habit,
    doneOnSelectedDate: (habit.doneDates || []).includes(selectedDate)
  }));

  safeText("#habitWeekSummary", `${completedWeek}/${Math.max(state.habits.length * 7, 0)}`);
  safeText("#habitMonthSummary", `${completedMonth}/${Math.max(state.habits.length * monthly.length, 0)}`);

  safeHTML("#habitsList", enrichedHabits.length
    ? enrichedHabits.map((habit) => `
      <div class="habit-item">
        <div class="task-row">
          <div class="task-main">
            <button class="habit-check ${habit.doneOnSelectedDate ? "done" : ""}" type="button" data-habit-toggle="${escapeHTML(habit.id)}"></button>
            <div>
              <div class="habit-name">${habit.icon ? `${escapeHTML(habit.icon)} ` : ""}${escapeHTML(habit.name)}</div>
              <div class="item-meta">${escapeHTML(String((habit.doneDates || []).length))} registro(s) - hoje ${todayStats.completed}/${todayStats.total}</div>
            </div>
          </div>
        </div>
      </div>
    `).join("")
    : `
      <div class="empty-state">
        <strong>Nenhum hábito criado ainda</strong>
        <span>Use as sugestões rápidas ou crie um hábito próprio para acompanhar sua consistência ao longo da semana e do mês.</span>
      </div>
    `);
}
