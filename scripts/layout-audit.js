import http from "node:http";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

import { DEFAULT_STATE, STATE_VERSION, normalizeState } from "../assets/js/schema.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const STORAGE_KEY = "flow-app-limpo-v1";
const SCREENSHOT_DIR = path.join(ROOT, "qa-layout-screenshots");
const REPORT_PATH = path.join(ROOT, "LAYOUT_AUDIT_REPORT.md");

const VIEWPORTS = [
  { width: 390, height: 844, label: "390x844" },
  { width: 390, height: 667, label: "390x667" },
  { width: 375, height: 667, label: "375x667" },
  { width: 430, height: 932, label: "430x932" }
];

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ico": "image/x-icon"
};

const SCREEN_DEFINITIONS = [
  {
    key: "overview",
    section: "overview",
    importantSelectors: ["#weekChart", "#nextTaskWrap", ".ov-grid .ov-card:last-child"]
  },
  {
    key: "water",
    section: "water",
    importantSelectors: ["#addWaterBtn", "#saveWaterCustomBtn", "#waterVolumes .chip:last-child", "#waterExerciseHint"]
  },
  {
    key: "focus",
    section: "study",
    importantSelectors: ["#focusVolume", "#focusAudioBtn", "#focusPlayer"]
  },
  {
    key: "tasks",
    section: "work",
    importantSelectors: ["#timeblocksList .timeblock-item:last-child", "#openTimeblockBtn", "#tasksList .task-item:last-child"]
  },
  {
    key: "health",
    section: "health",
    importantSelectors: ["#workoutsList .task-item:last-child", "#saveWorkoutPlanBtn", "#activityList .task-item:last-child"]
  },
  {
    key: "sleep",
    section: "sleep",
    importantSelectors: ["#sleepWeekList .task-item:last-child", "#dreamNotes", "#wakeMoodRow .mood-btn:last-child"]
  },
  {
    key: "food",
    section: "food",
    importantSelectors: ["#dietMealsList .task-item:last-child", "#saveDietMealBtn", "#savedMealsList .task-item:last-child"]
  },
  {
    key: "habits",
    section: "habits",
    importantSelectors: ["#habitsList .habit-item:last-child", "#habitMonthSummary", "#habitSuggestions .chip:last-child"]
  },
  {
    key: "mood",
    section: "mood",
    importantSelectors: ["#saveJournalBtn", "#journalNotesInput", "#toggleBreathingBtn"]
  },
  {
    key: "settings",
    section: "settings",
    importantSelectors: ["#resetAppBtn", "#resetDailyBtn", "#pinnedTabsEditor .chip:last-child"]
  }
];

const REQUIRED_SCREENSHOTS = [
  "overview-390x844.png",
  "water-390x844.png",
  "focus-390x844.png",
  "tasks-390x844.png",
  "tasks-full-390x844.png",
  "calendar-timeblocks-390x844.png",
  "health-390x844.png",
  "health-full-390x844.png",
  "sleep-390x844.png",
  "sleep-full-390x844.png",
  "food-390x844.png",
  "food-full-390x844.png",
  "habits-390x844.png",
  "habits-full-390x844.png",
  "mood-390x844.png",
  "mood-full-390x844.png",
  "settings-390x844.png",
  "settings-full-390x844.png",
  "menu-390x844.png",
  "modal-timeblock-390x667.png",
  "onboarding-390x844.png",
  "onboarding-390x667.png"
];

function dateKey(date) {
  return new Date(date).toISOString().slice(0, 10);
}

function shiftDate(baseDate, offsetDays) {
  const next = new Date(baseDate);
  next.setDate(next.getDate() + offsetDays);
  return next;
}

