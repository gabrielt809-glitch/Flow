import { getState, mutateState } from "./state.js";
import { selectFoodCaloriesToday, selectTodayKey } from "./selectors.js";
import { escapeHTML, qs, safeHTML, safeText, safeValue, uid } from "./utils.js";

export const FOOD_LIBRARY = [
  { id: "rice", name: "Arroz", portion: "1 concha", calories: 130, category: "carboidrato" },
  { id: "beans", name: "Feijão", portion: "1 concha", calories: 90, category: "leguminosa" },
  { id: "chicken", name: "Frango", portion: "100g", calories: 165, category: "proteina" },
  { id: "beef", name: "Carne", portion: "100g", calories: 220, category: "proteina" },
  { id: "egg", name: "Ovo", portion: "1 unidade", calories: 78, category: "proteina" },
  { id: "bread", name: "Pão francês", portion: "1 unidade", calories: 135, category: "padaria" },
  { id: "cheese", name: "Queijo", portion: "1 fatia", calories: 90, category: "laticinio" },
  { id: "milk", name: "Leite", portion: "200ml", calories: 120, category: "bebida" },
  { id: "coffee", name: "Café", portion: "100ml", calories: 5, category: "bebida" },
  { id: "banana", name: "Banana", portion: "1 unidade", calories: 90, category: "fruta" },
  { id: "apple", name: "Maçã", portion: "1 unidade", calories: 70, category: "fruta" },
  { id: "pasta", name: "Macarrão", portion: "1 prato", calories: 220, category: "carboidrato" },
  { id: "potato", name: "Batata", portion: "1 porção", calories: 130, category: "carboidrato" },
  { id: "salad", name: "Salada", portion: "1 prato", calories: 45, category: "vegetal" },
  { id: "olive-oil", name: "Azeite", portion: "1 colher", calories: 119, category: "gordura" },
  { id: "soda", name: "Refrigerante", portion: "350ml", calories: 140, category: "bebida" },
  { id: "juice", name: "Suco", portion: "300ml", calories: 120, category: "bebida" },
  { id: "yogurt", name: "Iogurte", portion: "1 pote", calories: 110, category: "laticinio" },
  { id: "oats", name: "Aveia", portion: "30g", calories: 115, category: "grao" },
  { id: "tapioca", name: "Tapioca", portion: "1 disco", calories: 160, category: "carboidrato" },
  { id: "whey", name: "Whey", portion: "1 scoop", calories: 120, category: "suplemento" },
  { id: "burger", name: "Hambúrguer", portion: "1 unidade", calories: 280, category: "lanche" },
  { id: "pizza", name: "Pizza", portion: "1 fatia", calories: 260, category: "lanche" },
  { id: "acai", name: "Açaí", portion: "300ml", calories: 320, category: "sobremesa" },
  { id: "chocolate", name: "Chocolate", portion: "25g", calories: 135, category: "sobremesa" },
  { id: "cookie", name: "Biscoito", portion: "4 unidades", calories: 150, category: "lanche" },
  { id: "vegetables", name: "Legumes", portion: "1 porção", calories: 60, category: "vegetal" },
  { id: "fish", name: "Peixe", portion: "100g", calories: 170, category: "proteina" }
];

function getSelectedFood() {
  return FOOD_LIBRARY.find((item) => item.id === qs("#foodLibrarySelect").value) ?? FOOD_LIBRARY[0];
}

function fillFromLibrary() {
  const item = getSelectedFood();
  const count = Math.max(1, Number(qs("#foodPortionCount").value || 1));
  safeValue("#foodName", `${item.name} (${item.portion})`);
  safeValue("#foodCalories", item.calories * count);
}

function addFood(source = "custom") {
  const name = qs("#foodName").value.trim();
  const calories = Math.max(0, Number(qs("#foodCalories").value || 0));
  if (!name) return;

  const libraryItem = getSelectedFood();
  mutateState((draft) => {
    draft.food.entries.unshift({
      id: uid("food"),
      name,
      calories,
      date: selectTodayKey(),
      category: libraryItem.category,
      portionLabel: libraryItem.portion,
      source
    });
  }, { scope: "food" });

  safeValue("#foodName", "");
  safeValue("#foodCalories", "");
}

function saveCurrentMeal() {
  const state = getState();
  const todayEntries = selectFoodCaloriesToday(state).entries;
  if (!todayEntries.length) return;

  const mealName = window.prompt("Nome da refeição salva", "Refeição personalizada");
  if (!mealName) return;

  mutateState((draft) => {
    draft.food.savedMeals.unshift({
      id: uid("meal"),
      name: mealName.trim(),
      category: "personalizada",
      notes: "",
      items: todayEntries.map((entry) => ({
        id: entry.id,
        name: entry.name,
        calories: entry.calories,
        date: entry.date,
        category: entry.category,
        portionLabel: entry.portionLabel,
        source: entry.source
      })),
      calories: todayEntries.reduce((total, entry) => total + Number(entry.calories || 0), 0)
    });
  }, { scope: "food" });
}

function applySavedMeal(mealId) {
  const state = getState();
  const meal = (state.food.savedMeals || []).find((entry) => entry.id === mealId);
  if (!meal) return;

  mutateState((draft) => {
    (meal.items || []).slice().reverse().forEach((item) => {
      draft.food.entries.unshift({
        ...item,
        id: uid("food"),
        date: selectTodayKey()
      });
    });
  }, { scope: "food" });
}

