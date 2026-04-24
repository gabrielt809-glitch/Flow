import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";

function createLocalStorageMock() {
  const store = new Map();
  return {
    writes: 0,
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      this.writes += 1;
      store.set(key, String(value));
    },
    removeItem(key) {
      store.delete(key);
    }
  };
}

export async function run() {
  global.localStorage = createLocalStorageMock();

  const stateUrl = pathToFileURL("C:/Users/gabri/Desktop/FLOW-APP-LIMPO/assets/js/state.js");
  const { getState, mutateState, resetState, subscribe } = await import(`${stateUrl.href}?suite=state-test`);

  const notifications = [];
  const unsubscribe = subscribe((state, meta) => {
    notifications.push({ state, meta });
  });

  mutateState((draft) => {
    draft.tasks.push({ title: "Scoped task" });
  }, { scope: "tasks" });

  assert.equal(getState().tasks.length, 1);
  assert.deepEqual(notifications.at(-1).meta.scopes, ["tasks"]);

  mutateState((draft) => {
    draft.focus.secondsLeft -= 1;
  }, { scope: "focus", persist: false });

  assert.deepEqual(notifications.at(-1).meta.scopes, ["focus"]);
  assert.equal(global.localStorage.writes, 1);

  unsubscribe();
  resetState();
}