function buildFixtureState() {
  const state = structuredClone(DEFAULT_STATE);
  const now = new Date();
  const today = dateKey(now);
  const yesterday = dateKey(shiftDate(now, -1));
  const twoDaysAgo = dateKey(shiftDate(now, -2));
  const weekKeys = Array.from({ length: 7 }, (_, index) => dateKey(shiftDate(now, -index))).reverse();

  state.onboarded = true;
  state.profile = {
    name: "Gabri",
    weight: "70",
    height: "170",
    age: "28",
    emoji: "🙂"
  };
  state.goals = {
    waterMl: 2730,
    steps: 10000,
    sleepHours: 8,
    calories: 2200
  };
  state.ui = {
    ...state.ui,
    activeSection: "overview",
    calendarAnchorDate: today,
    pinnedTabs: ["overview", "water", "study", "work", "menu"]
  };
  state.streak = 6;

  state.water = {
    ml: 700,
    cupMl: 700,
    customVolumes: [600, 700],
    history: {
      [today]: 700,
      [yesterday]: 1800
    }
  };

  state.focus = {
    mode: "deep",
    secondsLeft: 50 * 60,
    isRunning: false,
    sessionsToday: 2,
    soundMode: "lofi",
    soundPlaying: false,
    volume: 45,
    history: {
      [today]: 2,
      [yesterday]: 3
    }
  };

  state.tasks = [
    { id: "task-1", title: "Planejar roadmap do sprint", category: "Produto", priority: "high", dueDate: `${today}T09:30`, done: false, createdAt: `${today}T07:00` },
    { id: "task-2", title: "Revisar copy do onboarding", category: "Design", priority: "mid", dueDate: `${today}T14:00`, done: true, createdAt: `${today}T07:20` },
    { id: "task-3", title: "Responder pendências do cliente", category: "Operação", priority: "low", dueDate: `${yesterday}T18:15`, done: false, createdAt: `${yesterday}T11:00` }
  ];

  state.timeblocks = [
    {
      id: "tb-1",
      title: "Planejamento leve",
      type: "recurring_forever",
      date: "",
      startDate: dateKey(shiftDate(now, -12)),
      endDate: "",
      daysOfWeek: [1, 3, 5],
      start: "09:00",
      end: "09:45",
      color: "#5f82d8",
      allDay: false,
      skippedDates: [],
      createdAt: `${yesterday}T08:00`
    },
    {
      id: "tb-2",
      title: "Treino funcional",
      type: "recurring_period",
      date: "",
      startDate: dateKey(shiftDate(now, -6)),
      endDate: dateKey(shiftDate(now, 7)),
      daysOfWeek: [2, 4, 6],
      start: "19:00",
      end: "20:00",
      color: "#7b95cd",
      allDay: false,
      skippedDates: [dateKey(shiftDate(now, 2))],
      createdAt: `${twoDaysAgo}T08:00`
    },
    {
      id: "tb-3",
      title: "Revisão de produto",
      type: "single",
      date: today,
      startDate: today,
      endDate: "",
      daysOfWeek: [],
      start: "15:00",
      end: "16:00",
      color: "#6d8aca",
      allDay: false,
      skippedDates: [],
      createdAt: `${today}T08:00`
    }
  ];

  state.health = {
    steps: 4200,
    workoutMinutes: 45,
    activityEntries: [
      { id: "activity-1", name: "Corrida leve", activityId: "run-light", minutes: 45, calories: 349, intensity: "moderada", date: today },
      { id: "activity-2", name: "Caminhada rápida", activityId: "walk-fast", minutes: 20, calories: 105, intensity: "leve", date: today }
    ],
    workouts: [
      {
        id: "workout-1",
        name: "Upper A",
        daysOfWeek: ["Seg", "Qui"],
        notes: "Dias livres. 1 série/ciclo",
        exercises: [
          { name: "Supino", sets: "4", reps: "8-10", load: "", notes: "" },
          { name: "Remada", sets: "4", reps: "10", load: "", notes: "" }
        ]
      }
    ]
  };

  state.sleep = {
    start: "22:45",
    end: "07:00",
    quality: 4,
    notes: "Acordei melhor.",
    wakeMood: 4,
    entries: {
      [today]: { start: "22:45", end: "07:00", quality: 4, notes: "Acordei melhor.", wakeMood: 4 },
      [yesterday]: { start: "23:10", end: "06:50", quality: 3, notes: "Sono ok.", wakeMood: 3 },
      [twoDaysAgo]: { start: "23:35", end: "07:20", quality: 5, notes: "Recuperei bem.", wakeMood: 4 }
    },
    history: {
      [today]: { hours: 8.25, quality: 4, notes: "Acordei melhor." },
      [yesterday]: { hours: 7.7, quality: 3, notes: "Sono ok." },
      [twoDaysAgo]: { hours: 7.75, quality: 5, notes: "Recuperei bem." }
    }
  };

  state.food = {
    entries: [
      { id: "food-1", name: "Café + banana", calories: 180, date: today, category: "café da manhã", portionLabel: "1 refeição", source: "custom" },
      { id: "food-2", name: "Arroz, feijão e frango", calories: 520, date: today, category: "almoço", portionLabel: "1 prato", source: "library" },
      { id: "food-3", name: "Iogurte com aveia", calories: 210, date: today, category: "lanche", portionLabel: "1 pote", source: "library" }
    ],
    savedMeals: [
      {
        id: "meal-1",
        name: "Café rápido",
        category: "café da manhã",
        notes: "",
        calories: 280,
        items: [
          { id: "meal-item-1", name: "Café", calories: 5, date: today, category: "bebida", portionLabel: "100ml", source: "library" },
          { id: "meal-item-2", name: "Pão francês", calories: 135, date: today, category: "padaria", portionLabel: "1 unidade", source: "library" },
          { id: "meal-item-3", name: "Queijo", calories: 140, date: today, category: "laticinio", portionLabel: "2 fatias", source: "library" }
        ]
      }
    ],
    dietMeals: [
      { id: "diet-1", name: "Almoço de rotina", calories: 650, notes: "Arroz, feijão, frango e legumes." },
      { id: "diet-2", name: "Lanche pós-treino", calories: 320, notes: "Iogurte, banana e whey." }
    ],
    history: {}
  };

  state.habits = [
    { id: "habit-1", name: "Beber água", icon: "", doneDates: [twoDaysAgo, yesterday, today] },
    { id: "habit-2", name: "Leitura", icon: "", doneDates: [yesterday, today] },
    { id: "habit-3", name: "Alongar", icon: "", doneDates: [today] }
  ];

  state.mood = {
    value: 4,
    gratitude: "Tempo de qualidade e clareza.",
    notes: "Dia produtivo e bem mais leve.",
    dailyCheckinShownDate: today,
    journalEntries: {
      [today]: {
        summary: "Dia produtivo e bem mais leve.",
        highs: "Fechei uma entrega grande.",
        lows: "Cansei no meio da tarde.",
        lessons: "Pausas curtas ajudam mais do que insistir.",
        gratitude: "Tempo de qualidade e clareza.",
        notes: "Quero repetir esse ritmo amanhã."
      }
    },
    history: {
      [today]: {
        value: 4,
        gratitude: "Tempo de qualidade e clareza.",
        notes: "Dia produtivo e bem mais leve."
      }
    }
  };

  state.history = Object.fromEntries(weekKeys.map((key, index) => [
    key,
    {
      waterMl: 1200 + (index * 180),
      focusSessions: Math.min(4, 1 + (index % 4)),
      completedTasks: 1 + (index % 3),
      steps: 4800 + (index * 650),
      sleepHours: 6.9 + (index * 0.18)
    }
  ]));

  return normalizeState(state);
}

