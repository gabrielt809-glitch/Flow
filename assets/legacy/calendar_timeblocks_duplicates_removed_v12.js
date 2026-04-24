(function(){
  const saveFn = () => { if(typeof saveSafe==='function') saveSafe(); else if(typeof save==='function') save(); };

  function taskPriorityLabelSafe(pr){ return pr==='high'?'Alta':pr==='low'?'Baixa':'Média'; }
  function repeatLabelSafe(rep){ return rep==='weekdays' ? 'Dias úteis' : rep==='daily' ? 'Todos os dias' : rep==='weekly' ? 'Semanal' : 'Sem repetição'; }
  function parseDateOnly(str){ return str ? new Date(str + 'T00:00:00') : null; }

  function ensureTaskAnchorUi(){
    const due = document.getElementById('taskDue');
    if(!due) return;

    let anchor = document.getElementById('taskAnchor');
    if(!anchor){
      const row = document.createElement('div');
      row.className = 'inp-row';
      row.style.marginBottom = '10px';
      row.innerHTML = `
        <select class="inp" id="taskAnchor" style="flex:1;font-size:13px">
          <option value="dated">Vincular a um dia específico</option>
          <option value="floating">Não vincular a um dia</option>
        </select>
      `;
      due.closest('.inp-row')?.insertAdjacentElement('afterend', row);
      anchor = row.querySelector('#taskAnchor');
    }

    let bindRow = document.getElementById('taskBindRow');
    if(!bindRow){
      bindRow = document.createElement('div');
      bindRow.className = 'inp-row task-bind-row';
      bindRow.id = 'taskBindRow';
      bindRow.innerHTML = `
        <input class="inp" id="taskBindDate" type="date" style="flex:1;font-size:13px">
        <button class="btn btn-sm" type="button" id="taskBindDateBtn">Selecionar dia</button>
      `;
      const anchorRow = anchor.closest('.inp-row') || anchor.parentElement;
      anchorRow?.insertAdjacentElement('afterend', bindRow);

      const btn = bindRow.querySelector('#taskBindDateBtn');
      const input = bindRow.querySelector('#taskBindDate');
      btn?.addEventListener('click', ()=>{
        if(input?.showPicker){ try{ input.showPicker(); }catch(e){} }
        input?.focus();
        input?.click();
      });
      input?.addEventListener('change', ()=>{
        const dueEl = document.getElementById('taskDue');
        if(input.value && dueEl){
          const hhmm = (dueEl.value || '').slice(11,16) || '09:00';
          dueEl.value = `${input.value}T${hhmm}`;
        }
      });
    }

    let hint = document.getElementById('taskBindHint');
    if(!hint){
      hint = document.createElement('div');
      hint.id = 'taskBindHint';
      hint.className = 'task-bind-hint';
      hint.textContent = 'Quando a tarefa estiver vinculada, ela aparece no calendário no dia escolhido.';
      bindRow.insertAdjacentElement('afterend', hint);
    }

    const sync = () => {
      const dueEl = document.getElementById('taskDue');
      const bindDate = document.getElementById('taskBindDate');
      const floating = anchor.value === 'floating';
      bindRow.hidden = floating;
      hint.style.display = floating ? 'none' : 'block';
      if(dueEl){
        dueEl.style.display = 'none';
        dueEl.disabled = floating;
      }
      if(floating){
        if(dueEl) dueEl.value = '';
      }else if(bindDate && dueEl && dueEl.value){
        bindDate.value = dueEl.value.slice(0,10);
      }
    };

    anchor.onchange = sync;
    sync();
  }

  function buildTaskDue(anchorValue, bindDateValue, dueValue){
    if(anchorValue === 'floating') return '';
    if(bindDateValue){
      const hhmm = (dueValue || '').slice(11,16) || '09:00';
      return `${bindDateValue}T${hhmm}`;
    }
    return dueValue || '';
  }

  window.timeBlockOccurrences = function(days=90, startDateStr){
    const out = [];
    const todayStr = new Date().toISOString().slice(0,10);
    const start = parseDateOnly(startDateStr || todayStr) || new Date();
    const end = new Date(start); end.setDate(end.getDate() + days);

    (S.timeBlocks || []).forEach(tb=>{
      const baseStr = tb.date || todayStr;
      const base = parseDateOnly(baseStr);
      if(base && base >= start && base <= end){
        out.push({...tb, date: baseStr, repeat: tb.repeat || 'none'});
      }
    });

    (S.timeBlockRules || []).forEach(rule=>{
      const baseStr = rule.date || todayStr;
      const base = parseDateOnly(baseStr);
      if(!base) return;
      for(let current = new Date(start); current <= end; current.setDate(current.getDate()+1)){
        const d = new Date(current);
        if(d < base) continue;
        let include = false;
        if(rule.repeat === 'daily') include = true;
        else if(rule.repeat === 'weekdays') include = d.getDay() !== 0 && d.getDay() !== 6;
        else if(rule.repeat === 'weekly') include = d.getDay() === base.getDay();
        else include = d.toISOString().slice(0,10) === baseStr;
        if(include){
          out.push({
            id: `${rule.id}-${d.toISOString().slice(0,10)}`,
            start: rule.start,
            end: rule.end,
            task: rule.task,
            color: rule.color,
            date: d.toISOString().slice(0,10),
            repeat: rule.repeat,
            rule: true
          });
        }
      }
    });

    return out.sort((a,b)=>`${a.date}${a.start}`.localeCompare(`${b.date}${b.start}`));
  };

  window.allCalendarEventsForDate = function(dateStr){
    const tasks = (S.tasks || [])
      .filter(t => t.due && t.due.slice(0,10) === dateStr)
      .map(t => ({
        type:'task',
        title:t.text,
        meta:`${t.cat} · ${taskPriorityLabelSafe(t.prio)}${t.done?' · concluída':''}${t.due?' · '+(typeof formatDue==='function' ? formatDue(t.due) : t.due.slice(0,10)):''}`,
        done:t.done
      }));

    const ruleEvents = (S.taskRules || [])
      .filter(r => {
        if(r.floating) return false;
        const base = parseDateOnly(r.startDate || dateStr);
        const date = parseDateOnly(dateStr);
        if(!base || !date || date < base) return false;
        if(r.repeat === 'daily') return true;
        if(r.repeat === 'weekdays') return date.getDay() !== 0 && date.getDay() !== 6;
        if(r.repeat === 'weekly') return date.getDay() === base.getDay();
        return dateStr === (r.startDate || dateStr);
      })
      .map(r => ({
        type:'rule',
        ruleId:r.id,
        title:r.text,
        meta:`${r.cat} · ${taskPriorityLabelSafe(r.prio)} · ${repeatLabelSafe(r.repeat)}`,
        done:(r.doneDates || []).includes(dateStr)
      }));

    const blocks = (typeof window.timeBlockOccurrences === 'function' ? window.timeBlockOccurrences(120, dateStr) : [])
      .filter(b => b.date === dateStr)
      .map(b => ({
        type:'block',
        title:b.task,
        meta:`${b.start}–${b.end}${b.repeat && b.repeat!=='none' ? ' · ' + repeatLabelSafe(b.repeat) : ''}`
      }));

    return [...tasks, ...ruleEvents, ...blocks];
  };

  window.addTask = function(){
    const inp = document.getElementById('taskInp');
    const val = (inp?.value || '').trim();
    if(!val) return;

    const cat = document.getElementById('taskCat')?.value || '💼 Trabalho';
    const prio = document.getElementById('taskPrio')?.value || 'mid';
    const dueRaw = document.getElementById('taskDue')?.value || '';
    const bindDate = document.getElementById('taskBindDate')?.value || '';
    const repeat = document.getElementById('taskRepeat')?.value || 'none';
    const anchor = document.getElementById('taskAnchor')?.value || 'dated';
    const notes = document.getElementById('taskNote')?.value?.trim() || '';
    const due = buildTaskDue(anchor, bindDate, dueRaw);

    if(repeat !== 'none'){
      const startDate = anchor === 'floating' ? '' : ((bindDate || due.slice(0,10)) || '');
      S.taskRules = Array.isArray(S.taskRules) ? S.taskRules : [];
      S.taskRules.push({id:Date.now(), text:val, cat, prio, notes, repeat, startDate, floating: anchor==='floating', doneDates:[]});
    }else{
      S.tasks = Array.isArray(S.tasks) ? S.tasks : [];
      S.tasks.push({id:Date.now(), text:val, done:false, cat, prio, due: anchor==='floating' ? '' : due, subtasks:[], notes:'', repeat:'none'});
    }

    if(inp) inp.value = '';
    const dueEl = document.getElementById('taskDue');
    const bindEl = document.getElementById('taskBindDate');
    const noteEl = document.getElementById('taskNote');
    const repeatEl = document.getElementById('taskRepeat');
    const anchorEl = document.getElementById('taskAnchor');
    if(dueEl) dueEl.value = '';
    if(bindEl) bindEl.value = '';
    if(noteEl) noteEl.value = '';
    if(repeatEl) repeatEl.value = 'none';
    if(anchorEl) anchorEl.value = 'dated';
    ensureTaskAnchorUi();
    saveFn();
    if(typeof renderTasks==='function') renderTasks();
    if(typeof updateWorkProgress==='function') updateWorkProgress();
    if(typeof renderTaskCalendar==='function') renderTaskCalendar();
  };

  window.saveTB = function(){
    const start = document.getElementById('tbStart')?.value;
    const end = document.getElementById('tbEnd')?.value;
    const task = document.getElementById('tbTask')?.value.trim();
    const color = document.getElementById('tbColor')?.value || '#fb923c';
    const date = document.getElementById('tbDate')?.value || new Date().toISOString().slice(0,10);
    const repeat = document.getElementById('tbRepeat')?.value || 'none';
    if(!start || !end || !task) return;
    S.timeBlocks = Array.isArray(S.timeBlocks) ? S.timeBlocks : [];
    S.timeBlockRules = Array.isArray(S.timeBlockRules) ? S.timeBlockRules : [];
    if(repeat === 'none') S.timeBlocks.push({id:Date.now(), start, end, task, color, date, repeat});
    else S.timeBlockRules.push({id:Date.now(), start, end, task, color, date, repeat});
    saveFn();
    if(typeof renderTimeBlocks==='function') renderTimeBlocks();
    if(typeof renderTaskCalendar==='function') renderTaskCalendar();
    if(typeof closeModal==='function') closeModal('tbModal');
    const tbTask = document.getElementById('tbTask');
    if(tbTask) tbTask.value = '';
  };

  function boot(){
    ensureTaskAnchorUi();
    if(typeof renderTaskCalendar==='function') renderTaskCalendar();
  }
  document.addEventListener('DOMContentLoaded', boot);
  setTimeout(boot, 300);
  setTimeout(boot, 900);
})();

/* ===== SCRIPT BLOCK ORIGINAL CONSOLIDADO ===== */