function saveDietMeal() {
  const name = qs("#dietMealName").value.trim();
  if (!name) return;
  mutateState((draft) => {
    draft.food.dietMeals.unshift({
      id: uid("diet"),
      name,
      calories: Math.max(0, Number(qs("#dietMealCalories").value || 0)),
      notes: qs("#dietMealItems").value.trim()
    });
  }, { scope: "food" });

  safeValue("#dietMealName", "");
  safeValue("#dietMealCalories", "");
  safeValue("#dietMealItems", "");
}

function removeEntry(entryId) {
  mutateState((draft) => {
    draft.food.entries = (draft.food.entries || []).filter((entry) => entry.id !== entryId);
  }, { scope: "food" });
}

function removeSavedMeal(mealId) {
  mutateState((draft) => {
    draft.food.savedMeals = (draft.food.savedMeals || []).filter((entry) => entry.id !== mealId);
  }, { scope: "food" });
}

function removeDietMeal(mealId) {
  mutateState((draft) => {
    draft.food.dietMeals = (draft.food.dietMeals || []).filter((entry) => entry.id !== mealId);
  }, { scope: "food" });
}

export function initFood() {
  safeHTML("#foodLibrarySelect", FOOD_LIBRARY.map((item) => (
    `<option value="${escapeHTML(item.id)}">${escapeHTML(item.name)} - ${escapeHTML(item.portion)} (${escapeHTML(String(item.calories))} kcal)</option>`
  )).join(""));
  fillFromLibrary();

  qs("#foodLibrarySelect").addEventListener("change", fillFromLibrary);
  qs("#foodPortionCount").addEventListener("input", fillFromLibrary);
  qs("#useFoodLibraryBtn").addEventListener("click", () => addFood("library"));
  qs("#addFoodBtn").addEventListener("click", () => addFood("custom"));
  qs("#saveFoodMealBtn").addEventListener("click", saveCurrentMeal);
  qs("#saveDietMealBtn").addEventListener("click", saveDietMeal);

  qs("#foodList").addEventListener("click", (event) => {
    const remove = event.target.closest("[data-remove-food]");
    if (remove) {
      removeEntry(remove.dataset.removeFood);
    }
  });

  qs("#savedMealsList").addEventListener("click", (event) => {
    const use = event.target.closest("[data-use-meal]");
    if (use) {
      applySavedMeal(use.dataset.useMeal);
      return;
    }

    const remove = event.target.closest("[data-remove-saved-meal]");
    if (remove) {
      removeSavedMeal(remove.dataset.removeSavedMeal);
    }
  });

  qs("#dietMealsList").addEventListener("click", (event) => {
    const remove = event.target.closest("[data-remove-diet-meal]");
    if (remove) {
      removeDietMeal(remove.dataset.removeDietMeal);
    }
  });
}

export function renderFood(state = getState()) {
  const food = selectFoodCaloriesToday(state);

  safeText("#foodTotalCalories", `${food.total} kcal`);
  safeText("#foodMealCount", String(food.entries.length));

  safeHTML("#foodList", food.entries.length
    ? food.entries.map((entry) => `
      <div class="food-item">
        <div class="item-top">
          <div>
            <div class="food-name">${escapeHTML(entry.name)}</div>
            <div class="item-meta">${escapeHTML(String(entry.calories))} kcal - ${escapeHTML(entry.portionLabel || entry.category || "registro manual")}</div>
          </div>
          <button class="btn btn-xs" type="button" data-remove-food="${escapeHTML(entry.id)}">Excluir</button>
        </div>
      </div>
    `).join("")
    : `
      <div class="empty-state">
        <strong>Nenhuma refeição registrada hoje</strong>
        <span>Use a biblioteca para preencher calorias com mais rapidez ou registre manualmente um alimento do seu dia.</span>
      </div>
    `);

  safeHTML("#savedMealsList", (state.food.savedMeals || []).length
    ? state.food.savedMeals.map((meal) => `
      <div class="task-item">
        <div class="item-top">
          <div>
            <div class="task-title">${escapeHTML(meal.name)}</div>
            <div class="item-meta">${escapeHTML(String(meal.calories || 0))} kcal - ${escapeHTML(String((meal.items || []).length))} item(ns)</div>
          </div>
          <div class="btn-row compact-actions">
            <button class="btn btn-xs" type="button" data-use-meal="${escapeHTML(meal.id)}">Usar</button>
            <button class="btn btn-xs" type="button" data-remove-saved-meal="${escapeHTML(meal.id)}">Excluir</button>
          </div>
        </div>
      </div>
    `).join("")
    : `
      <div class="empty-state">
        <strong>Nenhum modelo salvo</strong>
        <span>Depois de montar uma refeição do dia, salve esse conjunto para reutilizar com um toque.</span>
      </div>
    `);

  safeHTML("#dietMealsList", (state.food.dietMeals || []).length
    ? state.food.dietMeals.map((meal) => `
      <div class="task-item">
        <div class="item-top">
          <div>
            <div class="task-title">${escapeHTML(meal.name)}</div>
            <div class="item-meta">${escapeHTML(String(meal.calories || 0))} kcal estimadas</div>
          </div>
          <button class="btn btn-xs" type="button" data-remove-diet-meal="${escapeHTML(meal.id)}">Excluir</button>
        </div>
        ${meal.notes ? `<div class="item-meta">${escapeHTML(meal.notes)}</div>` : ""}
      </div>
    `).join("")
    : `
      <div class="empty-state">
        <strong>Nenhuma refeição planejada</strong>
        <span>Cadastre almoço, jantar, lanche ou pós-treino para manter uma base simples da sua dieta.</span>
      </div>
    `);
}
