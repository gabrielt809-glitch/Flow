/* FLOW Foundation v15.0 — Calendar
   Renderização oficial do calendário semanal e modal de dia.
   O legado permanece carregado, mas estas funções passam a ser a fonte oficial.
*/
(function(){
  'use strict';
  const { State, Utils } = window.Flow;

  const Calendar = {
    weekOffset: 0,
    selectedDates: new Set(),
    selectionMode: false,

    priorityLabel(priority){
      return priority === 'high' ? 'Alta' : priority === 'low' ? 'Baixa' : 'Média';
    },
    repeatLabel(repeat){
      return repeat === 'daily' ? 'Todos os dias' : repeat === 'weekdays' ? 'Dias úteis' : repeat === 'weekly' ? 'Semanal' : 'Sem repetição';
    },
    getMonday(base = new Date()){
      const d = new Date(base);
      d.setHours(0,0,0,0);
      const day = d.getDay();
      d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
      return d;
    },
    visibleWeek(){
      const monday = this.getMonday(new Date());
      monday.setDate(monday.getDate() + (this.weekOffset * 7));
      return Array.from({length:7}, (_,i)=>Utils.addDays(monday,i));
    },
    rangeLabel(days){
      const start = days[0];
      const end = days[6];
      const month = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
      const dd = d => String(d.getDate()).padStart(2,'0');
      if(start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()){
        return `Semana · ${dd(start)}–${dd(end)} ${month[start.getMonth()]} ${start.getFullYear()}`;
      }
      if(start.getFullYear() === end.getFullYear()){
        return `Semana · ${dd(start)} ${month[start.getMonth()]} – ${dd(end)} ${month[end.getMonth()]} ${start.getFullYear()}`;
      }
      return `Semana · ${dd(start)} ${month[start.getMonth()]} ${start.getFullYear()} – ${dd(end)} ${month[end.getMonth()]} ${end.getFullYear()}`;
    },
    eventsForDate(dateStr){
      const S = State.ensure();
      const tasks = (S.tasks || [])
        .filter(task => task && task.due && String(task.due).slice(0,10) === dateStr)
        .map(task => ({
          type:'task',
          title:task.text || 'Tarefa',
          done:!!task.done,
          color:'var(--work)',
          raw:task,
          meta:`${task.cat || 'Tarefa'} · ${this.priorityLabel(task.prio)}${task.done ? ' · concluída' : ''}`
        }));

      const ruleTasks = (S.taskRules || [])
        .filter(rule => {
          if(!rule || rule.floating) return false;
          const base = Utils.parseDateOnly(rule.startDate || dateStr);
          const date = Utils.parseDateOnly(dateStr);
          if(!base || !date || date < base) return false;
          if(rule.repeat === 'daily') return true;
          if(rule.repeat === 'weekdays') return date.getDay() !== 0 && date.getDay() !== 6;
          if(rule.repeat === 'weekly') return date.getDay() === base.getDay();
          return dateStr === (rule.startDate || dateStr);
        })
        .map(rule => ({
          type:'rule',
          title:rule.text || 'Tarefa recorrente',
          done:(rule.doneDates || []).includes(dateStr),
          color:'var(--habits)',
          raw:rule,
          ruleId:rule.id,
          meta:`${rule.cat || 'Tarefa'} · ${this.repeatLabel(rule.repeat)}`
        }));

      const blocks = window.Flow.TimeBlocks.occurrences(1, dateStr)
        .filter(block => block.date === dateStr)
        .map(block => ({
          type:'block',
          title:block.task || 'Bloco de tempo',
          color:block.color || 'var(--study)',
          raw:block,
          meta:block.allDay ? 'Dia inteiro' : `${block.start || '--:--'}–${block.end || '--:--'}`
        }));

      const removed = window.Flow.TimeBlocks.removedForDate(dateStr)
        .map(skip => ({
          type:'removedBlock',
          title:skip.task || 'Bloco removido',
          color:'var(--muted)',
          raw:skip,
          meta:'Removido deste dia'
        }));

      return [...tasks, ...ruleTasks, ...blocks, ...removed];
    },
    ensureToolbar(){
      const card = document.getElementById('taskCalendarCard');
      if(!card || document.getElementById('flowCalendarSelectDaysBtn')) return;
      const head = card.querySelector('.task-calendar-head') || card.querySelector('.card-hdr') || card.firstElementChild;
      const row = document.createElement('div');
      row.className = 'flow-calendar-tools';
      row.innerHTML = `
        <button class="btn btn-xs" type="button" id="flowCalendarSelectDaysBtn">Selecionar dias</button>
        <button class="btn btn-xs" type="button" id="flowCalendarClearSelectionBtn" style="display:none">Limpar</button>
        <button class="btn btn-xs btn-p" type="button" id="flowCalendarRemoveBlocksBtn" style="display:none;background:var(--work);border-color:var(--work);color:#080810">Excluir bloco dos dias</button>
      `;
      head?.insertAdjacentElement('afterend', row);
      row.querySelector('#flowCalendarSelectDaysBtn').onclick = () => this.toggleSelectionMode();
      row.querySelector('#flowCalendarClearSelectionBtn').onclick = () => this.clearSelection();
      row.querySelector('#flowCalendarRemoveBlocksBtn').onclick = () => this.openBulkRemoveModal();
    },
    toggleSelectionMode(force){
      this.selectionMode = typeof force === 'boolean' ? force : !this.selectionMode;
      if(!this.selectionMode) this.selectedDates.clear();
      this.render();
    },
    clearSelection(){
      this.selectedDates.clear();
      this.render();
    },
    toggleDate(dateStr){
      if(this.selectedDates.has(dateStr)) this.selectedDates.delete(dateStr);
      else this.selectedDates.add(dateStr);
      this.render();
    },
    render(){
      const grid = document.getElementById('taskCalendarGrid');
      const label = document.getElementById('taskCalendarLabel');
      if(!grid || !label) return;
      this.ensureToolbar();

      const days = this.visibleWeek();
      label.textContent = this.rangeLabel(days);
      grid.className = 'task-calendar-grid weekly-stack-layout flow-calendar-v4';
      grid.innerHTML = '';

      const selectedCount = this.selectedDates.size;
      const selectBtn = document.getElementById('flowCalendarSelectDaysBtn');
      const clearBtn = document.getElementById('flowCalendarClearSelectionBtn');
      const removeBtn = document.getElementById('flowCalendarRemoveBlocksBtn');
      if(selectBtn) selectBtn.textContent = this.selectionMode ? `Selecionando (${selectedCount})` : 'Selecionar dias';
      if(clearBtn) clearBtn.style.display = this.selectionMode && selectedCount ? '' : 'none';
      if(removeBtn) removeBtn.style.display = this.selectionMode && selectedCount ? '' : 'none';

      const weekNames = ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'];
      const buildSection = (title, items, startIndex) => {
        const section = document.createElement('div');
        section.className = 'task-week-section';
        if(title){
          const titleEl = document.createElement('div');
          titleEl.className = 'task-weekend-title';
          titleEl.textContent = title;
          section.appendChild(titleEl);
        }
        const head = document.createElement('div');
        head.className = 'task-week-head' + (items.length === 2 ? ' two-cols' : '');
        items.forEach((_, idx)=>{
          const chip = document.createElement('div');
          chip.className = 'task-weekday-chip';
          chip.textContent = weekNames[startIndex + idx];
          head.appendChild(chip);
        });
        const row = document.createElement('div');
        row.className = 'task-week-row' + (items.length === 2 ? ' weekend' : '');
        items.forEach((d, idx)=>row.appendChild(this.makeDayButton(d, startIndex + idx)));
        section.appendChild(head);
        section.appendChild(row);
        return section;
      };

      grid.appendChild(buildSection('', days.slice(0,5), 0));
      grid.appendChild(buildSection('Final de semana', days.slice(5), 5));
    },
    makeDayButton(dateObj, idx){
      const dateStr = Utils.ymd(dateObj);
      const today = Utils.ymd() === dateStr;
      const events = this.eventsForDate(dateStr);
      const taskCount = events.filter(ev => ev.type === 'task' || ev.type === 'rule').length;
      const blockCount = events.filter(ev => ev.type === 'block').length;
      const removedCount = events.filter(ev => ev.type === 'removedBlock').length;
      const activeEvents = events.filter(ev => ev.type !== 'removedBlock');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'task-day weekly-card flow-calendar-day' + (idx >= 5 ? ' weekend-card' : '') + (today ? ' today' : '') + (activeEvents.length ? ' has-items' : '') + (taskCount ? ' has-tasks' : '') + (blockCount ? ' has-blocks' : '') + (this.selectedDates.has(dateStr) ? ' selected' : '') + (this.selectionMode ? ' selectable' : '');
      const preview = activeEvents.slice(0,3).map(ev => {
        const klass = ev.type === 'block' ? 'block' : ev.type === 'rule' ? 'rule' : 'task';
        const prefix = ev.type === 'block' ? '🕒 ' : ev.type === 'rule' ? '↻ ' : '• ';
        return `<div class="task-day-mini ${klass}">${prefix}${Utils.escape(ev.title)}</div>`;
      }).join('');
      const removedBadge = removedCount ? `<div class="task-day-mini removed">↩ ${removedCount} removido${removedCount>1?'s':''}</div>` : '';
      const dots = activeEvents.slice(0,5).map(ev => `<span class="task-day-dot" style="background:${Utils.escape(ev.color || 'var(--work)')}"></span>`).join('');
      btn.innerHTML = `
        <div class="task-day-topline">
          <span class="task-day-weeklabel">${['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'][idx]}</span>
          <span class="task-day-count">${activeEvents.length ? `${activeEvents.length} item${activeEvents.length>1?'s':''}` : ''}</span>
        </div>
        <div class="task-day-head"><span class="task-day-num">${dateObj.getDate()}</span></div>
        <div class="task-day-miniwrap">${preview || '<div class="task-day-empty">Nenhum item</div>'}${removedBadge}</div>
        <div class="task-day-dots">${dots}</div>`;
      btn.onclick = () => {
        if(this.selectionMode) this.toggleDate(dateStr);
        else this.openDay(dateStr);
      };
      return btn;
    },
    openDay(dateStr){
      let modal = document.getElementById('calendarDayModal');
      if(!modal){
        modal = document.createElement('div');
        modal.className = 'modal-bg';
        modal.id = 'calendarDayModal';
        modal.innerHTML = `<div class="modal flow-modal-fit"><div class="modal-title"><span id="calendarDayTitle">Detalhes do dia</span><button class="modal-close" onclick="closeModal('calendarDayModal')">×</button></div><div id="calendarDayContent"></div></div>`;
        document.body.appendChild(modal);
        modal.addEventListener('click', e=>{ if(e.target === modal) modal.classList.remove('open'); });
      }
      const title = document.getElementById('calendarDayTitle');
      const content = document.getElementById('calendarDayContent');
      const date = Utils.parseDateOnly(dateStr);
      if(title) title.textContent = date ? date.toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'long'}) : 'Detalhes do dia';
      if(!content) return;
      const events = this.eventsForDate(dateStr);
      const active = events.filter(ev => ev.type !== 'removedBlock');
      const removed = events.filter(ev => ev.type === 'removedBlock');
      if(!events.length){
        content.innerHTML = '<div class="empty">Nenhuma tarefa ou bloco de tempo neste dia.</div>';
        modal.classList.add('open');
        return;
      }
      let html = '';
      if(active.length){
        html += '<div class="day-modal-group-title">Itens do dia</div>';
        html += active.map(ev => {
          const icon = ev.type === 'block' ? '🕒' : ev.type === 'rule' ? '↻' : (ev.done ? '✅' : '📝');
          const blockAction = ev.type === 'block' ? `<button class="btn btn-xs" onclick="Flow.TimeBlocks.skipByKey('${Utils.escape(window.Flow.TimeBlocks.occurrenceKey(ev.raw, dateStr))}','${dateStr}');Flow.Calendar.openDay('${dateStr}')">Remover deste dia</button>` : '';
          return `<div class="day-modal-item"><div class="day-modal-title">${icon} ${Utils.escape(ev.title)}</div><div class="day-modal-meta">${Utils.escape(ev.meta || '')}</div>${blockAction ? `<div style="margin-top:10px">${blockAction}</div>` : ''}</div>`;
        }).join('');
      }
      if(removed.length){
        html += '<div class="day-modal-group-title">Blocos removidos</div>';
        html += removed.map(ev => `<div class="day-modal-item removed"><div class="day-modal-title">↩ ${Utils.escape(ev.title)}</div><div class="day-modal-meta">${Utils.escape(ev.meta || '')}</div><div style="margin-top:10px"><button class="btn btn-xs" onclick="Flow.TimeBlocks.restore('${Utils.escape(ev.raw.key)}');Flow.Calendar.openDay('${dateStr}')">Restaurar neste dia</button></div></div>`).join('');
      }
      content.innerHTML = html;
      modal.classList.add('open');
    },
    openBulkRemoveModal(){
      const dates = Array.from(this.selectedDates).sort();
      if(!dates.length) return;
      const blocks = [];
      dates.forEach(dateStr => {
        this.eventsForDate(dateStr).filter(ev=>ev.type === 'block').forEach(ev=>{
          blocks.push({date:dateStr, event:ev, key:window.Flow.TimeBlocks.occurrenceKey(ev.raw, dateStr)});
        });
      });
      let modal = document.getElementById('flowBulkRemoveModal');
      if(!modal){
        modal = document.createElement('div');
        modal.className = 'modal-bg';
        modal.id = 'flowBulkRemoveModal';
        modal.innerHTML = `<div class="modal flow-modal-fit"><div class="modal-title"><span>Excluir blocos selecionados</span><button class="modal-close" onclick="closeModal('flowBulkRemoveModal')">×</button></div><div id="flowBulkRemoveContent"></div></div>`;
        document.body.appendChild(modal);
        modal.addEventListener('click', e=>{ if(e.target === modal) modal.classList.remove('open'); });
      }
      const content = document.getElementById('flowBulkRemoveContent');
      if(!blocks.length){
        content.innerHTML = '<div class="empty">Os dias selecionados não possuem blocos de tempo ativos.</div>';
        modal.classList.add('open');
        return;
      }
      content.innerHTML = `<div class="section-muted" style="margin-bottom:12px">Marque os blocos que deseja remover apenas nos dias selecionados.</div>` + blocks.map((item, i)=>`
        <label class="flow-bulk-block-row">
          <input type="checkbox" data-flow-bulk-key="${Utils.escape(item.key)}" data-flow-date="${item.date}" checked>
          <span><strong>${Utils.escape(item.event.title)}</strong><small>${Utils.escape(item.date.split('-').reverse().join('/'))} · ${Utils.escape(item.event.meta || '')}</small></span>
        </label>`).join('') + `<button class="btn btn-p" style="width:100%;margin-top:12px;background:var(--work);border-color:var(--work);color:#080810" onclick="Flow.Calendar.confirmBulkRemove()">Confirmar remoção</button>`;
      modal.classList.add('open');
    },
    confirmBulkRemove(){
      const checks = Array.from(document.querySelectorAll('[data-flow-bulk-key]:checked'));
      checks.forEach(ch => window.Flow.TimeBlocks.skipByKey(ch.dataset.flowBulkKey, ch.dataset.flowDate));
      this.selectedDates.clear();
      this.selectionMode = false;
      window.Flow.Storage.commit('tasks');
      const modal = document.getElementById('flowBulkRemoveModal');
      if(modal) modal.classList.remove('open');
      this.render();
    },
    installCompatibility(){
      window.timeBlockOccurrences = (days, startDateStr) => window.Flow.TimeBlocks.occurrences(days, startDateStr);
      window.allCalendarEventsForDate = (dateStr) => Calendar.eventsForDate(dateStr);
      window.renderTaskCalendar = () => Calendar.render();
      window.openCalendarDay = (dateStr) => Calendar.openDay(dateStr);
      window.changeTaskCalendar = (delta) => { Calendar.weekOffset += Number(delta || 0); Calendar.render(); };
    }
  };

  window.Flow.Calendar = Calendar;
})();