(function(){
  const saveFn = () => { try{ if(typeof saveSafe==='function') saveSafe(); else if(typeof save==='function') save(); }catch(e){} };
  const ymd = (d)=>{
    const dt = new Date(d);
    const y = dt.getFullYear();
    const m = String(dt.getMonth()+1).padStart(2,'0');
    const day = String(dt.getDate()).padStart(2,'0');
    return `${y}-${m}-${day}`;
  };
  const parseDateOnly = (str)=>{
    if(!str) return null;
    const p=String(str).slice(0,10).split('-').map(Number);
    if(p.length!==3 || p.some(Number.isNaN)) return null;
    return new Date(p[0], p[1]-1, p[2]);
  };
  const escapeHtml=(s)=>String(s??'').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const prioLabel=(p)=>p==='high'?'Alta':p==='low'?'Baixa':'Média';
  const repeatLabel=(r)=>r==='daily'?'Todos os dias':r==='weekdays'?'Dias úteis':r==='weekly'?'Semanal':'Sem repetição';
  const formatShortDate=(dateStr)=>{ try{return parseDateOnly(dateStr).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'});}catch(e){return dateStr||'';} };
  const formatDueLabel=(v)=>{
    if(!v) return '';
    try{ if(typeof formatDueSafe==='function') return formatDueSafe(v); }catch(e){}
    const ds = String(v).slice(0,10);
    const hm = String(v).slice(11,16);
    return hm ? `${formatShortDate(ds)} · ${hm}` : formatShortDate(ds);
  };

  function fixPersistentMojibake(){
    try{
      window.S = window.S || {};
      const broken = (val)=> typeof val==='string' && /Ã|ð|â|�/.test(val);
      if(broken(S.userEmoji) || !S.userEmoji || String(S.userEmoji).length > 4){
        S.userEmoji = '😊';
      }
      const avatar = document.getElementById('avatarBtn');
      const bigAvatar = document.getElementById('bigAvatar');
      if(avatar) avatar.textContent = S.userEmoji || '😊';
      if(bigAvatar) bigAvatar.textContent = S.userEmoji || '😊';
      saveFn();
    }catch(e){}
  }

  window.timeBlockOccurrences = function(days=120, startDateStr){
    window.S = window.S || {};
    S.timeBlocks = Array.isArray(S.timeBlocks) ? S.timeBlocks : [];
    S.timeBlockRules = Array.isArray(S.timeBlockRules) ? S.timeBlockRules : [];
    const out=[];
    const todayStr = ymd(new Date());
    const start = parseDateOnly(startDateStr || todayStr) || new Date();
    const end = new Date(start); end.setDate(end.getDate()+Number(days||120));

    S.timeBlocks.forEach(tb=>{
      const baseStr = tb.date || todayStr;
      const base = parseDateOnly(baseStr);
      if(base && base >= start && base <= end){
        out.push({...tb, date:baseStr, repeat:tb.repeat||'none', rule:false});
      }
    });

    S.timeBlockRules.forEach(rule=>{
      const baseStr = rule.date || todayStr;
      const base = parseDateOnly(baseStr);
      if(!base) return;
      for(let cur = new Date(start); cur <= end; cur.setDate(cur.getDate()+1)){
        const d = new Date(cur);
        if(d < base) continue;
        const ds = ymd(d);
        let include=false;
        if(rule.repeat==='daily') include=true;
        else if(rule.repeat==='weekdays') include=d.getDay()!==0 && d.getDay()!==6;
        else if(rule.repeat==='weekly') include=d.getDay()===base.getDay();
        else include=ds===baseStr;
        if(include){
          out.push({id:`${rule.id}-${ds}`,start:rule.start,end:rule.end,task:rule.task,color:rule.color||'#c084fc',date:ds,repeat:rule.repeat||'none',rule:true});
        }
      }
    });

    return out.sort((a,b)=>`${a.date}${a.start||''}`.localeCompare(`${b.date}${b.start||''}`));
  };

  window.allCalendarEventsForDate = function(dateStr){
    window.S = window.S || {};
    S.tasks = Array.isArray(S.tasks) ? S.tasks : [];
    S.taskRules = Array.isArray(S.taskRules) ? S.taskRules : [];

    const tasks = S.tasks
      .filter(t => t && t.due && String(t.due).slice(0,10) === dateStr)
      .map(t => ({
        type:'task',
        title:t.text || 'Tarefa',
        done:!!t.done,
        color:'var(--work)',
        meta:`${t.cat || 'Tarefa'} · ${prioLabel(t.prio)}${t.done ? ' · concluída' : ''}${t.due ? ' · ' + formatDueLabel(t.due) : ''}`
      }));

    const ruleEvents = S.taskRules
      .filter(r => {
        if(!r || r.floating) return false;
        const base = parseDateOnly(r.startDate || dateStr);
        const date = parseDateOnly(dateStr);
        if(!base || !date || date < base) return false;
        if(r.repeat === 'daily') return true;
        if(r.repeat === 'weekdays') return date.getDay() !== 0 && date.getDay() !== 6;
        if(r.repeat === 'weekly') return date.getDay() === base.getDay();
        return dateStr === (r.startDate || dateStr);
      })
      .map(r => ({
        type:'rule',
        ruleId:r.id,
        title:r.text || 'Tarefa recorrente',
        done:(r.doneDates || []).includes(dateStr),
        color:'var(--habits)',
        meta:`${r.cat || 'Tarefa'} · ${prioLabel(r.prio)} · ${repeatLabel(r.repeat)}${(r.doneDates||[]).includes(dateStr) ? ' · concluída' : ''}`
      }));

    const blocks = window.timeBlockOccurrences(120, dateStr)
      .filter(b => b.date === dateStr)
      .map(b => ({
        type:'block',
        title:b.task || 'Bloco de tempo',
        done:false,
        color:b.color || 'var(--study)',
        meta:`${b.start || '--:--'}–${b.end || '--:--'}${b.repeat && b.repeat !== 'none' ? ' · ' + repeatLabel(b.repeat) : ''}`
      }));

    return [...tasks, ...ruleEvents, ...blocks];
  };

  window.openCalendarDay = function(dateStr){
    let modal = document.getElementById('calendarDayModal');
    if(!modal){
      modal = document.createElement('div');
      modal.className = 'modal-bg';
      modal.id = 'calendarDayModal';
      modal.innerHTML = `
        <div class="modal">
          <div class="modal-title">
            <span id="calendarDayTitle">Detalhes do dia</span>
            <button class="modal-close" onclick="closeModal('calendarDayModal')">×</button>
          </div>
          <div id="calendarDayContent"></div>
        </div>`;
      document.body.appendChild(modal);
      modal.addEventListener('click', e => { if(e.target===modal) modal.classList.remove('open'); });
    }
    const title = document.getElementById('calendarDayTitle');
    const content = document.getElementById('calendarDayContent');
    const dayDate = parseDateOnly(dateStr);
    const events = window.allCalendarEventsForDate(dateStr);
    if(title) title.textContent = dayDate ? dayDate.toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'long'}) : 'Detalhes do dia';
    if(!content) return;
    if(!events.length){
      content.innerHTML = '<div class="empty">Nenhuma tarefa ou bloco de tempo neste dia.</div>';
      modal.classList.add('open');
      return;
    }
    const tasks = events.filter(ev => ev.type==='task' || ev.type==='rule');
    const blocks = events.filter(ev => ev.type==='block');
    let html='';
    if(tasks.length){
      html += '<div class="day-modal-group-title">Tarefas</div>';
      html += tasks.map(ev => `<div class="day-modal-item"><div class="day-modal-title">${ev.type==='rule'?'↻':(ev.done?'✅':'📝')} ${escapeHtml(ev.title)}</div><div class="day-modal-meta">${escapeHtml(ev.meta)}</div></div>`).join('');
    }
    if(blocks.length){
      html += '<div class="day-modal-group-title">Blocos de tempo</div>';
      html += blocks.map(ev => `<div class="day-modal-item"><div class="day-modal-title">🕒 ${escapeHtml(ev.title)}</div><div class="day-modal-meta">${escapeHtml(ev.meta)}</div></div>`).join('');
    }
    content.innerHTML = html;
    modal.classList.add('open');
  };

  window.renderTaskCalendar = function(){
    const grid = document.getElementById('taskCalendarGrid');
    const label = document.getElementById('taskCalendarLabel');
    if(!grid || !label) return;

    const offset = Number(window.taskCalendarOffset || 0);
    const base = new Date();
    base.setDate(1);
    base.setMonth(base.getMonth() + offset);
    const month = base.getMonth();
    const year = base.getFullYear();
    const monthName = base.toLocaleDateString('pt-BR',{month:'long',year:'numeric'});
    label.textContent = monthName.charAt(0).toUpperCase() + monthName.slice(1);

    grid.innerHTML = '';
    ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].forEach(name=>{
      const h=document.createElement('div');
      h.className='task-calendar-weekday';
      h.textContent=name;
      grid.appendChild(h);
    });

    const first = new Date(year,month,1);
    const startPad = first.getDay();
    const daysInMonth = new Date(year, month+1, 0).getDate();
    const todayStr = ymd(new Date());

    for(let i=0;i<startPad;i++){
      const spacer=document.createElement('div');
      spacer.className='task-calendar-spacer';
      grid.appendChild(spacer);
    }

    for(let day=1; day<=daysInMonth; day++){
      const current = new Date(year, month, day);
      const dateStr = ymd(current);
      const events = window.allCalendarEventsForDate(dateStr);
      const taskCount = events.filter(ev=>ev.type==='task' || ev.type==='rule').length;
      const blockCount = events.filter(ev=>ev.type==='block').length;
      const total = events.length;

      const btn=document.createElement('button');
      btn.type='button';
      btn.className='task-day' + (dateStr===todayStr?' today':'') + (total?' has-items':'') + (taskCount?' has-tasks':'') + (blockCount?' has-blocks':'');

      const preview = events.slice(0,3).map(ev=>{
        const klass = ev.type==='block' ? 'block' : ev.type==='rule' ? 'rule' : 'task';
        const prefix = ev.type==='block' ? '🕒 ' : ev.type==='rule' ? '↻ ' : '• ';
        return `<div class="task-day-mini ${klass}">${prefix}${escapeHtml(ev.title)}</div>`;
      }).join('');

      const dots = events.slice(0,5).map(ev => `<span class="task-day-dot" style="background:${escapeHtml(ev.color || (ev.type==='block'?'var(--study)':'var(--work)'))}"></span>`).join('');
      btn.innerHTML = `
        <div class="task-day-head">
          <span class="task-day-num">${day}</span>
          <span class="task-day-count">${total ? `${total} item${total>1?'s':''}` : ''}</span>
        </div>
        <div class="task-day-miniwrap">${preview || '<div class="task-day-empty">—</div>'}</div>
        <div class="task-day-dots">${dots}</div>`;
      btn.onclick = ()=>window.openCalendarDay(dateStr);
      grid.appendChild(btn);
    }
  };

  window.saveTB = function(){
    const start = document.getElementById('tbStart')?.value;
    const end = document.getElementById('tbEnd')?.value;
    const task = document.getElementById('tbTask')?.value?.trim();
    const color = document.getElementById('tbColor')?.value || '#fb923c';
    const date = document.getElementById('tbDate')?.value || ymd(new Date());
    const repeat = document.getElementById('tbRepeat')?.value || 'none';
    if(!start || !end || !task) return;
    window.S = window.S || {};
    S.timeBlocks = Array.isArray(S.timeBlocks) ? S.timeBlocks : [];
    S.timeBlockRules = Array.isArray(S.timeBlockRules) ? S.timeBlockRules : [];
    if(repeat === 'none') S.timeBlocks.push({id:Date.now(), start, end, task, color, date, repeat:'none'});
    else S.timeBlockRules.push({id:Date.now(), start, end, task, color, date, repeat});
    saveFn();
    try{ if(typeof renderTimeBlocks==='function') renderTimeBlocks(); }catch(e){}
    try{ window.renderTaskCalendar(); }catch(e){}
    try{ if(typeof closeModal==='function') closeModal('tbModal'); }catch(e){}
    const tbTask = document.getElementById('tbTask'); if(tbTask) tbTask.value='';
  };

  function bootFixes(){
    fixPersistentMojibake();
    try{ if(typeof window.renderTaskCalendar==='function') window.renderTaskCalendar(); }catch(e){}
  }
  document.addEventListener('DOMContentLoaded', bootFixes);
  setTimeout(bootFixes, 250);
  setTimeout(bootFixes, 900);
})();

/* ===== SCRIPT BLOCK ORIGINAL CONSOLIDADO ===== */

(function(){
  const weekNames = ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'];
  const fullWeekNames = ['segunda','terça','quarta','quinta','sexta','sábado','domingo'];
  const monthNames = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
  const ymd = (d)=>{
    const dt = new Date(d);
    return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
  };
  const escapeHtml=(s)=>String(s??'').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));

  function getMonday(baseDate){
    const d = new Date(baseDate);
    d.setHours(0,0,0,0);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    return d;
  }

  function buildRangeLabel(start, end){
    const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
    if(sameMonth){
      return `${String(start.getDate()).padStart(2,'0')}–${String(end.getDate()).padStart(2,'0')} ${monthNames[start.getMonth()]} ${start.getFullYear()}`;
    }
    if(start.getFullYear() === end.getFullYear()){
      return `${String(start.getDate()).padStart(2,'0')} ${monthNames[start.getMonth()]} – ${String(end.getDate()).padStart(2,'0')} ${monthNames[end.getMonth()]} ${start.getFullYear()}`;
    }
    return `${String(start.getDate()).padStart(2,'0')} ${monthNames[start.getMonth()]} ${start.getFullYear()} – ${String(end.getDate()).padStart(2,'0')} ${monthNames[end.getMonth()]} ${end.getFullYear()}`;
  }

  function makeDayButton(dateObj, idx){
    const dateStr = ymd(dateObj);
    const todayStr = ymd(new Date());
    const events = typeof window.allCalendarEventsForDate === 'function' ? window.allCalendarEventsForDate(dateStr) : [];
    const taskCount = events.filter(ev => ev.type === 'task' || ev.type === 'rule').length;
    const blockCount = events.filter(ev => ev.type === 'block').length;
    const total = events.length;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'task-day weekly-card' + (idx >= 5 ? ' weekend-card' : '') + (dateStr === todayStr ? ' today' : '') + (total ? ' has-items' : '') + (taskCount ? ' has-tasks' : '') + (blockCount ? ' has-blocks' : '');

    const preview = events.slice(0,3).map(ev => {
      const klass = ev.type === 'block' ? 'block' : ev.type === 'rule' ? 'rule' : 'task';
      const prefix = ev.type === 'block' ? '🕒 ' : ev.type === 'rule' ? '↻ ' : '• ';
      return `<div class="task-day-mini ${klass}">${prefix}${escapeHtml(ev.title)}</div>`;
    }).join('');

    const dots = events.slice(0,5).map(ev => `<span class="task-day-dot" style="background:${escapeHtml(ev.color || (ev.type==='block'?'var(--study)':'var(--work)'))}"></span>`).join('');

    btn.innerHTML = `
      <div class="task-day-topline">
        <span class="task-day-weeklabel">${weekNames[idx]}</span>
        <span class="task-day-count">${total ? `${total} item${total>1?'s':''}` : ''}</span>
      </div>
      <div class="task-day-head">
        <span class="task-day-num">${dateObj.getDate()}</span>
      </div>
      <div class="task-day-miniwrap">${preview || '<div class="task-day-empty">Nenhum item</div>'}</div>
      <div class="task-day-dots">${dots}</div>`;
    btn.onclick = () => {
      if(typeof window.openCalendarDay === 'function') window.openCalendarDay(dateStr);
    };
    return btn;
  }

  window.changeTaskCalendar = function(delta){
    window.taskCalendarWeekOffset = Number(window.taskCalendarWeekOffset || 0) + Number(delta || 0);
    if(typeof window.renderTaskCalendar === 'function') window.renderTaskCalendar();
  };

  window.renderTaskCalendar = function(){
    const grid = document.getElementById('taskCalendarGrid');
    const label = document.getElementById('taskCalendarLabel');
    if(!grid || !label) return;

    const offset = Number(window.taskCalendarWeekOffset || 0);
    const monday = getMonday(new Date());
    monday.setDate(monday.getDate() + (offset * 7));
    const days = [];
    for(let i=0;i<7;i++){
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      days.push(d);
    }
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    label.textContent = 'Semana · ' + buildRangeLabel(monday, sunday);

    grid.className = 'task-calendar-grid weekly-stack-layout';
    grid.innerHTML = '';

    const weekSection = document.createElement('div');
    weekSection.className = 'task-week-section';
    const weekHead = document.createElement('div');
    weekHead.className = 'task-week-head';
    weekNames.slice(0,5).forEach(name=>{
      const chip = document.createElement('div');
      chip.className = 'task-weekday-chip';
      chip.textContent = name;
      weekHead.appendChild(chip);
    });
    const weekRow = document.createElement('div');
    weekRow.className = 'task-week-row';
    days.slice(0,5).forEach((d, idx)=>weekRow.appendChild(makeDayButton(d, idx)));
    weekSection.appendChild(weekHead);
    weekSection.appendChild(weekRow);

    const weekendSection = document.createElement('div');
    weekendSection.className = 'task-week-section';
    const weekendTitle = document.createElement('div');
    weekendTitle.className = 'task-weekend-title';
    weekendTitle.textContent = 'Final de semana';
    const weekendHead = document.createElement('div');
    weekendHead.className = 'task-week-head two-cols';
    weekNames.slice(5).forEach(name=>{
      const chip = document.createElement('div');
      chip.className = 'task-weekday-chip';
      chip.textContent = name;
      weekendHead.appendChild(chip);
    });
    const weekendRow = document.createElement('div');
    weekendRow.className = 'task-week-row weekend';
    days.slice(5).forEach((d, idx)=>weekendRow.appendChild(makeDayButton(d, idx + 5)));
    weekendSection.appendChild(weekendTitle);
    weekendSection.appendChild(weekendHead);
    weekendSection.appendChild(weekendRow);

    grid.appendChild(weekSection);
    grid.appendChild(weekendSection);
  };

  function boot(){
    if(typeof window.renderTaskCalendar === 'function') window.renderTaskCalendar();
  }
  document.addEventListener('DOMContentLoaded', boot);
  setTimeout(boot, 250);
  setTimeout(boot, 900);
})();

/* ===== SCRIPT BLOCK ORIGINAL CONSOLIDADO ===== */

