/* FLOW Foundation v12.0 — Storage
   Uma única entrada oficial para persistir estado, com fallback para o legado.
*/
(function(){
  'use strict';
  const { State, Utils } = window.Flow;

  const Storage = {
    rawLoad(){
      try { return JSON.parse(localStorage.getItem(window.Flow.storageKey) || '{}'); }
      catch(e){ return {}; }
    },
    save(){
      const state = State.ensure();
      try { localStorage.setItem(window.Flow.storageKey, JSON.stringify(state)); }
      catch(e){ console.warn('[FLOW Foundation] Falha ao salvar localStorage', e); }
      return state;
    },
    commit(scope = 'all', options = {}){
      const state = State.ensure();
      if(window.Flow.Sleep && options.pullDom !== false) window.Flow.Sleep.pullFromDOM();
      if(window.Flow.History && options.syncHistory !== false) window.Flow.History.syncToday();
      this.save();
      if(window.Flow.UI && options.refresh !== false) window.Flow.UI.refresh(scope);
      return state;
    },
    autosave(scope = 'all'){
      const fn = Utils.debounce(()=>this.commit(scope, {refresh:false}), 150);
      return fn;
    }
  };

  window.Flow.Storage = Storage;
})();
