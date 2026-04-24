/* FLOW Foundation v15.0 — Bridge
   Inicialização agressiva sem app.legacy.js ativo. Instala compatibilidade dos módulos
   e usa Flow.App como runtime principal.
*/
(function(){
  'use strict';
  const Flow = window.Flow = window.Flow || {};

  function installSaveBridge(){
    window.save = function(){ return Flow.Storage?.commit?.('all', {refresh:false}); };
    window.saveSafe = window.save;
    window.commitApp = (scope='all', options={}) => Flow.Storage?.commit?.(scope, options);
  }

  function installModules(){
    try{ Flow.TimeBlocks?.installCompatibility?.(); }catch(e){}
    try{ Flow.Tasks?.installCompatibility?.(); }catch(e){}
    try{ Flow.Calendar?.installCompatibility?.(); }catch(e){}
    try{ Flow.Overview?.installCompatibility?.(); }catch(e){}
    try{ Flow.Water?.installCompatibility?.(); }catch(e){}
    try{ Flow.Food?.installCompatibility?.(); }catch(e){}
    try{ Flow.Health?.installCompatibility?.(); }catch(e){}
    try{ Flow.Focus?.installCompatibility?.(); }catch(e){}
    try{ Flow.Habits?.installCompatibility?.(); }catch(e){}
    try{ Flow.Mood?.installCompatibility?.(); }catch(e){}
    try{ Flow.Settings?.installCompatibility?.(); }catch(e){}
    try{ Flow.Onboarding?.installCompatibility?.(); }catch(e){}
    try{ Flow.Sleep?.installLegacyBridge?.(); }catch(e){}
    try{ Flow.Sleep?.bind?.(); }catch(e){}
    try{ Flow.Focus?.bind?.(); }catch(e){}
    try{ Flow.Mood?.bind?.(); }catch(e){}
    try{ Flow.Settings?.bind?.(); }catch(e){}
    try{ Flow.Tasks?.boot?.(); }catch(e){}
    try{ Flow.TimeBlocks?.ensureModalControls?.(); }catch(e){}
  }

  function boot(){
    if(window.__flowFoundationV15Booted){
      try{ Flow.Storage?.commit?.('all', {refresh:false}); }catch(e){}
      return;
    }
    window.__flowFoundationV15Booted = true;
    installSaveBridge();
    try{ Flow.App?.installCompatibility?.(); }catch(e){}
    installModules();
    try{ Flow.App?.start?.(); }catch(e){ console.error('[FLOW Foundation] erro no boot v15', e); }
    try{ window.FlowFoundationV15 = Flow; }catch(e){}
    try{ window.__flowFoundationV15Report = Flow.Diagnostics?.report?.(); }catch(e){}
  }

  document.addEventListener('DOMContentLoaded', boot);
  setTimeout(boot, 600);
})();
