/* FLOW Foundation v12.0 — Health
   Módulo oficial para saúde: passos, BPM, peso, medidas, IMC e treinos.
*/
(function(){
  'use strict';
  const { State, Utils } = window.Flow;

  function setText(id,value){ const el=document.getElementById(id); if(el) el.textContent=value; }
  function setWidth(id,pct){ const el=document.getElementById(id); if(el) el.style.width=Utils.clamp(Utils.number(pct,0),0,100)+'%'; }

  const Health = {
    addSteps(amount){
      const S=State.ensure();
      S.steps=Math.max(0, Utils.number(S.steps,0)+Utils.number(amount,0));
      window.Flow.Storage?.commit('health');
    },
    saveHR(){
      const input=document.getElementById('hrInput');
      const value=parseInt(input?.value,10);
      if(value>0){
        State.ensure().hr=value;
        if(input) input.value='';
        window.Flow.Storage?.commit('health');
      }
    },
    openWeight(){ document.getElementById('weightModal')?.classList.add('open'); },
    confirmWeight(){
      const input=document.getElementById('weightInput');
      const value=parseFloat(input?.value);
      if(!value) return;
      const S=State.ensure();
      S.weights=Array.isArray(S.weights)?S.weights:[];
      S.profile=S.profile||{};
      S.weights.unshift({date:new Date().toLocaleDateString('pt-BR'),val:value});
      S.profile.weightKg=value;
      if(S.weights.length>30) S.weights=S.weights.slice(0,30);
      if(input) input.value='';
      try{ if(typeof window.closeModal==='function') window.closeModal('weightModal'); }catch(e){}
      window.Flow.Storage?.commit('health');
    },
    currentHeight(){
      const S=State.ensure();
      const input=Utils.number(document.getElementById('measHeight')?.value,0);
      return input || Utils.number(S.measures?.height,0) || Utils.number(S.profile?.heightCm,0);
    },
    currentWeight(){
      const S=State.ensure();
      return Utils.number(S.weights?.[0]?.val,0) || Utils.number(S.profile?.weightKg,0) || Utils.number(S.measures?.weight,0);
    },
    calcIMC(){
      const S=State.ensure();
      S.measures=S.measures||{};
      const h=this.currentHeight();
      const w=this.currentWeight();
      if(!h || !w){ setText('imcVal','—'); setText('imcLabel','Informe peso e altura'); return null; }
      S.measures.height=String(h);
      S.profile=S.profile||{};
      S.profile.heightCm=h;
      const imc=w/((h/100)**2);
      setText('imcVal', imc.toFixed(1));
      const label=imc<18.5?'Abaixo do peso':imc<25?'Normal':imc<30?'Sobrepeso':'Obesidade';
      setText('imcLabel', label);
      return imc;
    },
    saveMeasures(){
      const S=State.ensure();
      S.measures=S.measures||{};
      ['waist','arm','hip','height'].forEach(key=>{
        const id={waist:'measWaist',arm:'measArm',hip:'measHip',height:'measHeight'}[key];
        const el=document.getElementById(id);
        if(el) S.measures[key]=el.value;
      });
      S.profile=S.profile||{};
      if(S.measures.height) S.profile.heightCm=S.measures.height;
      window.Flow.Storage?.commit('health');
    },
    openWorkout(){ document.getElementById('workoutModal')?.classList.add('open'); },
    saveWorkout(){
      const name=document.getElementById('woName')?.value?.trim();
      if(!name) return;
      const S=State.ensure();
      S.workouts=Array.isArray(S.workouts)?S.workouts:[];
      S.workouts.push({
        id:Date.now(),
        name,
        sets:+(document.getElementById('woSets')?.value||0),
        reps:+(document.getElementById('woReps')?.value||0),
        weight:+(document.getElementById('woWeight')?.value||0),
        done:false
      });
      ['woName','woSets','woReps','woWeight'].forEach(id=>{ const el=document.getElementById(id); if(el) el.value=''; });
      try{ if(typeof window.closeModal==='function') window.closeModal('workoutModal'); }catch(e){}
      window.Flow.Storage?.commit('health');
    },
    toggleWorkout(index){
      const S=State.ensure();
      if(S.workouts?.[index]){
        S.workouts[index].done=!S.workouts[index].done;
        window.Flow.Storage?.commit('health');
      }
    },
    removeWorkout(index){
      const S=State.ensure();
      if(Array.isArray(S.workouts)){
        S.workouts.splice(index,1);
        window.Flow.Storage?.commit('health');
      }
    },
    renderWeightHistory(){
      const S=State.ensure();
      setText('weightVal', S.weights?.length ? S.weights[0].val+'kg' : '—');
      const wrap=document.getElementById('weightHistory');
      if(wrap){
        wrap.innerHTML='';
        (S.weights||[]).slice(0,5).forEach(w=>{
          const el=document.createElement('div');
          el.className='wt-entry';
          el.innerHTML=`<span class="wt-date">${Utils.escape(w.date)}</span><span class="wt-val">${Utils.escape(w.val)} kg</span>`;
          wrap.appendChild(el);
        });
      }
      const chart=document.getElementById('weightChart');
      if(chart && S.weights?.length>1){
        chart.style.display='flex';
        try{ if(typeof window.renderBarChart==='function') window.renderBarChart(chart, S.weights.slice(0,7).reverse().map(w=>w.val), S.weights.slice(0,7).reverse().map(w=>String(w.date).slice(0,5))); }catch(e){}
      }
    },
    renderWorkoutList(){
      const S=State.ensure();
      const wrap=document.getElementById('workoutList');
      if(!wrap) return;
      if(!S.workouts || !S.workouts.length){ wrap.innerHTML='<div class="empty">Adicione exercícios ao treino.</div>'; return; }
      wrap.innerHTML='';
      S.workouts.forEach((w,i)=>{
        const meta=w.sets?`${w.sets}×${w.reps} ${w.weight?'@ '+w.weight+'kg':''}`:'';
        const el=document.createElement('div');
        el.className='habit-item';
        el.innerHTML=`<div class="habit-check ${w.done?'done':''}" onclick="Flow.Health.toggleWorkout(${i})">${w.done?'✓':''}</div><div class="habit-info"><div class="habit-name">${Utils.escape(w.name)}</div><div class="habit-streak">${Utils.escape(meta)}</div></div><button class="li-del" onclick="Flow.Health.removeWorkout(${i})">×</button>`;
        wrap.appendChild(el);
      });
    },
    renderChart(){
      const el=document.getElementById('stepsChart');
      if(!el || !window.Flow.History?.week) return;
      const week=window.Flow.History.week();
      try{ if(typeof window.renderBarChart==='function') window.renderBarChart(el, week.map(d=>Utils.number(d.steps,0)), week.map(d=>new Date(d.date||d.key).toLocaleDateString('pt-BR',{weekday:'short'}).slice(0,3))); }catch(e){}
    },
    render(){
      const S=State.ensure();
      const steps=Utils.number(S.steps,0);
      const goal=Utils.number(S.goals?.steps,10000);
      setText('stepsVal', steps.toLocaleString('pt-BR'));
      setText('calBurnVal', Math.round(steps*0.04));
      setText('distVal', (steps*0.0008).toFixed(1));
      setText('hrVal', S.hr || '—');
      const pct=goal?steps/goal*100:0;
      setWidth('stepsBar', pct);
      setText('stepsPct', Math.round(Utils.clamp(pct,0,100))+'%');
      setText('stepsGoalLabel', 'meta '+goal.toLocaleString('pt-BR'));
      setText('stepsGoalDisp', goal.toLocaleString('pt-BR'));
      const measHeight=document.getElementById('measHeight');
      if(measHeight && !measHeight.value && S.profile?.heightCm) measHeight.value=S.profile.heightCm;
      this.renderWorkoutList();
      this.renderWeightHistory();
      this.calcIMC();
      this.renderChart();
    },
    installCompatibility(){
      window.renderHealth=()=>this.render();
      window.addSteps=(n)=>this.addSteps(n);
      window.saveHR=()=>this.saveHR();
      window.addWeight=()=>this.openWeight();
      window.confirmWeight=()=>this.confirmWeight();
      window.calcIMC=()=>this.calcIMC();
      window.saveMeasures=()=>this.saveMeasures();
      window.addWorkout=()=>this.openWorkout();
      window.saveWorkout=()=>this.saveWorkout();
      window.renderWorkoutList=()=>this.renderWorkoutList();
      window.renderWeightHistory=()=>this.renderWeightHistory();
      window.toggleWO=(i)=>this.toggleWorkout(i);
    }
  };

  window.Flow.Health = Health;
})();
