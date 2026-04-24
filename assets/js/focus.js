import { mutateState, getState } from "./state.js";
import { selectFocusStatsToday, selectTodayKey } from "./selectors.js";
import { qs, qsa, safeText } from "./utils.js";

let timerId = null;
let audioContext = null;
let gainNode = null;
let oscillators = [];

const MODES = {
  focus: 25 * 60,
  short: 5 * 60,
  long: 15 * 60
};

function formatTimer(secondsLeft) {
  const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const seconds = String(secondsLeft % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function stopTimer() {
  if (timerId) window.clearInterval(timerId);
  timerId = null;
}

function completeSession() {
  mutateState((draft) => {
    draft.focus.isRunning = false;
    draft.focus.sessionsToday += draft.focus.mode === "focus" ? 1 : 0;
    draft.focus.history[selectTodayKey()] = draft.focus.sessionsToday;
  }, { scope: "focus" });
  stopTimer();
}

function ensureAudioGraph() {
  const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextCtor) return false;

  if (!audioContext) {
    audioContext = new AudioContextCtor();
    gainNode = audioContext.createGain();
    gainNode.gain.value = 0.02;
    gainNode.connect(audioContext.destination);
  }

  if (!oscillators.length) {
    const frequencies = [180, 220, 330];
    oscillators = frequencies.map((frequency, index) => {
      const oscillator = audioContext.createOscillator();
      oscillator.type = index === 1 ? "triangle" : "sine";
      oscillator.frequency.value = frequency;
      oscillator.connect(gainNode);
      oscillator.start();
      return oscillator;
    });
  }

  return true;
}

function updateAudioTimbre(mode) {
  const modes = {
    lofi: [180, 220, 330],
    rain: [120, 170, 240],
    deep: [160, 240, 320]
  };
  const selected = modes[mode] ?? modes.lofi;
  oscillators.forEach((oscillator, index) => {
    oscillator.frequency.setValueAtTime(selected[index], audioContext.currentTime);
  });
}

function stopAudio() {
  if (gainNode) gainNode.gain.value = 0;
}

function playAudio() {
  if (!ensureAudioGraph()) return false;
  updateAudioTimbre(getState().focus.soundMode);
  gainNode.gain.value = Number(getState().focus.volume || 45) / 2000;
  return true;
}

export function initFocus() {
  qs("#focusStartBtn").addEventListener("click", toggleTimer);
  qs("#focusResetBtn").addEventListener("click", resetTimer);
  qs("#focusAudioBtn").addEventListener("click", toggleAudio);
  qs("#focusVolume").addEventListener("input", (event) => setVolume(event.target.value));

  qsa("[data-focus-mode]").forEach((button) => {
    button.addEventListener("click", () => setMode(button.dataset.focusMode));
  });

  qsa("[data-sound-mode]").forEach((button) => {
    button.addEventListener("click", () => setSoundMode(button.dataset.soundMode));
  });
}

export function setMode(mode) {
  mutateState((draft) => {
    draft.focus.mode = mode;
    draft.focus.isRunning = false;
    draft.focus.secondsLeft = MODES[mode];
  }, { scope: "focus" });
  stopTimer();
}

export function toggleTimer() {
  const state = getState();
  if (state.focus.isRunning) {
    mutateState((draft) => {
      draft.focus.isRunning = false;
    }, { scope: "focus" });
    stopTimer();
    return;
  }

  mutateState((draft) => {
    draft.focus.isRunning = true;
  }, { scope: "focus" });

  stopTimer();
  timerId = window.setInterval(() => {
    const current = getState();
    if (current.focus.secondsLeft <= 1) {
      completeSession();
      return;
    }
    mutateState((draft) => {
      draft.focus.secondsLeft -= 1;
    }, { scope: "focus", persist: false });
  }, 1000);
}

export function resetTimer() {
  stopTimer();
  mutateState((draft) => {
    draft.focus.isRunning = false;
    draft.focus.secondsLeft = MODES[draft.focus.mode];
  }, { scope: "focus" });
}

export async function toggleAudio() {
  const state = getState();
  const next = !state.focus.soundPlaying;

  if (next && !ensureAudioGraph()) {
    return;
  }

  mutateState((draft) => {
    draft.focus.soundPlaying = next;
  }, { scope: "focus" });

  if (next) {
    await audioContext.resume();
    playAudio();
  } else {
    stopAudio();
  }
}

export function setVolume(value) {
  mutateState((draft) => {
    draft.focus.volume = Number(value);
  }, { scope: "focus" });
  if (gainNode && getState().focus.soundPlaying) {
    gainNode.gain.value = Number(value) / 2000;
  }
}

export function setSoundMode(mode) {
  mutateState((draft) => {
    draft.focus.soundMode = mode;
  }, { scope: "focus" });
  if (audioContext && getState().focus.soundPlaying) {
    updateAudioTimbre(mode);
  }
}

export function renderFocus(state = getState()) {
  const focus = selectFocusStatsToday(state);
  safeText("#focusTimer", formatTimer(focus.secondsLeft));
  safeText("#focusStateLabel", focus.isRunning ? "Timer em andamento" : "Pronto para iniciar");
  safeText("#focusSessionCount", `${focus.sessions} ${focus.sessions === 1 ? "sessão" : "sessões"} hoje`);
  safeText("#focusStartBtn", focus.isRunning ? "Pausar" : "Iniciar");
  safeText("#focusAudioBtn", focus.soundPlaying ? "Pausar áudio" : "Tocar");
  safeText("#focusAudioStatus", focus.soundPlaying
    ? "Som interno ativo para sustentar a concentração."
    : "Toque em reproduzir para ativar o som interno do app.");
  safeText("#focusSoundTitle", {
    lofi: "Flow Lo-fi calmo",
    rain: "Chuva rítmica",
    deep: "Deep focus"
  }[focus.soundMode]);
  qs("#focusPlayer").classList.toggle("playing", focus.soundPlaying);
  qs("#focusVolume").value = String(focus.volume);
  qsa("[data-focus-mode]").forEach((button) => {
    button.classList.toggle("on", button.dataset.focusMode === focus.mode);
  });
  qsa("[data-sound-mode]").forEach((button) => {
    button.classList.toggle("on", button.dataset.soundMode === focus.soundMode);
  });
}
