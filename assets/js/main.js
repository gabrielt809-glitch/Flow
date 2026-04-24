import { subscribe, getState } from "./state.js";
import { qs, qsa } from "./utils.js";
import { initNavigation, renderNavigation } from "./navigation.js";
import { initOnboarding, renderOnboarding } from "./onboarding.js";
import { renderOverview } from "./overview.js";
import { initWater, renderWater } from "./water.js";
import { initFocus, renderFocus } from "./focus.js";
import { initTasks, renderTasks } from "./tasks.js";
import { initCalendar, renderCalendar } from "./calendar.js";
import { initTimeblocks, renderTimeblocks, closeModal } from "./timeblocks.js";
import { initHealth, renderHealth } from "./health.js";
import { initSleep, renderSleep } from "./sleep.js";
import { initFood, renderFood } from "./food.js";
import { initHabits, renderHabits } from "./habits.js";
import { initMood, renderMood } from "./mood.js";
import { initSettings, renderSettings } from "./settings.js";
import { renderAll, renderScopes } from "./render.js";

function initModals() {
  document.addEventListener("click", (event) => {
    const closeTrigger = event.target.closest("[data-close-modal]");
    if (closeTrigger) {
      closeModal(closeTrigger.dataset.closeModal);
      return;
    }

    const backdrop = event.target.classList.contains("modal-bg") ? event.target : null;
    if (backdrop) {
      backdrop.classList.remove("open");
    }
  });
}

function initApp() {
  initOnboarding();
  initNavigation();
  initWater();
  initFocus();
  initTasks();
  initCalendar();
  initTimeblocks();
  initHealth();
  initSleep();
  initFood();
  initHabits();
  initMood();
  initSettings();
  initModals();

  subscribe((state, meta) => {
    renderScopes(meta?.scopes || ["all"], state);
  });

  qsa("input, textarea, select").forEach((field) => {
    field.setAttribute("autocomplete", "off");
  });

  renderAll(getState());
}

window.addEventListener("DOMContentLoaded", initApp);
