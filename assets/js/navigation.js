import { getState, mutateState } from "./state.js";
import { escapeHTML, qs, qsa, safeHTML } from "./utils.js";

const TAB_META = {
  overview: {
    label: "Hoje",
    icon: `<svg viewBox="0 0 24 24"><path d="M4 11.5 12 5l8 6.5"></path><path d="M6.5 10.5V19h11v-8.5"></path></svg>`
  },
  water: {
    label: "Água",
    icon: `<svg viewBox="0 0 24 24"><path d="M12 4.5c3.2 4 5.3 6.8 5.3 9.2A5.3 5.3 0 0 1 12 19a5.3 5.3 0 0 1-5.3-5.3c0-2.4 2.1-5.2 5.3-9.2Z"></path></svg>`
  },
  study: {
    label: "Foco",
    icon: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="6.5"></circle><circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none"></circle></svg>`
  },
  work: {
    label: "Tarefas",
    icon: `<svg viewBox="0 0 24 24"><path d="M6 7.5h12"></path><path d="M6 12h12"></path><path d="M6 16.5h8"></path><path d="m15.5 16.5 1.8 1.8 3.2-3.5"></path></svg>`
  },
  health: {
    label: "Saúde",
    icon: `<svg viewBox="0 0 24 24"><path d="M4.5 14.5h3l1.7-4 2.7 7 2.1-5h4.5"></path></svg>`
  },
  sleep: {
    label: "Sono",
    icon: `<svg viewBox="0 0 24 24"><path d="M14.5 4.8a7 7 0 1 0 4.7 11.8 6.7 6.7 0 0 1-4.7-11.8Z"></path></svg>`
  },
  food: {
    label: "Nutrição",
    icon: `<svg viewBox="0 0 24 24"><path d="M7.5 5.5v5"></path><path d="M10 5.5v5"></path><path d="M8.75 10.5V19"></path><path d="M15 5.5c1.7 1.6 1.7 4.9 0 6.5V19"></path></svg>`
  },
  habits: {
    label: "Hábitos",
    icon: `<svg viewBox="0 0 24 24"><path d="M8 12.5 10.7 15 16 9.5"></path><circle cx="12" cy="12" r="8"></circle></svg>`
  },
  mood: {
    label: "Bem-estar",
    icon: `<svg viewBox="0 0 24 24"><path d="M12 19s-5.5-3.5-5.5-8a3.2 3.2 0 0 1 5.5-2.2A3.2 3.2 0 0 1 17.5 11c0 4.5-5.5 8-5.5 8Z"></path></svg>`
  },
  settings: {
    label: "Ajustes",
    icon: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="2.6"></circle><path d="M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.5-2.4 1a7.4 7.4 0 0 0-2.1-1.2L14 3h-4l-.4 2.6a7.4 7.4 0 0 0-2.1 1.2l-2.4-1-2 3.5 2 1.5A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.5 2.4-1a7.4 7.4 0 0 0 2.1 1.2L10 21h4l.4-2.6a7.4 7.4 0 0 0 2.1-1.2l2.4 1 2-3.5-2-1.5c.1-.4.1-.8.1-1.2Z"></path></svg>`
  },
  menu: {
    label: "Menu",
    icon: `<svg viewBox="0 0 24 24"><path d="M5 7.5h14"></path><path d="M5 12h14"></path><path d="M5 16.5h14"></path></svg>`
  }
};

function renderPinnedTabs(state = getState()) {
  const tabs = Array.isArray(state.ui.pinnedTabs) && state.ui.pinnedTabs.length
    ? state.ui.pinnedTabs
    : ["overview", "water", "study", "work", "menu"];

  safeHTML(".nav-inner", tabs.map((tab) => {
    const meta = TAB_META[tab] || TAB_META.menu;
    if (tab === "menu") {
      return `
        <button class="nav-btn ${state.ui.activeSection === "menu" ? "active" : ""}" type="button" id="menuToggleBtn">
          <span class="nav-ic" aria-hidden="true">${meta.icon}</span>
          <span>${escapeHTML(meta.label)}</span>
          <div class="nav-dot"></div>
        </button>
      `;
    }

    return `
      <button class="nav-btn ${state.ui.activeSection === tab ? "active" : ""}" type="button" data-nav="${escapeHTML(tab)}">
        <span class="nav-ic" aria-hidden="true">${meta.icon}</span>
        <span>${escapeHTML(meta.label)}</span>
        <div class="nav-dot"></div>
      </button>
    `;
  }).join(""));
}

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

  qs("#appWrap").dataset.activeSection = state.ui.activeSection;

  renderPinnedTabs(state);
}
