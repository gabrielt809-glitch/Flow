import { clone, todayKey } from "./utils.js";

export const STATE_VERSION = 2;

export const DEFAULT_STATE = Object.freeze({
  onboarded: false,
  profile: {
    name: "",
    weight: "",
    height: "",
    age: "",
    emoji: "😊"
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
    calendarAnchorDate: ""
  },
  streak: 0,
  water: {
    ml: 0,
    cupMl: 250,
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
    workoutMinutes: 0
  },
  sleep: {
    start: "23:00",
    end: "07:00",
    quality: 3,
    notes: "",
    history: {}
  },
  food: {
    entries: [],
    history: {}
  },
  habits: [],
  mood: {
    value: 0,
    gratitude: "",
    notes: "",
    history: {}
  },
  history: {}
});

const VALID_SECTIONS = new Set(["overview", "water", "study", "work", "health", "sleep", "food", "habits", "mood", "settings"]);
const VALID_TASK_FILTERS = new Set(["all", "pending", "done", "high"]);
const VALID_FOCUS_MODES = new Set(["focus", "short", "long"]);
const VALID_SOUND_MODES = new Set(["lofi", "rain", "deep"]);
const VALID_TIMEBLOCK_TYPES = new Set(["single", "recurring_period", "recurring_forever"]);
const DEFAULT_SECONDS_BY_MODE = {
  focus: 25 * 60,
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
    category: asString(safe.category, "💼 Trabalho"),
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
  const startDate = type === "single" ? (explicitStartDate || legacyDate || todayKey()) : (explicitStartDate || legacyDate || todayKey());
  const endDate = type === "recurring_period" ? (explicitEndDate || startDate) : "";
  const date = type === "single" ? startDate : "";

  return {
    id: deterministicId("tb", safe, index, ["title"], ["date", "startDate", "createdAt"]),
    title: asString(safe.title).trim(),
    type,
    date,
    startDate,
    endDate,
    daysOfWeek,
    start: asString(safe.start, "09:00"),
    end: asString(safe.end, "10:00"),
    color: asString(safe.color, "#fb923c"),
    allDay: asBoolean(safe.allDay, false),
    skippedDates,
    createdAt: asString(safe.createdAt, "")
  };
}

function sanitizeHabit(habit, index) {
  const safe = asObject(habit);
  const doneDates = Array.isArray(safe.doneDates) ? safe.doneDates.filter((entry) => typeof entry === "string") : [];
  return {
    id: deterministicId("habit", safe, index, ["name"]),
    name: asString(safe.name).trim(),
    icon: asString(safe.icon, "✨"),
    doneDates
  };
}

function sanitizeFoodEntry(entry, index) {
  const safe = asObject(entry);
  return {
    id: deterministicId("food", safe, index, ["name"], ["calories"]),
    name: asString(safe.name).trim(),
    calories: asNumber(safe.calories, 0)
  };
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
  merged.profile.emoji = asString(merged.profile.emoji, "😊") || "😊";

  merged.goals.waterMl = Math.max(500, asNumber(merged.goals.waterMl, 2000));
  merged.goals.steps = Math.max(0, asNumber(merged.goals.steps, 10000));
  merged.goals.sleepHours = Math.max(1, asNumber(merged.goals.sleepHours, 8));
  merged.goals.calories = Math.max(0, asNumber(merged.goals.calories, 2000));

  merged.ui.activeSection = VALID_SECTIONS.has(merged.ui.activeSection) ? merged.ui.activeSection : "overview";
  merged.ui.theme = merged.ui.theme === "light" ? "light" : "dark";
  merged.ui.taskFilter = VALID_TASK_FILTERS.has(merged.ui.taskFilter) ? merged.ui.taskFilter : "all";
  merged.ui.calendarAnchorDate = normalizeDateKey(merged.ui.calendarAnchorDate, todayKey()) || todayKey();

  merged.streak = Math.max(0, asNumber(merged.streak, 0));

  merged.water.ml = Math.max(0, asNumber(merged.water.ml, 0));
  merged.water.cupMl = Math.max(50, asNumber(merged.water.cupMl, 250));
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

  merged.sleep.start = asString(merged.sleep.start, "23:00");
  merged.sleep.end = asString(merged.sleep.end, "07:00");
  merged.sleep.quality = Math.max(1, Math.min(5, asNumber(merged.sleep.quality, 3)));
  merged.sleep.notes = asString(merged.sleep.notes);
  merged.sleep.history = asObject(merged.sleep.history);

  merged.food.entries = Array.isArray(merged.food.entries) ? merged.food.entries.map((entry, index) => sanitizeFoodEntry(entry, index)).filter((entry) => entry.name) : [];
  merged.food.history = asObject(merged.food.history);

  merged.habits = Array.isArray(merged.habits) ? merged.habits.map((habit, index) => sanitizeHabit(habit, index)).filter((habit) => habit.name) : [];

  merged.mood.value = Math.max(0, Math.min(5, asNumber(merged.mood.value, 0)));
  merged.mood.gratitude = asString(merged.mood.gratitude);
  merged.mood.notes = asString(merged.mood.notes);
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