async function ensureDir(dirPath) {
  await fsp.rm(dirPath, { recursive: true, force: true });
  await fsp.mkdir(dirPath, { recursive: true });
}

function getMimeType(filePath) {
  return MIME_TYPES[path.extname(filePath).toLowerCase()] || "application/octet-stream";
}

function createServer(rootDir) {
  return http.createServer(async (request, response) => {
    try {
      const requestUrl = new URL(request.url || "/", "http://127.0.0.1");
      let pathname = decodeURIComponent(requestUrl.pathname);
      if (pathname === "/") pathname = "/index.html";

      const resolvedPath = path.resolve(rootDir, `.${pathname}`);
      if (!resolvedPath.startsWith(rootDir)) {
        response.writeHead(403);
        response.end("Forbidden");
        return;
      }

      let targetPath = resolvedPath;
      let stats = await fsp.stat(targetPath).catch(() => null);
      if (stats?.isDirectory()) {
        targetPath = path.join(targetPath, "index.html");
        stats = await fsp.stat(targetPath).catch(() => null);
      }

      if (!stats?.isFile()) {
        response.writeHead(404);
        response.end("Not found");
        return;
      }

      response.writeHead(200, {
        "Content-Type": getMimeType(targetPath),
        "Cache-Control": "no-store"
      });
      fs.createReadStream(targetPath).pipe(response);
    } catch (error) {
      response.writeHead(500);
      response.end(String(error));
    }
  });
}

