import { getState, mutateState } from "./state.js";
import { selectFoodCaloriesToday } from "./selectors.js";
import { escapeHTML, qs, safeHTML, uid } from "./utils.js";

export function initFood() {
  qs("#addFoodBtn").addEventListener("click", addFood);
  qs("#foodList").addEventListener("click", (event) => {
    const remove = event.target.closest("[data-remove-food]");
    if (remove) {
      mutateState((draft) => {
        draft.food.entries = draft.food.entries.filter((entry) => entry.id !== remove.dataset.removeFood);
      }, { scope: "food" });
    }
  });
}

function addFood() {
  const name = qs("#foodName").value.trim();
  const calories = Number(qs("#foodCalories").value || 0);
  if (!name) return;
  mutateState((draft) => {
    draft.food.entries.unshift({
      id: uid("food"),
      name,
      calories
    });
  }, { scope: "food" });
  qs("#foodName").value = "";
  qs("#foodCalories").value = "";
}

export function renderFood(state = getState()) {
  const food = selectFoodCaloriesToday(state);
  safeHTML("#foodList", food.entries.length
    ? food.entries.map((entry) => `
      <div class="food-item">
        <div class="item-top">
          <div>
            <div class="food-name">${escapeHTML(entry.name)}</div>
            <div class="item-meta">${escapeHTML(entry.calories)} kcal</div>
          </div>
          <button class="btn btn-xs" type="button" data-remove-food="${escapeHTML(entry.id)}">Excluir</button>
        </div>
      </div>
    `).join("")
    : `<div class="food-item"><div class="item-meta">Nenhuma refeição registrada hoje.</div></div>`);
}
