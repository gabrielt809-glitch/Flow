/* FLOW Foundation v12.0 — History
   Histórico diário consolidado para gráficos semanais e score.
*/
(function(){
  'use strict';
  const { State, Utils } = window.Flow;

  const History = {
    totalCalories(){
      const S = State.ensure();
      return (S.meals || []).reduce((sum, meal)=>sum + Utils.number(meal.kcal ?? meal.calories, 0), 0);
    },
    currentWaterGoal(){
      const S = State.ensure();
      try { if(typeof calcWaterGoalMl === 'function') return Utils.number(calcWaterGoalMl(), 2000); } catch(e){}
      try { if(typeof calcBaseWaterMl === 'function') return Utils.number(calcBaseWaterMl(), 2000); } catch(e){}
      return Utils.number(S.goals?.waterBaseMl || S.goals?.waterMl || (S.goals?.water ? S.goals.water * 250 : 2000), 2000);
    },
    currentScore(){
      try { if(window.Flow.Overview?.calculateScore) return Utils.number(window.Flow.Overview.calculateScore(), 0); } catch(e){}
      try { if(typeof calcScore === 'function') return Utils.number(calcScore(), 0); } catch(e){}
      return 0;
    },
    currentSleep(){
      if(window.Flow.Sleep) return window.Flow.Sleep.getHours();
      return 0;
    },
    syncToday(){
      const S = State.ensure();
      const key = Utils.todayKey();
      const entry = Object.assign({}, S.history[key] || {});
      entry.date = new Date().toISOString();
      entry.water = Utils.number(S.water, 0);
      entry.waterGoal = this.currentWaterGoal();
      entry.waterGoalMl = entry.waterGoal;
      entry.cupSize = Utils.number(S.cupSize, 250);
      entry.steps = Utils.number(S.steps, 0);
      entry.calories = this.totalCalories();
      entry.sleep = this.currentSleep();
      entry.sleepStart = S.sleepStart || '23:00';
      entry.sleepEnd = S.sleepEnd || '07:00';
      entry.sleepQuality = Utils.number(S.sleepQuality, 0);
      entry.pomos = Utils.number(S.pomsDone, 0);
      entry.focusMinutes = (S.studySessions || []).reduce((sum, item)=>sum + Utils.number(item.dur ?? item.minutes ?? item.min, 0), 0);
      entry.mood = Utils.number(S.mood, 0);
      entry.habitsDone = window.Flow.Habits?.doneTodayCount ? window.Flow.Habits.doneTodayCount() : 0;
      entry.habitsTotal = Array.isArray(S.habits) ? S.habits.length : 0;
      entry.score = this.currentScore();
      entry.updatedAt = new Date().toISOString();
      S.history[key] = entry;
      this.prune(180);
      return entry;
    },
    prune(maxDays = 180){
      const S = State.ensure();
      const keys = Object.keys(S.history || {}).sort((a,b)=>new Date(a) - new Date(b));
      while(keys.length > maxDays){ delete S.history[keys.shift()]; }
    },
    week(date = new Date()){
      const base = new Date(date);
      const result = [];
      for(let i=6; i>=0; i--){
        const d = Utils.addDays(base, -i);
        const key = Utils.todayKey(d);
        result.push(Object.assign({key, date:d}, State.ensure().history[key] || {}));
      }
      return result;
    }
  };

  window.Flow.History = History;
})();