(function(){
  const saveFn = () => { try{ if(typeof saveSafe==='function') saveSafe(); else if(typeof save==='function') save(); }catch(e){} };
  const ymd = (d)=>{
    const dt = new Date(d);
    return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
  };
  const parseDateOnly = (str)=>{
    if(!str) return null;
    const p = String(str).slice(0,10).split('-').map(Number);
    if(p.length!==3 || p.some(Number.isNaN)) return null;
    return new Date(p[0], p[1]-1, p[2]);
  };
  const escapeHtml = (s)=>String(s??'').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const prioLabel = (p)=>p==='high'?'Alta':p==='low'?'Baixa':'Média';
  const repeatLabel = (r)=>r==='daily'?'Todos os dias':r==='weekdays'?'Dias úteis':r==='weekly'?'Semanal':'Sem repetição';
  const normalizeDateTime = (date, time)=>{
    if(!date) return '';
    const hhmm = time || '09:00';
    return `${date}T${hhmm}`;
  };
  const getTimeFromDue = (due)=> String(due || '').slice(11,16) || '09:00';

  function ensureState(){
    window.S = window.S || {};
    S.tasks = Array.isArray(S.tasks) ? S.tasks : [];
    S.taskRules = Array.isArray(S.taskRules) ? S.taskRules : [];
    S.timeBlocks = Array.isArray(S.timeBlocks) ? S.timeBlocks : [];
    S.timeBlockRules = Array.isArray(S.timeBlockRules) ? S.timeBlockRules : [];
  }

  window.timeBlockOccurrences = function(days=120, startDateStr){
    ensureState();
    const out = [];
    const todayStr = ymd(new Date());
    const start = parseDateOnly(startDateStr || todayStr) || new Date();
    const end = new Date(start);
    end.setDate(end.getDate() + Number(days || 120));

    S.timeBlocks.forEach(tb=>{
      const baseStr = tb.date || todayStr;
      const base = parseDateOnly(baseStr);
      if(base && base >= start && base <= end){
        out.push({
          ...tb,
          id: tb.id,
          sourceId: tb.id,
          sourceType: 'timeBlock',
          date: baseStr,
          repeat: tb.repeat || 'none',
          rule:false
        });
      }
    });

    S.timeBlockRules.forEach(rule=>{
      const baseStr = rule.date || todayStr;
      const base = parseDateOnly(baseStr);
      if(!base) return;
      for(let cur = new Date(start); cur <= end; cur.setDate(cur.getDate()+1)){
        const d = new Date(cur);
        if(d < base) continue;
        const ds = ymd(d);
        let include = false;
        if(rule.repeat === 'daily') include = true;
        else if(rule.repeat === 'weekdays') include = d.getDay() !== 0 && d.getDay() !== 6;
        else if(rule.repeat === 'weekly') include = d.getDay() === base.getDay();
        else include = ds === baseStr;

        if(include){
          out.push({
            id:`${rule.id}-${ds}`,
            sourceId: rule.id,
            sourceType:'timeBlockRule',
            start: rule.start,
            end: rule.end,
            task: rule.task,
            color: rule.color || '#c084fc',
            date: ds,
            repeat: rule.repeat || 'none',
            rule:true
          });
        }
      }
    });

    return out.sort((a,b)=>`${a.date}${a.start||''}`.localeCompare(`${b.date}${b.start||''}`));
  };

  window.allCalendarEventsForDate = function(dateStr){
    ensureState();

    const tasks = S.tasks
      .filter(t => t && t.due && String(t.due).slice(0,10) === dateStr)
      .map(t => ({
        type:'task',
        sourceId:t.id,
        title:t.text || 'Tarefa',
        done:!!t.done,
        color:'var(--work)',
        meta:`${t.cat || 'Tarefa'} · ${prioLabel(t.prio)}${t.done ? ' · concluída' : ''}${t.due ? ' · ' + (String(t.due).slice(11,16) || 'dia todo') : ''}`
      }));

    const ruleEvents = S.taskRules
      .filter(r => {
        if(!r || r.floating) return false;
        const base = parseDateOnly(r.startDate || dateStr);
        const date = parseDateOnly(dateStr);
        if(!base || !date || date < base) return false;
        if(r.repeat === 'daily') return true;
        if(r.repeat === 'weekdays') return date.getDay() !== 0 && date.getDay() !== 6;
        if(r.repeat === 'weekly') return date.getDay() === base.getDay();
        return dateStr === (r.startDate || dateStr);
      })
      .map(r => ({
        type:'rule',
        sourceId:r.id,
        ruleId:r.id,
        title:r.text || 'Tarefa recorrente',
        done:(r.doneDates || []).includes(dateStr),
        color:'var(--habits)',
        meta:`${r.cat || 'Tarefa'} · ${prioLabel(r.prio)} · ${repeatLabel(r.repeat)}${(r.doneDates||[]).includes(dateStr) ? ' · concluída' : ''}`
      }));

    const blocks = window.timeBlockOccurrences(120, dateStr)
      .filter(b => b.date === dateStr)
      .map(b => ({
        type:'block',
        sourceId:b.sourceId || b.id,
        sourceType:b.rule ? 'timeBlockRule' : 'timeBlock',
        occurrenceDate:dateStr,
        title:b.task || 'Bloco de tempo',
        done:false,
        color:b.color || 'var(--study)',
        meta:`${b.start || '--:--'}–${b.end || '--:--'}${b.repeat && b.repeat !== 'none' ? ' · ' + repeatLabel(b.repeat) : ''}`
      }));

    return [...tasks, ...ruleEvents, ...blocks];
  };

  function refreshCalendarAndLists(){
    saveFn();
    try{ if(typeof renderTasks === 'function') renderTasks(); }catch(e){}
    try{ if(typeof renderTimeBlocks === 'function') renderTimeBlocks(); }catch(e){}
    try{ if(typeof updateWorkProgress === 'function') updateWorkProgress(); }catch(e){}
    try{ if(typeof renderOverview === 'function') renderOverview(); }catch(e){}
    try{ if(typeof renderTaskCalendar === 'function') renderTaskCalendar(); }catch(e){}
  }

  function getTaskById(id){ return S.tasks.find(t => String(t.id) === String(id)); }
  function getRuleById(id){ return S.taskRules.find(r => String(r.id) === String(id)); }
  function getBlockById(id){ return S.timeBlocks.find(b => String(b.id) === String(id)); }
  function getBlockRuleById(id){ return S.timeBlockRules.find(b => String(b.id) === String(id)); }

  function ensureEditModal(){
    let modal = document.getElementById('calendarEditModal');
    if(modal) return modal;
    modal = document.createElement('div');
    modal.className = 'modal-bg';
    modal.id = 'calendarEditModal';
    modal.innerHTML = `
      <div class="modal">
        <div class="modal-title">
          <span id="calendarEditTitle">Editar item</span>
          <button class="modal-close" onclick="closeModal('calendarEditModal')">×</button>
        </div>
        <div id="calendarEditContent"></div>
      </div>
    `;
    document.body.appendChild(modal);
    modal.addEventListener('click', e => { if(e.target === modal) modal.classList.remove('open'); });
    return modal;
  }

  function openEditModal(title, html){
    const modal = ensureEditModal();
    const titleEl = document.getElementById('calendarEditTitle');
    const contentEl = document.getElementById('calendarEditContent');
    if(titleEl) titleEl.textContent = title;
    if(contentEl) contentEl.innerHTML = html;
    modal.classList.add('open');
  }

  window.openCalendarTaskEditor = function(taskId, dateStr){
    ensureState();
    const task = getTaskById(taskId);
    if(!task) return;
    const date = String(task.due || '').slice(0,10) || dateStr || ymd(new Date());
    const time = getTimeFromDue(task.due);
    const checked = task.done ? 'checked' : '';

    openEditModal('Editar tarefa', `
      <div class="calendar-edit-grid">
        <div class="full">
          <label class="calendar-edit-label">Título</label>
          <input class="inp" id="calEditTaskText" value="${escapeHtml(task.text || '')}">
        </div>
        <div>
          <label class="calendar-edit-label">Data</label>
          <input class="inp" id="calEditTaskDate" type="date" value="${escapeHtml(date)}">
        </div>
        <div>
          <label class="calendar-edit-label">Hora</label>
          <input class="inp" id="calEditTaskTime" type="time" value="${escapeHtml(time)}">
        </div>
        <div>
          <label class="calendar-edit-label">Categoria</label>
          <select class="inp" id="calEditTaskCat">
            ${['💼 Trabalho','📚 Estudos','🏠 Pessoal','💪 Saúde'].map(c=>`<option ${c===(task.cat||'')?'selected':''}>${c}</option>`).join('')}
          </select>
        </div>
        <div>
          <label class="calendar-edit-label">Prioridade</label>
          <select class="inp" id="calEditTaskPrio">
            <option value="high" ${task.prio==='high'?'selected':''}>🔴 Alta</option>
            <option value="mid" ${task.prio==='mid'?'selected':''}>🟡 Média</option>
            <option value="low" ${task.prio==='low'?'selected':''}>🟢 Baixa</option>
          </select>
        </div>
        <div class="full">
          <label class="calendar-edit-label">Observações</label>
          <textarea class="inp" id="calEditTaskNotes" rows="3">${escapeHtml(task.notes || '')}</textarea>
        </div>
        <label class="overview-toggle full" style="margin-top:2px">
          <input type="checkbox" id="calEditTaskDone" ${checked}>
          <span>Marcar como concluída</span>
        </label>
      </div>
      <div class="calendar-edit-actions">
        <button class="btn btn-p" style="background:var(--work);border-color:var(--work);color:#080810" onclick="saveCalendarTaskEdit(${Number(task.id)})">Salvar</button>
        <button class="btn calendar-edit-danger" onclick="deleteCalendarTaskEdit(${Number(task.id)}, '${escapeHtml(dateStr || date)}')">Excluir</button>
      </div>
    `);
  };

  window.saveCalendarTaskEdit = function(taskId){
    const task = getTaskById(taskId);
    if(!task) return;
    const text = document.getElementById('calEditTaskText')?.value.trim();
    const date = document.getElementById('calEditTaskDate')?.value;
    const time = document.getElementById('calEditTaskTime')?.value || '09:00';
    if(!text || !date) return;
    task.text = text;
    task.due = normalizeDateTime(date, time);
    task.cat = document.getElementById('calEditTaskCat')?.value || task.cat;
    task.prio = document.getElementById('calEditTaskPrio')?.value || task.prio;
    task.notes = document.getElementById('calEditTaskNotes')?.value.trim() || '';
    task.done = !!document.getElementById('calEditTaskDone')?.checked;
    refreshCalendarAndLists();
    try{ closeModal('calendarEditModal'); }catch(e){}
    window.openCalendarDay(date);
  };

  window.deleteCalendarTaskEdit = function(taskId, dateStr){
    if(!confirm('Excluir esta tarefa?')) return;
    S.tasks = S.tasks.filter(t => String(t.id) !== String(taskId));
    refreshCalendarAndLists();
    try{ closeModal('calendarEditModal'); }catch(e){}
    window.openCalendarDay(dateStr);
  };

  window.openCalendarRuleEditor = function(ruleId, dateStr){
    ensureState();
    const rule = getRuleById(ruleId);
    if(!rule) return;
    const startDate = rule.startDate || dateStr || ymd(new Date());
    openEditModal('Editar tarefa recorrente', `
      <div class="calendar-edit-grid">
        <div class="full">
          <label class="calendar-edit-label">Título</label>
          <input class="inp" id="calEditRuleText" value="${escapeHtml(rule.text || '')}">
        </div>
        <div>
          <label class="calendar-edit-label">Começa em</label>
          <input class="inp" id="calEditRuleDate" type="date" value="${escapeHtml(startDate)}">
        </div>
        <div>
          <label class="calendar-edit-label">Repetição</label>
          <select class="inp" id="calEditRuleRepeat">
            <option value="daily" ${rule.repeat==='daily'?'selected':''}>Todos os dias</option>
            <option value="weekdays" ${rule.repeat==='weekdays'?'selected':''}>Dias úteis</option>
            <option value="weekly" ${rule.repeat==='weekly'?'selected':''}>Semanal</option>
          </select>
        </div>
        <div>
          <label class="calendar-edit-label">Categoria</label>
          <select class="inp" id="calEditRuleCat">
            ${['💼 Trabalho','📚 Estudos','🏠 Pessoal','💪 Saúde'].map(c=>`<option ${c===(rule.cat||'')?'selected':''}>${c}</option>`).join('')}
          </select>
        </div>
        <div>
          <label class="calendar-edit-label">Prioridade</label>
          <select class="inp" id="calEditRulePrio">
            <option value="high" ${rule.prio==='high'?'selected':''}>🔴 Alta</option>
            <option value="mid" ${rule.prio==='mid'?'selected':''}>🟡 Média</option>
            <option value="low" ${rule.prio==='low'?'selected':''}>🟢 Baixa</option>
          </select>
        </div>
        <div class="full">
          <label class="calendar-edit-label">Observações</label>
          <textarea class="inp" id="calEditRuleNotes" rows="3">${escapeHtml(rule.notes || '')}</textarea>
        </div>
      </div>
      <div class="calendar-edit-actions">
        <button class="btn btn-p" style="background:var(--habits);border-color:var(--habits);color:#080810" onclick="saveCalendarRuleEdit(${Number(rule.id)}, '${escapeHtml(dateStr || startDate)}')">Salvar série</button>
        <button class="btn calendar-edit-danger" onclick="deleteCalendarRuleEdit(${Number(rule.id)}, '${escapeHtml(dateStr || startDate)}')">Excluir série</button>
      </div>
    `);
  };

  window.saveCalendarRuleEdit = function(ruleId, dateStr){
    const rule = getRuleById(ruleId);
    if(!rule) return;
    const text = document.getElementById('calEditRuleText')?.value.trim();
    const date = document.getElementById('calEditRuleDate')?.value;
    if(!text || !date) return;
    rule.text = text;
    rule.startDate = date;
    rule.repeat = document.getElementById('calEditRuleRepeat')?.value || rule.repeat;
    rule.cat = document.getElementById('calEditRuleCat')?.value || rule.cat;
    rule.prio = document.getElementById('calEditRulePrio')?.value || rule.prio;
    rule.notes = document.getElementById('calEditRuleNotes')?.value.trim() || '';
    refreshCalendarAndLists();
    try{ closeModal('calendarEditModal'); }catch(e){}
    window.openCalendarDay(dateStr || date);
  };

  window.deleteCalendarRuleEdit = function(ruleId, dateStr){
    if(!confirm('Excluir esta tarefa recorrente inteira?')) return;
    S.taskRules = S.taskRules.filter(r => String(r.id) !== String(ruleId));
    refreshCalendarAndLists();
    try{ closeModal('calendarEditModal'); }catch(e){}
    window.openCalendarDay(dateStr);
  };

  window.openCalendarBlockEditor = function(sourceId, sourceType, dateStr){
    ensureState();
    const isRule = sourceType === 'timeBlockRule';
    const block = isRule ? getBlockRuleById(sourceId) : getBlockById(sourceId);
    if(!block) return;
    const date = block.date || dateStr || ymd(new Date());
    const vacationQuick = `
      <div class="calendar-quick-row">
        <button class="btn btn-sm" onclick="applyVacationPresetToBlockForm()">🏖️ Transformar em férias</button>
        <button class="btn btn-sm" onclick="applyWorkPresetToBlockForm()">💼 Trabalho padrão</button>
      </div>
    `;
    openEditModal(isRule ? 'Editar bloco recorrente' : 'Editar bloco de tempo', `
      <div class="calendar-edit-grid">
        <div class="full">
          <label class="calendar-edit-label">Nome do bloco</label>
          <input class="inp" id="calEditBlockTask" value="${escapeHtml(block.task || '')}">
          ${vacationQuick}
        </div>
        <div>
          <label class="calendar-edit-label">Data inicial</label>
          <input class="inp" id="calEditBlockDate" type="date" value="${escapeHtml(date)}">
        </div>
        <div>
          <label class="calendar-edit-label">Repetição</label>
          <select class="inp" id="calEditBlockRepeat">
            <option value="none" ${(!block.repeat || block.repeat==='none')?'selected':''}>Sem repetição</option>
            <option value="daily" ${block.repeat==='daily'?'selected':''}>Todos os dias</option>
            <option value="weekdays" ${block.repeat==='weekdays'?'selected':''}>Dias úteis</option>
            <option value="weekly" ${block.repeat==='weekly'?'selected':''}>Semanal</option>
          </select>
        </div>
        <div>
          <label class="calendar-edit-label">Início</label>
          <input class="inp" id="calEditBlockStart" type="time" value="${escapeHtml(block.start || '09:00')}">
        </div>
        <div>
          <label class="calendar-edit-label">Fim</label>
          <input class="inp" id="calEditBlockEnd" type="time" value="${escapeHtml(block.end || '18:00')}">
        </div>
        <div class="full">
          <label class="calendar-edit-label">Cor</label>
          <input class="inp" id="calEditBlockColor" type="color" value="${escapeHtml(block.color || '#fb923c')}" style="height:44px;padding:6px">
        </div>
      </div>
      <div class="calendar-edit-actions">
        <button class="btn btn-p" style="background:var(--study);border-color:var(--study);color:#080810" onclick="saveCalendarBlockEdit('${escapeHtml(sourceId)}', '${escapeHtml(sourceType)}', '${escapeHtml(dateStr || date)}')">Salvar bloco</button>
        <button class="btn calendar-edit-danger" onclick="deleteCalendarBlockEdit('${escapeHtml(sourceId)}', '${escapeHtml(sourceType)}', '${escapeHtml(dateStr || date)}')">Excluir</button>
      </div>
      <div class="food-preview" style="margin-top:12px">Dica: para férias de vários dias, use repetição <strong>todos os dias</strong> ou <strong>dias úteis</strong> e ajuste a data inicial. Depois você pode excluir ou editar essa série quando acabar.</div>
    `);
  };

  window.applyVacationPresetToBlockForm = function(){
    const name = document.getElementById('calEditBlockTask');
    const start = document.getElementById('calEditBlockStart');
    const end = document.getElementById('calEditBlockEnd');
    const color = document.getElementById('calEditBlockColor');
    const repeat = document.getElementById('calEditBlockRepeat');
    if(name) name.value = '🏖️ Férias';
    if(start) start.value = '00:00';
    if(end) end.value = '23:59';
    if(color) color.value = '#34d399';
    if(repeat && repeat.value === 'none') repeat.value = 'daily';
  };

  window.applyWorkPresetToBlockForm = function(){
    const name = document.getElementById('calEditBlockTask');
    const start = document.getElementById('calEditBlockStart');
    const end = document.getElementById('calEditBlockEnd');
    const color = document.getElementById('calEditBlockColor');
    if(name) name.value = '💼 Trabalho';
    if(start) start.value = '09:00';
    if(end) end.value = '18:00';
    if(color) color.value = '#fb923c';
  };

  window.saveCalendarBlockEdit = function(sourceId, sourceType, fallbackDate){
    ensureState();
    const task = document.getElementById('calEditBlockTask')?.value.trim();
    const date = document.getElementById('calEditBlockDate')?.value;
    const repeat = document.getElementById('calEditBlockRepeat')?.value || 'none';
    const start = document.getElementById('calEditBlockStart')?.value || '09:00';
    const end = document.getElementById('calEditBlockEnd')?.value || '18:00';
    const color = document.getElementById('calEditBlockColor')?.value || '#fb923c';
    if(!task || !date) return;

    const wasRule = sourceType === 'timeBlockRule';
    let original = wasRule ? getBlockRuleById(sourceId) : getBlockById(sourceId);

    if(wasRule && repeat === 'none'){
      S.timeBlockRules = S.timeBlockRules.filter(b => String(b.id) !== String(sourceId));
      S.timeBlocks.push({id:Date.now(), task, date, repeat:'none', start, end, color});
    }else if(!wasRule && repeat !== 'none'){
      S.timeBlocks = S.timeBlocks.filter(b => String(b.id) !== String(sourceId));
      S.timeBlockRules.push({id:Date.now(), task, date, repeat, start, end, color});
    }else if(original){
      original.task = task;
      original.date = date;
      original.repeat = repeat;
      original.start = start;
      original.end = end;
      original.color = color;
    }

    refreshCalendarAndLists();
    try{ closeModal('calendarEditModal'); }catch(e){}
    window.openCalendarDay(fallbackDate || date);
  };

  window.deleteCalendarBlockEdit = function(sourceId, sourceType, dateStr){
    const isRule = sourceType === 'timeBlockRule';
    if(!confirm(isRule ? 'Excluir este bloco recorrente inteiro?' : 'Excluir este bloco de tempo?')) return;
    if(isRule) S.timeBlockRules = S.timeBlockRules.filter(b => String(b.id) !== String(sourceId));
    else S.timeBlocks = S.timeBlocks.filter(b => String(b.id) !== String(sourceId));
    refreshCalendarAndLists();
    try{ closeModal('calendarEditModal'); }catch(e){}
    window.openCalendarDay(dateStr);
  };

  window.openCalendarDay = function(dateStr){
    let modal = document.getElementById('calendarDayModal');
    if(!modal){
      modal = document.createElement('div');
      modal.className = 'modal-bg';
      modal.id = 'calendarDayModal';
      modal.innerHTML = `
        <div class="modal">
          <div class="modal-title">
            <span id="calendarDayTitle">Detalhes do dia</span>
            <button class="modal-close" onclick="closeModal('calendarDayModal')">×</button>
          </div>
          <div id="calendarDayContent"></div>
        </div>`;
      document.body.appendChild(modal);
      modal.addEventListener('click', e => { if(e.target === modal) modal.classList.remove('open'); });
    }

    const title = document.getElementById('calendarDayTitle');
    const content = document.getElementById('calendarDayContent');
    const dayDate = parseDateOnly(dateStr);
    const events = window.allCalendarEventsForDate(dateStr);

    if(title) title.textContent = dayDate ? dayDate.toLocaleDateString('pt-BR',{weekday:'long', day:'2-digit', month:'long'}) : 'Detalhes do dia';
    if(!content) return;

    if(!events.length){
      content.innerHTML = '<div class="empty">Nenhuma tarefa ou bloco de tempo neste dia.</div>';
      modal.classList.add('open');
      return;
    }

    const tasks = events.filter(ev => ev.type === 'task' || ev.type === 'rule');
    const blocks = events.filter(ev => ev.type === 'block');

    let html = '';

    if(tasks.length){
      html += '<div class="day-modal-group-title">Tarefas</div>';
      html += tasks.map(ev => {
        const icon = ev.type === 'rule' ? '↻' : ev.done ? '✅' : '📝';
        const editCall = ev.type === 'rule'
          ? `openCalendarRuleEditor(${Number(ev.sourceId)}, '${escapeHtml(dateStr)}')`
          : `openCalendarTaskEditor(${Number(ev.sourceId)}, '${escapeHtml(dateStr)}')`;
        return `
          <div class="day-modal-item">
            <div class="day-modal-title">${icon} ${escapeHtml(ev.title)}</div>
            <div class="day-modal-meta">${escapeHtml(ev.meta)}</div>
            <div class="calendar-edit-actions">
              <button class="btn btn-sm" onclick="${editCall}">Editar</button>
            </div>
          </div>
        `;
      }).join('');
    }

    if(blocks.length){
      html += '<div class="day-modal-group-title">Blocos de tempo</div>';
      html += blocks.map(ev => `
        <div class="day-modal-item">
          <div class="day-modal-title">🕒 ${escapeHtml(ev.title)}</div>
          <div class="day-modal-meta">${escapeHtml(ev.meta)}</div>
          <div class="calendar-edit-actions">
            <button class="btn btn-sm" onclick="openCalendarBlockEditor('${escapeHtml(ev.sourceId)}', '${escapeHtml(ev.sourceType)}', '${escapeHtml(dateStr)}')">Editar bloco</button>
          </div>
        </div>
      `).join('');
    }

    content.innerHTML = html;
    modal.classList.add('open');
  };

  function boot(){
    try{ if(typeof renderTaskCalendar === 'function') renderTaskCalendar(); }catch(e){}
  }
  document.addEventListener('DOMContentLoaded', boot);
  setTimeout(boot, 250);
  setTimeout(boot, 900);
})();

