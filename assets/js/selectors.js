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

export function selectTodayActivityEntries(state) {
  const key = selectTodayKey();
  return (state.health.activityEntries || []).filter((entry) => entry.date === key);
}

export function selectExerciseWaterRecommendation(state) {
  const extraMl = selectTodayActivityEntries(state).reduce((total, entry) => {
    const multiplier = entry.intensity === "intensa" ? 600 : entry.intensity === "leve" ? 300 : 500;
    return total + Math.round((entry.minutes / 30) * multiplier);
  }, 0);

  return {
    extraMl,
    percentOfGoal: percent(extraMl, Math.max(Number(state.goals.waterMl || 0), 1))
  };
}

function resolveSleepEntry(state, dateKey) {
  const entry = state.sleep.entries?.[dateKey];
  if (entry) {
    return entry;
  }

  if (dateKey === selectTodayKey()) {
    return {
      start: state.sleep.start,
      end: state.sleep.end,
      quality: state.sleep.quality,
      notes: state.sleep.notes,
      wakeMood: state.sleep.wakeMood
    };
  }

  const history = state.sleep.history?.[dateKey];
  if (history) {
    return {
      start: state.sleep.start,
      end: state.sleep.end,
      quality: Number(history.quality || 3),
      notes: history.notes || "",
      wakeMood: 3
    };
  }

  return {
    start: "23:00",
    end: "07:00",
    quality: 3,
    notes: "",
    wakeMood: 3
  };
}

export function selectSleepEntry(state, dateKey = selectTodayKey()) {
  const entry = resolveSleepEntry(state, dateKey);
  const hours = Number(diffHours(entry.start, entry.end));
  const totalMinutes = Math.round(hours * 60);
  const goalHours = Number(state.goals.sleepHours || 8);
  const debt = Number((hours - goalHours).toFixed(1));

  return {
    key: dateKey,
    start: entry.start,
    end: entry.end,
    notes: entry.notes,
    quality: Number(entry.quality || 0),
    wakeMood: Number(entry.wakeMood || 0),
    hours,
    totalMinutes,
    goalHours,
    percent: percent(hours, goalHours),
    debt
  };
}

export function selectSleepToday(state) {
  return selectSleepEntry(state, selectTodayKey());
}

export function selectSleepWeek(state, anchorKey = selectTodayKey()) {
  return getWeekDates(new Date(`${anchorKey}T12:00:00`)).map((date) => {
    const key = todayKey(date);
    const entry = selectSleepEntry(state, key);
    return {
      key,
      date,
      hours: entry.hours,
      quality: entry.quality,
      wakeMood: entry.wakeMood
    };
  });
}

export function selectFoodEntriesForDate(state, dateKey = selectTodayKey()) {
  return (state.food.entries || []).filter((entry) => !entry.date || entry.date === dateKey);
}

export function selectFoodCaloriesToday(state) {
  const entries = selectFoodEntriesForDate(state, selectTodayKey());
  const total = entries.reduce((acc, entry) => acc + Number(entry.calories || 0), 0);
  return {
    total,
    goal: Number(state.goals.calories || 0),
    percent: percent(total, Math.max(Number(state.goals.calories || 0), 1)),
    entries
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

export function selectHabitWeek(state, anchorKey = selectTodayKey()) {
  return getWeekDates(new Date(`${anchorKey}T12:00:00`)).map((date) => {
    const key = todayKey(date);
    const completed = state.habits.filter((habit) => (habit.doneDates || []).includes(key)).length;
    return {
      key,
      date,
      completed
    };
  });
}

export function selectHabitMonth(state, anchorKey = selectTodayKey()) {
  const anchor = new Date(`${anchorKey}T12:00:00`);
  const year = anchor.getFullYear();
  const month = anchor.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  return Array.from({ length: daysInMonth }, (_, index) => {
    const date = new Date(year, month, index + 1, 12, 0, 0);
    const key = todayKey(date);
    const completed = state.habits.filter((habit) => (habit.doneDates || []).includes(key)).length;
    return { key, date, completed };
  });
}

export function selectMoodToday(state) {
  return {
    value: Number(state.mood.value || 0),
    gratitude: state.mood.gratitude,
    notes: state.mood.notes,
    percent: percent(Number(state.mood.value || 0), 5)
  };
}

export function selectJournalEntry(state, dateKey = selectTodayKey()) {
  return state.mood.journalEntries?.[dateKey] || {
    summary: "",
    highs: "",
    lows: "",
    lessons: "",
    gratitude: "",
    notes: ""
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
  const activityEntries = selectTodayActivityEntries(state);
  const calories = activityEntries.reduce((total, entry) => total + Number(entry.calories || 0), 0);

  return {
    steps,
    workoutMinutes,
    goalSteps: Number(state.goals.steps || 0),
    percent: percent(steps, Math.max(Number(state.goals.steps || 0), 1)),
    activityEntries,
    calories
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
