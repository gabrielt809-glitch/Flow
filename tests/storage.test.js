import assert from "node:assert/strict";

function createLocalStorageMock() {
  const store = new Map();
  return {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, String(value));
    },
    removeItem(key) {
      store.delete(key);
    },
    clear() {
      store.clear();
    }
  };
}

export async function run() {
  global.localStorage = createLocalStorageMock();

  const { createDefaultState, normalizeState, validateState, STATE_VERSION } = await import("../assets/js/schema.js");
  const { persistState, loadPersistedState } = await import("../assets/js/storage.js");
  const { migrateState } = await import("../assets/js/migrations.js");

  assert.equal(STATE_VERSION, 2);

  const legacyPayload = {
    onboarded: true,
    tasks: [{ title: "Legado", done: false }]
  };

  const migratedLegacy = migrateState(legacyPayload);
  assert.equal(migratedLegacy.onboarded, true);
  assert.equal(migratedLegacy.tasks[0].title, "Legado");
  assert.match(migratedLegacy.ui.calendarAnchorDate, /^\d{4}-\d{2}-\d{2}$/);

  const versionOnePayload = {
    version: 1,
    updatedAt: "2026-04-24T00:00:00.000Z",
    data: {
      ...createDefaultState(),
      ui: {
        ...createDefaultState().ui,
        calendarAnchorDate: ""
      }
    }
  };
  const migratedV1 = migrateState(versionOnePayload);
  assert.match(migratedV1.ui.calendarAnchorDate, /^\d{4}-\d{2}-\d{2}$/);

  const normalized = normalizeState({
    ...createDefaultState(),
    ui: {
      ...createDefaultState().ui,
      calendarAnchorDate: "2026-05-07"
    },
    tasks: [{ title: "Sem id" }]
  });
  const validation = validateState(normalized);
  assert.equal(validation.valid, true);
  assert.equal(normalized.tasks[0].id, normalizeState({
    ...createDefaultState(),
    tasks: [{ title: "Sem id" }]
  }).tasks[0].id);
  assert.equal(normalized.ui.calendarAnchorDate, "2026-05-07");

  persistState(normalized);
  const envelope = JSON.parse(global.localStorage.getItem("flow-app-limpo-v1"));
  assert.equal(envelope.version, STATE_VERSION);
  assert.equal(typeof envelope.updatedAt, "string");
  assert.deepEqual(envelope.data.tasks.length, 1);

  global.localStorage.setItem("flow-app-limpo-v1", JSON.stringify(legacyPayload));
  const loadedLegacy = loadPersistedState();
  assert.equal(loadedLegacy.tasks[0].title, "Legado");
}