/* ===== SCRIPT BLOCK ORIGINAL CONSOLIDADO ===== */

(function(){
  const saveFn = () => { try{ if(typeof saveSafe==='function') saveSafe(); else if(typeof save==='function') save(); }catch(e){} };
  const ymd = (d)=>{
    const dt = new Date(d);
    return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
  };
  const parseDateOnly = (str)=>{
    if(!str) return null;
    const p=String(str).slice(0,10).split('-').map(Number);
    if(p.length!==3 || p.some(Number.isNaN)) return null;
    return new Date(p[0],p[1]-1,p[2]);
  };
  const escapeHtml=(s)=>String(s??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const prioLabel=(p)=>p==='high'?'Alta':p==='low'?'Baixa':'Média';
  const repeatLabel=(r)=>r==='daily'?'Todos os dias':r==='weekdays'?'Dias úteis':r==='weekly'?'Semanal':'Sem repetição';
  const reasonLabel=(r)=>({ferias:'🏖️ Férias',folga:'🌿 Folga',atestado:'🧾 Atestado',removido:'🚫 Removido'}[r] || '🚫 Removido');
  const reasonColor=(r)=>({ferias:'#34d399',folga:'#22d3ee',atestado:'#f87171',removido:'#a0a0c0'}[r] || '#a0a0c0');

  function ensureState(){
    window.S=window.S||{};
    S.tasks=Array.isArray(S.tasks)?S.tasks:[];
    S.taskRules=Array.isArray(S.taskRules)?S.taskRules:[];
    S.timeBlocks=Array.isArray(S.timeBlocks)?S.timeBlocks:[];
    S.timeBlockRules=Array.isArray(S.timeBlockRules)?S.timeBlockRules:[];
    S.timeBlockSkips=Array.isArray(S.timeBlockSkips)?S.timeBlockSkips:[];
  }
  function skipKey(sourceType, sourceId, date){ return `${sourceType}:${sourceId}:${date}`; }
  function isSkipped(sourceType, sourceId, date){
    ensureState();
    const key=skipKey(sourceType, sourceId, date);
    return S.timeBlockSkips.some(x=>x && x.key===key);
  }
  function addSkip(sourceType, sourceId, date, title, meta, reason){
    ensureState();
    const key=skipKey(sourceType, sourceId, date);
    if(!S.timeBlockSkips.some(x=>x.key===key)){
      S.timeBlockSkips.push({key,sourceType:String(sourceType),sourceId:String(sourceId),date,title:title||'Bloco de tempo',meta:meta||'',reason:reason||'removido',createdAt:new Date().toISOString()});
    }
  }
  function removeSkip(key){
    ensureState();
    S.timeBlockSkips=S.timeBlockSkips.filter(x=>x.key!==key);
  }
  function refreshAll(){
    saveFn();
    try{ if(typeof renderTimeBlocks==='function') renderTimeBlocks(); }catch(e){}
    try{ if(typeof renderTasks==='function') renderTasks(); }catch(e){}
    try{ if(typeof updateWorkProgress==='function') updateWorkProgress(); }catch(e){}
    try{ if(typeof renderOverview==='function') renderOverview(); }catch(e){}
    try{ if(typeof renderTaskCalendar==='function') renderTaskCalendar(); }catch(e){}
  }

  window.timeBlockOccurrences = function(days=120, startDateStr){
    ensureState();
    const out=[];
    const todayStr=ymd(new Date());
    const start=parseDateOnly(startDateStr || todayStr) || new Date();
    const end=new Date(start); end.setDate(end.getDate()+Number(days||120));

    S.timeBlocks.forEach(tb=>{
      const baseStr=tb.date || todayStr;
      const base=parseDateOnly(baseStr);
      const sourceId=tb.id;
      const sourceType='timeBlock';
      if(base && base>=start && base<=end && !isSkipped(sourceType, sourceId, baseStr)){
        out.push({...tb,id:tb.id,sourceId,sourceType,date:baseStr,repeat:tb.repeat||'none',rule:false});
      }
    });

    S.timeBlockRules.forEach(rule=>{
      const baseStr=rule.date || todayStr;
      const base=parseDateOnly(baseStr);
      if(!base) return;
      for(let cur=new Date(start); cur<=end; cur.setDate(cur.getDate()+1)){
        const d=new Date(cur);
        if(d<base) continue;
        const ds=ymd(d);
        let include=false;
        if(rule.repeat==='daily') include=true;
        else if(rule.repeat==='weekdays') include=d.getDay()!==0 && d.getDay()!==6;
        else if(rule.repeat==='weekly') include=d.getDay()===base.getDay();
        else include=ds===baseStr;
        const sourceId=rule.id;
        const sourceType='timeBlockRule';
        if(include && !isSkipped(sourceType, sourceId, ds)){
          out.push({id:`${rule.id}-${ds}`,sourceId,sourceType,start:rule.start,end:rule.end,task:rule.task,color:rule.color||'#c084fc',date:ds,repeat:rule.repeat||'none',rule:true});
        }
      }
    });
    return out.sort((a,b)=>`${a.date}${a.start||''}`.localeCompare(`${b.date}${b.start||''}`));
  };

  window.allCalendarEventsForDate = function(dateStr){
    ensureState();
    const tasks=S.tasks.filter(t=>t&&t.due&&String(t.due).slice(0,10)===dateStr).map(t=>({type:'task',sourceId:t.id,title:t.text||'Tarefa',done:!!t.done,color:'var(--work)',meta:`${t.cat||'Tarefa'} · ${prioLabel(t.prio)}${t.done?' · concluída':''}${t.due?' · '+(String(t.due).slice(11,16)||'dia todo'):''}`}));
    const ruleEvents=S.taskRules.filter(r=>{
      if(!r||r.floating) return false;
      const base=parseDateOnly(r.startDate||dateStr), date=parseDateOnly(dateStr);
      if(!base||!date||date<base) return false;
      if(r.repeat==='daily') return true;
      if(r.repeat==='weekdays') return date.getDay()!==0&&date.getDay()!==6;
      if(r.repeat==='weekly') return date.getDay()===base.getDay();
      return dateStr===(r.startDate||dateStr);
    }).map(r=>({type:'rule',sourceId:r.id,ruleId:r.id,title:r.text||'Tarefa recorrente',done:(r.doneDates||[]).includes(dateStr),color:'var(--habits)',meta:`${r.cat||'Tarefa'} · ${prioLabel(r.prio)} · ${repeatLabel(r.repeat)}${(r.doneDates||[]).includes(dateStr)?' · concluída':''}`}));
    const blocks=window.timeBlockOccurrences(120,dateStr).filter(b=>b.date===dateStr).map(b=>({type:'block',sourceId:b.sourceId||b.id,sourceType:b.sourceType||(b.rule?'timeBlockRule':'timeBlock'),occurrenceDate:dateStr,title:b.task||'Bloco de tempo',done:false,color:b.color||'var(--study)',meta:`${b.start||'--:--'}–${b.end||'--:--'}${b.repeat&&b.repeat!=='none'?' · '+repeatLabel(b.repeat):''}`}));
    const absences=S.timeBlockSkips.filter(x=>x&&x.date===dateStr).map(x=>({type:'absence',skipKey:x.key,sourceId:x.sourceId,sourceType:x.sourceType,title:reasonLabel(x.reason),color:reasonColor(x.reason),meta:`${x.title||'Bloco'} removido deste dia${x.meta?' · '+x.meta:''}`}));
    return [...tasks,...ruleEvents,...blocks,...absences];
  };

  window.removeCalendarBlockOccurrence = function(sourceType, sourceId, dateStr, title, meta){
    const reason=document.getElementById('calendarRemovalReason')?.value || 'removido';
    addSkip(sourceType,sourceId,dateStr,title,meta,reason);
    refreshAll();
    window.openCalendarDay(dateStr);
  };

  window.removeSelectedCalendarBlocks = function(dateStr){
    const checked=[...document.querySelectorAll('#calendarDayContent input[data-block-select]:checked')];
    if(!checked.length){ alert('Selecione pelo menos um bloco.'); return; }
    const reason=document.getElementById('calendarRemovalReason')?.value || 'removido';
    checked.forEach(input=>addSkip(input.dataset.sourceType,input.dataset.sourceId,dateStr,input.dataset.title,input.dataset.meta,reason));
    refreshAll();
    window.openCalendarDay(dateStr);
  };

  window.restoreCalendarBlockOccurrence = function(skipKeyValue, dateStr){
    removeSkip(skipKeyValue);
    refreshAll();
    window.openCalendarDay(dateStr);
  };

  window.selectAllDayBlocks = function(on){
    document.querySelectorAll('#calendarDayContent input[data-block-select]').forEach(cb=>cb.checked=!!on);
  };

  window.openCalendarDay = function(dateStr){
    ensureState();
    let modal=document.getElementById('calendarDayModal');
    if(!modal){
      modal=document.createElement('div');
      modal.className='modal-bg';
      modal.id='calendarDayModal';
      modal.innerHTML=`<div class="modal"><div class="modal-title"><span id="calendarDayTitle">Detalhes do dia</span><button class="modal-close" onclick="closeModal('calendarDayModal')">×</button></div><div id="calendarDayContent"></div></div>`;
      document.body.appendChild(modal);
      modal.addEventListener('click',e=>{if(e.target===modal)modal.classList.remove('open');});
    }
    const title=document.getElementById('calendarDayTitle');
    const content=document.getElementById('calendarDayContent');
    const dayDate=parseDateOnly(dateStr);
    const events=window.allCalendarEventsForDate(dateStr);
    if(title) title.textContent=dayDate?dayDate.toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'long'}):'Detalhes do dia';
    if(!content) return;
    if(!events.length){ content.innerHTML='<div class="empty">Nenhuma tarefa ou bloco de tempo neste dia.</div>'; modal.classList.add('open'); return; }
    const tasks=events.filter(ev=>ev.type==='task'||ev.type==='rule');
    const blocks=events.filter(ev=>ev.type==='block');
    const absences=events.filter(ev=>ev.type==='absence');
    let html='';
    if(tasks.length){
      html+='<div class="day-modal-group-title">Tarefas</div>';
      html+=tasks.map(ev=>{
        const icon=ev.type==='rule'?'↻':ev.done?'✅':'📝';
        const editCall=ev.type==='rule'?`openCalendarRuleEditor(${Number(ev.sourceId)}, '${escapeHtml(dateStr)}')`:`openCalendarTaskEditor(${Number(ev.sourceId)}, '${escapeHtml(dateStr)}')`;
        return `<div class="day-modal-item"><div class="day-modal-title">${icon} ${escapeHtml(ev.title)}</div><div class="day-modal-meta">${escapeHtml(ev.meta)}</div><div class="calendar-edit-actions"><button class="btn btn-sm" onclick="${editCall}">Editar tarefa</button></div></div>`;
      }).join('');
    }
    if(blocks.length){
      html+=`<div class="day-modal-group-title">Blocos de tempo</div>
      <div class="calendar-day-toolbar">
        <div class="inp-row">
          <select class="inp" id="calendarRemovalReason" style="flex:1;font-size:13px">
            <option value="ferias">🏖️ Férias</option>
            <option value="folga">🌿 Folga</option>
            <option value="atestado">🧾 Atestado</option>
            <option value="removido">🚫 Apenas remover</option>
          </select>
          <button class="btn btn-p" style="background:var(--study);border-color:var(--study);color:#080810" onclick="removeSelectedCalendarBlocks('${escapeHtml(dateStr)}')">Remover selecionados só deste dia</button>
        </div>
        <div class="btn-row">
          <button class="btn btn-xs" onclick="selectAllDayBlocks(true)">Selecionar todos</button>
          <button class="btn btn-xs" onclick="selectAllDayBlocks(false)">Limpar seleção</button>
        </div>
      </div>`;
      html+=blocks.map(ev=>`
        <div class="day-modal-item">
          <label class="calendar-block-select-row">
            <input type="checkbox" data-block-select="1" data-source-type="${escapeHtml(ev.sourceType)}" data-source-id="${escapeHtml(ev.sourceId)}" data-title="${escapeHtml(ev.title)}" data-meta="${escapeHtml(ev.meta)}">
            <span style="flex:1">
              <span class="day-modal-title">🕒 ${escapeHtml(ev.title)}</span>
              <span class="day-modal-meta">${escapeHtml(ev.meta)}</span>
            </span>
          </label>
          <div class="calendar-edit-actions">
            <button class="btn btn-sm calendar-edit-danger" onclick="removeCalendarBlockOccurrence('${escapeHtml(ev.sourceType)}','${escapeHtml(ev.sourceId)}','${escapeHtml(dateStr)}','${escapeHtml(ev.title)}','${escapeHtml(ev.meta)}')">Remover só deste dia</button>
          </div>
        </div>`).join('');
    }
    if(absences.length){
      html+='<div class="day-modal-group-title">Ausências / blocos removidos</div>';
      html+=absences.map(ev=>`<div class="day-modal-item calendar-absence-item"><div class="day-modal-title">${escapeHtml(ev.title)}</div><div class="day-modal-meta">${escapeHtml(ev.meta)}</div><div class="calendar-absence-actions"><button class="btn btn-sm" onclick="restoreCalendarBlockOccurrence('${escapeHtml(ev.skipKey)}','${escapeHtml(dateStr)}')">Restaurar bloco neste dia</button></div></div>`).join('');
    }
    content.innerHTML=html;
    modal.classList.add('open');
  };

  function getMonday(baseDate){
    const d=new Date(baseDate); d.setHours(0,0,0,0);
    const day=d.getDay(); d.setDate(d.getDate()+(day===0?-6:1-day));
    return d;
  }
  function currentWeekRange(){
    const offset=Number(window.taskCalendarWeekOffset||0);
    const start=getMonday(new Date()); start.setDate(start.getDate()+offset*7);
    const end=new Date(start); end.setDate(start.getDate()+6);
    return {start,end};
  }
  function formatDateLabel(dateStr){
    const d=parseDateOnly(dateStr);
    return d?d.toLocaleDateString('pt-BR',{weekday:'short',day:'2-digit',month:'2-digit'}):dateStr;
  }

  function injectBulkButton(){
    const card=document.getElementById('taskCalendarCard');
    if(!card || document.getElementById('bulkBlockRemoveBtnWrap')) return;
    const grid=document.getElementById('taskCalendarGrid');
    const wrap=document.createElement('div');
    wrap.id='bulkBlockRemoveBtnWrap';
    wrap.className='calendar-bulk-btn-wrap';
    wrap.innerHTML=`<button class="btn" onclick="openBulkBlockRemovalModal()">Selecionar blocos da semana para férias/folga/atestado</button>`;
    grid?.insertAdjacentElement('beforebegin',wrap);
  }
  const previousRenderTaskCalendar=window.renderTaskCalendar;
  window.renderTaskCalendar=function(){
    if(typeof previousRenderTaskCalendar==='function') previousRenderTaskCalendar();
    injectBulkButton();
  };

  function ensureBulkModal(){
    let modal=document.getElementById('calendarBulkBlockModal');
    if(modal) return modal;
    modal=document.createElement('div');
    modal.className='modal-bg';
    modal.id='calendarBulkBlockModal';
    modal.innerHTML=`<div class="modal"><div class="modal-title"><span>Remover blocos específicos</span><button class="modal-close" onclick="closeModal('calendarBulkBlockModal')">×</button></div><div id="calendarBulkBlockContent"></div></div>`;
    document.body.appendChild(modal);
    modal.addEventListener('click',e=>{if(e.target===modal)modal.classList.remove('open');});
    return modal;
  }

  window.openBulkBlockRemovalModal=function(){
    ensureState();
    const {start}=currentWeekRange();
    const days=[];
    for(let i=0;i<7;i++){ const d=new Date(start); d.setDate(start.getDate()+i); days.push(ymd(d)); }
    const byDay=days.map(date=>({date,blocks:window.timeBlockOccurrences(1,date).filter(b=>b.date===date)})).filter(x=>x.blocks.length);
    const modal=ensureBulkModal();
    const content=document.getElementById('calendarBulkBlockContent');
    if(!content) return;
    if(!byDay.length){
      content.innerHTML='<div class="empty">Nenhum bloco de tempo disponível nesta semana.</div>';
      modal.classList.add('open');
      return;
    }
    content.innerHTML=`
      <div class="calendar-day-toolbar">
        <div class="inp-row">
          <select class="inp" id="bulkRemovalReason" style="flex:1;font-size:13px">
            <option value="ferias">🏖️ Férias</option>
            <option value="folga">🌿 Folga</option>
            <option value="atestado">🧾 Atestado</option>
            <option value="removido">🚫 Apenas remover</option>
          </select>
          <button class="btn btn-p" style="background:var(--study);border-color:var(--study);color:#080810" onclick="applyBulkBlockRemoval()">Aplicar aos selecionados</button>
        </div>
        <div class="food-preview">Isso remove apenas as ocorrências selecionadas. O bloco recorrente original continua existindo nos outros dias.</div>
      </div>
      <div class="calendar-bulk-list">
        ${byDay.map(group=>`<div class="calendar-bulk-day"><div class="calendar-bulk-day-title">${formatDateLabel(group.date)}</div>${group.blocks.map(b=>`<label class="calendar-bulk-option"><input type="checkbox" data-bulk-block="1" data-date="${escapeHtml(group.date)}" data-source-type="${escapeHtml(b.sourceType||'timeBlock')}" data-source-id="${escapeHtml(b.sourceId||b.id)}" data-title="${escapeHtml(b.task||'Bloco de tempo')}" data-meta="${escapeHtml((b.start||'--:--')+'–'+(b.end||'--:--'))}"><span><strong>${escapeHtml(b.task||'Bloco de tempo')}</strong><span>${escapeHtml((b.start||'--:--')+'–'+(b.end||'--:--'))}${b.repeat&&b.repeat!=='none'?' · '+escapeHtml(repeatLabel(b.repeat)):''}</span></span></label>`).join('')}</div>`).join('')}
      </div>`;
    modal.classList.add('open');
  };

  window.applyBulkBlockRemoval=function(){
    const checked=[...document.querySelectorAll('#calendarBulkBlockContent input[data-bulk-block]:checked')];
    if(!checked.length){ alert('Selecione pelo menos um bloco.'); return; }
    const reason=document.getElementById('bulkRemovalReason')?.value || 'removido';
    checked.forEach(input=>addSkip(input.dataset.sourceType,input.dataset.sourceId,input.dataset.date,input.dataset.title,input.dataset.meta,reason));
    refreshAll();
    try{ closeModal('calendarBulkBlockModal'); }catch(e){}
  };

  function boot(){ injectBulkButton(); try{ if(typeof renderTaskCalendar==='function') renderTaskCalendar(); }catch(e){} }
  document.addEventListener('DOMContentLoaded',boot);
  setTimeout(boot,300);
  setTimeout(boot,900);
})();

