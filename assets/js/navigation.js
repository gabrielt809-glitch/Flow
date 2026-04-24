import { getState, mutateState } from "./state.js";
import { qs, qsa } from "./utils.js";

export function initNavigation() {
  document.addEventListener("click", (event) => {
    const navTrigger = event.target.closest("[data-nav]");
    if (navTrigger) {
      openSection(navTrigger.dataset.nav);
      return;
    }

    if (event.target.closest("#menuToggleBtn")) {
      toggleSideMenu(true);
      return;
    }

    if (event.target.closest("#closeMenuBtn") || event.target.closest("#menuBackdrop")) {
      toggleSideMenu(false);
    }
  });
}

export function openSection(section) {
  mutateState((draft) => {
    draft.ui.activeSection = section;
  }, { scope: "navigation" });
  toggleSideMenu(false);
}

export function toggleSideMenu(open) {
  qs("#sideMenu").classList.toggle("open", open);
  qs("#menuBackdrop").hidden = !open;
}

export function renderNavigation(state = getState()) {
  qsa(".sec").forEach((section) => {
    section.classList.toggle("active", section.dataset.section === state.ui.activeSection);
  });

  qsa(".nav-btn[data-nav]").forEach((button) => {
    button.classList.toggle("active", button.dataset.nav === state.ui.activeSection);
  });
}
