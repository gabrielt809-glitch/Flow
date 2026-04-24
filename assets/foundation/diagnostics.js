/* FLOW Foundation v15.0 — Diagnostics
   Ferramenta leve de auditoria em runtime. Não altera comportamento do app.
*/
(function(){
  'use strict';
  const Flow = window.Flow = window.Flow || {};

  const Diagnostics = {
    expectedModules:['State','Storage','History','Sleep','TimeBlocks','Calendar','Tasks','Overview','Water','Food','Health','Focus','Habits','Mood','Settings','Onboarding','UI','Manifest'],
    moduleStatus(){
      return this.expectedModules.reduce((acc, name)=>{
        acc[name] = !!Flow[name];
        return acc;
      },{});
    },
    stateShape(){
      const S = Flow.State?.ensure?.() || window.S || {};
      return {
        tasks:Array.isArray(S.tasks) ? S.tasks.length : null,
        taskRules:Array.isArray(S.taskRules) ? S.taskRules.length : null,
        timeBlocks:Array.isArray(S.timeBlocks) ? S.timeBlocks.length : null,
        timeBlockRules:Array.isArray(S.timeBlockRules) ? S.timeBlockRules.length : null,
        timeBlockSkips:Array.isArray(S.timeBlockSkips) ? S.timeBlockSkips.length : null,
        meals:Array.isArray(S.meals) ? S.meals.length : null,
        workouts:Array.isArray(S.workouts) ? S.workouts.length : null,
        habits:Array.isArray(S.habits) ? S.habits.length : null,
        historyDays:S.history && typeof S.history === 'object' ? Object.keys(S.history).length : 0,
        onboarded:!!S.onboarded
      };
    },
    globals(){
      const list = Flow.Manifest?.legacyGlobals || [];
      return list.reduce((acc, name)=>{
        acc[name] = typeof window[name] === 'function' ? 'function' : typeof window[name];
        return acc;
      },{});
    },
    report(){
      return {
        foundationVersion:Flow.version,
        manifestVersion:Flow.Manifest?.version,
        modules:this.moduleStatus(),
        state:this.stateShape(),
        globals:this.globals(),
        timestamp:new Date().toISOString()
      };
    },
    print(){
      const report=this.report();
      console.group('[FLOW Foundation] Diagnóstico v11');
      console.table(report.modules);
      console.log('Estado:', report.state);
      console.groupEnd();
      return report;
    }
  };

  Flow.Diagnostics = Diagnostics;
})();


/* v11: complemento de diagnóstico do LegacyGate */
(function(){
  'use strict';
  const Flow = window.Flow;
  if(!Flow || !Flow.Diagnostics || Flow.Diagnostics.__v11Patched) return;
  const originalReport = Flow.Diagnostics.report?.bind(Flow.Diagnostics);
  Flow.Diagnostics.report = function(){
    const base = originalReport ? originalReport() : {};
    base.legacyGate = Flow.LegacyGate?.report?.() || null;
    return base;
  };
  Flow.Diagnostics.__v11Patched = true;
})();
