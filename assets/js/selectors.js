import { diffHours, getWeekDates, percent, sum, todayKey, weekdayFromDateKey } from "./utils.js";

export function selectTodayKey() {
  return todayKey();
}

export function selectCalendarAnchorDate(state) {
  return state.ui.calendarAnchorDate || selectTodayKey();
}

export function selectCalendarWeekDates(state) {
  const anchorKey = selectCalendarAnchorDate(state);
  return getWeekDates(new Date(`${anchorKey}T12:00:00`));
}

export function selectCalendarWeekLabel(state) {
  const dates = selectCalendarWeekDates(state);
  const start = dates[0];
  const end = dates[dates.length - 1];
  const startDay = String(start.getDate()).padStart(2, "0");
  const endDay = String(end.getDate()).padStart(2, "0");
  const startMonth = start.toLocaleDateString("pt-BR", { month: "long" });
  const endMonth = end.toLocaleDateString("pt-BR", { month: "long" });

  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    return `${startDay} a ${endDay} de ${endMonth}`;
  }

  return `${startDay} de ${startMonth} a ${endDay} de ${endMonth}`;
}

export function selectCompletedTasks(state) {
  return state.tasks.filter((task) => task.done).length;
}

export function selectTaskStats(state) {
  const completed = selectCompletedTasks(state);
  const total = state.tasks.length;
  return {
    completed,
    total,
    pending: Math.max(total - completed, 0),
    percent: percent(completed, Math.max(total, 1))
  };
}

export function selectVisibleTasks(state) {
  const filter = state.ui.taskFilter;
  switch (filter) {
    case "pending":
      return state.tasks.filter((task) => !task.done);
    case "done":
      return state.tasks.filter((task) => task.done);
    case "high":
      return state.tasks.filter((task) => task.priority === "high");
    default:
      return state.tasks;
  }
}

export function selectNextTask(state) {
  return state.tasks.find((task) => !task.done) ?? null;
}

export function selectWaterProgress(state) {
  const currentMl = Number(state.water.ml || 0);
  const cupMl = Math.max(Number(state.water.cupMl || 250), 1);
  const goalMl = Math.max(Number(state.goals.waterMl || 2000), 1);
  const cupCount = Math.round(currentMl / cupMl);
  const goalCups = Math.ceil(goalMl / cupMl);
  return {
    currentMl,
    goalMl,
    cupMl,
    cupCount,
    goalCups,
    percent: percent(currentMl, goalMl)
  };
}

export function selectSleepToday(state) {
  const key = selectTodayKey();
  const hours = Number(state.sleep.history[key]?.hours ?? diffHours(state.sleep.start, state.sleep.end));
  const goalHours = Number(state.goals.sleepHours || 8);
  const debt = Number((hours - goalHours).toFixed(1));
  return {
    key,
    start: state.sleep.start,
    end: state.sleep.end,
    notes: state.sleep.notes,
    quality: Number(state.sleep.quality || 0),
    hours,
    goalHours,
    percent: percent(hours, goalHours),
    debt
  };
}

export function selectFoodCaloriesToday(state) {
  const total = state.food.entries.reduce((acc, entry) => acc + Number(entry.calories || 0), 0);
  return {
    total,
    goal: Number(state.goals.calories || 0),
    percent: percent(total, Math.max(Number(state.goals.calories || 0), 1)),
    entries: state.food.entries
  };
}

export function selectHabitStatsToday(state) {
  const key = selectTodayKey();
  const total = state.habits.length;
  const completed = state.habits.filter((habit) => (habit.doneDates || []).includes(key)).length;
  return {
    key,
    total,
    completed,
    percent: percent(completed, Math.max(total, 1))
  };
}

export function selectMoodToday(state) {
  return {
    value: Number(state.mood.value || 0),
    gratitude: state.mood.gratitude,
    notes: state.mood.notes,
    percent: percent(Number(state.mood.value || 0), 5)
  };
}

