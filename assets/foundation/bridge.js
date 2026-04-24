/* FLOW Foundation v12.0 — Bridge
   Instala compatibilidade com o legado e inicializa módulos oficiais.
*/
(function(){
  'use strict';

  const Flow = window.Flow;
  const originalSave = typeof window.save === 'function' ? window.save : null;
  const originalSaveSafe = typeof window.saveSafe === 'function' ? window.saveSafe : null;

  function installSaveBridge(){
    window.save = function(){
      try{ Flow.History?.syncToday(); }catch(e){}
      try{
        if(originalSave) originalSave.apply(this, arguments);
        else Flow.Storage?.save();
      }catch(e){
        Flow.Storage?.save();
      }
    };
    window.saveSafe = function(){
      try{ window.save(); }
      catch(e){
        try{ if(originalSaveSafe) originalSaveSafe.apply(this, arguments); }catch(err){}
        Flow.Storage?.save();
      }
    };
    window.commitApp = (scope = 'all') => Flow.Storage?.commit(scope);
  }

  function boot(){
    if(window.__flowFoundationV12Booted){
      try{ Flow.Storage?.commit('all', {refresh:false}); }catch(e){}
      return;
    }
    window.__flowFoundationV12Booted = true;
    try{ Flow.State.ensure(); }catch(e){}
    try{ Flow.TimeBlocks?.installCompatibility(); }catch(e){}
    try{ Flow.Tasks?.installCompatibility(); }catch(e){}
    try{ Flow.Calendar?.installCompatibility(); }catch(e){}
    try{ Flow.Overview?.installCompatibility(); }catch(e){}
    try{ Flow.Water?.installCompatibility(); }catch(e){}
    try{ Flow.Food?.installCompatibility(); }catch(e){}
    try{ Flow.Health?.installCompatibility(); }catch(e){}
    try{ Flow.Focus?.installCompatibility(); }catch(e){}
    try{ Flow.Habits?.installCompatibility(); }catch(e){}
    try{ Flow.Mood?.installCompatibility(); }catch(e){}
    try{ Flow.Settings?.installCompatibility(); }catch(e){}
    try{ Flow.Onboarding?.installCompatibility(); }catch(e){}
    try{ Flow.Sleep?.installLegacyBridge(); }catch(e){}
    try{ Flow.Sleep?.bind(); }catch(e){}
    try{ Flow.Focus?.bind(); }catch(e){}
    try{ Flow.Mood?.bind(); }catch(e){}
    try{ Flow.Settings?.bind(); }catch(e){}
    try{ Flow.Tasks?.boot(); }catch(e){}
    try{ Flow.UI?.bindGlobalPersistence(); }catch(e){}
    try{ Flow.Storage?.commit('all'); }catch(e){ try{ Flow.Storage?.save(); }catch(err){} }
    try{ Flow.Focus?.render(); }catch(e){}
    try{ Flow.Habits?.render(); }catch(e){}
    try{ Flow.Mood?.render(); }catch(e){}
    try{ Flow.Settings?.render(); }catch(e){}
    try{ Flow.Overview?.render(); }catch(e){}
    window.FlowFoundationV12 = Flow;
    console.info('[FLOW Foundation] v' + Flow.version + ' ativa — módulos oficiais carregados.');
    try{ window.__flowFoundationV11Report = Flow.Diagnostics?.report?.(); }catch(e){}
  }

  installSaveBridge();
  document.addEventListener('DOMContentLoaded', boot);
  setTimeout(boot, 700);
  setTimeout(boot, 1600);
})();
