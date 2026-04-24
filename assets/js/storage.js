import { STATE_VERSION, normalizeState, validateState } from "./schema.js";
import { migrateState } from "./migrations.js";

const STORAGE_KEY = "flow-app-limpo-v1";

export function loadPersistedState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const payload = JSON.parse(raw);
    const state = migrateState(payload);
    const validation = validateState(state);

    if (!validation.valid) {
      console.warn("Estado persistido invalido; usando estado normalizado.", validation.errors);
    }

    return normalizeState(state);
  } catch (error) {
    console.warn("Falha ao carregar dados salvos.", error);
    return null;
  }
}

export function persistState(state) {
  try {
    const normalizedState = normalizeState(state);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      version: STATE_VERSION,
      updatedAt: new Date().toISOString(),
      data: normalizedState
    }));
  } catch (error) {
    console.warn("Falha ao salvar dados.", error);
  }
}

export function clearPersistedState() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn("Falha ao limpar dados.", error);
  }
}
