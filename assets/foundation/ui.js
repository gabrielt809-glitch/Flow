/* FLOW Foundation v15.0 — UI
   Refresh coordenado, sem espalhar chamadas manuais em cada módulo.
*/
(function(){
  'use strict';
  const { Utils } = window.Flow;

  const UI = {
    groups:{
      sleep:['Flow.Sleep.render','Flow.Overview.render','renderCharts'],
      tasks:['Flow.Tasks.render','Flow.Tasks.updateProgress','Flow.TimeBlocks.renderList','Flow.Calendar.render','Flow.Overview.render'],
      food:['Flow.Food.render','Flow.Overview.render','renderCharts'],
      water:['Flow.Water.render','Flow.Overview.render','renderCharts'],
      health:['Flow.Health.render','Flow.Overview.render','renderCharts'],
      focus:['Flow.Focus.render','Flow.Overview.render','renderCharts'],
      habits:['Flow.Habits.render','Flow.Overview.render','renderCharts'],
      mood:['Flow.Mood.render','Flow.Settings.render','Flow.Overview.render','renderCharts'],
      overview:['Flow.Overview.render'],
      settings:['Flow.Settings.render','Flow.Overview.render'],
      all:['Flow.Sleep.render','Flow.Tasks.render','Flow.Tasks.updateProgress','Flow.TimeBlocks.renderList','Flow.Calendar.render','Flow.Water.render','Flow.Food.render','Flow.Health.render','Flow.Focus.render','Flow.Habits.render','Flow.Mood.render','Flow.Settings.render','Flow.Overview.render','renderCharts']
    },
    call(name){
      try{
        if(name.includes('.')){
          const parts = name.split('.');
          const fnName = parts.pop();
          let owner = window;
          for(const part of parts) owner = owner?.[part];
          const fn = owner?.[fnName];
          if(typeof fn === 'function') return fn.call(owner);
          return;
        }
        if(typeof window[name] === 'function') window[name]();
      }catch(e){ console.warn('[FLOW Foundation] refresh falhou:', name, e); }
    },
    refresh(scope = 'all'){
      const calls = this.groups[scope] || this.groups.all;
      calls.forEach(name => this.call(name));
    },
    bindGlobalPersistence(){
      if(window.__flowFoundationV11GlobalBound) return;
      window.__flowFoundationV11GlobalBound = true;
      const softCommit = Utils.debounce(()=>window.Flow.Storage?.commit('all', {refresh:false}), 180);
      document.addEventListener('visibilitychange', ()=>{
        if(document.visibilityState === 'hidden') window.Flow.Storage?.commit('all', {refresh:false});
        if(document.visibilityState === 'visible') window.Flow.Storage?.commit('all');
      });
      window.addEventListener('pagehide', ()=>window.Flow.Storage?.commit('all', {refresh:false}));
      window.addEventListener('beforeunload', ()=>window.Flow.Storage?.commit('all', {refresh:false}));
      document.addEventListener('input', e => {
        if(e.target?.closest?.('.sec')) softCommit();
      }, true);
      document.addEventListener('change', e => {
        if(e.target?.closest?.('.sec')) window.Flow.Storage?.commit('all', {refresh:false});
      }, true);
    }
  };

  window.Flow.UI = UI;
})();
