/* FLOW Foundation v15.0 — Legacy Gate
   Camada de governança para remoção controlada do legado.
   Não altera a experiência do usuário: apenas registra ownership e pontos que já pertencem à fundação.
*/
(function(){
  'use strict';
  const Flow = window.Flow || (window.Flow = {});
  Flow.LegacyGate = {
    version:'11.0.0',
    mode:'safe-quarantine',
    ownedGlobals:[
      'save','saveSafe','commitApp',
      'renderTaskCalendar','changeTaskCalendar','openCalendarDay',
      'saveTB','renderTimeBlocks',
      'addTask','renderTasks','deleteTask','toggleTask','filterTasks','updateWorkProgress','openTaskDetail',
      'renderOverview','calcScore',
      'renderWater','addWater','quickAddWater','setDrink','setCupSize',
      'renderFood','deleteMeal','deleteMealGroup',
      'renderHealth','addSteps','saveHR','confirmWeight','saveMeasures',
      'renderStudy','setMode','toggleTimer','resetTimer','savePomGoal',
      'renderHabits','saveHabit','toggleHabit','deleteHabit','renderHeatmap',
      'renderMood','setMood','saveGratitude','saveReview',
      'renderSettings','toggleTheme','applyTheme','setAccentColor','changeEmoji','exportData','confirmReset',
      'finishOnboard','showApp'
    ],
    report(){
      const missing = this.ownedGlobals.filter(name => typeof window[name] !== 'function');
      const present = this.ownedGlobals.filter(name => typeof window[name] === 'function');
      return {
        version:this.version,
        mode:this.mode,
        ownedGlobals:this.ownedGlobals.length,
        present:present.length,
        missing,
        legacyRuntimeLoaded:!!window.__flowLegacyRuntimeLoaded,
        note:'v11 inicia remoção controlada por quarantine/backup/gate. Funções críticas seguem com fallback até validação completa.'
      };
    },
    print(){ console.table(this.report()); return this.report(); }
  };
  window.FlowLegacyGate = Flow.LegacyGate;
})();