async function startServer() {
  const server = createServer(ROOT);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  return {
    server,
    baseUrl: `http://127.0.0.1:${address.port}/index.html`
  };
}

async function closeServer(server) {
  if (!server) return;
  await new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) reject(error);
      else resolve();
    });
  });
}

async function seedState(page, state) {
  await page.addInitScript(({ storageKey, version, seededState }) => {
    localStorage.setItem(storageKey, JSON.stringify({
      version,
      updatedAt: new Date().toISOString(),
      data: seededState
    }));
  }, {
    storageKey: STORAGE_KEY,
    version: STATE_VERSION,
    seededState: state
  });
}

async function clearState(page) {
  await page.addInitScript(({ storageKey }) => {
    localStorage.removeItem(storageKey);
  }, { storageKey: STORAGE_KEY });
}

async function openApp(page, baseUrl) {
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.waitForTimeout(250);
}

async function waitForAppShell(page) {
  await page.waitForSelector("#appWrap:not([hidden])", { timeout: 20000 });
  await page.waitForSelector("#mainNav:not([hidden])", { timeout: 20000 });
  await page.waitForTimeout(200);
}

async function waitForOnboarding(page) {
  await page.waitForSelector("#onboard:not([hidden])", { timeout: 20000 });
  await page.waitForTimeout(150);
}

async function dismissDailyMoodIfNeeded(page) {
  const modalVisible = await page.locator("#dailyMoodModal.open").isVisible().catch(() => false);
  if (modalVisible) {
    await page.click("#skipDailyMoodBtn");
    await page.waitForTimeout(120);
  }
}

function sectionIdFromKey(section) {
  return `#sec-${section}`;
}

async function openMenu(page) {
  if (await page.locator("#sideMenu.open").isVisible().catch(() => false)) return;
  await page.click("#menuToggleBtn");
  await page.waitForSelector("#sideMenu.open", { timeout: 5000 });
  await page.waitForTimeout(380);
}

async function closeMenu(page) {
  if (!(await page.locator("#sideMenu.open").isVisible().catch(() => false))) return;
  await page.click("#closeMenuBtn");
  await page.waitForTimeout(320);
}

async function closeTimeblockModal(page) {
  if (!(await page.locator("#tbModal.open").isVisible().catch(() => false))) return;
  await page.click("#tbModal [data-close-modal=\"tbModal\"]");
  await page.waitForTimeout(120);
}

async function goToSection(page, section) {
  await closeTimeblockModal(page);
  if (["overview", "water", "study", "work"].includes(section)) {
    await closeMenu(page);
    await page.locator(`#mainNav [data-nav="${section}"]`).click();
  } else {
    await openMenu(page);
    await page.locator(`#sideMenu [data-nav="${section}"]`).click();
  }

  await page.waitForFunction((selector) => {
    const sectionEl = document.querySelector(selector);
    return sectionEl && sectionEl.classList.contains("active");
  }, sectionIdFromKey(section), { timeout: 5000 });
  await page.waitForTimeout(160);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(100);
}

async function goToScreen(page, key) {
  if (key === "menu") {
    await closeTimeblockModal(page);
    await openMenu(page);
    return;
  }

  if (key === "modal-timeblock") {
    await goToSection(page, "work");
    await page.locator("#openTimeblockBtn").scrollIntoViewIfNeeded();
    await page.click("#openTimeblockBtn");
    await page.waitForSelector("#tbModal.open .modal", { timeout: 5000 });
    await page.waitForTimeout(200);
    return;
  }

  const screen = SCREEN_DEFINITIONS.find((entry) => entry.key === key);
  if (!screen) {
    throw new Error(`Tela nao mapeada: ${key}`);
  }

  await goToSection(page, screen.section);
}

