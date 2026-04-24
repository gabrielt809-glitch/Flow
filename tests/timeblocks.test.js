import assert from "node:assert/strict";
import { createDefaultState, normalizeState } from "../assets/js/schema.js";
import { selectCalendarEventsForDate, selectTimeblockOccurrencesForDate } from "../assets/js/selectors.js";

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
    }
  };
}

export async function run() {
  global.localStorage = createLocalStorageMock();
  const { buildTimeblockRecord } = await import("../assets/js/timeblocks.js?test=timeblocks");

  const singleState = normalizeState({
    ...createDefaultState(),
    timeblocks: [{
      title: "Bloco unico",
      type: "single",
      date: "2026-04-24",
      start: "09:00",
      end: "10:00"
    }]
  });
  const singleOccurrences = selectTimeblockOccurrencesForDate(singleState, "2026-04-24");
  assert.equal(singleOccurrences.length, 1);
  assert.equal(singleOccurrences[0].label, "Bloco unico");

  const recurringState = normalizeState({
    ...createDefaultState(),
    timeblocks: [{
      title: "Bloco recorrente",
      type: "recurring_period",
      startDate: "2026-04-20",
      endDate: "2026-04-30",
      daysOfWeek: [1, 3, 5],
      start: "08:00",
      end: "09:00"
    }]
  });
  const recurringOccurrences = selectTimeblockOccurrencesForDate(recurringState, "2026-04-24");
  assert.equal(recurringOccurrences.length, 1);
  assert.equal(recurringOccurrences[0].sourceId.startsWith("tb"), true);

  const skippedState = normalizeState({
    ...createDefaultState(),
    timeblocks: [{
      title: "Bloco pulado",
      type: "recurring_forever",
      startDate: "2026-04-01",
      daysOfWeek: [5],
      start: "10:00",
      end: "11:00",
      skippedDates: ["2026-04-24"]
    }]
  });
  const skippedOccurrences = selectTimeblockOccurrencesForDate(skippedState, "2026-04-24");
  assert.equal(skippedOccurrences.length, 0);

  const edited = buildTimeblockRecord({
    title: "Bloco editado",
    type: "recurring_forever",
    date: "",
    startDate: "2026-04-20",
    endDate: "",
    daysOfWeek: [],
    start: "00:00",
    end: "23:59",
    color: "#000000",
    allDay: true
  }, {
    id: "tb-1",
    createdAt: "2026-04-01T12:00:00.000Z",
    skippedDates: ["2026-04-24"]
  });
  assert.equal(edited.id, "tb-1");
  assert.equal(edited.createdAt, "2026-04-01T12:00:00.000Z");
  assert.deepEqual(edited.skippedDates, ["2026-04-24"]);
  assert.equal(edited.start, "00:00");
  assert.equal(edited.end, "23:59");

  const weeklyCalendarState = normalizeState({
    ...createDefaultState(),
    ui: {
      ...createDefaultState().ui,
      calendarAnchorDate: "2026-05-07"
    },
    timeblocks: [{
      title: "Reunião semanal",
      type: "recurring_period",
      startDate: "2026-05-01",
      endDate: "2026-05-31",
      daysOfWeek: [4],
      start: "14:00",
      end: "15:00",
      skippedDates: ["2026-05-07"]
    }]
  });
  assert.equal(selectCalendarEventsForDate(weeklyCalendarState, "2026-05-07").length, 0);
}
