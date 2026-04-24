import assert from "node:assert/strict";
import { createDefaultState, normalizeState } from "../assets/js/schema.js";
import { selectCalendarEventsForDate, selectCalendarWeekDates, selectCalendarWeekLabel, selectScore } from "../assets/js/selectors.js";

export async function run() {
  const baseState = normalizeState(createDefaultState());
  assert.doesNotThrow(() => selectScore(baseState));

  const stateWithTask = normalizeState({
    ...createDefaultState(),
    tasks: [{
      title: "Tarefa <b>importante</b>",
      dueDate: "2026-04-24T09:00",
      done: false,
      category: "Work"
    }]
  });

  const events = selectCalendarEventsForDate(stateWithTask, "2026-04-24");
  assert.equal(events.length, 1);
  assert.equal(events[0].type, "task");
  assert.equal(events[0].label, "Tarefa <b>importante</b>");

  const stateWithoutDueDate = normalizeState({
    ...createDefaultState(),
    tasks: [{
      title: "Tarefa sem data",
      done: false,
      category: "Pessoal"
    }]
  });
  assert.equal(selectCalendarEventsForDate(stateWithoutDueDate, "2026-04-24").length, 0);

  const anchoredState = normalizeState({
    ...createDefaultState(),
    ui: {
      ...createDefaultState().ui,
      calendarAnchorDate: "2026-05-07"
    }
  });
  const weekDates = selectCalendarWeekDates(anchoredState);
  assert.equal(weekDates.length, 7);
  assert.equal(weekDates[0].toISOString().slice(0, 10), "2026-05-04");
  assert.equal(weekDates[6].toISOString().slice(0, 10), "2026-05-10");
  assert.equal(selectCalendarWeekLabel(anchoredState), "04 a 10 de maio");

  const crossingMonthState = normalizeState({
    ...createDefaultState(),
    ui: {
      ...createDefaultState().ui,
      calendarAnchorDate: "2026-05-01"
    }
  });
  assert.equal(selectCalendarWeekLabel(crossingMonthState), "27 de abril a 03 de maio");
}