async function scrollPageToBottom(page) {
  await page.evaluate(() => {
    window.scrollTo(0, document.documentElement.scrollHeight);
  });
  await page.waitForTimeout(180);
}

async function scrollContainerToBottom(page, selector) {
  await page.evaluate((targetSelector) => {
    const element = document.querySelector(targetSelector);
    if (element) {
      element.scrollTop = element.scrollHeight;
    }
  }, selector);
  await page.waitForTimeout(180);
}

async function collectPageAudit(page, importantSelectors = []) {
  return page.evaluate((selectors) => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const root = document.documentElement;
    const nav = document.querySelector("#mainNav:not([hidden])");

    const skippedTags = new Set(["HTML", "BODY", "SCRIPT", "STYLE", "META", "LINK", "PATH"]);

    function isVisible(element) {
      if (!(element instanceof HTMLElement || element instanceof SVGElement)) return false;
      if (skippedTags.has(element.tagName)) return false;
      if (element.closest(".ambient-bg")) return false;
      const sideMenu = document.querySelector("#sideMenu");
      if (sideMenu && !sideMenu.classList.contains("open") && (element === sideMenu || element.closest("#sideMenu"))) {
        return false;
      }
      const style = window.getComputedStyle(element);
      if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0) return false;
      const rect = element.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return false;
      return rect.bottom > 1 && rect.top < viewportHeight - 1 && rect.right > 1 && rect.left < viewportWidth - 1;
    }

    function describeElement(element) {
      if (element.id) return `#${element.id}`;
      const className = String(element.className || "").trim().split(/\s+/).filter(Boolean).slice(0, 2).join(".");
      return className ? `${element.tagName.toLowerCase()}.${className}` : element.tagName.toLowerCase();
    }

    const edgeOffenders = [];
    for (const element of document.body.querySelectorAll("*")) {
      if (!isVisible(element)) continue;
      const rect = element.getBoundingClientRect();
      if (rect.left < -2 || rect.right > viewportWidth + 2) {
        edgeOffenders.push({
          element: describeElement(element),
          left: Number(rect.left.toFixed(1)),
          right: Number(rect.right.toFixed(1))
        });
      }
      if (edgeOffenders.length >= 12) break;
    }

    let lastImportant = null;
    let lastImportantSelector = null;
    for (const selector of selectors) {
      const elements = Array.from(document.querySelectorAll(selector)).filter(isVisible);
      if (elements.length) {
        lastImportant = elements[elements.length - 1];
        lastImportantSelector = selector;
        break;
      }
    }

    let navCoverage = {
      ok: true,
      selector: null,
      element: null,
      navTop: null,
      bottom: null
    };

    if (nav && lastImportant) {
      const navRect = nav.getBoundingClientRect();
      const lastRect = lastImportant.getBoundingClientRect();
      navCoverage = {
        ok: lastRect.bottom <= navRect.top - 8,
        selector: lastImportantSelector,
        element: describeElement(lastImportant),
        navTop: Number(navRect.top.toFixed(1)),
        bottom: Number(lastRect.bottom.toFixed(1))
      };
    }

    return {
      viewportWidth,
      viewportHeight,
      scrollWidth: root.scrollWidth,
      hasHorizontalOverflow: root.scrollWidth > viewportWidth + 2,
      edgeOffenders,
      navCoverage
    };
  }, importantSelectors);
}

async function collectModalAudit(page, modalSelector, actionSelector) {
  return page.evaluate(({ selector, action }) => {
    const modal = document.querySelector(selector);
    if (!(modal instanceof HTMLElement)) {
      return {
        ok: false,
        reason: "modal-nao-encontrado"
      };
    }

    const rect = modal.getBoundingClientRect();
    const style = window.getComputedStyle(modal);
    const saveButton = action ? document.querySelector(action) : null;
    const saveRect = saveButton instanceof HTMLElement ? saveButton.getBoundingClientRect() : null;

    return {
      ok: rect.height <= window.innerHeight - 8
        && rect.left >= -2
        && rect.right <= window.innerWidth + 2
        && ["auto", "scroll"].includes(style.overflowY)
        && (!saveRect || saveRect.bottom <= rect.bottom - 8),
      height: Number(rect.height.toFixed(1)),
      viewportHeight: window.innerHeight,
      left: Number(rect.left.toFixed(1)),
      right: Number(rect.right.toFixed(1)),
      overflowY: style.overflowY,
      actionBottom: saveRect ? Number(saveRect.bottom.toFixed(1)) : null,
      modalBottom: Number(rect.bottom.toFixed(1))
    };
  }, { selector: modalSelector, action: actionSelector });
}

