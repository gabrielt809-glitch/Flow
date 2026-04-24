export function optionalQs(selector, root = document) {
  return root.querySelector(selector);
}

export function requiredQs(selector, root = document) {
  const element = optionalQs(selector, root);
  if (!element) {
    throw new Error(`Elemento obrigatorio nao encontrado: ${selector}`);
  }
  return element;
}

export function qs(selector, root = document) {
  return requiredQs(selector, root);
}

export function qsa(selector, root = document) {
  return Array.from(root.querySelectorAll(selector));
}

export function safeText(selector, value, root = document) {
  const element = optionalQs(selector, root);
  if (!element) return false;
  element.textContent = value == null ? "" : String(value);
  return true;
}

export function safeHTML(selector, value, root = document) {
  const element = optionalQs(selector, root);
  if (!element) return false;
  element.innerHTML = value == null ? "" : String(value);
  return true;
}

export function safeStyle(selector, prop, value, root = document) {
  const element = optionalQs(selector, root);
  if (!element) return false;
  element.style[prop] = value;
  return true;
}

export function safeValue(selector, value, root = document) {
  const element = optionalQs(selector, root);
  if (!element) return false;
  element.value = value == null ? "" : value;
  return true;
}

export function safeToggleClass(selector, className, enabled, root = document) {
  const element = optionalQs(selector, root);
  if (!element) return false;
  element.classList.toggle(className, Boolean(enabled));
  return true;
}

export function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function createLogger(namespace) {
  const seenWarnings = new Set();

  function prefix(message) {
    return `[${namespace}] ${message}`;
  }

  return {
    info(message, ...args) {
      console.info(prefix(message), ...args);
    },
    warn(message, ...args) {
      console.warn(prefix(message), ...args);
    },
    warnOnce(message, ...args) {
      const key = `${message}::${JSON.stringify(args)}`;
      if (seenWarnings.has(key)) return;
      seenWarnings.add(key);
      console.warn(prefix(message), ...args);
    },
    error(message, ...args) {
      console.error(prefix(message), ...args);
    }
  };
}

export function clone(value) {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function todayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function humanDate(date = new Date()) {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long"
  }).format(date);
}

export function shortDay(date) {
  return new Intl.DateTimeFormat("pt-BR", { weekday: "short" }).format(date).replace(".", "");
}

export function uid(prefix = "id") {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function parseTimeToMinutes(value) {
  if (!value || !value.includes(":")) return 0;
  const [hours, minutes] = value.split(":").map(Number);
  return (hours * 60) + minutes;
}

export function diffHours(start, end) {
  let total = parseTimeToMinutes(end) - parseTimeToMinutes(start);
  if (total < 0) total += 1440;
  return Number((total / 60).toFixed(1));
}

export function formatHours(value) {
  return `${Number(value || 0).toFixed(1)}h`;
}

export function percent(value, total) {
  if (!total) return 0;
  return clamp(Math.round((value / total) * 100), 0, 100);
}

export function formatDateInput(date = new Date()) {
  return todayKey(date);
}

export function getWeekDates(anchor = new Date()) {
  const base = new Date(anchor);
  const day = base.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  base.setDate(base.getDate() + mondayOffset);
  base.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, index) => {
    const current = new Date(base);
    current.setDate(base.getDate() + index);
    return current;
  });
}

export function sum(values) {
  return values.reduce((acc, current) => acc + current, 0);
}

export function formatDateTime(value) {
  if (!value) return "Sem horario";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

export function sameDay(dateA, dateB) {
  return todayKey(dateA) === todayKey(dateB);
}

export function weekdayFromDateKey(dateKey) {
  const date = new Date(`${dateKey}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date.getDay();
}
