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

let editingTimeblockId = null;

function readSelectedDays() {
  return qsa("[data-tb-day]").filter((input) => input.checked).map((input) => Number(input.value));
}

function readTimeblockForm() {
  const type = qs("#tbType").value;
  const allDay = qs("#tbAllDay").checked;
  const singleDate = qs("#tbDate").value || formatDateInput();
  const startDate = qs("#tbStartDate").value || singleDate;
  const endDate = qs("#tbEndDate").value || startDate;

  return {
    title: qs("#tbTask").value.trim(),
    type,
    date: type === "single" ? singleDate : "",
    startDate: type === "single" ? singleDate : startDate,
    endDate: type === "recurring_period" ? endDate : "",
    daysOfWeek: type === "single" ? [] : readSelectedDays(),
    start: allDay ? "00:00" : (qs("#tbStart").value || "09:00"),
    end: allDay ? "23:59" : (qs("#tbEnd").value || "10:00"),
    color: qs("#tbColor").value || "#5475bc",
    allDay
  };
}

export function buildTimeblockRecord(input, existingBlock = null) {
  return {
    id: existingBlock?.id || uid("tb"),
    title: input.title,
    type: input.type,
    date: input.type === "single" ? input.date : "",
    startDate: input.type === "single" ? input.date : input.startDate,
    endDate: input.type === "recurring_period" ? input.endDate : "",
    daysOfWeek: input.type === "single" ? [] : input.daysOfWeek,
    start: input.allDay ? "00:00" : input.start,
    end: input.allDay ? "23:59" : input.end,
    color: input.color,
    allDay: input.allDay,
    skippedDates: existingBlock?.skippedDates || [],
    createdAt: existingBlock?.createdAt || new Date().toISOString()
  };
}

function syncTimeblockFormVisibility() {
  const type = qs("#tbType").value;
  const allDay = qs("#tbAllDay").checked;
  const singleRow = optionalQs("#tbSingleDateRow");
  const startRow = optionalQs("#tbStartDateRow");
  const endRow = optionalQs("#tbEndDateRow");
  const daysRow = optionalQs("#tbDaysRow");
  const daysHint = optionalQs("#tbDaysHint");
  const timeRow = optionalQs("#tbTimeRow");
  const timeHint = optionalQs("#tbTimeHint");
  const modalTitle = optionalQs("#tbModalTitle");
  const saveButton = optionalQs("#saveTimeblockBtn");

  if (singleRow) singleRow.hidden = type !== "single";
  if (startRow) startRow.hidden = type === "single";
  if (endRow) endRow.hidden = type !== "recurring_period";
  if (daysRow) daysRow.hidden = type === "single";
  if (timeRow) timeRow.hidden = allDay;
  if (daysHint) {
    daysHint.hidden = type === "single";
    daysHint.textContent = "Se nenhum dia for marcado, o bloco será interpretado como todos os dias.";
  }
  if (timeHint) {
    timeHint.hidden = !allDay;
    timeHint.textContent = "Dia inteiro usa automaticamente 00:00 até 23:59.";
  }
  if (modalTitle) {
    modalTitle.textContent = editingTimeblockId ? "Editar bloco de tempo" : "Bloco de tempo";
  }
  if (saveButton) {
    saveButton.textContent = editingTimeblockId ? "Salvar alterações" : "Salvar bloco";
  }
}

function clearTimeblockForm() {
  editingTimeblockId = null;
  qs("#tbTask").value = "";
  qs("#tbType").value = "single";
  qs("#tbDate").value = formatDateInput();
  qs("#tbStartDate").value = formatDateInput();
  qs("#tbEndDate").value = formatDateInput();
  qs("#tbStart").value = "";
  qs("#tbEnd").value = "";
  qs("#tbColor").value = "#5475bc";
  qs("#tbAllDay").checked = false;
  qsa("[data-tb-day]").forEach((input) => {
    input.checked = false;
  });
  syncTimeblockFormVisibility();
}

function fillTimeblockForm(block) {
  editingTimeblockId = block.id;
  qs("#tbTask").value = block.title;
  qs("#tbType").value = block.type;
  qs("#tbDate").value = block.date || block.startDate || formatDateInput();
  qs("#tbStartDate").value = block.startDate || block.date || formatDateInput();
  qs("#tbEndDate").value = block.endDate || block.startDate || formatDateInput();
  qs("#tbStart").value = block.allDay ? "" : (block.start || "09:00");
  qs("#tbEnd").value = block.allDay ? "" : (block.end || "10:00");
  qs("#tbColor").value = block.color || "#5475bc";
  qs("#tbAllDay").checked = Boolean(block.allDay);
  qsa("[data-tb-day]").forEach((input) => {
    input.checked = (block.daysOfWeek || []).includes(Number(input.value));
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
    const edit = event.target.closest("[data-edit-timeblock]");
    if (edit) {
      editTimeblock(edit.dataset.editTimeblock);
      return;
    }

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
  const input = readTimeblockForm();
  if (!input.title) return;

  mutateState((draft) => {
    const index = draft.timeblocks.findIndex((block) => block.id === editingTimeblockId);
    if (index >= 0) {
      draft.timeblocks[index] = buildTimeblockRecord(input, draft.timeblocks[index]);
      return;
    }

    draft.timeblocks.push(buildTimeblockRecord(input));
  }, { scope: "timeblocks" });

  clearTimeblockForm();
  closeModal("tbModal");
}

function editTimeblock(blockId) {
  const block = getState().timeblocks.find((entry) => entry.id === blockId);
  if (!block) return;
  fillTimeblockForm(block);
  openModal("tbModal");
}

export function skipTimeblockOccurrence(blockId, date) {
  mutateState((draft) => {
    const block = draft.timeblocks.find((item) => item.id === blockId);
    if (!block) return;
    const skippedDates = Array.isArray(block.skippedDates) ? block.skippedDates : [];
    if (!skippedDates.includes(date)) {
      block.skippedDates = [...skippedDates, date].sort();
    }
  }, { scope: "timeblocks" });
}

export function restoreTimeblockOccurrence(blockId, date) {
  mutateState((draft) => {
    const block = draft.timeblocks.find((item) => item.id === blockId);
    if (!block) return;
    block.skippedDates = (block.skippedDates || []).filter((entry) => entry !== date);
  }, { scope: "timeblocks" });
}

export function removeTimeblock(blockId) {
  mutateState((draft) => {
    draft.timeblocks = draft.timeblocks.filter((block) => block.id !== blockId);
  }, { scope: "timeblocks" });
}

function describeType(block) {
  if (block.type === "single") return "dia único";
  if (block.type === "recurring_period") return `recorrente de ${block.startDate} até ${block.endDate}`;
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
              <div class="item-meta">${escapeHTML(describeType(block))} · ${escapeHTML(block.allDay ? "dia inteiro" : `${block.start} - ${block.end}`)}</div>
              <div class="item-meta">${escapeHTML(describeDays(block))}</div>
              ${skipped ? `<div class="btn-row">${skipped}</div>` : ""}
            </div>
            <div class="btn-row">
              <button class="btn btn-xs" type="button" data-edit-timeblock="${escapeHTML(block.id)}">Editar</button>
              <button class="btn btn-xs" type="button" data-remove-timeblock="${escapeHTML(block.id)}">Excluir</button>
            </div>
          </div>
        </div>
      `;
    }).join("")
    : `<div class="timeblock-item"><div class="item-meta">Nenhum bloco de tempo criado ainda.</div></div>`);
}

export function listOccurrencesForDate(state, date) {
  return selectTimeblockOccurrencesForDate(state, date);
}
