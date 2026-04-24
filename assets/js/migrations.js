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

const MIGRATIONS = {
  0: migrateLegacyState,
  1: migrateV1ToV2
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
