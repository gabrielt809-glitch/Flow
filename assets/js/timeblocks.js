import { getState, mutateState } from "./state.js";
import { selectTimeblockOccurrencesForDate } from "./selectors.js";
import { escapeHTML, formatDateInput, optionalQs, qs, qsa, safeHTML, uid } from "./utils.js";

const WEEKDAYS = [
  { value: 1, label: "Seg" },
  { value: 2, label: "Ter" },
  { value: 3, label: "Qua" },
  { value: 4, label: "Qui" },
  { value: 5, label: "Sex" },
  { value: 6, label: "Sab" },
  { value: 0, label: "Dom" }
];

function readSelectedDays() {
  return qsa("[data-tb-day]").filter((input) => input.checked).map((input) => Number(input.value));
}

function syncTimeblockFormVisibility() {
  const type = qs("#tbType").value;
  const allDay = qs("#tbAllDay").checked;
  const singleRow = optionalQs("#tbSingleDateRow");
  const startRow = optionalQs("#tbStartDateRow");
  const endRow = optionalQs("#tbEndDateRow");
  const daysRow = optionalQs("#tbDaysRow");
  const timeRow = optionalQs("#tbTimeRow");

  if (singleRow) singleRow.hidden = type !== "single";
  if (startRow) startRow.hidden = type === "single";
  if (endRow) endRow.hidden = type !== "recurring_period";
  if (daysRow) daysRow.hidden = type === "single";
  if (timeRow) timeRow.hidden = allDay;
}

function clearTimeblockForm() {
  qs("#tbTask").value = "";
  qs("#tbType").value = "single";
  qs("#tbDate").value = formatDateInput();
  qs("#tbStartDate").value = formatDateInput();
  qs("#tbEndDate").value = formatDateInput();
  qs("#tbStart").value = "";
  qs("#tbEnd").value = "";
  qs("#tbColor").value = "#fb923c";
  qs("#tbAllDay").checked = false;
  qsa("[data-tb-day]").forEach((input) => {
    input.checked = [1, 2, 3, 4, 5].includes(Number(input.value));
  });
  syncTimeblockFormVisibility();
}

export function initTimeblocks() {
  qs("#openTimeblockBtn").addEventListener("click", () => {
    clearTimeblockForm();
    openModal("tbModal");
  });
  qs("#saveTimeblockBtn").addEventListener("click", saveTimeblock);
  qs("#tbType").addEventListener("change", syncTimeblockFormVisibility);
  qs("#tbAllDay").addEventListener("change", syncTimeblockFormVisibility);

  qs("#timeblocksList").addEventListener("click", (event) => {
    const remove = event.target.closest("[data-remove-timeblock]");
    if (remove) {
      removeTimeblock(remove.dataset.removeTimeblock);
      return;
    }

    const restore = event.target.closest("[data-restore-timeblock-occurrence]");
    if (restore) {
      restoreTimeblockOccurrence(restore.dataset.restoreTimeblockOccurrence, restore.dataset.date);
    }
  });

  clearTimeblockForm();
}

export function openModal(id) {
  qs(`#${id}`).classList.add("open");
}

export function closeModal(id) {
  qs(`#${id}`).classList.remove("open");
}

function saveTimeblock() {
  const title = qs("#tbTask").value.trim();
  if (!title) return;

  const type = qs("#tbType").value;
  const allDay = qs("#tbAllDay").checked;
  const singleDate = qs("#tbDate").value || formatDateInput();
  const startDate = qs("#tbStartDate").value || singleDate;
  const endDate = qs("#tbEndDate").value || startDate;
  const daysOfWeek = type === "single" ? [] : readSelectedDays();

  mutateState((draft) => {
    draft.timeblocks.push({
      id: uid("tb"),
      title,
      type,
      date: type === "single" ? singleDate : "",
      startDate: type === "single" ? singleDate : startDate,
      endDate: type === "recurring_period" ? endDate : "",
      daysOfWeek,
      start: allDay ? "00:00" : (qs("#tbStart").value || "09:00"),
      end: allDay ? "23:59" : (qs("#tbEnd").value || "10:00"),
      color: qs("#tbColor").value || "#fb923c",
      allDay,
      skippedDates: [],
      createdAt: new Date().toISOString()
    });
  });

  clearTimeblockForm();
  closeModal("tbModal");
}

export function skipTimeblockOccurrence(blockId, date) {
  mutateState((draft) => {
    const block = draft.timeblocks.find((item) => item.id === blockId);
    if (!block) return;
    const skippedDates = Array.isArray(block.skippedDates) ? block.skippedDates : [];
    if (!skippedDates.includes(date)) {
      block.skippedDates = [...skippedDates, date].sort();
    }
  });
}

export function restoreTimeblockOccurrence(blockId, date) {
  mutateState((draft) => {
    const block = draft.timeblocks.find((item) => item.id === blockId);
    if (!block) return;
    block.skippedDates = (block.skippedDates || []).filter((entry) => entry !== date);
  });
}

export function removeTimeblock(blockId) {
  mutateState((draft) => {
    draft.timeblocks = draft.timeblocks.filter((block) => block.id !== blockId);
  });
}

function describeType(block) {
  if (block.type === "single") return "dia unico";
  if (block.type === "recurring_period") return `recorrente ${block.startDate} ate ${block.endDate}`;
  return `recorrente desde ${block.startDate}`;
}

function describeDays(block) {
  if (!block.daysOfWeek || block.daysOfWeek.length === 0) return "todos os dias";
  return WEEKDAYS.filter((day) => block.daysOfWeek.includes(day.value)).map((day) => day.label).join(", ");
}

export function renderTimeblocks(state = getState()) {
  const ordered = [...state.timeblocks].sort((a, b) => {
    const left = a.startDate || a.date || "";
    const right = b.startDate || b.date || "";
    if (left === right) return (a.start || "").localeCompare(b.start || "");
    return left.localeCompare(right);
  });

  safeHTML("#timeblocksList", ordered.length
    ? ordered.map((block) => {
      const skipped = (block.skippedDates || []).map((date) => `
        <button class="btn btn-xs" type="button" data-restore-timeblock-occurrence="${escapeHTML(block.id)}" data-date="${escapeHTML(date)}">
          Restaurar ${escapeHTML(date)}
        </button>
      `).join("");
      return `
        <div class="timeblock-item">
          <div class="item-top">
            <div>
              <div class="task-title">${escapeHTML(block.title)}</div>
              <div class="item-meta">${escapeHTML(describeType(block))} • ${escapeHTML(block.allDay ? "dia inteiro" : `${block.start} - ${block.end}`)}</div>
              <div class="item-meta">${escapeHTML(describeDays(block))}</div>
              ${skipped ? `<div class="btn-row">${skipped}</div>` : ""}
            </div>
            <button class="btn btn-xs" type="button" data-remove-timeblock="${escapeHTML(block.id)}">Excluir</button>
          </div>
        </div>
      `;
    }).join("")
    : `<div class="timeblock-item"><div class="item-meta">Nenhum bloco criado ainda.</div></div>`);
}

export function listOccurrencesForDate(state, date) {
  return selectTimeblockOccurrencesForDate(state, date);
}