/* ===== SCRIPT BLOCK ORIGINAL CONSOLIDADO ===== */

(function(){
  const saveFn = () => { try{ if(typeof saveSafe==='function') saveSafe(); else if(typeof save==='function') save(); }catch(e){} };
  const ymd=(d)=>{const dt=new Date(d);return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;};
  const parseDateOnly=(str)=>{if(!str)return null;const p=String(str).slice(0,10).split('-').map(Number);if(p.length!==3||p.some(Number.isNaN))return null;return new Date(p[0],p[1]-1,p[2]);};
  const escapeHtml=(s)=>String(s??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const prioLabel=(p)=>p==='high'?'Alta':p==='low'?'Baixa':'Média';
  const repeatLabel=(r)=>r==='daily'?'Todos os dias':r==='weekdays'?'Dias úteis':r==='weekly'?'Semanal':'Sem repetição';
  const monthNames=['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
  const weekNames=['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'];

  window.calendarDaySelectMode = false;
  window.calendarSelectedDays = window.calendarSelectedDays || [];

  function ensureState(){
    window.S=window.S||{};
    S.tasks=Array.isArray(S.tasks)?S.tasks:[];
    S.taskRules=Array.isArray(S.taskRules)?S.taskRules:[];
    S.timeBlocks=Array.isArray(S.timeBlocks)?S.timeBlocks:[];
    S.timeBlockRules=Array.isArray(S.timeBlockRules)?S.timeBlockRules:[];
    S.timeBlockSkips=Array.isArray(S.timeBlockSkips)?S.timeBlockSkips:[];
  }
  function skipKey(sourceType, sourceId, date){return `${sourceType}:${sourceId}:${date}`;}
  function isSkipped(sourceType, sourceId, date){ensureState();const key=skipKey(sourceType,sourceId,date);return S.timeBlockSkips.some(x=>x&&x.key===key);}
  function addSkip(sourceType, sourceId, date, title, meta){
    ensureState();
    const key=skipKey(sourceType,sourceId,date);
    if(!S.timeBlockSkips.some(x=>x&&x.key===key)){
      S.timeBlockSkips.push({key,sourceType:String(sourceType),sourceId:String(sourceId),date,title:title||'Bloco de tempo',meta:meta||'',reason:'removido',createdAt:new Date().toISOString()});
    }
  }
  function removeSkip(key){ensureState();S.timeBlockSkips=S.timeBlockSkips.filter(x=>x&&x.key!==key);}
  function refreshAll(){
    saveFn();
    try{ if(typeof renderTimeBlocks==='function') renderTimeBlocks(); }catch(e){}
    try{ if(typeof renderTasks==='function') renderTasks(); }catch(e){}
    try{ if(typeof updateWorkProgress==='function') updateWorkProgress(); }catch(e){}
    try{ if(typeof renderOverview==='function') renderOverview(); }catch(e){}
    try{ if(typeof renderTaskCalendar==='function') renderTaskCalendar(); }catch(e){}
  }
  function getMonday(baseDate){const d=new Date(baseDate);d.setHours(0,0,0,0);const day=d.getDay();d.setDate(d.getDate()+(day===0?-6:1-day));return d;}
  function buildRangeLabel(start,end){
    if(start.getMonth()===end.getMonth()&&start.getFullYear()===end.getFullYear()) return `${String(start.getDate()).padStart(2,'0')}–${String(end.getDate()).padStart(2,'0')} ${monthNames[start.getMonth()]} ${start.getFullYear()}`;
    if(start.getFullYear()===end.getFullYear()) return `${String(start.getDate()).padStart(2,'0')} ${monthNames[start.getMonth()]} – ${String(end.getDate()).padStart(2,'0')} ${monthNames[end.getMonth()]} ${start.getFullYear()}`;
    return `${String(start.getDate()).padStart(2,'0')} ${monthNames[start.getMonth()]} ${start.getFullYear()} – ${String(end.getDate()).padStart(2,'0')} ${monthNames[end.getMonth()]} ${end.getFullYear()}`;
  }
  function currentWeekDays(){
    const offset=Number(window.taskCalendarWeekOffset||0);
    const monday=getMonday(new Date());monday.setDate(monday.getDate()+offset*7);
    return Array.from({length:7},(_,i)=>{const d=new Date(monday);d.setDate(monday.getDate()+i);return d;});
  }
  function formatDateLabel(dateStr){const d=parseDateOnly(dateStr);return d?d.toLocaleDateString('pt-BR',{weekday:'short',day:'2-digit',month:'2-digit'}):dateStr;}

  window.timeBlockOccurrences=function(days=120,startDateStr){
    ensureState();
    const out=[];
    const todayStr=ymd(new Date());
    const start=parseDateOnly(startDateStr||todayStr)||new Date();
    const end=new Date(start);end.setDate(end.getDate()+Number(days||120));
    S.timeBlocks.forEach(tb=>{
      const baseStr=tb.date||todayStr;const base=parseDateOnly(baseStr);const sourceId=tb.id;const sourceType='timeBlock';
      if(base&&base>=start&&base<=end&&!isSkipped(sourceType,sourceId,baseStr)) out.push({...tb,id:tb.id,sourceId,sourceType,date:baseStr,repeat:tb.repeat||'none',rule:false});
    });
    S.timeBlockRules.forEach(rule=>{
      const baseStr=rule.date||todayStr;const base=parseDateOnly(baseStr);if(!base)return;
      for(let cur=new Date(start);cur<=end;cur.setDate(cur.getDate()+1)){
        const d=new Date(cur);if(d<base)continue;const ds=ymd(d);let include=false;
        if(rule.repeat==='daily')include=true;else if(rule.repeat==='weekdays')include=d.getDay()!==0&&d.getDay()!==6;else if(rule.repeat==='weekly')include=d.getDay()===base.getDay();else include=ds===baseStr;
        const sourceId=rule.id;const sourceType='timeBlockRule';
        if(include&&!isSkipped(sourceType,sourceId,ds)) out.push({id:`${rule.id}-${ds}`,sourceId,sourceType,start:rule.start,end:rule.end,task:rule.task,color:rule.color||'#c084fc',date:ds,repeat:rule.repeat||'none',rule:true});
      }
    });
    return out.sort((a,b)=>`${a.date}${a.start||''}`.localeCompare(`${b.date}${b.start||''}`));
  };

  window.allCalendarEventsForDate=function(dateStr){
    ensureState();
    const tasks=S.tasks.filter(t=>t&&t.due&&String(t.due).slice(0,10)===dateStr).map(t=>({type:'task',sourceId:t.id,title:t.text||'Tarefa',done:!!t.done,color:'var(--work)',meta:`${t.cat||'Tarefa'} · ${prioLabel(t.prio)}${t.done?' · concluída':''}${t.due?' · '+(String(t.due).slice(11,16)||'dia todo'):''}`}));
    const ruleEvents=S.taskRules.filter(r=>{if(!r||r.floating)return false;const base=parseDateOnly(r.startDate||dateStr),date=parseDateOnly(dateStr);if(!base||!date||date<base)return false;if(r.repeat==='daily')return true;if(r.repeat==='weekdays')return date.getDay()!==0&&date.getDay()!==6;if(r.repeat==='weekly')return date.getDay()===base.getDay();return dateStr===(r.startDate||dateStr);}).map(r=>({type:'rule',sourceId:r.id,ruleId:r.id,title:r.text||'Tarefa recorrente',done:(r.doneDates||[]).includes(dateStr),color:'var(--habits)',meta:`${r.cat||'Tarefa'} · ${prioLabel(r.prio)} · ${repeatLabel(r.repeat)}${(r.doneDates||[]).includes(dateStr)?' · concluída':''}`}));
    const blocks=window.timeBlockOccurrences(120,dateStr).filter(b=>b.date===dateStr).map(b=>({type:'block',sourceId:b.sourceId||b.id,sourceType:b.sourceType||(b.rule?'timeBlockRule':'timeBlock'),occurrenceDate:dateStr,title:b.task||'Bloco de tempo',done:false,color:b.color||'var(--study)',meta:`${b.start||'--:--'}–${b.end||'--:--'}${b.repeat&&b.repeat!=='none'?' · '+repeatLabel(b.repeat):''}`}));
    const removed=S.timeBlockSkips.filter(x=>x&&x.date===dateStr).map(x=>({type:'absence',skipKey:x.key,sourceId:x.sourceId,sourceType:x.sourceType,title:'↩ Bloco removido',color:'#34d399',meta:`${x.title||'Bloco'} removido deste dia${x.meta?' · '+x.meta:''}`}));
    return [...tasks,...ruleEvents,...blocks,...removed];
  };

  window.restoreCalendarBlockOccurrence=function(skipKeyValue,dateStr){
    removeSkip(skipKeyValue);
    refreshAll();
    if(dateStr) window.openCalendarDay(dateStr);
  };

  window.toggleCalendarDaySelection=function(dateStr){
    const set=new Set(window.calendarSelectedDays||[]);
    if(set.has(dateStr)) set.delete(dateStr); else set.add(dateStr);
    window.calendarSelectedDays=[...set].sort();
    renderTaskCalendar();
  };
  window.toggleCalendarDaySelectionMode=function(){
    window.calendarDaySelectMode=!window.calendarDaySelectMode;
    if(!window.calendarDaySelectMode) window.calendarSelectedDays=[];
    renderTaskCalendar();
  };
  window.clearCalendarDaySelection=function(){window.calendarSelectedDays=[];renderTaskCalendar();};

  window.changeTaskCalendar=function(delta){
    window.taskCalendarWeekOffset=Number(window.taskCalendarWeekOffset||0)+Number(delta||0);
    window.calendarSelectedDays=[];
    renderTaskCalendar();
  };

  function makeDayButton(dateObj,idx){
    const dateStr=ymd(dateObj);const todayStr=ymd(new Date());const events=window.allCalendarEventsForDate(dateStr);
    const taskCount=events.filter(ev=>ev.type==='task'||ev.type==='rule').length;
    const blockCount=events.filter(ev=>ev.type==='block').length;
    const total=events.length;
    const selected=(window.calendarSelectedDays||[]).includes(dateStr);
    const btn=document.createElement('button');btn.type='button';
    btn.className='task-day weekly-card'+(idx>=5?' weekend-card':'')+(dateStr===todayStr?' today':'')+(total?' has-items':'')+(taskCount?' has-tasks':'')+(blockCount?' has-blocks':'')+(window.calendarDaySelectMode?' day-select-mode':'')+(selected?' day-selected':'');
    const preview=events.filter(ev=>ev.type!=='absence').slice(0,3).map(ev=>{const klass=ev.type==='block'?'block':ev.type==='rule'?'rule':'task';const prefix=ev.type==='block'?'🕒 ':ev.type==='rule'?'↻ ':'• ';return `<div class="task-day-mini ${klass}">${prefix}${escapeHtml(ev.title)}</div>`;}).join('');
    const dots=events.slice(0,5).map(ev=>`<span class="task-day-dot" style="background:${escapeHtml(ev.color||(ev.type==='block'?'var(--study)':'var(--work)'))}"></span>`).join('');
    btn.innerHTML=`${window.calendarDaySelectMode?'<span class="day-select-check">✓</span>':''}<div class="task-day-topline"><span class="task-day-weeklabel">${weekNames[idx]}</span><span class="task-day-count">${total?`${total} item${total>1?'s':''}`:''}</span></div><div class="task-day-head"><span class="task-day-num">${dateObj.getDate()}</span></div><div class="task-day-miniwrap">${preview||'<div class="task-day-empty">Nenhum item</div>'}</div><div class="task-day-dots">${dots}</div>`;
    btn.onclick=()=>{ if(window.calendarDaySelectMode) toggleCalendarDaySelection(dateStr); else openCalendarDay(dateStr); };
    return btn;
  }

  function ensureSelectBar(card){
    let bar=document.getElementById('calendarSimpleSelectBar');
    if(!bar){
      bar=document.createElement('div');bar.id='calendarSimpleSelectBar';bar.className='calendar-simple-select-bar';
      const grid=document.getElementById('taskCalendarGrid');
      grid?.insertAdjacentElement('beforebegin',bar);
    }
    const selectedCount=(window.calendarSelectedDays||[]).length;
    if(!window.calendarDaySelectMode){
      bar.innerHTML=`<button class="btn" onclick="toggleCalendarDaySelectionMode()">Selecionar dias para remover bloco</button><div class="calendar-simple-select-info">Selecione um ou mais dias e depois escolha qual bloco de tempo será removido somente nesses dias.</div>`;
    }else{
      bar.innerHTML=`<button class="btn btn-p" style="background:var(--study);border-color:var(--study);color:#080810" onclick="openSelectedDaysBlockRemoval()">Excluir bloco dos dias selecionados ${selectedCount?`(${selectedCount})`:''}</button><button class="btn" onclick="clearCalendarDaySelection()">Limpar</button><button class="btn" onclick="toggleCalendarDaySelectionMode()">Cancelar seleção</button><div class="calendar-simple-select-info">Toque nos dias da semana para selecionar. O bloco recorrente original não será apagado, só as ocorrências desses dias.</div>`;
    }
  }

  window.renderTaskCalendar=function(){
    const grid=document.getElementById('taskCalendarGrid');const label=document.getElementById('taskCalendarLabel');if(!grid||!label)return;
    const days=currentWeekDays();const monday=days[0],sunday=days[6];label.textContent='Semana · '+buildRangeLabel(monday,sunday);
    grid.className='task-calendar-grid weekly-stack-layout';grid.innerHTML='';
    ensureSelectBar();
    const weekSection=document.createElement('div');weekSection.className='task-week-section';
    const weekHead=document.createElement('div');weekHead.className='task-week-head';
    weekNames.slice(0,5).forEach(name=>{const chip=document.createElement('div');chip.className='task-weekday-chip';chip.textContent=name;weekHead.appendChild(chip);});
    const weekRow=document.createElement('div');weekRow.className='task-week-row';days.slice(0,5).forEach((d,idx)=>weekRow.appendChild(makeDayButton(d,idx)));weekSection.appendChild(weekHead);weekSection.appendChild(weekRow);
    const weekendSection=document.createElement('div');weekendSection.className='task-week-section';
    const weekendTitle=document.createElement('div');weekendTitle.className='task-weekend-title';weekendTitle.textContent='Final de semana';
    const weekendHead=document.createElement('div');weekendHead.className='task-week-head two-cols';weekNames.slice(5).forEach(name=>{const chip=document.createElement('div');chip.className='task-weekday-chip';chip.textContent=name;weekendHead.appendChild(chip);});
    const weekendRow=document.createElement('div');weekendRow.className='task-week-row weekend';days.slice(5).forEach((d,idx)=>weekendRow.appendChild(makeDayButton(d,idx+5)));weekendSection.appendChild(weekendTitle);weekendSection.appendChild(weekendHead);weekendSection.appendChild(weekendRow);
    grid.appendChild(weekSection);grid.appendChild(weekendSection);
    const old=document.getElementById('bulkBlockRemoveBtnWrap'); if(old) old.style.display='none';
  };

  function ensureSelectedBlockModal(){
    let modal=document.getElementById('calendarSelectedBlockModal');
    if(modal)return modal;
    modal=document.createElement('div');modal.className='modal-bg';modal.id='calendarSelectedBlockModal';
    modal.innerHTML=`<div class="modal"><div class="modal-title"><span>Excluir bloco dos dias selecionados</span><button class="modal-close" onclick="closeModal('calendarSelectedBlockModal')">×</button></div><div id="calendarSelectedBlockContent"></div></div>`;
    document.body.appendChild(modal);modal.addEventListener('click',e=>{if(e.target===modal)modal.classList.remove('open');});return modal;
  }

  window.openSelectedDaysBlockRemoval=function(){
    ensureState();
    const selected=[...(window.calendarSelectedDays||[])].sort();
    if(!selected.length){alert('Selecione pelo menos um dia.');return;}
    const items=[];
    selected.forEach(date=>{
      window.timeBlockOccurrences(1,date).filter(b=>b.date===date).forEach(b=>{
        items.push({date,sourceType:b.sourceType||'timeBlock',sourceId:b.sourceId||b.id,title:b.task||'Bloco de tempo',meta:`${b.start||'--:--'}–${b.end||'--:--'}${b.repeat&&b.repeat!=='none'?' · '+repeatLabel(b.repeat):''}`});
      });
    });
    const modal=ensureSelectedBlockModal();const content=document.getElementById('calendarSelectedBlockContent');if(!content)return;
    if(!items.length){
      content.innerHTML=`<div class="empty">Os dias selecionados não possuem blocos de tempo disponíveis para remover.</div>`;modal.classList.add('open');return;
    }
    const grouped=selected.map(date=>({date,items:items.filter(x=>x.date===date)})).filter(g=>g.items.length);
    content.innerHTML=`<div class="calendar-selected-panel"><div class="calendar-selected-panel-title">${selected.length} dia${selected.length>1?'s':''} selecionado${selected.length>1?'s':''}</div><div class="calendar-selected-panel-sub">Marque os blocos abaixo e confirme. Isso remove apenas as ocorrências desses dias. O bloco original continua existindo nos demais dias.</div><button class="btn btn-p" style="background:var(--study);border-color:var(--study);color:#080810" onclick="applySelectedDaysBlockRemoval()">Excluir blocos marcados</button></div><div class="calendar-selected-block-list">${grouped.map(group=>`<div class="calendar-bulk-day"><div class="calendar-bulk-day-title">${formatDateLabel(group.date)}</div>${group.items.map(item=>`<label class="calendar-selected-block-option"><input type="checkbox" data-selected-day-block="1" data-date="${escapeHtml(item.date)}" data-source-type="${escapeHtml(item.sourceType)}" data-source-id="${escapeHtml(item.sourceId)}" data-title="${escapeHtml(item.title)}" data-meta="${escapeHtml(item.meta)}"><span><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.meta)}</span></span></label>`).join('')}</div>`).join('')}</div>`;
    modal.classList.add('open');
  };

  window.applySelectedDaysBlockRemoval=function(){
    const checked=[...document.querySelectorAll('#calendarSelectedBlockContent input[data-selected-day-block]:checked')];
    if(!checked.length){alert('Selecione pelo menos um bloco.');return;}
    checked.forEach(input=>addSkip(input.dataset.sourceType,input.dataset.sourceId,input.dataset.date,input.dataset.title,input.dataset.meta));
    window.calendarSelectedDays=[];
    window.calendarDaySelectMode=false;
    refreshAll();
    try{ closeModal('calendarSelectedBlockModal'); }catch(e){}
  };

  window.openCalendarDay=function(dateStr){
    ensureState();
    let modal=document.getElementById('calendarDayModal');
    if(!modal){
      modal=document.createElement('div');modal.className='modal-bg';modal.id='calendarDayModal';
      modal.innerHTML=`<div class="modal"><div class="modal-title"><span id="calendarDayTitle">Detalhes do dia</span><button class="modal-close" onclick="closeModal('calendarDayModal')">×</button></div><div id="calendarDayContent"></div></div>`;
      document.body.appendChild(modal);modal.addEventListener('click',e=>{if(e.target===modal)modal.classList.remove('open');});
    }
    const title=document.getElementById('calendarDayTitle');const content=document.getElementById('calendarDayContent');const dayDate=parseDateOnly(dateStr);const events=window.allCalendarEventsForDate(dateStr);
    if(title)title.textContent=dayDate?dayDate.toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'long'}):'Detalhes do dia';if(!content)return;
    if(!events.length){content.innerHTML='<div class="empty">Nenhuma tarefa ou bloco de tempo neste dia.</div>';modal.classList.add('open');return;}
    const tasks=events.filter(ev=>ev.type==='task'||ev.type==='rule');const blocks=events.filter(ev=>ev.type==='block');const removed=events.filter(ev=>ev.type==='absence');let html='';
    if(tasks.length){html+='<div class="day-modal-group-title">Tarefas</div>';html+=tasks.map(ev=>`<div class="day-modal-item"><div class="day-modal-title">${ev.type==='rule'?'↻':ev.done?'✅':'📝'} ${escapeHtml(ev.title)}</div><div class="day-modal-meta">${escapeHtml(ev.meta)}</div></div>`).join('');}
    if(blocks.length){html+='<div class="day-modal-group-title">Blocos de tempo</div>';html+=blocks.map(ev=>`<div class="day-modal-item"><div class="day-modal-title">🕒 ${escapeHtml(ev.title)}</div><div class="day-modal-meta">${escapeHtml(ev.meta)}</div><div class="calendar-absence-actions"><button class="btn btn-sm calendar-edit-danger" onclick="addCalendarSingleBlockSkip('${escapeHtml(ev.sourceType)}','${escapeHtml(ev.sourceId)}','${escapeHtml(dateStr)}','${escapeHtml(ev.title)}','${escapeHtml(ev.meta)}')">Excluir só deste dia</button></div></div>`).join('');}
    if(removed.length){html+='<div class="day-modal-group-title">Blocos removidos</div>';html+=removed.map(ev=>`<div class="day-modal-item calendar-absence-item"><div class="day-modal-title">${escapeHtml(ev.title)}</div><div class="day-modal-meta">${escapeHtml(ev.meta)}</div><div class="calendar-absence-actions"><button class="btn btn-sm" onclick="restoreCalendarBlockOccurrence('${escapeHtml(ev.skipKey)}','${escapeHtml(dateStr)}')">Restaurar bloco neste dia</button></div></div>`).join('');}
    content.innerHTML=html;modal.classList.add('open');
  };

  window.addCalendarSingleBlockSkip=function(sourceType,sourceId,dateStr,title,meta){
    addSkip(sourceType,sourceId,dateStr,title,meta);
    refreshAll();
    window.openCalendarDay(dateStr);
  };

  function boot(){
    const old=document.getElementById('bulkBlockRemoveBtnWrap'); if(old) old.style.display='none';
    try{ renderTaskCalendar(); }catch(e){}
  }
  document.addEventListener('DOMContentLoaded',boot);
  setTimeout(boot,250);
  setTimeout(boot,900);
})();

