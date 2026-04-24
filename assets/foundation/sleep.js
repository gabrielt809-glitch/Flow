/* FLOW Foundation v15.0 — Sleep
   Módulo oficial de sono: cálculo, DOM, persistência e compatibilidade com legado.
*/
(function(){
  'use strict';
  const { State, Utils } = window.Flow;

  const Sleep = {
    calculate(start = '23:00', end = '07:00'){
      const [sh, sm] = String(start || '23:00').split(':').map(Number);
      const [eh, em] = String(end || '07:00').split(':').map(Number);
      if([sh,sm,eh,em].some(Number.isNaN)) return 0;
      let mins = (eh * 60 + em) - (sh * 60 + sm);
      if(mins < 0) mins += 1440;
      return Number((mins / 60).toFixed(1));
    },
    pullFromDOM(){
      const S = State.ensure();
      const start = document.getElementById('sleepStart');
      const end = document.getElementById('sleepEnd');
      if(start) S.sleepStart = start.value || S.sleepStart || '23:00';
      if(end) S.sleepEnd = end.value || S.sleepEnd || '07:00';
      S.sleep = this.calculate(S.sleepStart, S.sleepEnd);
      return S.sleep;
    },
    pushToDOM(){
      const S = State.ensure();
      const start = document.getElementById('sleepStart');
      const end = document.getElementById('sleepEnd');
      if(start) start.value = S.sleepStart || '23:00';
      if(end) end.value = S.sleepEnd || '07:00';
      document.querySelectorAll('.qual-btn').forEach(btn => {
        btn.classList.toggle('sel', Number(btn.dataset.q) === Number(S.sleepQuality || 0));
      });
    },
    getHours(){
      this.pullFromDOM();
      return State.ensure().sleep || 0;
    },
    setQuality(q, shouldCommit = true){
      State.ensure().sleepQuality = Utils.number(q, 0);
      this.pushToDOM();
      if(shouldCommit && window.Flow.Storage) window.Flow.Storage.commit('sleep');
    },
    render(){
      const S = State.ensure();
      const hrs = this.getHours();
      const hrsEl = document.getElementById('sleepHrs');
      if(hrsEl) hrsEl.textContent = hrs || '—';
      const goal = Utils.number(S.goals?.sleep, 8) || 8;
      const pct = Utils.clamp((hrs / goal) * 100, 0, 100);
      const arc = document.getElementById('sleepArc');
      if(arc) arc.style.strokeDashoffset = 314 - (314 * pct / 100);
      const [sh, sm] = String(S.sleepStart || '23:00').split(':').map(Number);
      const wakeMin = (sh * 60 + sm) + goal * 60;
      const wh = Math.floor(wakeMin / 60) % 24;
      const wm = wakeMin % 60;
      const alarm = document.getElementById('alarmSugg');
      if(alarm) alarm.textContent = `${String(wh).padStart(2,'0')}:${String(wm).padStart(2,'0')}`;
      const week = window.Flow.History ? window.Flow.History.week() : [];
      const debt = week.reduce((sum, item)=>sum + Math.max(0, goal - Utils.number(item.sleep, 0)), 0);
      const debtEl = document.getElementById('sleepDebt');
      if(debtEl) debtEl.textContent = debt.toFixed(1) + 'h';
      const recCard = document.getElementById('sleepRecCard');
      const rec = document.getElementById('sleepRec');
      if(recCard && rec){
        if(hrs && hrs < goal - 1.5){
          recCard.style.display = '';
          rec.textContent = '😴 Você dormiu pouco. Hoje tente manter uma rotina mais leve e dormir um pouco mais cedo.';
        }else if(hrs >= goal){
          recCard.style.display = '';
          rec.textContent = '✨ Ótimo sono! Você está bem descansado para manter consistência nas metas.';
        }else{
          recCard.style.display = 'none';
        }
      }
    },
    bind(){
      this.pushToDOM();
      const commit = Utils.debounce(()=>{
        this.pullFromDOM();
        if(window.Flow.Storage) window.Flow.Storage.commit('sleep');
      }, 100);
      ['sleepStart','sleepEnd'].forEach(id => {
        const el = document.getElementById(id);
        if(el && !el.dataset.flowFoundationV3){
          el.dataset.flowFoundationV3 = '1';
          ['input','change','blur'].forEach(evt => el.addEventListener(evt, commit));
        }
      });
      document.querySelectorAll('.qual-btn').forEach(btn => {
        if(!btn.dataset.flowFoundationV3){
          btn.dataset.flowFoundationV3 = '1';
          btn.addEventListener('click', ()=>this.setQuality(Number(btn.dataset.q), true));
        }
      });
    },
    installLegacyBridge(){
      const originalCalcSleep = window.calcSleep;
      window.getSleepHours = () => this.getHours();
      window.calcSleep = () => {
        this.render();
        if(window.Flow.Storage) window.Flow.Storage.commit('sleep', {refresh:false});
        return State.ensure().sleep;
      };
      window.setSleepQual = (q, sv = true) => this.setQuality(q, sv);
      window.Flow._legacyCalcSleep = originalCalcSleep;
    }
  };

  window.Flow.Sleep = Sleep;
})();
