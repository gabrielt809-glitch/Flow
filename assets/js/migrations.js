import { STATE_VERSION, createDefaultState, normalizeState } from "./schema.js";
import { todayKey } from "./utils.js";

function isWrappedPayload(payload) {
  return payload && typeof payload === "object" && "version" in payload && "data" in payload;
}

function migrateLegacyState(data) {
  return normalizeState(data);
}

function migrateV1ToV2(data) {
  const safe = data && typeof data === "object" ? data : {};
  const ui = safe.ui && typeof safe.ui === "object" ? safe.ui : {};
  const calendarAnchorDate = /^\d{4}-\d{2}-\d{2}$/.test(ui.calendarAnchorDate || "")
    ? ui.calendarAnchorDate
    : todayKey();

  return {
    ...safe,
    ui: {
      ...ui,
      calendarAnchorDate
    }
  };
}

function migrateV2ToV3(data) {
  const safe = data && typeof data === "object" ? data : {};
  const ui = safe.ui && typeof safe.ui === "object" ? safe.ui : {};
  const health = safe.health && typeof safe.health === "object" ? safe.health : {};
  const sleep = safe.sleep && typeof safe.sleep === "object" ? safe.sleep : {};
  const food = safe.food && typeof safe.food === "object" ? safe.food : {};
  const mood = safe.mood && typeof safe.mood === "object" ? safe.mood : {};

  const currentDateKey = todayKey();
  const legacyFoodEntries = Array.isArray(food.entries)
    ? food.entries.map((entry) => ({
      ...entry,
      date: entry && typeof entry === "object" && entry.date ? entry.date : currentDateKey
    }))
    : [];

  return {
    ...safe,
    ui: {
      ...ui,
      theme: "dark",
      pinnedTabs: Array.isArray(ui.pinnedTabs) && ui.pinnedTabs.length ? ui.pinnedTabs : ["overview", "water", "study", "work", "menu"]
    },
    health: {
      ...health,
      activityEntries: Array.isArray(health.activityEntries) ? health.activityEntries : [],
      workouts: Array.isArray(health.workouts) ? health.workouts : []
    },
    sleep: {
      ...sleep,
      wakeMood: Number.isFinite(Number(sleep.wakeMood)) ? Number(sleep.wakeMood) : 3,
      entries: sleep.entries && typeof sleep.entries === "object" ? sleep.entries : {}
    },
    food: {
      ...food,
      entries: legacyFoodEntries,
      savedMeals: Array.isArray(food.savedMeals) ? food.savedMeals : [],
      dietMeals: Array.isArray(food.dietMeals) ? food.dietMeals : []
    },
    mood: {
      ...mood,
      dailyCheckinShownDate: typeof mood.dailyCheckinShownDate === "string" ? mood.dailyCheckinShownDate : "",
      journalEntries: mood.journalEntries && typeof mood.journalEntries === "object" ? mood.journalEntries : {}
    }
  };
}

const MIGRATIONS = {
  0: migrateLegacyState,
  1: migrateV1ToV2,
  2: migrateV2ToV3
};

export function migrateState(payload) {
  if (payload == null) {
    return createDefaultState();
  }

  let currentVersion = 0;
  let currentData = payload;

  if (isWrappedPayload(payload)) {
    currentVersion = Number(payload.version) || 0;
    currentData = payload.data;
  }

  while (currentVersion < STATE_VERSION) {
    const migrate = MIGRATIONS[currentVersion];
    if (typeof migrate !== "function") {
      break;
    }
    currentData = migrate(currentData);
    currentVersion += 1;
  }

  return normalizeState(currentData);
}