/* ===== SCRIPT BLOCK ORIGINAL CONSOLIDADO ===== */

(function(){
  const originalSave = typeof save === 'function' ? save : null;
  const ymd = (d)=>{
    const dt = new Date(d);
    return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
  };
  const parseDateOnly = (str)=>{
    if(!str) return null;
    const p=String(str).slice(0,10).split('-').map(Number);
    if(p.length!==3 || p.some(Number.isNaN)) return null;
    return new Date(p[0],p[1]-1,p[2]);
  };
  const addDays=(date,n)=>{ const d=new Date(date); d.setDate(d.getDate()+n); return d; };

  function ensureState(){
    window.S = window.S || {};
    S.history = S.history || {};
    S.timeBlocks = Array.isArray(S.timeBlocks) ? S.timeBlocks : [];
    S.timeBlockRules = Array.isArray(S.timeBlockRules) ? S.timeBlockRules : [];
    S.calendarBlockSkips = Array.isArray(S.calendarBlockSkips) ? S.calendarBlockSkips : [];
    S.meals = Array.isArray(S.meals) ? S.meals : [];
    S.studySessions = Array.isArray(S.studySessions) ? S.studySessions : [];
    S.goals = S.goals || {water:8,waterBaseMl:0,steps:10000,calories:2000,sleep:8,pomodoros:4};
  }

  function totalCalories(){
    ensureState();
    return (S.meals || []).reduce((sum,m)=>sum + Number(m.kcal || 0),0);
  }

  function currentSleepHours(){
    try{
      if(typeof getSleepHours === 'function') return Number(getSleepHours() || 0);
    }catch(e){}
    const start = S.sleepStart || '23:00';
    const end = S.sleepEnd || '07:00';
    const [sh,sm]=start.split(':').map(Number);
    const [eh,em]=end.split(':').map(Number);
    if([sh,sm,eh,em].some(Number.isNaN)) return 0;
    let mins=(eh*60+em)-(sh*60+em);
    mins=(eh*60+em)-(sh*60+sm);
    if(mins<0) mins+=1440;
    return Number((mins/60).toFixed(1));
  }

  function currentScoreSafe(){
    try{
      if(typeof calcScore === 'function') return Number(calcScore() || 0);
    }catch(e){}
    return 0;
  }

  function syncTodayHistory(){
    ensureState();
    const key = new Date().toDateString();
    const sleepH = currentSleepHours();
    const entry = Object.assign({}, S.history[key] || {});
    entry.water = Number(S.water || 0);
    try{ entry.waterGoalMl = typeof calcWaterGoalMl === 'function' ? calcWaterGoalMl() : (S.goals.waterBaseMl || S.goals.water*250 || 2000); }catch(e){ entry.waterGoalMl = S.goals.waterBaseMl || S.goals.water*250 || 2000; }
    entry.cupSize = Number(S.cupSize || 250);
    entry.steps = Number(S.steps || 0);
    entry.calories = totalCalories();
    entry.sleep = sleepH;
    entry.sleepStart = S.sleepStart || document.getElementById('sleepStart')?.value || '23:00';
    entry.sleepEnd = S.sleepEnd || document.getElementById('sleepEnd')?.value || '07:00';
    entry.sleepQuality = Number(S.sleepQuality || 0);
    entry.pomos = Number(S.pomsDone || 0);
    entry.score = currentScoreSafe();
    entry.mood = Number(S.mood || 0);
    entry.updatedAt = new Date().toISOString();
    S.history[key] = entry;
    const keys = Object.keys(S.history).sort((a,b)=>new Date(a)-new Date(b));
    while(keys.length > 120){ delete S.history[keys.shift()]; }
  }

  function refreshWeeklyChartsSoon(){
    clearTimeout(window.__flowHistoryRefreshTimer);
    window.__flowHistoryRefreshTimer = setTimeout(()=>{
      try{ if(typeof renderCharts === 'function') renderCharts(); }catch(e){}
      try{ if(typeof renderOverview === 'function') renderOverview(); }catch(e){}
      try{ if(typeof calcScore === 'function') calcScore(); }catch(e){}
    },120);
  }

  window.save = save = function(){
    try{ syncTodayHistory(); }catch(e){}
    if(originalSave) originalSave();
    else { try{ localStorage.setItem('flowData', JSON.stringify(S)); }catch(e){} }
    refreshWeeklyChartsSoon();
  };

  window.saveCurrentDayHistory = function(){
    syncTodayHistory();
    if(originalSave) originalSave();
    refreshWeeklyChartsSoon();
  };

  function ensureTimeBlockAdvancedUi(){
    const tbTask = document.getElementById('tbTask');
    if(!tbTask) return;

    let oldDate = document.getElementById('tbDate');
    let oldRepeat = document.getElementById('tbRepeat');

    let wrap = document.getElementById('tbAdvancedWrap');
    if(!wrap){
      wrap = document.createElement('div');
      wrap.id = 'tbAdvancedWrap';
      wrap.className = 'tb-advanced-card';
      wrap.innerHTML = `
        <div>
          <div class="tb-advanced-label">Tipo do bloco</div>
          <select class="inp" id="tbMode" style="--acc:var(--work)">
            <option value="single">Dia único</option>
            <option value="recurring" selected>Recorrente com período</option>
          </select>
        </div>
        <div class="tb-date-grid">
          <div>
            <div class="tb-advanced-label" id="tbStartDateLabel">Data</div>
            <input class="inp" id="tbStartDate" type="date" style="--acc:var(--work)">
          </div>
          <div id="tbEndDateBox">
            <div class="tb-advanced-label">Data final</div>
            <input class="inp" id="tbEndDate" type="date" style="--acc:var(--work)">
          </div>
        </div>
        <div id="tbRepeatBox">
          <div class="tb-advanced-label">Recorrência</div>
          <select class="inp" id="tbRepeatNew" style="--acc:var(--work)">
            <option value="daily">Todos os dias</option>
            <option value="weekdays" selected>Dias úteis</option>
            <option value="weekly">Semanal</option>
          </select>
        </div>
        <div class="tb-advanced-help" id="tbAdvancedHelp">Use data inicial e final para criar blocos como jornada de trabalho por um período específico. Depois você ainda pode remover dias isolados pelo calendário.</div>
      `;
      const color = document.getElementById('tbColor');
      color?.insertAdjacentElement('afterend', wrap);
    }

    const today = ymd(new Date());
    const startDate = document.getElementById('tbStartDate');
    const endDate = document.getElementById('tbEndDate');
    const repeatNew = document.getElementById('tbRepeatNew');
    const mode = document.getElementById('tbMode');
    if(startDate && !startDate.value) startDate.value = oldDate?.value || today;
    if(endDate && !endDate.value) endDate.value = startDate?.value || today;
    if(repeatNew && oldRepeat?.value && oldRepeat.value !== 'none') repeatNew.value = oldRepeat.value;

    if(oldDate){ oldDate.style.display='none'; oldDate.tabIndex=-1; }
    if(oldRepeat){ oldRepeat.style.display='none'; oldRepeat.tabIndex=-1; }

    function syncMode(){
      const isSingle = mode?.value === 'single';
      const endBox = document.getElementById('tbEndDateBox');
      const repeatBox = document.getElementById('tbRepeatBox');
      const label = document.getElementById('tbStartDateLabel');
      const help = document.getElementById('tbAdvancedHelp');
      if(endBox) endBox.style.display = isSingle ? 'none' : '';
      if(repeatBox) repeatBox.style.display = isSingle ? 'none' : '';
      if(label) label.textContent = isSingle ? 'Data do bloco' : 'Data inicial';
      if(help) help.textContent = isSingle ? 'Cria o bloco em apenas um dia.' : 'Cria o bloco recorrente entre a data inicial e a data final. Você pode remover dias isolados pelo calendário depois.';
      if(isSingle && endDate && startDate) endDate.value = startDate.value;
    }
    mode?.addEventListener('change', syncMode);
    startDate?.addEventListener('change', ()=>{
      if(endDate && (!endDate.value || endDate.value < startDate.value)) endDate.value = startDate.value;
      const oldDateNow = document.getElementById('tbDate');
      if(oldDateNow) oldDateNow.value = startDate.value;
    });
    syncMode();
  }

  const repeatLabel=(r)=>r==='daily'?'Todos os dias':r==='weekdays'?'Dias úteis':r==='weekly'?'Semanal':'Sem repetição';
  function shouldIncludeRule(rule,date){
    const base = parseDateOnly(rule.date || rule.startDate);
    if(!base || date < base) return false;
    const end = parseDateOnly(rule.endDate || rule.dateEnd || rule.until || '');
    if(end && date > end) return false;
    if(rule.repeat==='daily') return true;
    if(rule.repeat==='weekdays') return date.getDay() !== 0 && date.getDay() !== 6;
    if(rule.repeat==='weekly') return date.getDay() === base.getDay();
    return ymd(date) === ymd(base);
  }

  const isSkipped=(sourceType,sourceId,dateStr)=>{
    ensureState();
    return S.calendarBlockSkips.some(skip => String(skip.sourceType)===String(sourceType) && String(skip.sourceId)===String(sourceId) && String(skip.date)===String(dateStr));
  };

  window.timeBlockOccurrences = function(days=120,startDateStr){
    ensureState();
    const out=[];
    const start = parseDateOnly(startDateStr || ymd(new Date())) || new Date();
    const end = addDays(start, Number(days||120));

    S.timeBlocks.forEach(tb=>{
      const dateStr = tb.date || tb.startDate || ymd(new Date());
      const d = parseDateOnly(dateStr);
      const sourceId = tb.id;
      if(d && d >= start && d <= end && !isSkipped('timeBlock',sourceId,dateStr)){
        out.push({...tb,date:dateStr,repeat:'none',sourceType:'timeBlock',sourceId});
      }
    });

    S.timeBlockRules.forEach(rule=>{
      const sourceId = rule.id;
      for(let cur=new Date(start);cur<=end;cur.setDate(cur.getDate()+1)){
        const d = new Date(cur);
        const dateStr = ymd(d);
        if(shouldIncludeRule(rule,d) && !isSkipped('timeBlockRule',sourceId,dateStr)){
          out.push({
            id:`${sourceId}-${dateStr}`,
            sourceType:'timeBlockRule',
            sourceId,
            start:rule.start,
            end:rule.end,
            task:rule.task,
            color:rule.color || '#fb923c',
            date:dateStr,
            repeat:rule.repeat || 'none',
            endDate:rule.endDate || '',
            rule:true
          });
        }
      }
    });

    return out.sort((a,b)=>`${a.date}${a.start||''}`.localeCompare(`${b.date}${b.start||''}`));
  };

  window.saveTB = function(){
    ensureState();
    ensureTimeBlockAdvancedUi();
    const start = document.getElementById('tbStart')?.value;
    const end = document.getElementById('tbEnd')?.value;
    const task = document.getElementById('tbTask')?.value?.trim();
    const color = document.getElementById('tbColor')?.value || '#fb923c';
    const mode = document.getElementById('tbMode')?.value || 'recurring';
    const startDate = document.getElementById('tbStartDate')?.value || document.getElementById('tbDate')?.value || ymd(new Date());
    let endDate = document.getElementById('tbEndDate')?.value || startDate;
    const repeat = mode === 'single' ? 'none' : (document.getElementById('tbRepeatNew')?.value || document.getElementById('tbRepeat')?.value || 'weekdays');
    if(!start || !end || !task) return;
    if(mode !== 'single' && endDate < startDate) endDate = startDate;

    if(mode === 'single'){
      S.timeBlocks.push({id:Date.now(),start,end,task,color,date:startDate,repeat:'none'});
    }else{
      S.timeBlockRules.push({id:Date.now(),start,end,task,color,date:startDate,startDate,endDate,repeat});
    }

    save();
    try{ if(typeof renderTimeBlocks==='function') renderTimeBlocks(); }catch(e){}
    try{ if(typeof renderTaskCalendar==='function') renderTaskCalendar(); }catch(e){}
    try{ if(typeof closeModal==='function') closeModal('tbModal'); }catch(e){}
    const tbTask=document.getElementById('tbTask'); if(tbTask) tbTask.value='';
  };

  const originalAddTimeBlock = typeof addTimeBlock === 'function' ? addTimeBlock : null;
  window.addTimeBlock = addTimeBlock = function(){
    if(originalAddTimeBlock) originalAddTimeBlock();
    else document.getElementById('tbModal')?.classList.add('open');
    setTimeout(ensureTimeBlockAdvancedUi,50);
  };

  function hydrateSleepInputs(){
    const s=document.getElementById('sleepStart');
    const e=document.getElementById('sleepEnd');
    if(s && S.sleepStart) s.value=S.sleepStart;
    if(e && S.sleepEnd) e.value=S.sleepEnd;
    try{ if(typeof calcSleep === 'function') calcSleep(); }catch(err){}
    try{ if(S.sleepQuality && typeof setSleepQual === 'function') setSleepQual(Number(S.sleepQuality),false); }catch(err){}
  }

  const originalCalcSleep = typeof calcSleep === 'function' ? calcSleep : null;
  if(originalCalcSleep){
    window.calcSleep = calcSleep = function(){
      const s=document.getElementById('sleepStart');
      const e=document.getElementById('sleepEnd');
      if(s) S.sleepStart=s.value || S.sleepStart || '23:00';
      if(e) S.sleepEnd=e.value || S.sleepEnd || '07:00';
      const result = originalCalcSleep.apply(this,arguments);
      try{ syncTodayHistory(); }catch(err){}
      try{ if(originalSave) originalSave(); }catch(err){}
      refreshWeeklyChartsSoon();
      return result;
    };
  }

  const originalSetSleepQual = typeof setSleepQual === 'function' ? setSleepQual : null;
  if(originalSetSleepQual){
    window.setSleepQual = setSleepQual = function(q,sv=true){
      const result = originalSetSleepQual.apply(this,arguments);
      S.sleepQuality = Number(q || 0);
      try{ syncTodayHistory(); }catch(err){}
      if(sv){ try{ if(originalSave) originalSave(); }catch(err){} refreshWeeklyChartsSoon(); }
      return result;
    };
  }

  function addSavedStatusToSleep(){
    const card = document.querySelector('#sec-sleep .card');
    if(card && !document.getElementById('sleepSavedStatus')){
      const pill=document.createElement('div');
      pill.id='sleepSavedStatus';
      pill.className='save-status-pill';
      pill.textContent='✓ sono salvo automaticamente';
      card.appendChild(pill);
    }
  }

  function boot(){
    ensureState();
    ensureTimeBlockAdvancedUi();
    hydrateSleepInputs();
    addSavedStatusToSleep();
    try{ syncTodayHistory(); if(originalSave) originalSave(); }catch(e){}
    try{ if(typeof renderCharts==='function') renderCharts(); }catch(e){}
    try{ if(typeof renderTaskCalendar==='function') renderTaskCalendar(); }catch(e){}
  }

  document.addEventListener('DOMContentLoaded',boot);
  setTimeout(boot,250);
  setTimeout(boot,900);
  window.addEventListener('pagehide',()=>{ try{ syncTodayHistory(); if(originalSave) originalSave(); }catch(e){} });
  document.addEventListener('visibilitychange',()=>{ if(document.visibilityState==='hidden'){ try{ syncTodayHistory(); if(originalSave) originalSave(); }catch(e){} } });
})();

