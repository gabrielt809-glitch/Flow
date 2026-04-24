/* FLOW Foundation v12.0 — Overview + Score
   Módulo oficial para painel inicial, score e métricas resumidas.
   Não altera o visual; apenas centraliza cálculos e atualização de elementos já existentes.
*/
(function(){
  'use strict';
  const { State, Utils } = window.Flow;

  function setText(id, value){ const el=document.getElementById(id); if(el) el.textContent=value; }
  function setWidth(id, pct){ const el=document.getElementById(id); if(el) el.style.width=Utils.clamp(Utils.number(pct,0),0,100)+'%'; }
  function pct(done,total){ return total>0 ? Utils.clamp((done/total)*100,0,100) : 0; }

  const Overview = {
    waterGoal(){
      try{ if(window.Flow.History?.currentWaterGoal) return Utils.number(window.Flow.History.currentWaterGoal(),2000); }catch(e){}
      const S=State.ensure();
      return Utils.number(S.goals?.waterBaseMl || S.goals?.waterMl || 2000, 2000);
    },
    waterMl(){
      const S=State.ensure();
      return Utils.number(S.water,0) * Utils.number(S.cupSize,250);
    },
    taskStats(){
      const S=State.ensure();
      const total=(S.tasks||[]).length;
      const done=(S.tasks||[]).filter(t=>t.done).length;
      return {total,done,pending:Math.max(total-done,0),pct:pct(done,total)};
    },
    habitStats(){
      const S=State.ensure();
      const total=(S.habits||[]).length;
      const done=window.Flow.Habits?.doneTodayCount ? window.Flow.Habits.doneTodayCount() : (S.habits||[]).filter(h=>h.done || h.completed || h.checked).length;
      return {total,done,pct:pct(done,total)};
    },
    foodStats(){
      const S=State.ensure();
      const total=(S.meals||[]).reduce((sum,m)=>sum+Utils.number(m.kcal ?? m.calories,0),0);
      const goal=Utils.number(S.goals?.calories,2000);
      return {total,goal,pct:pct(total,goal)};
    },
    sleepHours(){
      try{ if(window.Flow.Sleep?.getHours) return Utils.number(window.Flow.Sleep.getHours(),0); }catch(e){}
      const S=State.ensure();
      return Utils.number(S.sleepHours || S.sleep,0);
    },
    focusMinutes(){
      const S=State.ensure();
      return (S.studySessions||[]).reduce((sum,item)=>sum+Utils.number(item.dur ?? item.minutes ?? item.min,0),0);
    },
    calculateScore(){
      const S=State.ensure();
      const waterScore=pct(this.waterMl(), this.waterGoal());
      const stepsScore=pct(Utils.number(S.steps,0), Utils.number(S.goals?.steps,10000));
      const taskScore=this.taskStats().total ? this.taskStats().pct : 0;
      const sleepScore=pct(this.sleepHours(), Utils.number(S.goals?.sleep,8));
      const food=this.foodStats();
      const foodScore=food.goal ? Utils.clamp(100 - Math.abs(food.goal-food.total)/food.goal*100,0,100) : 0;
      const focusGoal=Utils.number(S.goals?.pomodoros,4);
      const focusScore=pct(Utils.number(S.pomsDone,0), focusGoal);
      const moodScore=Utils.number(S.mood,0) ? pct(Utils.number(S.mood,0),5) : 0;
      const score=Math.round((waterScore*0.18)+(stepsScore*0.16)+(taskScore*0.18)+(sleepScore*0.16)+(foodScore*0.12)+(focusScore*0.12)+(moodScore*0.08));
      return Utils.clamp(score,0,100);
    },
    nextTask(){
      const S=State.ensure();
      const pending=(S.tasks||[]).filter(t=>!t.done);
      pending.sort((a,b)=>(a.due||'9999').localeCompare(b.due||'9999'));
      return pending[0] || null;
    },
    spotlight(score){
      const hour=new Date().getHours();
      const icon=document.getElementById('spotlightIcon');
      const kicker=document.getElementById('spotlightKicker');
      const title=document.getElementById('spotlightTitle');
      const sub=document.getElementById('spotlightSub');
      if(!icon || !kicker || !title || !sub) return;
      if(score>=75){ icon.textContent='🚀'; kicker.textContent='Ritmo forte'; title.textContent='Seu dia está bem encaminhado'; sub.textContent='Mantenha consistência nas próximas horas para fechar o dia com um resultado excelente.'; return; }
      if(hour<12){ icon.textContent='⚡'; kicker.textContent='Manhã'; title.textContent='Bom momento para ganhar tração'; sub.textContent='Comece pelo básico: água, uma tarefa importante e um bloco curto de foco.'; return; }
      if(hour<18){ icon.textContent='🎯'; kicker.textContent='Tarde'; title.textContent='Hora de proteger o ritmo'; sub.textContent='Revise pendências, registre o que já fez e ajuste o restante do dia.'; return; }
      icon.textContent='🌙'; kicker.textContent='Noite'; title.textContent='Fechamento do dia'; sub.textContent='Atualize sono, alimentação e tarefas para manter seu histórico confiável.';
    },
    renderWeeklyScore(){
      const el=document.getElementById('weekChart');
      if(!el || !window.Flow.History?.week) return;
      const week=window.Flow.History.week();
      try{
        if(typeof renderBarChart==='function'){
          renderBarChart(el, week.map(d=>Utils.number(d.score,0)), week.map(d=>new Date(d.date || d.key).toLocaleDateString('pt-BR',{weekday:'short'}).slice(0,3)));
        }
      }catch(e){}
      const compare=document.getElementById('weekCompare');
      if(compare){
        const vals=week.map(d=>Utils.number(d.score,0)).filter(Boolean);
        compare.textContent=vals.length ? `Média semanal: ${Math.round(vals.reduce((a,b)=>a+b,0)/vals.length)}%` : '';
      }
    },
    render(){
      const S=State.ensure();
      const score=this.calculateScore();
      const waterMl=this.waterMl();
      const waterGoal=this.waterGoal();
      const waterPct=pct(waterMl,waterGoal);
      const tasks=this.taskStats();
      const habits=this.habitStats();
      const food=this.foodStats();
      const sleep=this.sleepHours();
      const steps=Utils.number(S.steps,0);
      const stepsGoal=Utils.number(S.goals?.steps,10000);
      const poms=Utils.number(S.pomsDone,0);

      setText('scoreNum', score+'%');
      setText('ovScore', score+'%');
      setText('ms-water', Math.round(waterPct)+'%');
      setText('ms-focus', String(poms));
      setText('ms-tasks', String(tasks.done));
      setText('ms-steps', String(steps));
      setText('ov-water', `${Math.round(waterMl)}/${Math.round(waterGoal)}ml`);
      setText('ov-study', `${poms} pomos`);
      setText('ov-work', `${tasks.done}/${tasks.total}`);
      setText('ov-health', `${steps} passos`);
      setText('ov-sleep', sleep ? `${sleep.toFixed(1)}h` : '—h');
      setText('ov-food', `${Math.round(food.total)} kcal`);
      setText('ov-habits', `${habits.done}/${habits.total}`);
      setText('ov-mood', S.mood ? `${S.mood}/5` : '—');

      setWidth('ovb-water', waterPct);
      setWidth('ovb-study', pct(poms, Utils.number(S.goals?.pomodoros,4)));
      setWidth('ovb-work', tasks.pct);
      setWidth('ovb-health', pct(steps, stepsGoal));
      setWidth('ovb-sleep', pct(sleep, Utils.number(S.goals?.sleep,8)));
      setWidth('ovb-food', food.pct);
      setWidth('ovb-habits', habits.pct);
      setWidth('ovb-mood', S.mood ? pct(S.mood,5) : 0);

      const next=this.nextTask();
      const wrap=document.getElementById('nextTaskWrap');
      const text=document.getElementById('nextTaskText');
      if(wrap && text){
        if(next){ wrap.style.display=''; text.textContent=next.text || 'Tarefa pendente'; }
        else wrap.style.display='none';
      }
      this.spotlight(score);
      this.renderWeeklyScore();
      return score;
    },
    installCompatibility(){
      window.calcScore = () => this.calculateScore();
      window.renderOverview = () => this.render();
    }
  };

  window.Flow.Overview = Overview;
})();
