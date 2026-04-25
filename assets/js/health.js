import { getState, mutateState } from "./state.js";
import { selectExerciseWaterRecommendation, selectHealthStatsToday, selectTodayActivityEntries } from "./selectors.js";
import { escapeHTML, formatDurationMinutes, qs, safeHTML, safeText, safeValue, uid } from "./utils.js";

export const ACTIVITY_LIBRARY = [
  { id: "walk-light", name: "Caminhada leve", met: 2.8, intensity: "leve" },
  { id: "walk-fast", name: "Caminhada rápida", met: 4.3, intensity: "moderada" },
  { id: "run-light", name: "Corrida leve", met: 7.0, intensity: "moderada" },
  { id: "run-hard", name: "Corrida intensa", met: 10.0, intensity: "intensa" },
  { id: "bike-light", name: "Bicicleta leve", met: 4.0, intensity: "leve" },
  { id: "bike-moderate", name: "Bicicleta moderada", met: 6.8, intensity: "moderada" },
  { id: "bike-hard", name: "Bicicleta intensa", met: 9.0, intensity: "intensa" },
  { id: "weights", name: "Musculação", met: 5.0, intensity: "moderada" },
  { id: "soccer", name: "Futebol", met: 7.0, intensity: "intensa" },
  { id: "futsal", name: "Futsal", met: 8.0, intensity: "intensa" },
  { id: "basket", name: "Basquete", met: 6.5, intensity: "intensa" },
  { id: "volleyball", name: "Vôlei", met: 4.0, intensity: "moderada" },
  { id: "swim", name: "Natação", met: 7.0, intensity: "intensa" },
  { id: "dance", name: "Dança", met: 5.5, intensity: "moderada" },
  { id: "hiit", name: "HIIT", met: 9.0, intensity: "intensa" },
  { id: "yoga", name: "Yoga", met: 2.5, intensity: "leve" },
  { id: "pilates", name: "Pilates", met: 3.0, intensity: "leve" },
  { id: "stairs", name: "Escada", met: 8.8, intensity: "intensa" },
  { id: "elliptical", name: "Elíptico", met: 5.5, intensity: "moderada" },
  { id: "stretching", name: "Alongamento", met: 2.3, intensity: "leve" },
  { id: "functional", name: "Funcional", met: 6.0, intensity: "moderada" },
  { id: "martial", name: "Artes marciais", met: 8.5, intensity: "intensa" },
  { id: "treadmill", name: "Corrida esteira", met: 8.3, intensity: "intensa" },
  { id: "spinning", name: "Spinning", met: 8.8, intensity: "intensa" }
];

function getActivityById(activityId) {
  return ACTIVITY_LIBRARY.find((activity) => activity.id === activityId) ?? ACTIVITY_LIBRARY[0];
}

export function calculateActivityCalories(activity, minutes, weightKg = 70) {
  const safeMinutes = Math.max(0, Number(minutes || 0));
  const safeWeight = Math.max(20, Number(weightKg || 70));
  return Math.round((Number(activity.met || 0) * 3.5 * safeWeight / 200) * safeMinutes);
}