/* ===== SCRIPT BLOCK ORIGINAL CONSOLIDADO ===== */

(function(){
  const ymd=(d)=>{const dt=new Date(d);return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;};
  const parseDateOnly=(str)=>{if(!str)return null;const p=String(str).slice(0,10).split('-').map(Number);if(p.length!==3||p.some(Number.isNaN))return null;return new Date(p[0],p[1]-1,p[2]);};
  const addDays=(date,n)=>{const d=new Date(date);d.setDate(d.getDate()+Number(n||0));return d;};
  const repeatLabel=(r)=>r==='daily'?'Todos os dias':r==='weekdays'?'Dias úteis':r==='weekly'?'Semanal':'Sem repetição';
  const escapeHtml=(s)=>String(s??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const nativeSave=()=>{try{localStorage.setItem('flow_v3',JSON.stringify(window.S||{}));}catch(e){}};
  const saveAll=()=>{try{if(typeof save==='function')save();else nativeSave();}catch(e){nativeSave();}};

  function ensureState(){
    window.S=window.S||{};
    S.history=S.history||{};
    S.timeBlocks=Array.isArray(S.timeBlocks)?S.timeBlocks:[];
    S.timeBlockRules=Array.isArray(S.timeBlockRules)?S.timeBlockRules:[];
    S.timeBlockSkips=Array.isArray(S.timeBlockSkips)?S.timeBlockSkips:[];
    S.calendarBlockSkips=Array.isArray(S.calendarBlockSkips)?S.calendarBlockSkips:[];
    S.meals=Array.isArray(S.meals)?S.meals:[];
    S.studySessions=Array.isArray(S.studySessions)?S.studySessions:[];
    S.goals=S.goals||{water:8,waterBaseMl:0,steps:10000,calories:2000,sleep:8,pomodoros:4};
  }

  function skipKey(sourceType,sourceId,date){return `${sourceType}:${sourceId}:${date}`;}
  function allSkips(){ensureState();return [...S.timeBlockSkips,...S.calendarBlockSkips].filter(Boolean);}
  function isSkipped(sourceType,sourceId,date){const key=skipKey(sourceType,sourceId,date);return allSkips().some(x=>x&&x.key===key);}
  function addUnifiedSkip(sourceType,sourceId,date,title,meta){
    ensureState();
    const key=skipKey(sourceType,sourceId,date);
    const obj={key,sourceType:String(sourceType),sourceId:String(sourceId),date,title:title||'Bloco de tempo',meta:meta||'',reason:'removido',createdAt:new Date().toISOString()};
    if(!S.timeBlockSkips.some(x=>x&&x.key===key))S.timeBlockSkips.push({...obj});
    if(!S.calendarBlockSkips.some(x=>x&&x.key===key))S.calendarBlockSkips.push({...obj});
  }
  function removeUnifiedSkip(key){
    ensureState();
    S.timeBlockSkips=S.timeBlockSkips.filter(x=>x&&x.key!==key);
    S.calendarBlockSkips=S.calendarBlockSkips.filter(x=>x&&x.key!==key);
  }
  window.restoreCalendarBlockOccurrence=function(key,dateStr){
    removeUnifiedSkip(key);saveAll();refreshCalendarBits();if(dateStr&&typeof openCalendarDay==='function')openCalendarDay(dateStr);
  };
  window.addCalendarSingleBlockSkip=function(sourceType,sourceId,dateStr,title,meta){
    addUnifiedSkip(sourceType,sourceId,dateStr,title,meta);saveAll();refreshCalendarBits();if(typeof openCalendarDay==='function')openCalendarDay(dateStr);
  };
  window.applySelectedDaysBlockRemoval=function(){
    const checked=[...document.querySelectorAll('#calendarSelectedBlockContent input[data-selected-day-block]:checked')];
    if(!checked.length){alert('Selecione pelo menos um bloco.');return;}
    checked.forEach(input=>addUnifiedSkip(input.dataset.sourceType,input.dataset.sourceId,input.dataset.date,input.dataset.title,input.dataset.meta));
    window.calendarSelectedDays=[];window.calendarDaySelectMode=false;
    saveAll();refreshCalendarBits();try{closeModal('calendarSelectedBlockModal');}catch(e){}
  };

  function shouldIncludeRule(rule,date){
    const base=parseDateOnly(rule.date||rule.startDate);if(!base||date<base)return false;
    const end=parseDateOnly(rule.endDate||rule.dateEnd||rule.until||'');if(end&&date>end)return false;
    if(rule.repeat==='daily')return true;
    if(rule.repeat==='weekdays')return date.getDay()!==0&&date.getDay()!==6;
    if(rule.repeat==='weekly')return date.getDay()===base.getDay();
    return ymd(date)===ymd(base);
  }

  window.timeBlockOccurrences=function(days=120,startDateStr){
    ensureState();
    const out=[];const today=ymd(new Date());const start=parseDateOnly(startDateStr||today)||new Date();const end=addDays(start,Number(days||120));
    S.timeBlocks.forEach(tb=>{
      const dateStr=tb.date||tb.startDate||today;const d=parseDateOnly(dateStr);const sourceId=tb.id;const sourceType='timeBlock';
      if(d&&d>=start&&d<=end&&!isSkipped(sourceType,sourceId,dateStr))out.push({...tb,date:dateStr,repeat:'none',sourceType,sourceId,allDay:!!tb.allDay});
    });
    S.timeBlockRules.forEach(rule=>{
      const sourceId=rule.id;const sourceType='timeBlockRule';
      for(let cur=new Date(start);cur<=end;cur.setDate(cur.getDate()+1)){
        const d=new Date(cur);const dateStr=ymd(d);
        if(shouldIncludeRule(rule,d)&&!isSkipped(sourceType,sourceId,dateStr))out.push({id:`${sourceId}-${dateStr}`,sourceType,sourceId,start:rule.start,end:rule.end,task:rule.task,color:rule.color||'#fb923c',date:dateStr,repeat:rule.repeat||'none',endDate:rule.endDate||'',allDay:!!rule.allDay,rule:true});
      }
    });
    return out.sort((a,b)=>`${a.date}${a.start||''}`.localeCompare(`${b.date}${b.start||''}`));
  };

  function patchAllCalendarEvents(){
    const old=window.allCalendarEventsForDate;
    window.allCalendarEventsForDate=function(dateStr){
      let events=[];
      try{events=old?old(dateStr):[];}catch(e){events=[];}
      // Rebuild blocks and removed records with the unified skip list so deletion persists.
      events=events.filter(ev=>ev.type!=='block'&&ev.type!=='absence');
      const blocks=window.timeBlockOccurrences(120,dateStr).filter(b=>b.date===dateStr).map(b=>({type:'block',sourceId:b.sourceId||b.id,sourceType:b.sourceType||(b.rule?'timeBlockRule':'timeBlock'),occurrenceDate:dateStr,title:b.task||'Bloco de tempo',done:false,color:b.color||'var(--study)',meta:b.allDay?'Dia inteiro':`${b.start||'--:--'}–${b.end||'--:--'}${b.repeat&&b.repeat!=='none'?' · '+repeatLabel(b.repeat):''}`}));
      const removed=allSkips().filter(x=>x&&x.date===dateStr).filter((x,i,arr)=>arr.findIndex(y=>y.key===x.key)===i).map(x=>({type:'absence',skipKey:x.key,sourceId:x.sourceId,sourceType:x.sourceType,title:'↩ Bloco removido',color:'#34d399',meta:`${x.title||'Bloco'} removido deste dia${x.meta?' · '+x.meta:''}`}));
      return [...events,...blocks,...removed];
    };
  }

  function ensureTimeBlockUi(){
    const tbTask=document.getElementById('tbTask');if(!tbTask)return;
    const oldDate=document.getElementById('tbDate');const oldRepeat=document.getElementById('tbRepeat');
    if(oldDate){oldDate.style.display='none';oldDate.tabIndex=-1;}
    if(oldRepeat){oldRepeat.style.display='none';oldRepeat.tabIndex=-1;}
    let wrap=document.getElementById('tbAdvancedWrap');
    if(!wrap){
      wrap=document.createElement('div');wrap.id='tbAdvancedWrap';
      const color=document.getElementById('tbColor');color?.insertAdjacentElement('afterend',wrap);
    }
    wrap.className='tb-advanced-card v23';
    if(!wrap.dataset.v23){
      wrap.dataset.v23='1';
      wrap.innerHTML=`
        <div class="tb-v23-field">
          <div class="tb-v23-label">Tipo do bloco</div>
          <select class="inp" id="tbModeV23">
            <option value="single">Bloco de tempo de dia único</option>
            <option value="period" selected>Bloco de tempo recorrente com período</option>
            <option value="open">Bloco de tempo recorrente sem período</option>
          </select>
        </div>
        <label class="tb-v23-all-day">
          <div><strong>Dia inteiro</strong><span>Ocupa o dia todo, sem horário de início e fim.</span></div>
          <input type="checkbox" id="tbAllDayV23" style="width:22px;height:22px;accent-color:var(--work)">
        </label>
        <div class="tb-v23-grid" id="tbDateGridV23">
          <div class="tb-v23-field">
            <div class="tb-v23-label" id="tbStartDateLabelV23">Data inicial</div>
            <input class="inp" id="tbStartDateV23" type="date">
          </div>
          <div class="tb-v23-field" id="tbEndDateBoxV23">
            <div class="tb-v23-label">Data final</div>
            <input class="inp" id="tbEndDateV23" type="date">
          </div>
        </div>
        <div class="tb-v23-field" id="tbRepeatBoxV23">
          <div class="tb-v23-label">Recorrência</div>
          <select class="inp" id="tbRepeatNewV23">
            <option value="daily">Todos os dias</option>
            <option value="weekdays" selected>Dias úteis</option>
            <option value="weekly">Semanal</option>
          </select>
        </div>
        <div class="tb-v23-help" id="tbHelpV23">Escolha o tipo do bloco. Depois, se precisar, remova dias específicos pelo calendário sem apagar a série.</div>`;
    }
    const today=ymd(new Date());
    const mode=document.getElementById('tbModeV23');const startDate=document.getElementById('tbStartDateV23');const endDate=document.getElementById('tbEndDateV23');const repeat=document.getElementById('tbRepeatNewV23');const allDay=document.getElementById('tbAllDayV23');
    if(startDate&&!startDate.value)startDate.value=oldDate?.value||today;
    if(endDate&&!endDate.value)endDate.value=startDate?.value||today;
    if(repeat&&oldRepeat?.value&&oldRepeat.value!=='none')repeat.value=oldRepeat.value;
    function sync(){
      const m=mode?.value||'period';const isSingle=m==='single';const isOpen=m==='open';
      const endBox=document.getElementById('tbEndDateBoxV23');const repeatBox=document.getElementById('tbRepeatBoxV23');const label=document.getElementById('tbStartDateLabelV23');const help=document.getElementById('tbHelpV23');
      if(endBox)endBox.classList.toggle('tb-v23-hidden',isSingle||isOpen);
      if(repeatBox)repeatBox.classList.toggle('tb-v23-hidden',isSingle);
      if(label)label.textContent=isSingle?'Data do bloco':'Data inicial';
      if(help)help.textContent=isSingle?'Cria o bloco em apenas um dia.':isOpen?'Cria um bloco recorrente sem data final definida.':'Cria um bloco recorrente entre a data inicial e a data final.';
      if(isSingle&&endDate&&startDate)endDate.value=startDate.value;
      const timeRow=document.getElementById('tbStart')?.closest('.inp-row');
      if(timeRow)timeRow.classList.toggle('tb-v23-hidden',!!allDay?.checked);
    }
    mode.onchange=sync;allDay.onchange=sync;startDate.onchange=()=>{if(endDate&&(!endDate.value||endDate.value<startDate.value))endDate.value=startDate.value;if(oldDate)oldDate.value=startDate.value;};
    sync();
  }

  const oldAdd=typeof addTimeBlock==='function'?addTimeBlock:null;
  window.addTimeBlock=addTimeBlock=function(){if(oldAdd)oldAdd();else document.getElementById('tbModal')?.classList.add('open');setTimeout(ensureTimeBlockUi,50);};
  window.saveTB=function(){
    ensureState();ensureTimeBlockUi();
    const allDay=!!document.getElementById('tbAllDayV23')?.checked;
    const start=allDay?'00:00':document.getElementById('tbStart')?.value;
    const end=allDay?'23:59':document.getElementById('tbEnd')?.value;
    const task=document.getElementById('tbTask')?.value?.trim();
    const color=document.getElementById('tbColor')?.value||'#fb923c';
    const mode=document.getElementById('tbModeV23')?.value||'period';
    const startDate=document.getElementById('tbStartDateV23')?.value||document.getElementById('tbDate')?.value||ymd(new Date());
    let endDate=document.getElementById('tbEndDateV23')?.value||startDate;
    const repeat=mode==='single'?'none':(document.getElementById('tbRepeatNewV23')?.value||'weekdays');
    if(!task||(!allDay&&(!start||!end)))return;
    if(mode==='single')S.timeBlocks.push({id:Date.now(),start,end,task,color,date:startDate,repeat:'none',allDay});
    else{if(mode==='period'&&endDate<startDate)endDate=startDate;S.timeBlockRules.push({id:Date.now(),start,end,task,color,date:startDate,startDate,endDate:mode==='period'?endDate:'',repeat,allDay,openEnded:mode==='open'});}
    saveAll();try{if(typeof renderTimeBlocks==='function')renderTimeBlocks();}catch(e){}refreshCalendarBits();try{closeModal('tbModal');}catch(e){}
    const tbTask=document.getElementById('tbTask');if(tbTask)tbTask.value='';
  };

  function currentSleepHours(){
    const s=S.sleepStart||document.getElementById('sleepStart')?.value||'23:00';const e=S.sleepEnd||document.getElementById('sleepEnd')?.value||'07:00';
    const [sh,sm]=String(s).split(':').map(Number);const [eh,em]=String(e).split(':').map(Number);if([sh,sm,eh,em].some(Number.isNaN))return 0;let mins=(eh*60+em)-(sh*60+sm);if(mins<0)mins+=1440;return Number((mins/60).toFixed(1));
  }
  function totalCalories(){return (S.meals||[]).reduce((sum,m)=>sum+Number(m.kcal||0),0);}
  function syncTodayHistory(){
    ensureState();const key=new Date().toDateString();const entry={...(S.history[key]||{})};
    entry.water=Number(S.water||0);entry.steps=Number(S.steps||0);entry.calories=totalCalories();entry.sleep=currentSleepHours();entry.sleepStart=S.sleepStart||'23:00';entry.sleepEnd=S.sleepEnd||'07:00';entry.sleepQuality=Number(S.sleepQuality||0);entry.pomos=Number(S.pomsDone||0);entry.mood=Number(S.mood||0);try{entry.score=typeof calcScore==='function'?Number(calcScore()||0):Number(entry.score||0);}catch(e){entry.score=Number(entry.score||0);}entry.updatedAt=new Date().toISOString();S.history[key]=entry;
  }
  function persistSleep(){
    ensureState();const s=document.getElementById('sleepStart');const e=document.getElementById('sleepEnd');if(s)S.sleepStart=s.value||S.sleepStart||'23:00';if(e)S.sleepEnd=e.value||S.sleepEnd||'07:00';
    syncTodayHistory();nativeSave();try{if(typeof renderCharts==='function')renderCharts();}catch(e){}try{if(typeof renderOverview==='function')renderOverview();}catch(e){}
    const st=document.getElementById('sleepAutosaveStatus');if(st)st.textContent='✓ sono salvo automaticamente';
  }
  const oldCalc=typeof calcSleep==='function'?calcSleep:null;
  if(oldCalc){window.calcSleep=calcSleep=function(){const r=oldCalc.apply(this,arguments);persistSleep();return r;};}
  const oldQual=typeof setSleepQual==='function'?setSleepQual:null;
  if(oldQual){window.setSleepQual=setSleepQual=function(q,sv=true){const r=oldQual.apply(this,arguments);S.sleepQuality=Number(q||0);persistSleep();return r;};}
  function bindSleepSave(){
    const s=document.getElementById('sleepStart');const e=document.getElementById('sleepEnd');
    if(s&&!s.dataset.v23Sleep){s.dataset.v23Sleep='1';s.value=S.sleepStart||s.value||'23:00';['input','change','blur'].forEach(evt=>s.addEventListener(evt,persistSleep));}
    if(e&&!e.dataset.v23Sleep){e.dataset.v23Sleep='1';e.value=S.sleepEnd||e.value||'07:00';['input','change','blur'].forEach(evt=>e.addEventListener(evt,persistSleep));}
    const card=document.querySelector('#sec-sleep .card');if(card&&!document.getElementById('sleepAutosaveStatus')){const p=document.createElement('div');p.id='sleepAutosaveStatus';p.className='sleep-autosave-status';p.textContent='✓ sono salvo automaticamente';card.appendChild(p);}persistSleep();
  }
  function refreshCalendarBits(){try{if(typeof renderTaskCalendar==='function')renderTaskCalendar();}catch(e){}try{if(typeof renderOverview==='function')renderOverview();}catch(e){}try{if(typeof updateWorkProgress==='function')updateWorkProgress();}catch(e){}}
  patchAllCalendarEvents();
  function boot(){ensureState();ensureTimeBlockUi();bindSleepSave();refreshCalendarBits();}
  document.addEventListener('DOMContentLoaded',boot);setTimeout(boot,250);setTimeout(boot,900);setTimeout(boot,1600);
  window.addEventListener('pagehide',()=>{try{persistSleep();nativeSave();}catch(e){}});
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'){try{persistSleep();nativeSave();}catch(e){}}});
})();
