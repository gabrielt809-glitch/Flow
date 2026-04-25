import { getState, mutateState } from "./state.js";
import { selectCalendarAnchorDate, selectCalendarEventsForDate, selectCalendarWeekDates, selectCalendarWeekLabel } from "./selectors.js";
import { escapeHTML, sameDay, shortDay, todayKey, qs, safeText } from "./utils.js";
import { skipTimeblockOccurrence } from "./timeblocks.js";

function shiftAnchorDate(days) {
  const anchorKey = selectCalendarAnchorDate(getState());
  const anchorDate = new Date(`${anchorKey}T12:00:00`);
  anchorDate.setDate(anchorDate.getDate() + days);

  mutateState((draft) => {
    draft.ui.calendarAnchorDate = todayKey(anchorDate);
  }, { scope: "calendar" });
}

export function initCalendar() {
  qs("#calendarControls").addEventListener("click", (event) => {
    const navButton = event.target.closest("[data-calendar-nav]");
    if (!navButton) return;

    if (navButton.dataset.calendarNav === "prev") {
      shiftAnchorDate(-7);
      return;
    }
    if (navButton.dataset.calendarNav === "next") {
      shiftAnchorDate(7);
      return;
    }

    mutateState((draft) => {
      draft.ui.calendarAnchorDate = todayKey();
    }, { scope: "calendar" });
  });

  qs("#calendarWeek").addEventListener("click", (event) => {
    const skipButton = event.target.closest("[data-skip-occurrence]");
    if (!skipButton) return;
    skipTimeblockOccurrence(skipButton.dataset.sourceId, skipButton.dataset.date);
  });
}

export function renderCalendar(state = getState()) {
  const weekRoot = qs("#calendarWeek");
  weekRoot.replaceChildren();
  safeText("#calendarRangeLabel", selectCalendarWeekLabel(state));

  selectCalendarWeekDates(state).forEach((date) => {
    const key = todayKey(date);
    const items = selectCalendarEventsForDate(state, key);

    const day = document.createElement("div");
    day.className = `calendar-day ${sameDay(date, new Date()) ? "today" : ""}`;

    const head = document.createElement("div");
    head.className = "calendar-head";
    head.innerHTML = `
      <div>
        <div class="calendar-label">${escapeHTML(shortDay(date))}</div>
        <div class="calendar-date">${escapeHTML(date.getDate())}</div>
      </div>
    `;
    day.appendChild(head);

    const list = document.createElement("div");
    list.className = "calendar-items";

    if (!items.length) {
      const empty = document.createElement("div");
      empty.className = "calendar-item";
      empty.textContent = "Sem tarefas ou blocos";
      list.appendChild(empty);
    } else {
      items.forEach((item) => {
        const row = document.createElement("div");
        row.className = "calendar-item";
        row.style.borderLeft = `3px solid ${item.accent}`;
        row.textContent = `${item.label}${item.meta ? ` · ${item.meta}` : ""}`;

        if (item.canSkip) {
          const button = document.createElement("button");
          button.type = "button";
          button.className = "btn btn-xs";
          button.dataset.skipOccurrence = "1";
          button.dataset.sourceId = item.sourceId;
          button.dataset.date = item.date;
          button.textContent = "Pular";
          row.appendChild(document.createTextNode(" "));
          row.appendChild(button);
        }

        list.appendChild(row);
      });
    }

    day.appendChild(list);
    weekRoot.appendChild(day);
  });
}
