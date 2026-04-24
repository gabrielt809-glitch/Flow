/* FLOW Foundation v12.0 — TimeBlocks
   Módulo oficial para criar blocos, gerar ocorrências, remover ocorrências e restaurar.
*/
(function(){
  'use strict';
  const { State, Utils } = window.Flow;

  const TimeBlocks = {
    normalize(block = {}){
      const allDay = !!block.allDay;
      return Object.assign({
        id: block.id || Date.now(),
        task: block.task || 'Bloco de tempo',
        start: allDay ? '00:00' : (block.start || '09:00'),
        end: allDay ? '23:59' : (block.end || '10:00'),
        color: block.color || '#fb923c',
        repeat: block.repeat || 'none',
        allDay
      }, block, allDay ? {start:'00:00', end:'23:59', allDay:true} : {});
    },
    occurrenceKey(block, dateStr){
      const id = block.ruleId || block.seriesId || block.id || `${block.task || ''}-${block.start || ''}-${block.end || ''}`;
      return `${id}|${dateStr}|${block.start || ''}|${block.end || ''}|${block.task || ''}`;
    },
    allSkips(){
      const S = State.ensure();
      S.timeBlockSkips = Array.isArray(S.timeBlockSkips) ? S.timeBlockSkips : [];
      S.calendarBlockSkips = Array.isArray(S.calendarBlockSkips) ? S.calendarBlockSkips : [];
      const merged = [...S.timeBlockSkips, ...S.calendarBlockSkips];
      const seen = new Set();
      return merged.filter(skip => {
        const key = skip.key || `${skip.blockId || skip.ruleId || skip.id || ''}|${skip.date}|${skip.start || ''}|${skip.end || ''}|${skip.task || ''}`;
        if(seen.has(key)) return false;
        seen.add(key);
        skip.key = key;
        return true;
      });
    },
    isSkipped(block, dateStr){
      const key = this.occurrenceKey(block, dateStr);
      return this.allSkips().some(skip => skip.key === key || (
        String(skip.date) === String(dateStr) &&
        String(skip.start || '') === String(block.start || '') &&
        String(skip.end || '') === String(block.end || '') &&
        String(skip.task || '') === String(block.task || '')
      ));
    },
    skip(block, dateStr){
      const S = State.ensure();
      const normalized = this.normalize(block);
      const key = this.occurrenceKey(normalized, dateStr);
      return this.skipByKey(key, dateStr, normalized);
    },
    skipByKey(key, dateStr, fallbackBlock = null){
      const S = State.ensure();
      S.timeBlockSkips = Array.isArray(S.timeBlockSkips) ? S.timeBlockSkips : [];
      S.calendarBlockSkips = Array.isArray(S.calendarBlockSkips) ? S.calendarBlockSkips : [];
      if(S.timeBlockSkips.some(item => item.key === key)) return;
      let block = fallbackBlock;
      if(!block){
        const active = this.occurrences(1, dateStr).find(item => this.occurrenceKey(item, dateStr) === key);
        block = active || {};
      }
      const skip = {
        key,
        date: dateStr,
        start: block.start || '',
        end: block.end || '',
        task: block.task || 'Bloco removido',
        color: block.color || '#52527a',
        blockId: block.ruleId || block.id || null,
        createdAt: new Date().toISOString()
      };
      S.timeBlockSkips.push(skip);
      S.calendarBlockSkips.push(skip);
    },
    skipMany(blocks = [], dates = []){
      blocks.forEach(block => dates.forEach(dateStr => this.skip(block, dateStr)));
      if(window.Flow.Storage) window.Flow.Storage.commit('tasks');
    },
    restore(skipKey){
      const S = State.ensure();
      S.timeBlockSkips = (S.timeBlockSkips || []).filter(skip => skip.key !== skipKey);
      S.calendarBlockSkips = (S.calendarBlockSkips || []).filter(skip => skip.key !== skipKey);
      if(window.Flow.Storage) window.Flow.Storage.commit('tasks');
    },
    occurrences(days = 120, startDateStr){
      const S = State.ensure();
      const out = [];
      const today = Utils.ymd();
      const start = Utils.parseDateOnly(startDateStr || today) || new Date();
      const end = Utils.addDays(start, Number(days || 120));

      (S.timeBlocks || []).map(b=>this.normalize(b)).forEach(block => {
        const dateStr = block.date || block.startDate || today;
        const date = Utils.parseDateOnly(dateStr);
        if(!date || date < start || date > end) return;
        const item = Object.assign({}, block, {date: dateStr, repeat:'none', rule:false});
        if(!this.isSkipped(item, dateStr)) out.push(item);
      });

      (S.timeBlockRules || []).map(b=>this.normalize(b)).forEach(rule => {
        const startStr = rule.startDate || rule.date || today;
        const endStr = rule.endDate || rule.finishDate || '';
        const ruleStart = Utils.parseDateOnly(startStr);
        const ruleEnd = endStr ? Utils.parseDateOnly(endStr) : null;
        if(!ruleStart) return;
        for(let cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate()+1)){
          const d = new Date(cursor);
          if(d < ruleStart) continue;
          if(ruleEnd && d > ruleEnd) continue;
          const dateStr = Utils.ymd(d);
          let include = false;
          if(rule.repeat === 'daily') include = true;
          else if(rule.repeat === 'weekdays') include = d.getDay() !== 0 && d.getDay() !== 6;
          else if(rule.repeat === 'weekly') include = d.getDay() === ruleStart.getDay();
          else include = dateStr === startStr;
          if(include){
            const item = Object.assign({}, rule, {
              id: `${rule.id}-${dateStr}`,
              ruleId: rule.id,
              date: dateStr,
              rule:true
            });
            if(!this.isSkipped(item, dateStr)) out.push(item);
          }
        }
      });
      return out.sort((a,b)=>`${a.date}${a.start || ''}`.localeCompare(`${b.date}${b.start || ''}`));
    },
    removedForDate(dateStr){
      return this.allSkips().filter(skip => skip.date === dateStr);
    },
    ensureModalControls(){
      const modal = document.getElementById('tbModal');
      const task = document.getElementById('tbTask');
      if(!modal || !task || document.getElementById('flowTbMode')) return;
      const today = Utils.ymd();
      const block = document.createElement('div');
      block.className = 'flow-tb-foundation-controls';
      block.innerHTML = `
        <div class="flow-tb-field">
          <label>Tipo de bloco</label>
          <select class="inp" id="flowTbMode">
            <option value="single">Bloco de tempo de dia único</option>
            <option value="period">Bloco de tempo recorrente com período</option>
            <option value="indefinite">Bloco de tempo recorrente sem período</option>
          </select>
        </div>
        <label class="flow-tb-check"><input type="checkbox" id="flowTbAllDay"> <span>Dia inteiro</span></label>
        <div class="flow-tb-grid">
          <div class="flow-tb-field"><label id="flowTbStartDateLabel">Data</label><input class="inp" id="flowTbStartDate" type="date" value="${today}"></div>
          <div class="flow-tb-field" id="flowTbEndDateWrap"><label>Data final</label><input class="inp" id="flowTbEndDate" type="date" value="${today}"></div>
        </div>
        <div class="flow-tb-field" id="flowTbRepeatWrap">
          <label>Recorrência</label>
          <select class="inp" id="flowTbRepeat">
            <option value="daily">Todos os dias</option>
            <option value="weekdays" selected>Dias úteis</option>
            <option value="weekly">Semanal</option>
          </select>
        </div>
      `;
      task.closest('.inp-row')?.insertAdjacentElement('afterend', block);
      const oldDate = document.getElementById('tbDate');
      const oldRepeat = document.getElementById('tbRepeat');
      if(oldDate) oldDate.closest('.inp-row')?.style.setProperty('display','none','important');
      if(oldRepeat) oldRepeat.closest('.inp-row')?.style.setProperty('display','none','important');
      const sync = () => {
        const mode = document.getElementById('flowTbMode')?.value || 'single';
        const allDay = !!document.getElementById('flowTbAllDay')?.checked;
        const endWrap = document.getElementById('flowTbEndDateWrap');
        const repeatWrap = document.getElementById('flowTbRepeatWrap');
        const label = document.getElementById('flowTbStartDateLabel');
        const timeRow = document.getElementById('tbStart')?.closest('.inp-row');
        if(endWrap) endWrap.style.display = mode === 'period' ? '' : 'none';
        if(repeatWrap) repeatWrap.style.display = mode === 'single' ? 'none' : '';
        if(label) label.textContent = mode === 'single' ? 'Data' : 'Data inicial';
        if(timeRow) timeRow.style.display = allDay ? 'none' : '';
      };
      ['flowTbMode','flowTbAllDay'].forEach(id => document.getElementById(id)?.addEventListener('change', sync));
      sync();
    },
    createFromModal(){
      const task = document.getElementById('tbTask')?.value?.trim();
      const color = document.getElementById('tbColor')?.value || '#fb923c';
      const mode = document.getElementById('flowTbMode')?.value || 'single';
      const allDay = !!document.getElementById('flowTbAllDay')?.checked;
      const start = allDay ? '00:00' : document.getElementById('tbStart')?.value;
      const end = allDay ? '23:59' : document.getElementById('tbEnd')?.value;
      const startDate = document.getElementById('flowTbStartDate')?.value || document.getElementById('tbDate')?.value || Utils.ymd();
      const endDate = document.getElementById('flowTbEndDate')?.value || startDate;
      const repeat = mode === 'single' ? 'none' : (document.getElementById('flowTbRepeat')?.value || 'weekdays');
      if(!task || !start || !end) return false;
      const S = State.ensure();
      const item = this.normalize({id:Date.now(), task, color, start, end, allDay, repeat, date:startDate, startDate});
      if(mode === 'single'){
        S.timeBlocks.push(Object.assign({}, item, {repeat:'none', date:startDate}));
      }else{
        S.timeBlockRules.push(Object.assign({}, item, {repeat, startDate, endDate: mode === 'period' ? endDate : ''}));
      }
      document.getElementById('tbTask').value = '';
      if(window.Flow.Storage) window.Flow.Storage.commit('tasks');
      if(typeof closeModal === 'function') closeModal('tbModal');
      return true;
    },
    renderList(){
      const wrap = document.getElementById('timeBlocks');
      if(!wrap) return;
      const S = State.ensure();
      const rules = [...(S.timeBlockRules || [])];
      const singles = [...(S.timeBlocks || [])];
      if(!rules.length && !singles.length){ wrap.innerHTML='<div class="empty">Nenhum bloco de tempo.</div>'; return; }
      const dateLabel = (value) => {
        const d = Utils.parseDateOnly(value);
        return d ? d.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'2-digit'}) : '—';
      };
      wrap.innerHTML = '';
      rules.forEach(rule => {
        const el = document.createElement('div');
        el.className = 'tb-slot-premium';
        const period = rule.endDate ? `${dateLabel(rule.startDate || rule.date)} até ${dateLabel(rule.endDate)}` : `desde ${dateLabel(rule.startDate || rule.date)}`;
        el.innerHTML = `<div class="tb-color" style="background:${rule.color || '#fb923c'}"></div><div class="tb-time">${rule.allDay?'Dia<br>inteiro':`${rule.start}<br>${rule.end}`}</div><div class="tb-task"><div style="font-size:14px;font-weight:700">${Utils.escape(rule.task)}</div><div class="tb-repeat">${window.Flow.Calendar?.repeatLabel(rule.repeat) || rule.repeat} · ${period}</div></div><button class="li-del" onclick="Flow.TimeBlocks.deleteRule(${Number(rule.id)})">×</button>`;
        wrap.appendChild(el);
      });
      singles.forEach(block => {
        const el = document.createElement('div');
        el.className = 'tb-slot-premium';
        el.innerHTML = `<div class="tb-color" style="background:${block.color || '#fb923c'}"></div><div class="tb-time">${block.allDay?'Dia<br>inteiro':`${block.start}<br>${block.end}`}</div><div class="tb-task"><div style="font-size:14px;font-weight:700">${Utils.escape(block.task)}</div><div class="tb-repeat">${dateLabel(block.date || block.startDate)}</div></div><button class="li-del" onclick="Flow.TimeBlocks.deleteSingle(${Number(block.id)})">×</button>`;
        wrap.appendChild(el);
      });
    },
    deleteRule(id){
      const S = State.ensure();
      S.timeBlockRules = (S.timeBlockRules || []).filter(item => Number(item.id) !== Number(id));
      window.Flow.Storage?.commit('tasks');
    },
    deleteSingle(id){
      const S = State.ensure();
      S.timeBlocks = (S.timeBlocks || []).filter(item => Number(item.id) !== Number(id));
      window.Flow.Storage?.commit('tasks');
    },
    installCompatibility(){
      window.saveTB = () => this.createFromModal();
      window.renderTimeBlocks = () => this.renderList();
    }
  };

  window.Flow.TimeBlocks = TimeBlocks;
})();
