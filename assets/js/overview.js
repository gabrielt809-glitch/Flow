import { getStreak } from "./history.js";
import { getState } from "./state.js";
import {
  selectFocusStatsToday,
  selectFoodCaloriesToday,
  selectHabitStatsToday,
  selectHealthStatsToday,
  selectMoodToday,
  selectNextTask,
  selectScore,
  selectSleepToday,
  selectTaskStats,
  selectWaterProgress,
  selectWeeklyScoreSeries
} from "./selectors.js";
import { humanDate, optionalQs, qs, safeHTML, safeText } from "./utils.js";

function setBarWidth(id, value) {
  const element = optionalQs(id);
  if (element) element.style.width = `${value}%`;
}

export function renderOverview(state = getState()) {
  const score = selectScore(state);
  const streak = getStreak(state);
  const nextTask = selectNextTask(state);
  const water = selectWaterProgress(state);
  const focus = selectFocusStatsToday(state);
  const tasks = selectTaskStats(state);
  const health = selectHealthStatsToday(state);
  const sleep = selectSleepToday(state);
  const food = selectFoodCaloriesToday(state);
  const habits = selectHabitStatsToday(state);
  const mood = selectMoodToday(state);

  safeText("#hdrDate", humanDate(new Date()));
  safeText("#greeting", `Olá ${state.profile.name || "Você"} ${state.profile.emoji || ""}`.trim());
  safeText("#greetSub", score >= 60 ? "Seu dia está ganhando tração." : "Vamos montar um bom ritmo hoje.");
  safeText("#motivationEl", score >= 60
    ? "Você está sustentando consistência. Priorize manter as pequenas vitórias."
    : "Comece pelo próximo passo simples: água, foco ou uma tarefa curta.");
  safeText("#scoreNum", `${score}%`);
  safeText("#ovScore", `${score}%`);
  safeText("#streakText", streak > 0 ? `${streak} dias seguidos!` : "Hoje é um bom dia para recomeçar.");

  safeText("#ms-water", `${water.percent}%`);
  safeText("#ms-focus", String(focus.sessions));
  safeText("#ms-tasks", String(tasks.completed));
  safeText("#ms-steps", String(health.steps));

  safeText("#ov-water", `${water.cupCount}/${water.goalCups}`);
  safeText("#ov-study", `${focus.sessions} pomos`);
  safeText("#ov-work", `${tasks.completed}/${tasks.total}`);
  safeText("#ov-health", `${health.steps} passos`);
  safeText("#ov-sleep", `${sleep.hours.toFixed(1)}h`);
  safeText("#ov-food", `${food.total} kcal`);
  safeText("#ov-habits", `${habits.completed}/${habits.total}`);
  safeText("#ov-mood", mood.value ? `${mood.value}/5` : "-");

  setBarWidth("#ovb-water", water.percent);
  setBarWidth("#ovb-study", focus.percent);
  setBarWidth("#ovb-work", tasks.percent);
  setBarWidth("#ovb-health", health.percent);
  setBarWidth("#ovb-sleep", sleep.percent);
  setBarWidth("#ovb-food", food.percent);
  setBarWidth("#ovb-habits", habits.percent);
  setBarWidth("#ovb-mood", mood.percent);

  qs("#nextTaskWrap").hidden = !nextTask;
  if (nextTask) {
    safeText("#nextTaskText", nextTask.title);
  }

  safeText("#spotlightTitle", nextTask ? `Prioridade: ${nextTask.title}` : "Seu dia está organizado");
  safeText("#spotlightSub", nextTask
    ? "Finalize a próxima tarefa importante e depois volte para manter o ritmo."
    : "Agora vale consolidar água, foco e sono para fechar o dia bem.");

  const series = selectWeeklyScoreSeries(state);
  safeHTML("#weekChart", series.map((entry) => `
    <div class="bar">
      <div class="bar-fill" style="height:${Math.max(entry.total, 8)}%"></div>
      <div class="bar-label">${entry.date.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "")}</div>
    </div>
  `).join(""));
  safeText("#weekCompare", `Média da semana: ${Math.round(series.reduce((acc, entry) => acc + entry.total, 0) / series.length)}%.`);
}
