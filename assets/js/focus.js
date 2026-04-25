import { mutateState, getState } from "./state.js";
import { selectFocusStatsToday, selectTodayKey } from "./selectors.js";
import { qs, qsa, safeText } from "./utils.js";

let timerId = null;
let audioContext = null;
let masterGain = null;
let activeSoundNodes = [];
let noiseBuffer = null;

const MODES = {
  focus: 25 * 60,
  deep: 50 * 60,
  short: 5 * 60,
  long: 15 * 60
};

const SOUND_TITLES = {
  lofi: "Flow Lo-fi calmo",
  rain: "Chuva ritmica",
  deep: "Deep focus"
};

function formatTimer(secondsLeft) {
  const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const seconds = String(secondsLeft % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function stopTimer() {
  if (timerId) {
    window.clearInterval(timerId);
  }
  timerId = null;
}

function completeSession() {
  mutateState((draft) => {
    draft.focus.isRunning = false;
    draft.focus.sessionsToday += draft.focus.mode === "focus" || draft.focus.mode === "deep" ? 1 : 0;
    draft.focus.history[selectTodayKey()] = draft.focus.sessionsToday;
  }, { scope: "focus" });
  stopTimer();
}

function ensureAudioContext() {
  const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextCtor) {
    return false;
  }

  if (!audioContext) {
    audioContext = new AudioContextCtor();
    masterGain = audioContext.createGain();
    masterGain.gain.value = 0;
    masterGain.connect(audioContext.destination);
  }

  if (!noiseBuffer) {
    const buffer = audioContext.createBuffer(1, audioContext.sampleRate * 2, audioContext.sampleRate);
    const channel = buffer.getChannelData(0);
    for (let index = 0; index < channel.length; index += 1) {
      channel[index] = (Math.random() * 2 - 1) * 0.35;
    }
    noiseBuffer = buffer;
  }

  return true;
}

function setMasterVolume(value) {
  if (!masterGain || !audioContext) return;
  const nextVolume = Math.max(0, Math.min(100, Number(value || 0))) / 100;
  masterGain.gain.cancelScheduledValues(audioContext.currentTime);
  masterGain.gain.setTargetAtTime(nextVolume * 0.09, audioContext.currentTime, 0.08);
}

function registerSoundNode(node, stopMethod = "stop") {
  activeSoundNodes.push({ node, stopMethod });
}

function stopActiveSound() {
  activeSoundNodes.forEach(({ node, stopMethod }) => {
    try {
      if (stopMethod && typeof node[stopMethod] === "function") {
        node[stopMethod]();
      }
    } catch {
      // ignore nodes that already stopped
    }

    try {
      if (typeof node.disconnect === "function") {
        node.disconnect();
      }
    } catch {
      // ignore disconnected nodes
    }
  });

  activeSoundNodes = [];
}

function createOscillatorLayer({ type, frequency, gainValue, detune = 0, target = masterGain }) {
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = type;
  oscillator.frequency.value = frequency;
  oscillator.detune.value = detune;
  gain.gain.value = gainValue;
  oscillator.connect(gain);
  gain.connect(target);
  oscillator.start();
  registerSoundNode(oscillator);
  registerSoundNode(gain, null);
  return { oscillator, gain };
}

function startLofiSound() {
  const lowpass = audioContext.createBiquadFilter();
  lowpass.type = "lowpass";
  lowpass.frequency.value = 920;
  lowpass.Q.value = 0.7;
  lowpass.connect(masterGain);
  registerSoundNode(lowpass, null);

  createOscillatorLayer({ type: "triangle", frequency: 180, gainValue: 0.22, target: lowpass });
  createOscillatorLayer({ type: "sine", frequency: 240, gainValue: 0.1, detune: 5, target: lowpass });
  createOscillatorLayer({ type: "sine", frequency: 320, gainValue: 0.06, detune: -7, target: lowpass });
}

function startDeepSound() {
  const lowpass = audioContext.createBiquadFilter();
  lowpass.type = "lowpass";
  lowpass.frequency.value = 520;
  lowpass.Q.value = 0.8;
  lowpass.connect(masterGain);
  registerSoundNode(lowpass, null);

  createOscillatorLayer({ type: "sine", frequency: 96, gainValue: 0.3, target: lowpass });
  createOscillatorLayer({ type: "triangle", frequency: 144, gainValue: 0.14, detune: -4, target: lowpass });
  createOscillatorLayer({ type: "sine", frequency: 216, gainValue: 0.08, detune: 3, target: lowpass });
}

function startRainSound() {
  const source = audioContext.createBufferSource();
  source.buffer = noiseBuffer;
  source.loop = true;

  const bandpass = audioContext.createBiquadFilter();
  bandpass.type = "bandpass";
  bandpass.frequency.value = 980;
  bandpass.Q.value = 0.65;

  const lowpass = audioContext.createBiquadFilter();
  lowpass.type = "lowpass";
  lowpass.frequency.value = 2400;

  const noiseGain = audioContext.createGain();
  noiseGain.gain.value = 0.22;

  source.connect(bandpass);
  bandpass.connect(lowpass);
  lowpass.connect(noiseGain);
  noiseGain.connect(masterGain);

  source.start();
  registerSoundNode(source);
  registerSoundNode(bandpass, null);
  registerSoundNode(lowpass, null);
  registerSoundNode(noiseGain, null);

  createOscillatorLayer({ type: "sine", frequency: 196, gainValue: 0.03 });
}

function startActiveSound(mode) {
  if (!ensureAudioContext()) {
    return false;
  }

  stopActiveSound();

  if (mode === "rain") {
    startRainSound();
  } else if (mode === "deep") {
    startDeepSound();
  } else {
    startLofiSound();
  }

  setMasterVolume(getState().focus.volume);
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

  if (next) {
    if (!ensureAudioContext()) {
      return;
    }

    await audioContext.resume();
    if (!startActiveSound(state.focus.soundMode)) {
      return;
    }
  } else {
    stopActiveSound();
    if (masterGain) {
      masterGain.gain.value = 0;
    }
  }

  mutateState((draft) => {
    draft.focus.soundPlaying = next;
  }, { scope: "focus" });
}

export function setVolume(value) {
  mutateState((draft) => {
    draft.focus.volume = Number(value);
  }, { scope: "focus" });

  if (getState().focus.soundPlaying) {
    setMasterVolume(value);
  }
}

export function setSoundMode(mode) {
  mutateState((draft) => {
    draft.focus.soundMode = mode;
  }, { scope: "focus" });

  if (getState().focus.soundPlaying) {
    startActiveSound(mode);
  }
}

export function renderFocus(state = getState()) {
  const focus = selectFocusStatsToday(state);
  safeText("#focusTimer", formatTimer(focus.secondsLeft));
  safeText("#focusStateLabel", focus.isRunning ? "Timer em andamento" : "Pronto para iniciar");
  safeText("#focusSessionCount", `${focus.sessions} ${focus.sessions === 1 ? "sessao" : "sessoes"} hoje`);
  safeText("#focusStartBtn", focus.isRunning ? "Pausar" : "Iniciar");
  safeText("#focusAudioBtn", focus.soundPlaying ? "Pausar audio" : "Tocar");
  safeText(
    "#focusAudioStatus",
    focus.soundPlaying
      ? "Som interno ativo para sustentar a concentracao."
      : "Toque em reproduzir para ativar o som interno do app."
  );
  safeText("#focusSoundTitle", SOUND_TITLES[focus.soundMode] || SOUND_TITLES.lofi);
  qs("#focusPlayer").classList.toggle("playing", focus.soundPlaying);
  qs("#focusVolume").value = String(focus.volume);

  qsa("[data-focus-mode]").forEach((button) => {
    button.classList.toggle("on", button.dataset.focusMode === focus.mode);
  });

  qsa("[data-sound-mode]").forEach((button) => {
    button.classList.toggle("on", button.dataset.soundMode === focus.soundMode);
  });
}
