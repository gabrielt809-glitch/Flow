import { clone, todayKey } from "./utils.js";

export const STATE_VERSION = 3;

const DEFAULT_PINNED_TABS = ["overview", "water", "study", "work", "menu"];

export const DEFAULT_STATE = Object.freeze({
  onboarded: false,
  profile: {
    name: "",
    weight: "",
    height: "",
    age: "",
    emoji: ":)"
  },
  goals: {
    waterMl: 2000,
    steps: 10000,
    sleepHours: 8,
    calories: 2000
  },
  ui: {
    activeSection: "overview",
    theme: "dark",
    taskFilter: "all",
    calendarAnchorDate: "",
    pinnedTabs: DEFAULT_PINNED_TABS
  },
  streak: 0,
  water: {
    ml: 0,
    cupMl: 250,
    customVolumes: [],
    history: {}
  },
  focus: {
    mode: "focus",
    secondsLeft: 25 * 60,
    isRunning: false,
    sessionsToday: 0,
    soundMode: "lofi",
    soundPlaying: false,
    volume: 45,
    history: {}
  },
  tasks: [],
  timeblocks: [],
  health: {
    steps: 0,
    workoutMinutes: 0,
    activityEntries: [],
    workouts: []
  },
  sleep: {
    start: "23:00",
    end: "07:00",
    quality: 3,
    notes: "",
    wakeMood: 3,
    entries: {},
    history: {}
  },
  food: {
    entries: [],
    savedMeals: [],
    dietMeals: [],
    history: {}
  },
  habits: [],
  mood: {
    value: 0,
    gratitude: "",
    notes: "",
    dailyCheckinShownDate: "",
    journalEntries: {},
    history: {}
  },
  history: {}
});

const VALID_SECTIONS = new Set(["overview", "water", "study", "work", "health", "sleep", "food", "habits", "mood", "settings"]);
const NAV_SECTIONS = new Set(["overview", "water", "study", "work", "health", "sleep", "food", "habits", "mood", "settings", "menu"]);
const VALID_TASK_FILTERS = new Set(["all", "pending", "done", "high"]);
const VALID_FOCUS_MODES = new Set(["focus", "deep", "short", "long"]);
const VALID_SOUND_MODES = new Set(["lofi", "rain", "deep"]);
const VALID_TIMEBLOCK_TYPES = new Set(["single", "recurring_period", "recurring_forever"]);
const DEFAULT_SECONDS_BY_MODE = {
  focus: 25 * 60,
  deep: 50 * 60,
  short: 5 * 60,
  long: 15 * 60
};

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function mergeDefaults(base, patch) {
  if (Array.isArray(base)) {
    return Array.isArray(patch) ? clone(patch) : clone(base);
  }

  if (!isPlainObject(base)) {
    return patch ?? base;
  }

  const source = isPlainObject(patch) ? patch : {};
  const result = {};

  for (const [key, value] of Object.entries(base)) {
    result[key] = mergeDefaults(value, source[key]);
  }

  for (const [key, value] of Object.entries(source)) {
    if (!(key in result)) {
      result[key] = clone(value);
    }
  }

  return result;
}

function asNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function asString(value, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function asBoolean(value, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

function asObject(value) {
  return isPlainObject(value) ? value : {};
}

function slugify(value, fallback) {
  const normalized = String(value ?? "")
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase();
  return normalized || fallback;
}

function deterministicId(prefix, safe, index, labelKeys = [], extraKeys = []) {
  const existingId = asString(safe.id).trim();
  if (existingId) return existingId;

  const label = labelKeys.map((key) => asString(safe[key]).trim()).find(Boolean);
  const extra = extraKeys.map((key) => asString(safe[key]).trim()).find(Boolean);
  const slug = slugify(label, "migrated");
  const extraSlug = extra ? `-${slugify(extra, String(index))}` : "";

  if (slug === "migrated") {
    return `${prefix}-migrated-${index}`;
  }

  return `${prefix}-migrated-${slug}${extraSlug}`;
}

function normalizeDateKey(value, fallback = "") {
  const text = asString(value, fallback);
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : fallback;
}

function sanitizeTask(task, index) {
  const safe = asObject(task);
  return {
    id: deterministicId("task", safe, index, ["title"], ["createdAt", "dueDate"]),
    title: asString(safe.title).trim(),
    category: asString(safe.category, "Trabalho"),
    priority: ["high", "mid", "low"].includes(safe.priority) ? safe.priority : "mid",
    dueDate: asString(safe.dueDate),
    done: asBoolean(safe.done, false),
    createdAt: asString(safe.createdAt)
  };
}

function sanitizeTimeblock(block, index) {
  const safe = asObject(block);
  const legacyDate = normalizeDateKey(safe.date);
  const explicitStartDate = normalizeDateKey(safe.startDate, legacyDate);
  const explicitEndDate = normalizeDateKey(safe.endDate, explicitStartDate);
  const type = VALID_TIMEBLOCK_TYPES.has(safe.type)
    ? safe.type
    : (legacyDate ? "single" : "recurring_forever");
  const daysOfWeek = Array.isArray(safe.daysOfWeek)
    ? safe.daysOfWeek.map((day) => Number(day)).filter((day, position, array) => Number.isInteger(day) && day >= 0 && day <= 6 && array.indexOf(day) === position).sort()
    : [];
  const skippedDates = Array.isArray(safe.skippedDates)
    ? safe.skippedDates.map((date) => normalizeDateKey(date)).filter(Boolean)
    : [];
  const startDate = explicitStartDate || legacyDate || todayKey();
  const endDate = type === "recurring_period" ? (explicitEndDate || startDate) : "";

  return {
    id: deterministicId("tb", safe, index, ["title"], ["date", "startDate", "createdAt"]),
    title: asString(safe.title).trim(),
    type,
    date: type === "single" ? startDate : "",
    startDate,
    endDate,
    daysOfWeek,
    start: asString(safe.start, "09:00"),
    end: asString(safe.end, "10:00"),
    color: asString(safe.color, "#5475bc"),
    allDay: asBoolean(safe.allDay, false),
    skippedDates,
    createdAt: asString(safe.createdAt, "")
  };
}

function sanitizeHabit(habit, index) {
  const safe = asObject(habit);
  const doneDates = Array.isArray(safe.doneDates) ? safe.doneDates.map((entry) => normalizeDateKey(entry)).filter(Boolean) : [];
  return {
    id: deterministicId("habit", safe, index, ["name"]),
    name: asString(safe.name).trim(),
    icon: asString(safe.icon),
    doneDates
  };
}

function sanitizeFoodEntry(entry, index) {
  const safe = asObject(entry);
  return {
    id: deterministicId("food", safe, index, ["name"], ["calories", "date"]),
    name: asString(safe.name).trim(),
    calories: Math.max(0, asNumber(safe.calories, 0)),
    date: normalizeDateKey(safe.date, todayKey()),
    category: asString(safe.category, "geral"),
    portionLabel: asString(safe.portionLabel, ""),
    source: asString(safe.source, "custom")
  };
}

function sanitizeSavedMeal(meal, index) {
  const safe = asObject(meal);
  const items = Array.isArray(safe.items)
    ? safe.items.map((item, itemIndex) => sanitizeFoodEntry(item, itemIndex)).filter((item) => item.name)
    : [];
  const calories = items.reduce((total, item) => total + Number(item.calories || 0), 0);
  return {
    id: deterministicId("meal", safe, index, ["name"]),
    name: asString(safe.name).trim(),
    category: asString(safe.category, "personalizada"),
    notes: asString(safe.notes),
    items,
    calories
  };
}

function sanitizeDietMeal(meal, index) {
  const safe = asObject(meal);
  return {
    id: deterministicId("diet-meal", safe, index, ["name"]),
    name: asString(safe.name).trim(),
    items: Array.isArray(safe.items) ? safe.items.map((item) => asString(item).trim()).filter(Boolean) : [],
    calories: Math.max(0, asNumber(safe.calories, 0)),
    notes: asString(safe.notes)
  };
}

function sanitizeActivityEntry(entry, index) {
  const safe = asObject(entry);
  return {
    id: deterministicId("activity", safe, index, ["name"], ["date", "minutes"]),
    date: normalizeDateKey(safe.date, todayKey()),
    name: asString(safe.name).trim(),
    minutes: Math.max(1, asNumber(safe.minutes, 0)),
    met: Math.max(0, asNumber(safe.met, 0)),
    calories: Math.max(0, asNumber(safe.calories, 0)),
    intensity: asString(safe.intensity, "moderada")
  };
}

function sanitizeWorkoutExercise(exercise, index) {
  const safe = asObject(exercise);
  return {
    id: deterministicId("exercise", safe, index, ["name"]),
    name: asString(safe.name).trim(),
    sets: Math.max(0, asNumber(safe.sets, 0)),
    reps: asString(safe.reps),
    load: asString(safe.load),
    notes: asString(safe.notes)
  };
}

function sanitizeWorkout(workout, index) {
  const safe = asObject(workout);
  const daysOfWeek = Array.isArray(safe.daysOfWeek)
    ? safe.daysOfWeek.map((day) => Number(day)).filter((day, position, array) => Number.isInteger(day) && day >= 0 && day <= 6 && array.indexOf(day) === position).sort()
    : [];
  return {
    id: deterministicId("workout", safe, index, ["name"]),
    name: asString(safe.name).trim(),
    daysOfWeek,
    exercises: Array.isArray(safe.exercises) ? safe.exercises.map((exercise, exerciseIndex) => sanitizeWorkoutExercise(exercise, exerciseIndex)).filter((exercise) => exercise.name) : [],
    notes: asString(safe.notes)
  };
}

function sanitizeSleepEntry(entry) {
  const safe = asObject(entry);
  return {
    start: asString(safe.start, "23:00"),
    end: asString(safe.end, "07:00"),
    quality: Math.max(1, Math.min(5, asNumber(safe.quality, 3))),
    notes: asString(safe.notes),
    wakeMood: Math.max(1, Math.min(5, asNumber(safe.wakeMood, 3)))
  };
}

function sanitizeJournalEntry(entry) {
  const safe = asObject(entry);
  return {
    summary: asString(safe.summary),
    highs: asString(safe.highs),
    lows: asString(safe.lows),
    lessons: asString(safe.lessons),
    gratitude: asString(safe.gratitude),
    notes: asString(safe.notes)
  };
}

function normalizePinnedTabs(value) {
  const base = Array.isArray(value) ? value : DEFAULT_PINNED_TABS;
  const filtered = base
    .map((tab) => asString(tab))
    .filter((tab, index, tabs) => NAV_SECTIONS.has(tab) && tabs.indexOf(tab) === index)
    .slice(0, 5);

  if (!filtered.includes("menu")) {
    filtered.push("menu");
  }

  if (!filtered.length) {
    return clone(DEFAULT_PINNED_TABS);
  }

  return filtered.slice(0, 5);
}

export function createDefaultState() {
  return clone(DEFAULT_STATE);
}

export function normalizeState(state) {
  const merged = mergeDefaults(createDefaultState(), isPlainObject(state) ? state : {});

  merged.onboarded = asBoolean(merged.onboarded, false);
  merged.profile.name = asString(merged.profile.name);
  merged.profile.weight = asString(merged.profile.weight);
  merged.profile.height = asString(merged.profile.height);
  merged.profile.age = asString(merged.profile.age);
  merged.profile.emoji = asString(merged.profile.emoji, ":)") || ":)";

  merged.goals.waterMl = Math.max(500, asNumber(merged.goals.waterMl, 2000));
  merged.goals.steps = Math.max(0, asNumber(merged.goals.steps, 10000));
  merged.goals.sleepHours = Math.max(1, asNumber(merged.goals.sleepHours, 8));
  merged.goals.calories = Math.max(0, asNumber(merged.goals.calories, 2000));

  merged.ui.activeSection = VALID_SECTIONS.has(merged.ui.activeSection) ? merged.ui.activeSection : "overview";
  merged.ui.theme = "dark";
  merged.ui.taskFilter = VALID_TASK_FILTERS.has(merged.ui.taskFilter) ? merged.ui.taskFilter : "all";
  merged.ui.calendarAnchorDate = normalizeDateKey(merged.ui.calendarAnchorDate, todayKey()) || todayKey();
  merged.ui.pinnedTabs = normalizePinnedTabs(merged.ui.pinnedTabs);

  merged.streak = Math.max(0, asNumber(merged.streak, 0));

  merged.water.ml = Math.max(0, asNumber(merged.water.ml, 0));
  merged.water.cupMl = Math.max(50, asNumber(merged.water.cupMl, 250));
  merged.water.customVolumes = Array.isArray(merged.water.customVolumes)
    ? merged.water.customVolumes
      .map((value) => Math.round(asNumber(value, 0)))
      .filter((value, index, values) => value > 0 && values.indexOf(value) === index)
      .sort((left, right) => left - right)
    : [];
  merged.water.history = asObject(merged.water.history);

  merged.focus.mode = VALID_FOCUS_MODES.has(merged.focus.mode) ? merged.focus.mode : "focus";
  merged.focus.secondsLeft = Math.max(0, asNumber(merged.focus.secondsLeft, DEFAULT_SECONDS_BY_MODE[merged.focus.mode]));
  merged.focus.isRunning = asBoolean(merged.focus.isRunning, false);
  merged.focus.sessionsToday = Math.max(0, asNumber(merged.focus.sessionsToday, 0));
  merged.focus.soundMode = VALID_SOUND_MODES.has(merged.focus.soundMode) ? merged.focus.soundMode : "lofi";
  merged.focus.soundPlaying = asBoolean(merged.focus.soundPlaying, false);
  merged.focus.volume = Math.max(0, Math.min(100, asNumber(merged.focus.volume, 45)));
  merged.focus.history = asObject(merged.focus.history);

  merged.tasks = Array.isArray(merged.tasks) ? merged.tasks.map((task, index) => sanitizeTask(task, index)).filter((task) => task.title) : [];
  merged.timeblocks = Array.isArray(merged.timeblocks) ? merged.timeblocks.map((block, index) => sanitizeTimeblock(block, index)).filter((block) => block.title) : [];

  merged.health.steps = Math.max(0, asNumber(merged.health.steps, 0));
  merged.health.workoutMinutes = Math.max(0, asNumber(merged.health.workoutMinutes, 0));
  merged.health.activityEntries = Array.isArray(merged.health.activityEntries) ? merged.health.activityEntries.map((entry, index) => sanitizeActivityEntry(entry, index)).filter((entry) => entry.name) : [];
  merged.health.workouts = Array.isArray(merged.health.workouts) ? merged.health.workouts.map((workout, index) => sanitizeWorkout(workout, index)).filter((workout) => workout.name) : [];

  merged.sleep.start = asString(merged.sleep.start, "23:00");
  merged.sleep.end = asString(merged.sleep.end, "07:00");
  merged.sleep.quality = Math.max(1, Math.min(5, asNumber(merged.sleep.quality, 3)));
  merged.sleep.notes = asString(merged.sleep.notes);
  merged.sleep.wakeMood = Math.max(1, Math.min(5, asNumber(merged.sleep.wakeMood, 3)));
  merged.sleep.entries = Object.fromEntries(Object.entries(asObject(merged.sleep.entries)).map(([key, entry]) => [normalizeDateKey(key), sanitizeSleepEntry(entry)]).filter(([key]) => Boolean(key)));
  merged.sleep.history = asObject(merged.sleep.history);

  merged.food.entries = Array.isArray(merged.food.entries) ? merged.food.entries.map((entry, index) => sanitizeFoodEntry(entry, index)).filter((entry) => entry.name) : [];
  merged.food.savedMeals = Array.isArray(merged.food.savedMeals) ? merged.food.savedMeals.map((meal, index) => sanitizeSavedMeal(meal, index)).filter((meal) => meal.name && meal.items.length) : [];
  merged.food.dietMeals = Array.isArray(merged.food.dietMeals) ? merged.food.dietMeals.map((meal, index) => sanitizeDietMeal(meal, index)).filter((meal) => meal.name) : [];
  merged.food.history = asObject(merged.food.history);

  merged.habits = Array.isArray(merged.habits) ? merged.habits.map((habit, index) => sanitizeHabit(habit, index)).filter((habit) => habit.name) : [];

  merged.mood.value = Math.max(0, Math.min(5, asNumber(merged.mood.value, 0)));
  merged.mood.gratitude = asString(merged.mood.gratitude);
  merged.mood.notes = asString(merged.mood.notes);
  merged.mood.dailyCheckinShownDate = normalizeDateKey(merged.mood.dailyCheckinShownDate);
  merged.mood.journalEntries = Object.fromEntries(Object.entries(asObject(merged.mood.journalEntries)).map(([key, entry]) => [normalizeDateKey(key), sanitizeJournalEntry(entry)]).filter(([key]) => Boolean(key)));
  merged.mood.history = asObject(merged.mood.history);

  merged.history = asObject(merged.history);

  return merged;
}

export function validateState(state) {
  const errors = [];

  if (!isPlainObject(state)) {
    errors.push("State precisa ser um objeto.");
  } else {
    if (!isPlainObject(state.profile)) errors.push("profile invalido.");
    if (!isPlainObject(state.goals)) errors.push("goals invalido.");
    if (!isPlainObject(state.ui)) errors.push("ui invalido.");
    if (!Array.isArray(state.tasks)) errors.push("tasks invalido.");
    if (!Array.isArray(state.timeblocks)) errors.push("timeblocks invalido.");
    if (!Array.isArray(state.habits)) errors.push("habits invalido.");
    if (!isPlainObject(state.water)) errors.push("water invalido.");
    if (!isPlainObject(state.focus)) errors.push("focus invalido.");
    if (!isPlainObject(state.health)) errors.push("health invalido.");
    if (!isPlainObject(state.sleep)) errors.push("sleep invalido.");
    if (!isPlainObject(state.food)) errors.push("food invalido.");
    if (!isPlainObject(state.mood)) errors.push("mood invalido.");
    if (!isPlainObject(state.history)) errors.push("history invalido.");
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
