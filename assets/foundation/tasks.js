/* FLOW Foundation v12.0 — Tasks
   Módulo oficial de tarefas: criação, filtros, renderização, progresso e bridge.
   O legado permanece como fallback, mas as funções globais de tarefas passam por esta API.
*/
(function(){
  'use strict';
  const { State, Utils } = window.Flow;

  const Tasks = {
    filter:'all',

    priorityOrder(priority){
      return ({high:0, mid:1, low:2})[priority] ?? 1;
    },
    priorityLabel(priority){
      return priority === 'high' ? 'Alta' : priority === 'low' ? 'Baixa' : 'Média';
    },
    priorityBadge(priority){
      if(priority === 'high') return '<span class="badge badge-high">Alta</span>';
      if(priority === 'low') return '<span class="badge badge-low">Baixa</span>';
      return '<span class="badge badge-mid">Média</span>';
    },
    repeatLabel(repeat){
      return repeat === 'daily' ? 'Todos os dias' : repeat === 'weekdays' ? 'Dias úteis' : repeat === 'weekly' ? 'Semanal' : 'Sem repetição';
    },
    today(){ return Utils.ymd(); },
    formatDue(value){
      if(!value) return '';
      try{ if(typeof window.formatDue === 'function') return window.formatDue(value); }catch(e){}
      const date = String(value).slice(0,10).split('-').reverse().join('/');
      const time = String(value).slice(11,16);
      return time ? `${date} · ${time}` : date;
    },

    ensureUI(){
      const due = document.getElementById('taskDue');
      if(!due) return;

      due.style.display = 'none';

      let anchor = document.getElementById('taskAnchor');
      if(!anchor){
        const row = document.createElement('div');
        row.className = 'inp-row flow-task-anchor-row';
        row.style.marginBottom = '10px';
        row.innerHTML = `
          <select class="inp" id="taskAnchor" style="flex:1;font-size:13px">
            <option value="dated">Vincular a um dia específico</option>
            <option value="floating">Não vincular a um dia</option>
          </select>`;
        due.closest('.inp-row')?.insertAdjacentElement('afterend', row);
        anchor = row.querySelector('#taskAnchor');
      }

      let bindRow = document.getElementById('taskBindRow');
      if(!bindRow){
        bindRow = document.createElement('div');
        bindRow.className = 'inp-row task-bind-row';
        bindRow.id = 'taskBindRow';
        bindRow.style.marginBottom = '10px';
        bindRow.innerHTML = `
          <input class="inp" id="taskBindDate" type="date" style="flex:1;font-size:13px">
          <button class="btn btn-sm" type="button" id="taskBindDateBtn">Selecionar dia</button>`;
        anchor.closest('.inp-row')?.insertAdjacentElement('afterend', bindRow);
        const btn = bindRow.querySelector('#taskBindDateBtn');
        const input = bindRow.querySelector('#taskBindDate');
        btn?.addEventListener('click', ()=>{
          if(input?.showPicker){ try{ input.showPicker(); }catch(e){} }
          input?.focus(); input?.click();
        });
        input?.addEventListener('change', ()=>{
          if(!input.value) return;
          const dueEl = document.getElementById('taskDue');
          if(dueEl){
            const hhmm = String(dueEl.value || '').slice(11,16) || '09:00';
            dueEl.value = `${input.value}T${hhmm}`;
          }
        });
      }

      let repeat = document.getElementById('taskRepeat');
      if(!repeat){
        const row = document.createElement('div');
        row.className = 'inp-row flow-task-repeat-row';
        row.style.marginBottom = '10px';
        row.innerHTML = `
          <select class="inp" id="taskRepeat" style="flex:1;font-size:13px">
            <option value="none">Sem repetição</option>
            <option value="daily">Todos os dias</option>
            <option value="weekdays">Dias úteis</option>
            <option value="weekly">Semanal</option>
          </select>`;
        bindRow.insertAdjacentElement('afterend', row);
        repeat = row.querySelector('#taskRepeat');
      }

      let note = document.getElementById('taskNote');
      if(!note){
        const row = document.createElement('div');
        row.className = 'inp-row flow-task-note-row';
        row.style.marginBottom = '10px';
        row.innerHTML = `<input class="inp" id="taskNote" placeholder="Observação rápida" style="font-size:13px">`;
        repeat.closest('.inp-row')?.insertAdjacentElement('afterend', row);
        note = row.querySelector('#taskNote');
      }

      let hint = document.getElementById('taskBindHint');
      if(!hint){
        hint = document.createElement('div');
        hint.id = 'taskBindHint';
        hint.className = 'task-bind-hint section-muted';
        hint.style.margin = '-4px 0 10px';
        hint.textContent = 'Com data, a tarefa aparece no calendário. Sem data, ela fica apenas pendente.';
        note.closest('.inp-row')?.insertAdjacentElement('afterend', hint);
      }

      const sync = () => {
        const floating = anchor.value === 'floating';
        if(bindRow) bindRow.hidden = floating;
        if(due) due.disabled = floating;
        if(floating){ due.value = ''; const bind = document.getElementById('taskBindDate'); if(bind) bind.value = ''; }
      };
      anchor.onchange = sync;
      sync();
    },

    buildDue(){
      const anchor = document.getElementById('taskAnchor')?.value || 'dated';
      if(anchor === 'floating') return '';
      const bindDate = document.getElementById('taskBindDate')?.value || '';
      const dueRaw = document.getElementById('taskDue')?.value || '';
      if(bindDate){
        const hhmm = String(dueRaw || '').slice(11,16) || '09:00';
        return `${bindDate}T${hhmm}`;
      }
      return dueRaw || '';
    },

    add(){
      this.ensureUI();
      const input = document.getElementById('taskInp');
      const text = (input?.value || '').trim();
      if(!text) return false;

      const S = State.ensure();
      const cat = document.getElementById('taskCat')?.value || '💼 Trabalho';
      const prio = document.getElementById('taskPrio')?.value || 'mid';
      const repeat = document.getElementById('taskRepeat')?.value || 'none';
      const anchor = document.getElementById('taskAnchor')?.value || 'dated';
      const notes = (document.getElementById('taskNote')?.value || '').trim();
      const due = this.buildDue();
      const startDate = anchor === 'floating' ? '' : (String(due || '').slice(0,10) || document.getElementById('taskBindDate')?.value || '');

      if(repeat && repeat !== 'none'){
        S.taskRules.push({
          id:Date.now(), text, cat, prio, notes, repeat,
          startDate, floating:anchor === 'floating', doneDates:[]
        });
      }else{
        S.tasks.push({
          id:Date.now(), text, done:false, cat, prio,
          due:anchor === 'floating' ? '' : due,
          subtasks:[], notes, repeat:'none'
        });
      }

      if(input) input.value = '';
      ['taskDue','taskBindDate','taskNote'].forEach(id=>{ const el=document.getElementById(id); if(el) el.value=''; });
      const rep = document.getElementById('taskRepeat'); if(rep) rep.value='none';
      const anc = document.getElementById('taskAnchor'); if(anc) anc.value='dated';
      this.ensureUI();
      this.commit();
      return true;
    },

    setFilter(filter){
      this.filter = filter || 'all';
      window.taskFilter = this.filter;
      this.render();
    },
    filterFromButton(el){
      document.querySelectorAll('#taskFilters .chip').forEach(chip=>chip.classList.remove('on'));
      el?.classList?.add('on');
      this.setFilter(el?.dataset?.filter || 'all');
    },
    filteredTasks(){
      const S = State.ensure();
      let tasks = [...(S.tasks || [])];
      const f = this.filter || window.taskFilter || 'all';
      if(f === 'pending') tasks = tasks.filter(t=>!t.done);
      else if(f === 'done') tasks = tasks.filter(t=>t.done);
      else if(f === 'high') tasks = tasks.filter(t=>t.prio === 'high');
      else if(f.includes('💼') || f.includes('📚')) tasks = tasks.filter(t=>t.cat === f);
      return tasks.sort((a,b)=>this.priorityOrder(a.prio)-this.priorityOrder(b.prio) || String(a.due || '9999').localeCompare(String(b.due || '9999')) || String(a.text||'').localeCompare(String(b.text||''),'pt-BR'));
    },
    filteredRules(){
      const S = State.ensure();
      const f = this.filter || window.taskFilter || 'all';
      if(f === 'done') return [];
      let rules = [...(S.taskRules || [])];
      if(f === 'high') rules = rules.filter(r=>r.prio === 'high');
      else if(f.includes('💼') || f.includes('📚')) rules = rules.filter(r=>r.cat === f);
      return rules.sort((a,b)=>this.priorityOrder(a.prio)-this.priorityOrder(b.prio) || String(a.text||'').localeCompare(String(b.text||''),'pt-BR'));
    },

    groupTasks(tasks){
      const today = this.today();
      return [
        {key:'overdue', title:'Atrasadas', items:tasks.filter(t=>!t.done && t.due && String(t.due).slice(0,10) < today)},
        {key:'today', title:'Hoje', items:tasks.filter(t=>!t.done && t.due && String(t.due).slice(0,10) === today)},
        {key:'next', title:'Próximas', items:tasks.filter(t=>!t.done && t.due && String(t.due).slice(0,10) > today)},
        {key:'floating', title:'Pendentes sem dia', items:tasks.filter(t=>!t.done && !t.due)},
        {key:'done', title:'Concluídas', items:tasks.filter(t=>t.done)}
      ];
    },

    render(){
      this.ensureUI();
      const list = document.getElementById('tasksList');
      if(!list) return;
      const tasks = this.filteredTasks();
      const rules = this.filteredRules();
      list.innerHTML = '';

      if(!tasks.length && !rules.length){
        list.innerHTML = '<div class="empty">Nenhuma tarefa aqui.</div>';
        this.updateProgress();
        return;
      }

      const holder = document.createElement('div');
      holder.className = 'task-sections flow-tasks-foundation';
      this.groupTasks(tasks).forEach(group=>{
        if(!group.items.length) return;
        const sec = document.createElement('div');
        sec.className = 'task-group';
        sec.innerHTML = `<div class="task-group-h"><strong>${Utils.escape(group.title)}</strong><span>${group.items.length} item(ns)</span></div>`;
        group.items.forEach(task=>sec.appendChild(this.taskRow(task)));
        holder.appendChild(sec);
      });

      if(rules.length){
        const sec = document.createElement('div');
        sec.className = 'task-group';
        sec.innerHTML = `<div class="task-group-h"><strong>Recorrentes</strong><span>${rules.length} regra(s)</span></div>`;
        rules.forEach(rule=>sec.appendChild(this.ruleRow(rule)));
        holder.appendChild(sec);
      }

      list.appendChild(holder);
      this.updateProgress();
    },

    taskRow(task){
      const today = this.today();
      const overdue = task.due && String(task.due).slice(0,10) < today && !task.done;
      const row = document.createElement('div');
      row.className = 'task-item-premium' + (task.done ? ' done' : '');
      row.innerHTML = `
        <div class="li-check" data-task-action="toggle" data-task-id="${task.id}">${task.done?'✓':''}</div>
        <div class="task-main" data-task-action="open" data-task-id="${task.id}">
          <div class="task-topline"><div class="task-title-premium">${Utils.escape(task.text)}</div>${this.priorityBadge(task.prio)}</div>
          <div class="task-subline">
            <span class="task-meta-chip">${Utils.escape(task.cat || 'Tarefa')}</span>
            ${task.due ? `<span class="task-meta-chip">⏰ ${Utils.escape(this.formatDue(task.due))}</span>` : '<span class="task-meta-chip">pendente sem dia</span>'}
            ${overdue ? '<span class="task-meta-chip" style="border-color:rgba(248,113,113,.3);color:#f87171">Atrasada</span>' : ''}
          </div>
          ${task.notes ? `<div class="li-meta" style="margin-top:8px">${Utils.escape(String(task.notes).slice(0,120))}</div>` : ''}
        </div>
        <button class="li-del" data-task-action="delete" data-task-id="${task.id}">×</button>`;
      row.querySelector('[data-task-action="toggle"]').onclick = () => this.toggle(task.id);
      row.querySelector('[data-task-action="open"]').onclick = () => this.openDetail(task.id);
      row.querySelector('[data-task-action="delete"]').onclick = (e) => { e.stopPropagation(); this.remove(task.id); };
      return row;
    },

    ruleRow(rule){
      const row = document.createElement('div');
      row.className = 'task-item-premium task-rule-premium';
      row.innerHTML = `
        <div class="li-check" style="opacity:.5">↻</div>
        <div class="task-main" data-rule-action="open" data-rule-id="${rule.id}">
          <div class="task-topline"><div class="task-title-premium">${Utils.escape(rule.text)}</div>${this.priorityBadge(rule.prio)}</div>
          <div class="task-subline">
            <span class="task-meta-chip">${Utils.escape(rule.cat || 'Tarefa')}</span>
            <span class="task-meta-chip task-repeat-chip">↻ ${Utils.escape(this.repeatLabel(rule.repeat))}</span>
            ${rule.floating ? '<span class="task-meta-chip">sem dia fixo</span>' : `<span class="task-meta-chip">desde ${Utils.escape(rule.startDate || '—')}</span>`}
          </div>
          ${rule.notes ? `<div class="li-meta" style="margin-top:8px">${Utils.escape(String(rule.notes).slice(0,120))}</div>` : ''}
        </div>
        <button class="li-del" data-rule-action="delete" data-rule-id="${rule.id}">×</button>`;
      row.querySelector('[data-rule-action="open"]').onclick = () => this.openRuleDetail(rule.id);
      row.querySelector('[data-rule-action="delete"]').onclick = (e) => { e.stopPropagation(); this.removeRule(rule.id); };
      return row;
    },

    find(id){
      return State.ensure().tasks.find(t=>String(t.id) === String(id));
    },
    findRule(id){
      return State.ensure().taskRules.find(r=>String(r.id) === String(id));
    },
    toggle(id){
      const task = this.find(id);
      if(!task) return;
      task.done = !task.done;
      this.commit();
    },
    remove(id){
      const S = State.ensure();
      S.tasks = S.tasks.filter(t=>String(t.id) !== String(id));
      this.commit();
    },
    removeRule(id){
      const S = State.ensure();
      S.taskRules = S.taskRules.filter(r=>String(r.id) !== String(id));
      this.commit();
    },
    toggleRuleDone(ruleId, dateStr){
      const rule = this.findRule(ruleId);
      if(!rule || !dateStr) return;
      rule.doneDates = Array.isArray(rule.doneDates) ? rule.doneDates : [];
      if(rule.doneDates.includes(dateStr)) rule.doneDates = rule.doneDates.filter(d=>d!==dateStr);
      else rule.doneDates.push(dateStr);
      this.commit();
    },

    openDetail(id){
      const task = this.find(id);
      if(!task) return;
      this.ensureTaskModal();
      const modal = document.getElementById('taskModal');
      const content = document.getElementById('taskModalContent');
      if(!modal || !content) return;
      content.innerHTML = `
        <div class="day-modal-item">
          <div class="day-modal-title">${task.done?'✅':'📝'} ${Utils.escape(task.text)}</div>
          <div class="day-modal-meta">${Utils.escape(task.cat || 'Tarefa')} · ${this.priorityLabel(task.prio)}${task.due ? ' · ' + Utils.escape(this.formatDue(task.due)) : ' · sem dia'}</div>
          ${task.notes ? `<div class="li-meta" style="margin-top:10px">${Utils.escape(task.notes)}</div>` : ''}
        </div>
        <div class="btn-row">
          <button class="btn btn-sm" onclick="Flow.Tasks.toggle(${Number(task.id)});closeModal('taskModal')">${task.done?'Desmarcar':'Concluir'}</button>
          <button class="btn btn-sm" onclick="Flow.Tasks.remove(${Number(task.id)});closeModal('taskModal')">Excluir</button>
        </div>`;
      modal.classList.add('open');
    },
    openRuleDetail(id){
      const rule = this.findRule(id);
      if(!rule) return;
      this.ensureTaskModal();
      const modal = document.getElementById('taskModal');
      const content = document.getElementById('taskModalContent');
      if(!modal || !content) return;
      content.innerHTML = `
        <div class="day-modal-item">
          <div class="day-modal-title">↻ ${Utils.escape(rule.text)}</div>
          <div class="day-modal-meta">${Utils.escape(rule.cat || 'Tarefa')} · ${this.priorityLabel(rule.prio)} · ${this.repeatLabel(rule.repeat)}</div>
          ${rule.notes ? `<div class="li-meta" style="margin-top:10px">${Utils.escape(rule.notes)}</div>` : ''}
        </div>
        <div class="btn-row"><button class="btn btn-sm" onclick="Flow.Tasks.removeRule(${Number(rule.id)});closeModal('taskModal')">Excluir regra</button></div>`;
      modal.classList.add('open');
    },
    ensureTaskModal(){
      if(document.getElementById('taskModal')) return;
      const div = document.createElement('div');
      div.className = 'modal-bg';
      div.id = 'taskModal';
      div.innerHTML = '<div class="modal"><div class="modal-title">Detalhes da tarefa <button class="modal-close" onclick="closeModal(\'taskModal\')">×</button></div><div style="display:flex;flex-direction:column;gap:10px" id="taskModalContent"></div></div>';
      document.body.appendChild(div);
      div.addEventListener('click', e=>{ if(e.target === div) div.classList.remove('open'); });
    },

    updateProgress(){
      const S = State.ensure();
      const tasks = S.tasks || [];
      const done = tasks.filter(t=>t.done).length;
      const total = tasks.length;
      const pct = total ? (done/total*100) : 0;
      const today = this.today();
      const bar = document.getElementById('workBar'); if(bar) bar.style.width = pct + '%';
      const wd = document.getElementById('workDone'); if(wd) wd.textContent = done + ' concluída' + (done !== 1 ? 's' : '');
      const wt = document.getElementById('workTotal'); if(wt) wt.textContent = total + ' total';
      const cats = {};
      tasks.forEach(t=>{ cats[t.cat || 'Tarefa'] = (cats[t.cat || 'Tarefa'] || 0) + 1; });
      const catCounts = document.getElementById('catCounts');
      if(catCounts){
        catCounts.innerHTML = '';
        Object.entries(cats).forEach(([cat,count])=>{
          const span = document.createElement('span');
          span.className = 'badge badge-mid';
          span.textContent = `${cat}: ${count}`;
          catCounts.appendChild(span);
        });
      }
      const next = tasks.filter(t=>!t.done).sort((a,b)=>String(a.due || '9999').localeCompare(String(b.due || '9999')))[0];
      const nextWrap = document.getElementById('nextTaskWrap');
      const nextText = document.getElementById('nextTaskText');
      if(next && nextWrap && nextText){ nextWrap.style.display=''; nextText.textContent = next.text; }
      else if(nextWrap){ nextWrap.style.display='none'; }
      const map = {
        tsPending: total - done,
        tsToday: tasks.filter(t=>t.due && String(t.due).slice(0,10) === today).length,
        tsOverdue: tasks.filter(t=>t.due && String(t.due).slice(0,10) < today && !t.done).length,
        tsBlocks: (S.timeBlocks || []).length + (S.timeBlockRules || []).length
      };
      Object.entries(map).forEach(([id,value])=>{ const el=document.getElementById(id); if(el) el.textContent = value; });
    },

    commit(scope = 'tasks'){
      try{ window.Flow.Storage?.commit(scope); }
      catch(e){ try{ if(typeof window.save === 'function') window.save(); }catch(err){} }
      this.render();
      try{ window.Flow.Calendar?.render(); }catch(e){}
      try{ window.renderOverview?.(); }catch(e){}
      try{ window.renderCharts?.(); }catch(e){}
    },

    installCompatibility(){
      window.taskFilter = this.filter;
      window.addTask = () => this.add();
      window.renderTasks = () => this.render();
      window.filterTasks = (el) => this.filterFromButton(el);
      window.toggleTask = (id) => this.toggle(id);
      window.deleteTask = (id) => this.remove(id);
      window.updateWorkProgress = () => this.updateProgress();
      window.openTaskDetail = (id) => this.openDetail(id);
      window.toggleTaskRuleDone = (ruleId, dateStr) => this.toggleRuleDone(ruleId, dateStr);
    },

    boot(){
      this.ensureUI();
      this.installCompatibility();
      this.render();
    }
  };

  window.Flow.Tasks = Tasks;
})();