export function selectFocusStatsToday(state) {
  const sessions = Number(state.focus.sessionsToday || 0);
  return {
    sessions,
    mode: state.focus.mode,
    secondsLeft: Number(state.focus.secondsLeft || 0),
    isRunning: Boolean(state.focus.isRunning),
    soundMode: state.focus.soundMode,
    soundPlaying: Boolean(state.focus.soundPlaying),
    volume: Number(state.focus.volume || 0),
    percent: percent(sessions, 4)
  };
}

export function selectHealthStatsToday(state) {
  const steps = Number(state.health.steps || 0);
  const workoutMinutes = Number(state.health.workoutMinutes || 0);
  return {
    steps,
    workoutMinutes,
    goalSteps: Number(state.goals.steps || 0),
    percent: percent(steps, Math.max(Number(state.goals.steps || 0), 1))
  };
}

export function selectTimeblockOccurrencesForDate(state, date) {
  const key = typeof date === "string" ? date : todayKey(date);
  const weekday = weekdayFromDateKey(key);

  return state.timeblocks.flatMap((block) => {
    if ((block.skippedDates || []).includes(key)) return [];

    let matches = false;
    if (block.type === "single") {
      matches = block.date === key || block.startDate === key;
    } else if (key >= block.startDate) {
      if (block.type === "recurring_period" && block.endDate && key > block.endDate) {
        matches = false;
      } else if ((block.daysOfWeek || []).length > 0) {
        matches = block.daysOfWeek.includes(weekday);
      } else {
        matches = true;
      }
    }

    if (!matches) return [];

    return [{
      id: `timeblock-occurrence:${block.id}:${key}`,
      sourceId: block.id,
      type: "timeblock",
      label: block.title,
      date: key,
      accent: block.color || "var(--work)",
      meta: block.allDay ? "dia inteiro" : `${block.start} - ${block.end}`,
      allDay: Boolean(block.allDay),
      canSkip: block.type !== "single",
      canRestore: false
    }];
  });
}

export function selectCalendarEventsForDate(state, date) {
  const key = typeof date === "string" ? date : todayKey(date);
  const taskEvents = state.tasks
    .filter((task) => task.dueDate && task.dueDate.startsWith(key))
    .map((task) => ({
      id: `task:${task.id}`,
      sourceId: task.id,
      type: "task",
      label: task.title,
      date: key,
      accent: "var(--work)",
      meta: task.category || "",
      allDay: false,
      canSkip: false,
      canRestore: false
    }));

  return [...taskEvents, ...selectTimeblockOccurrencesForDate(state, key)];
}

export function selectScoreFromSnapshot(state, snapshot) {
  return Math.round(sum([
    percent(snapshot.waterMl ?? 0, state.goals.waterMl),
    percent(snapshot.focusSessions ?? 0, 4),
    percent(snapshot.completedTasks ?? 0, Math.max(state.tasks.length, 1)),
    percent(snapshot.steps ?? 0, state.goals.steps),
    percent(snapshot.sleepHours ?? 0, state.goals.sleepHours)
  ]) / 5);
}

export function selectWeeklyScoreSeries(state) {
  return getWeekDates().map((date) => {
    const key = todayKey(date);
    const snapshot = state.history[key] ?? {};
    return {
      key,
      total: selectScoreFromSnapshot(state, snapshot),
      date
    };
  });
}

export function selectScore(state) {
  return Math.round(sum([
    selectWaterProgress(state).percent,
    selectFocusStatsToday(state).percent,
    selectTaskStats(state).percent,
    selectHealthStatsToday(state).percent,
    selectSleepToday(state).percent
  ]) / 5);
}

export function selectStreak(state) {
  let streak = 0;
  const today = new Date();
  for (let index = 0; index < 30; index += 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - index);
    const snapshot = state.history[todayKey(date)];
    if (!snapshot) break;
    const score = selectScoreFromSnapshot(state, snapshot);
    if (score >= 55) streak += 1;
    else break;
  }
  return streak;
}
