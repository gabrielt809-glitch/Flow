/* FLOW Foundation v12.0 — Manifest
   Declara os módulos oficiais e o status de migração para orientar manutenção futura.
*/
(function(){
  'use strict';
  const Flow = window.Flow = window.Flow || {};

  const modules = {
    core:{status:'official', owns:['namespace','utils','state normalization']},
    storage:{status:'official', owns:['save','commit','local persistence']},
    history:{status:'official', owns:['daily history','weekly history inputs']},
    sleep:{status:'official', owns:['sleep form','sleep duration','sleep persistence']},
    timeblocks:{status:'official', owns:['time block creation','occurrences','skip/restore']},
    calendar:{status:'official', owns:['weekly calendar','day modal','calendar events']},
    tasks:{status:'official', owns:['task CRUD','task filters','task progress']},
    overview:{status:'official', owns:['score','home cards','spotlight']},
    water:{status:'official', owns:['hydration state','cups','drink type']},
    food:{status:'official', owns:['meals','nutrition totals']},
    health:{status:'official', owns:['steps','weight','workouts','measurements']},
    focus:{status:'official', owns:['pomodoro','study sessions','focus player bridge']},
    habits:{status:'official', owns:['habits','habit heatmap']},
    mood:{status:'official', owns:['mood','gratitude','review']},
    settings:{status:'official', owns:['profile','goals','theme','export/reset']},
    onboarding:{status:'official', owns:['first setup','show app']},
    ui:{status:'official', owns:['coordinated refresh','global persistence hooks']},
    bridge:{status:'compatibility', owns:['legacy global function redirection']}
  };

  const legacyGlobals = [
    'save','saveSafe','commitApp','renderOverview','calcScore','renderTasks','addTask','deleteTask','toggleTask','filterTasks','updateWorkProgress','openTaskDetail',
    'renderTaskCalendar','openCalendarDay','changeTaskCalendar','saveTB','renderTimeBlocks','timeBlockOccurrences','renderWater','addWater','quickAddWater','setDrink','setCupSize',
    'renderFood','deleteMeal','deleteMealGroup','renderHealth','addSteps','saveHR','confirmWeight','saveMeasures','renderStudy','setMode','toggleTimer','resetTimer','savePomGoal',
    'renderHabits','saveHabit','toggleHabit','deleteHabit','renderHeatmap','renderMood','setMood','saveGratitude','saveReview','renderSettings','toggleTheme','applyTheme',
    'setAccentColor','changeEmoji','exportData','confirmReset','finishOnboard','showApp'
  ];

  Flow.Manifest = {
    version:'10.0.0',
    modules,
    legacyGlobals,
    generatedAt:new Date().toISOString(),
    ownerFor(moduleName){ return modules[moduleName] || null; },
    listOfficial(){ return Object.entries(modules).filter(([,m])=>m.status==='official').map(([name])=>name); }
  };
})();