function resultStatus(ok) {
  return ok ? "PASS" : "FAIL";
}

async function takeScreenshot(page, fileName, options = {}) {
  const targetPath = path.join(SCREENSHOT_DIR, fileName);
  await page.screenshot({
    path: targetPath,
    fullPage: Boolean(options.fullPage)
  });
  return fileName;
}

async function captureRequiredScreenshots(page, viewportLabel, createdScreenshots) {
  if (viewportLabel !== "390x844") return;

  await goToSection(page, "overview");
  createdScreenshots.push(await takeScreenshot(page, "overview-390x844.png"));

  await goToSection(page, "water");
  createdScreenshots.push(await takeScreenshot(page, "water-390x844.png"));

  await goToSection(page, "study");
  createdScreenshots.push(await takeScreenshot(page, "focus-390x844.png"));

  await goToSection(page, "work");
  createdScreenshots.push(await takeScreenshot(page, "tasks-390x844.png"));
  createdScreenshots.push(await takeScreenshot(page, "tasks-full-390x844.png", { fullPage: true }));
  await page.locator(".calendar-card").scrollIntoViewIfNeeded();
  await page.waitForTimeout(120);
  createdScreenshots.push(await takeScreenshot(page, "calendar-timeblocks-390x844.png"));

  await goToSection(page, "health");
  createdScreenshots.push(await takeScreenshot(page, "health-390x844.png"));
  createdScreenshots.push(await takeScreenshot(page, "health-full-390x844.png", { fullPage: true }));

  await goToSection(page, "sleep");
  createdScreenshots.push(await takeScreenshot(page, "sleep-390x844.png"));
  createdScreenshots.push(await takeScreenshot(page, "sleep-full-390x844.png", { fullPage: true }));

  await goToSection(page, "food");
  createdScreenshots.push(await takeScreenshot(page, "food-390x844.png"));
  createdScreenshots.push(await takeScreenshot(page, "food-full-390x844.png", { fullPage: true }));

  await goToSection(page, "habits");
  createdScreenshots.push(await takeScreenshot(page, "habits-390x844.png"));
  createdScreenshots.push(await takeScreenshot(page, "habits-full-390x844.png", { fullPage: true }));

  await goToSection(page, "mood");
  createdScreenshots.push(await takeScreenshot(page, "mood-390x844.png"));
  createdScreenshots.push(await takeScreenshot(page, "mood-full-390x844.png", { fullPage: true }));

  await goToSection(page, "settings");
  createdScreenshots.push(await takeScreenshot(page, "settings-390x844.png"));
  createdScreenshots.push(await takeScreenshot(page, "settings-full-390x844.png", { fullPage: true }));

  await openMenu(page);
  createdScreenshots.push(await takeScreenshot(page, "menu-390x844.png"));
  await closeMenu(page);
}

async function captureModalScreenshot(page, viewportLabel, createdScreenshots) {
  if (viewportLabel !== "390x667") return;
  await goToScreen(page, "modal-timeblock");
  createdScreenshots.push(await takeScreenshot(page, "modal-timeblock-390x667.png"));
  await closeTimeblockModal(page);
}

