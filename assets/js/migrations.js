import { STATE_VERSION, createDefaultState, normalizeState } from "./schema.js";

function isWrappedPayload(payload) {
  return payload && typeof payload === "object" && "version" in payload && "data" in payload;
}

function migrateLegacyState(data) {
  return normalizeState(data);
}

const MIGRATIONS = {
  0: migrateLegacyState
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
