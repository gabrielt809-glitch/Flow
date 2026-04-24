/* FLOW Foundation v15.0 — Habits
   Módulo oficial para hábitos, logs, streaks e estatísticas.
*/
(function(){
  'use strict';
  const { State, Storage, Utils } = window.Flow;

  const Habits = {
    ensure(){
      const S=State.ensure();
      S.habits=Array.isArray(S.habits)?S.habits:[];
      S.habitLogs=S.habitLogs && typeof S.habitLogs==='object' ? S.habitLogs : {};
      S.today=S.today || Utils.todayKey();
      return S;
    },
    logKey(date, id){ return `${Utils.todayKey(date)}*${id}`; },
    altLogKey(date, id){ return `${Utils.todayKey(date)}_${id}`; },
    isDoneOn(habitId, date=new Date()){
      const S=this.ensure();
      return !!(S.habitLogs[this.logKey(date,habitId)] || S.habitLogs[this.altLogKey(date,habitId)]);
    },
    openAdd(){ const modal=document.getElementById('habitModal'); if(modal) modal.classList.add('open'); },
    saveHabit(){
      const S=this.ensure();
      const name=(document.getElementById('habitName')?.value || '').trim();
      if(!name) return;
      const cat=document.getElementById('habitCat')?.value || 'Geral';
      const icon=document.getElementById('habitIcon')?.value || '⭐';
      S.habits.push({id:Date.now(),name,cat,icon,streak:0,createdAt:new Date().toISOString()});
      ['habitName','habitIcon'].forEach(id=>{ const el=document.getElementById(id); if(el) el.value=''; });
      Storage.commit('habits');
      try{ if(typeof closeModal==='function') closeModal('habitModal'); }catch(e){}
    },
    toggle(id){
      const S=this.ensure();
      const key=this.logKey(new Date(), id);
      if(S.habitLogs[key]) delete S.habitLogs[key];
      else S.habitLogs[key]=1;
      Storage.commit('habits');
    },
    remove(id){
      const S=this.ensure();
      S.habits=S.habits.filter(h=>Number(h.id)!==Number(id));
      Object.keys(S.habitLogs || {}).forEach(key=>{
        if(key.endsWith('*'+id) || key.endsWith('_'+id)) delete S.habitLogs[key];
      });
      Storage.commit('habits');
    },
    streak(habitId){
      let streak=0;
      const today=new Date();
      for(let i=0;i<90;i++){
        const d=Utils.addDays(today, -i);
        if(this.isDoneOn(habitId,d)) streak++;
        else if(i>0) break;
      }
      return streak;
    },
    render(){
      const S=this.ensure();
      const wrap=document.getElementById('habitsList'); if(!wrap) return;
      if(!S.habits.length){
        wrap.innerHTML='<div class="empty">Nenhum hábito. Crie um acima!</div>';
        this.renderStats();
        this.renderHeatmap();
        return;
      }
      wrap.innerHTML='';
      S.habits.forEach(h=>{
        const done=this.isDoneOn(h.id);
        const streak=this.streak(h.id);
        const el=document.createElement('div');
        el.className='habit-item';
        el.innerHTML=`<div class="habit-check ${done?'done':''}" onclick="toggleHabit(${h.id})">${done?'✓':''}</div><div class="habit-info"><div class="habit-name">${Utils.escape(h.icon || '⭐')} ${Utils.escape(h.name)}</div><div class="habit-streak">${Utils.escape(h.cat || 'Geral')} · <span>${streak>0?'🔥 '+streak+' dias':'Ainda não feito'}</span></div></div><button class="li-del" onclick="deleteHabit(${h.id})">×</button>`;
        wrap.appendChild(el);
      });
      this.renderStats();
      this.renderHeatmap();
    },
    renderStats(){
      const S=this.ensure();
      const wrap=document.getElementById('habitStats'); if(!wrap) return;
      if(!S.habits.length){ wrap.innerHTML='<div class="empty">Sem dados.</div>'; return; }
      wrap.innerHTML='';
      S.habits.forEach(h=>{
        let done=0;
        for(let i=0;i<7;i++) if(this.isDoneOn(h.id, Utils.addDays(new Date(), -i))) done++;
        const pct=Math.round(done/7*100);
        const el=document.createElement('div');
        el.style.cssText='margin-bottom:12px';
        el.innerHTML=`<div style="display:flex;justify-content:space-between;margin-bottom:4px"><span style="font-size:13px">${Utils.escape(h.icon || '⭐')} ${Utils.escape(h.name)}</span><span style="font-family:'DM Mono',monospace;font-size:11px;color:var(--habits)">${pct}% (7 dias)</span></div><div class="prog-wrap" style="--acc:var(--habits)"><div class="prog-bar" style="width:${pct}%;background:var(--habits)"></div></div>`;
        wrap.appendChild(el);
      });
    },
    renderHeatmap(){
      const S=this.ensure();
      const wrap=document.getElementById('habitHeatmap'); if(!wrap) return;
      wrap.innerHTML='';
      for(let i=90;i>=0;i--){
        const d=Utils.addDays(new Date(), -i);
        const doneCount=S.habits.filter(h=>this.isDoneOn(h.id,d)).length;
        const total=S.habits.length || 1;
        const pct=doneCount/total;
        const cell=document.createElement('div');
        cell.className='hm-cell'+(pct===0?'':pct<0.33?' l1':pct<0.66?' l2':pct<1?' l3':' l4');
        cell.title=d.toLocaleDateString('pt-BR')+': '+doneCount+'/'+S.habits.length;
        wrap.appendChild(cell);
      }
    },
    doneTodayCount(){
      const S=this.ensure();
      return S.habits.filter(h=>this.isDoneOn(h.id)).length;
    },
    installCompatibility(){
      window.openAddHabit=()=>this.openAdd();
      window.saveHabit=()=>this.saveHabit();
      window.toggleHabit=(id)=>this.toggle(id);
      window.deleteHabit=(id)=>this.remove(id);
      window.renderHabits=()=>this.render();
      window.renderHabitStats=()=>this.renderStats();
      window.renderHeatmap=()=>this.renderHeatmap();
    }
  };

  window.Flow.Habits = Habits;
})();