async function captureOnboardingScreenshots(browser, baseUrl, createdScreenshots) {
  const onboardingViewports = [
    { width: 390, height: 844, label: "390x844", fileName: "onboarding-390x844.png", scrollToCta: false },
    { width: 390, height: 667, label: "390x667", fileName: "onboarding-390x667.png", scrollToCta: true },
    { width: 375, height: 667, label: "375x667", fileName: "onboarding-375x667.png", scrollToCta: true, optional: true }
  ];

  const results = [];

  for (const viewport of onboardingViewports) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      isMobile: true,
      hasTouch: true,
      colorScheme: "dark"
    });
    const page = await context.newPage();
    await clearState(page);
    await openApp(page, baseUrl);
    await waitForOnboarding(page);

    if (viewport.scrollToCta) {
      await page.locator("#finishOnboardBtn").scrollIntoViewIfNeeded();
      await page.waitForTimeout(120);
    }

    if (!viewport.optional || viewport.width === 390) {
      createdScreenshots.push(await takeScreenshot(page, viewport.fileName));
    } else {
      createdScreenshots.push(await takeScreenshot(page, viewport.fileName));
    }

    const audit = await page.evaluate(() => {
      const root = document.documentElement;
      const onboard = document.querySelector("#onboard");
      const cta = document.querySelector("#finishOnboardBtn");
      const rect = cta?.getBoundingClientRect();
      return {
        hasHorizontalOverflow: root.scrollWidth > window.innerWidth + 2,
        ctaVisible: Boolean(rect && rect.bottom <= window.innerHeight - 8),
        onboardScrollHeight: onboard instanceof HTMLElement ? onboard.scrollHeight : 0,
        viewportHeight: window.innerHeight
      };
    });

    results.push({
      key: `onboarding-${viewport.label}`,
      viewport: viewport.label,
      ok: !audit.hasHorizontalOverflow && audit.ctaVisible,
      audit
    });

    await context.close();
  }

  return results;
}

async function runViewportAudit(browser, baseUrl, viewport, createdScreenshots) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    isMobile: true,
    hasTouch: true,
    colorScheme: "dark"
  });
  const page = await context.newPage();
  await seedState(page, buildFixtureState());
  await openApp(page, baseUrl);
  await waitForAppShell(page);
  await dismissDailyMoodIfNeeded(page);

  const results = [];

  for (const screen of SCREEN_DEFINITIONS) {
    await goToScreen(page, screen.key);
    await scrollPageToBottom(page);
    const audit = await collectPageAudit(page, screen.importantSelectors);
    const ok = !audit.hasHorizontalOverflow && audit.edgeOffenders.length === 0 && audit.navCoverage.ok;
    results.push({
      key: screen.key,
      viewport: viewport.label,
      ok,
      audit
    });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(100);
  }

  await openMenu(page);
  await page.waitForTimeout(120);
  const menuAudit = await page.evaluate(() => {
    const root = document.documentElement;
    const drawer = document.querySelector("#sideMenu .side-menu-card");
    const closeButton = document.querySelector("#closeMenuBtn");
    const drawerRect = drawer?.getBoundingClientRect();
    const closeRect = closeButton?.getBoundingClientRect();
    return {
      hasHorizontalOverflow: root.scrollWidth > window.innerWidth + 2,
      drawerFits: Boolean(drawerRect && drawerRect.left >= -2 && drawerRect.right <= window.innerWidth + 2 && drawerRect.bottom <= window.innerHeight + 2),
      closeButtonFits: Boolean(closeRect && closeRect.top >= -2 && closeRect.bottom <= window.innerHeight + 2 && closeRect.right <= window.innerWidth + 2)
    };
  });
  results.push({
    key: "menu",
    viewport: viewport.label,
    ok: !menuAudit.hasHorizontalOverflow && menuAudit.drawerFits && menuAudit.closeButtonFits,
    audit: menuAudit
  });
  await closeMenu(page);

  await goToScreen(page, "modal-timeblock");
  await scrollContainerToBottom(page, "#tbModal .modal");
  const modalAudit = await collectModalAudit(page, "#tbModal .modal", "#saveTimeblockBtn");
  results.push({
    key: "modal-timeblock",
    viewport: viewport.label,
    ok: modalAudit.ok,
    audit: modalAudit
  });
  await closeTimeblockModal(page);

  await captureRequiredScreenshots(page, viewport.label, createdScreenshots);
  await captureModalScreenshot(page, viewport.label, createdScreenshots);

  if (viewport.label === "375x667") {
    await goToSection(page, "work");
    createdScreenshots.push(await takeScreenshot(page, "tasks-375x667.png"));
    await goToSection(page, "health");
    createdScreenshots.push(await takeScreenshot(page, "health-375x667.png"));
    await goToScreen(page, "modal-timeblock");
    createdScreenshots.push(await takeScreenshot(page, "modal-timeblock-375x667.png"));
    await closeTimeblockModal(page);
  }

  await context.close();
  return results;
}