function parseWorkoutDays(value) {
  return String(value || "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function parseWorkoutExercises(namesValue, setsValue) {
  const names = String(namesValue || "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

  return names.map((name) => ({
    name,
    sets: setsValue || "",
    reps: "",
    load: "",
    notes: ""
  }));
}

function addActivity() {
  const activity = getActivityById(qs("#healthActivityType").value);
  const minutes = Math.max(0, Number(qs("#workoutInput").value || 0));
  if (!minutes) return;

  mutateState((draft) => {
    const weight = Number(draft.profile.weight || 70);
    const calories = calculateActivityCalories(activity, minutes, weight);
    draft.health.workoutMinutes = minutes;
    draft.health.activityEntries.unshift({
      id: uid("activity"),
      name: activity.name,
      activityId: activity.id,
      minutes,
      calories,
      intensity: activity.intensity,
      date: new Date().toISOString().slice(0, 10)
    });
  }, { scope: "health" });
}

function saveWorkoutPlan() {
  const name = qs("#workoutNameInput").value.trim();
  if (!name) return;

  mutateState((draft) => {
    draft.health.workouts.unshift({
      id: uid("workout"),
      name,
      daysOfWeek: parseWorkoutDays(qs("#workoutDaysInput").value),
      notes: qs("#workoutNotesInput").value.trim(),
      exercises: parseWorkoutExercises(qs("#workoutExercisesInput").value, qs("#workoutSetsInput").value)
    });
  }, { scope: "health" });

  safeValue("#workoutNameInput", "");
  safeValue("#workoutExercisesInput", "");
  safeValue("#workoutSetsInput", "");
  safeValue("#workoutDaysInput", "");
  safeValue("#workoutNotesInput", "");
}

function saveSteps() {
  mutateState((draft) => {
    draft.health.steps = Math.max(0, Number(qs("#stepsInput").value || 0));
  }, { scope: "health" });
}

function saveWorkoutMinutes() {
  mutateState((draft) => {
    draft.health.workoutMinutes = Math.max(0, Number(qs("#workoutInput").value || 0));
  }, { scope: "health" });
}

function removeActivity(activityId) {
  mutateState((draft) => {
    draft.health.activityEntries = (draft.health.activityEntries || []).filter((entry) => entry.id !== activityId);
  }, { scope: "health" });
}

function removeWorkout(workoutId) {
  mutateState((draft) => {
    draft.health.workouts = (draft.health.workouts || []).filter((entry) => entry.id !== workoutId);
  }, { scope: "health" });
}

export function initHealth() {
  safeHTML("#healthActivityType", ACTIVITY_LIBRARY.map((activity) => (
    `<option value="${escapeHTML(activity.id)}">${escapeHTML(activity.name)}</option>`
  )).join(""));

  qs("#saveStepsBtn").addEventListener("click", saveSteps);
  qs("#saveWorkoutBtn").addEventListener("click", saveWorkoutMinutes);
  qs("#addActivityBtn").addEventListener("click", addActivity);
  qs("#saveWorkoutPlanBtn").addEventListener("click", saveWorkoutPlan);

  qs("#stepQuickAddRow").addEventListener("click", (event) => {
    const chip = event.target.closest("[data-step-add]");
    if (!chip) return;
    mutateState((draft) => {
      draft.health.steps = Math.max(0, Number(draft.health.steps || 0) + Number(chip.dataset.stepAdd || 0));
    }, { scope: "health" });
  });

  qs("#activityList").addEventListener("click", (event) => {
    const remove = event.target.closest("[data-remove-activity]");
    if (remove) {
      removeActivity(remove.dataset.removeActivity);
    }
  });

  qs("#workoutsList").addEventListener("click", (event) => {
    const remove = event.target.closest("[data-remove-workout]");
    if (remove) {
      removeWorkout(remove.dataset.removeWorkout);
    }
  });
}

export function renderHealth(state = getState()) {
  const health = selectHealthStatsToday(state);
  const waterRecommendation = selectExerciseWaterRecommendation(state);
  const todayActivities = selectTodayActivityEntries(state);

  safeText("#stepsVal", String(health.steps));
  safeText("#workoutVal", String(health.workoutMinutes));
  safeText("#activityCaloriesVal", `${health.calories} kcal`);
  safeText("#exerciseWaterVal", `${waterRecommendation.extraMl}ml`);
  safeValue("#stepsInput", health.steps || "");
  safeValue("#workoutInput", health.workoutMinutes || "");

  safeHTML("#activityList", todayActivities.length
    ? todayActivities.map((entry) => `
      <div class="task-item">
        <div class="item-top">
          <div>
            <div class="task-title">${escapeHTML(entry.name)}</div>
            <div class="item-meta">${escapeHTML(formatDurationMinutes(entry.minutes))} - ${escapeHTML(String(entry.calories))} kcal - ${escapeHTML(entry.intensity)}</div>
          </div>
          <button class="btn btn-xs" type="button" data-remove-activity="${escapeHTML(entry.id)}">Excluir</button>
        </div>
      </div>
    `).join("")
    : `
      <div class="empty-state">
        <strong>Nenhuma atividade registrada hoje</strong>
        <span>Use a biblioteca acima para salvar caminhada, corrida, musculação e outros treinos com gasto estimado.</span>
      </div>
    `);

  safeHTML("#workoutsList", (state.health.workouts || []).length
    ? state.health.workouts.map((workout) => `
      <div class="task-item">
        <div class="item-top">
          <div>
            <div class="task-title">${escapeHTML(workout.name)}</div>
            <div class="item-meta">${escapeHTML((workout.daysOfWeek || []).join(", ") || "Dias livres")} - ${escapeHTML(String((workout.exercises || []).length))} exercício(s)</div>
          </div>
          <button class="btn btn-xs" type="button" data-remove-workout="${escapeHTML(workout.id)}">Excluir</button>
        </div>
        <div class="item-meta">${escapeHTML((workout.exercises || []).map((exercise) => `${exercise.name}${exercise.sets ? ` (${exercise.sets})` : ""}`).join(", "))}</div>
        ${workout.notes ? `<div class="item-meta">${escapeHTML(workout.notes)}</div>` : ""}
      </div>
    `).join("")
    : `
      <div class="empty-state">
        <strong>Nenhum treino salvo</strong>
        <span>Cadastre uma ficha simples de academia com dias da semana, exercícios e observações para consultar sempre que precisar.</span>
      </div>
    `);
}
