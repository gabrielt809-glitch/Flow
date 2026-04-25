import { getState, mutateState } from "./state.js";
import { selectVisibleTasks } from "./selectors.js";
import { escapeHTML, formatDateTime, qs, qsa, safeHTML, uid } from "./utils.js";

export function initTasks() {
  qs("#addTaskBtn").addEventListener("click", addTask);
  qs("#clearTaskDueBtn").addEventListener("click", () => {
    qs("#taskDue").value = "";
  });
  qs("#taskInp").addEventListener("keydown", (event) => {
    if (event.key === "Enter") addTask();
  });

  qsa("[data-task-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      mutateState((draft) => {
        draft.ui.taskFilter = button.dataset.taskFilter;
      }, { scope: "tasks" });
    });
  });

  qs("#tasksList").addEventListener("click", (event) => {
    const toggle = event.target.closest("[data-task-toggle]");
    if (toggle) {
      toggleTask(toggle.dataset.taskToggle);
      return;
    }
    const remove = event.target.closest("[data-task-remove]");
    if (remove) {
      removeTask(remove.dataset.taskRemove);
    }
  });
}

export function addTask() {
  const title = qs("#taskInp").value.trim();
  if (!title) return;

  mutateState((draft) => {
    draft.tasks.unshift({
      id: uid("task"),
      title,
      category: qs("#taskCat").value,
      priority: qs("#taskPrio").value,
      dueDate: qs("#taskDue").value,
      done: false,
      createdAt: new Date().toISOString()
    });
  }, { scope: "tasks" });

  qs("#taskInp").value = "";
  qs("#taskDue").value = "";
}

function toggleTask(id) {
  mutateState((draft) => {
    const task = draft.tasks.find((item) => item.id === id);
    if (task) task.done = !task.done;
  }, { scope: "tasks" });
}

function removeTask(id) {
  mutateState((draft) => {
    draft.tasks = draft.tasks.filter((task) => task.id !== id);
  }, { scope: "tasks" });
}

export function renderTasks(state = getState()) {
  qsa("[data-task-filter]").forEach((button) => {
    button.classList.toggle("on", button.dataset.taskFilter === state.ui.taskFilter);
  });

  const visibleTasks = selectVisibleTasks(state);
  const hasAnyTasks = state.tasks.length > 0;

  safeHTML("#tasksList", visibleTasks.length
    ? visibleTasks.map((task) => `
      <div class="task-item ${task.done ? "done" : ""}">
        <div class="task-row">
          <div class="task-main">
            <button class="task-check ${task.done ? "done" : ""}" type="button" data-task-toggle="${escapeHTML(task.id)}"></button>
            <div>
              <div class="task-title">${escapeHTML(task.title)}</div>
              <div class="task-meta">${escapeHTML(task.category)} · ${escapeHTML(task.dueDate ? formatDateTime(task.dueDate) : "Sem data")}</div>
            </div>
          </div>
          <div class="item-top">
            <span class="badge ${escapeHTML(task.priority)}">${escapeHTML(task.priority)}</span>
            <button class="btn btn-xs" type="button" data-task-remove="${escapeHTML(task.id)}">Excluir</button>
          </div>
        </div>
      </div>
    `).join("")
    : `<div class="task-item"><div class="task-meta">${hasAnyTasks ? "Nenhuma tarefa encontrada neste filtro." : "Nenhuma tarefa criada ainda. Adicione a primeira tarefa acima."}</div></div>`);
}