function buildMarkdownReport({ allResults, onboardingResults, screenshots, failedItems }) {
  const groupedByViewport = new Map();
  for (const result of allResults) {
    if (!groupedByViewport.has(result.viewport)) {
      groupedByViewport.set(result.viewport, []);
    }
    groupedByViewport.get(result.viewport).push(result);
  }

  const lines = [];
  lines.push("# Layout Audit Report");
  lines.push("");
  lines.push(`- Gerado em: ${new Date().toISOString()}`);
  lines.push(`- Screenshots em: \`qa-layout-screenshots/\``);
  lines.push(`- Total de verificações: ${allResults.length + onboardingResults.length}`);
  lines.push(`- Falhas encontradas: ${failedItems.length}`);
  lines.push("");
  lines.push("## Viewports");
  lines.push("");

  for (const [viewport, results] of groupedByViewport.entries()) {
    const passes = results.filter((entry) => entry.ok).length;
    lines.push(`### ${viewport}`);
    lines.push("");
    lines.push(`- Resultado: ${passes}/${results.length} verificações aprovadas`);
    for (const result of results) {
      lines.push(`- ${resultStatus(result.ok)} ${result.key}`);
      if (!result.ok) {
        lines.push(`  - detalhes: \`${JSON.stringify(result.audit)}\``);
      }
    }
    lines.push("");
  }

  lines.push("## Onboarding");
  lines.push("");
  for (const result of onboardingResults) {
    lines.push(`- ${resultStatus(result.ok)} ${result.key}`);
    if (!result.ok) {
      lines.push(`  - detalhes: \`${JSON.stringify(result.audit)}\``);
    }
  }
  lines.push("");

  lines.push("## Screenshots Geradas");
  lines.push("");
  screenshots.forEach((fileName) => {
    lines.push(`- \`qa-layout-screenshots/${fileName}\``);
  });
  lines.push("");

  if (failedItems.length > 0) {
    lines.push("## Falhas Pendentes");
    lines.push("");
    failedItems.forEach((item) => {
      lines.push(`- ${item.viewport} / ${item.key}: \`${JSON.stringify(item.audit)}\``);
    });
    lines.push("");
  }

  return `${lines.join("\n")}\n`;
}

async function main() {
  await ensureDir(SCREENSHOT_DIR);

  const { server, baseUrl } = await startServer();
  const browser = await chromium.launch({ headless: true });
  const createdScreenshots = [];
  const allResults = [];

  try {
    for (const viewport of VIEWPORTS) {
      const results = await runViewportAudit(browser, baseUrl, viewport, createdScreenshots);
      allResults.push(...results);
    }

    const onboardingResults = await captureOnboardingScreenshots(browser, baseUrl, createdScreenshots);
    const requiredMissing = REQUIRED_SCREENSHOTS.filter((fileName) => !createdScreenshots.includes(fileName));
    const failedItems = allResults.filter((item) => !item.ok);
    const failedOnboarding = onboardingResults.filter((item) => !item.ok);
    const allFailures = [
      ...failedItems,
      ...failedOnboarding,
      ...requiredMissing.map((fileName) => ({
        viewport: "screenshots",
        key: fileName,
        ok: false,
        audit: { missing: true }
      }))
    ];

    const report = buildMarkdownReport({
      allResults,
      onboardingResults,
      screenshots: createdScreenshots,
      failedItems: allFailures
    });

    await fsp.writeFile(REPORT_PATH, report, "utf8");

    if (allFailures.length > 0) {
      console.error(`Layout audit encontrou ${allFailures.length} falha(s). Veja ${REPORT_PATH}.`);
      process.exitCode = 1;
      return;
    }

    console.log(`Layout audit aprovado. Relatório salvo em ${REPORT_PATH}.`);
  } finally {
    await browser.close();
    await closeServer(server);
  }
}

main().catch(async (error) => {
  console.error(error);
  process.exitCode = 1;
});
