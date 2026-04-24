/* FLOW Foundation v15.0 — Core
   Camada oficial de namespace, utilitários e acesso ao estado legado S.
*/
(function(){
  'use strict';

  const VERSION = '15.0.0';
  const STORAGE_KEY = 'flow_v3';

  const Utils = {
    todayKey(date = new Date()){
      return new Date(date).toDateString();
    },
    ymd(date = new Date()){
      const d = new Date(date);
      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    },
    parseDateOnly(value){
      if(!value) return null;
      const parts = String(value).slice(0,10).split('-').map(Number);
      if(parts.length !== 3 || parts.some(Number.isNaN)) return null;
      return new Date(parts[0], parts[1]-1, parts[2]);
    },
    addDays(date, amount){
      const d = new Date(date);
      d.setDate(d.getDate() + Number(amount || 0));
      return d;
    },
    number(value, fallback = 0){
      const n = Number(value);
      return Number.isFinite(n) ? n : fallback;
    },
    clamp(value, min, max){
      return Math.min(max, Math.max(min, value));
    },
    escape(value){
      return String(value ?? '').replace(/[&<>"']/g, ch => ({
        '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
      }[ch]));
    },
    debounce(fn, wait = 150){
      let timer;
      return function(...args){
        clearTimeout(timer);
        timer = setTimeout(()=>fn.apply(this,args), wait);
      };
    }
  };

  const State = {
    get(){
      window.S = window.S || {};
      return window.S;
    },
    ensure(){
      const state = this.get();
      state.history = state.history && typeof state.history === 'object' ? state.history : {};
      state.goals = state.goals && typeof state.goals === 'object' ? state.goals : {};
      state.profile = state.profile && typeof state.profile === 'object' ? state.profile : {};
      state.tasks = Array.isArray(state.tasks) ? state.tasks : [];
      state.taskRules = Array.isArray(state.taskRules) ? state.taskRules : [];
      state.timeBlocks = Array.isArray(state.timeBlocks) ? state.timeBlocks : [];
      state.timeBlockRules = Array.isArray(state.timeBlockRules) ? state.timeBlockRules : [];
      state.timeBlockSkips = Array.isArray(state.timeBlockSkips) ? state.timeBlockSkips : [];
      state.calendarBlockSkips = Array.isArray(state.calendarBlockSkips) ? state.calendarBlockSkips : [];
      state.meals = Array.isArray(state.meals) ? state.meals : [];
      state.workouts = Array.isArray(state.workouts) ? state.workouts : [];
      state.studySessions = Array.isArray(state.studySessions) ? state.studySessions : [];
      state.pomsDone = Utils.number(state.pomsDone, 0);
      state.studyNotes = state.studyNotes || '';
      state.habits = Array.isArray(state.habits) ? state.habits : [];
      state.habitLogs = state.habitLogs && typeof state.habitLogs === 'object' ? state.habitLogs : {};
      state.mood = Utils.number(state.mood, 0);
      state.gratitude = Array.isArray(state.gratitude) ? state.gratitude : ['', '', ''];
      state.review = Array.isArray(state.review) ? state.review : ['', '', ''];
      state.sleepStart = state.sleepStart || '23:00';
      state.sleepEnd = state.sleepEnd || '07:00';
      state.sleepQuality = Utils.number(state.sleepQuality, 0);
      state.goals.sleep = Utils.number(state.goals.sleep, 8) || 8;
      state.goals.steps = Utils.number(state.goals.steps, 10000) || 10000;
      state.goals.calories = Utils.number(state.goals.calories, 2000) || 2000;
      state.goals.pomodoros = Utils.number(state.goals.pomodoros, 4) || 4;
      state.foundation = Object.assign({}, state.foundation || {}, {
        version: VERSION,
        updatedAt: new Date().toISOString()
      });
      return state;
    },
    patch(partial){
      const state = this.ensure();
      Object.assign(state, partial || {});
      return state;
    }
  };

  window.Flow = window.Flow || {};
  Object.assign(window.Flow, {
    version: VERSION,
    storageKey: STORAGE_KEY,
    Utils,
    State,
    modules: window.Flow.modules || {}
  });
})();
