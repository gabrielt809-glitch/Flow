/* FLOW Foundation v15.0 — Water
   Módulo oficial para hidratação: render, metas, copos, bebida e tamanho do copo.
*/
(function(){
  'use strict';
  const { State, Utils } = window.Flow;

  function setText(id,value){ const el=document.getElementById(id); if(el) el.textContent=value; }
  function setHTML(id,value){ const el=document.getElementById(id); if(el) el.innerHTML=value; }
  function setWidth(id,pct){ const el=document.getElementById(id); if(el) el.style.width=Utils.clamp(Utils.number(pct,0),0,100)+'%'; }

  const Water = {
    ml(){ const S=State.ensure(); return Utils.number(S.water,0) * Utils.number(S.cupSize,250); },
    goalMl(){
      const S=State.ensure();
      try{ if(typeof window.calcWaterGoalMl==='function') return Utils.number(window.calcWaterGoalMl(),2000); }catch(e){}
      try{ if(window.Flow.History?.currentWaterGoal) return Utils.number(window.Flow.History.currentWaterGoal(),2000); }catch(e){}
      return Utils.number(S.goals?.waterBaseMl || S.goals?.waterMl || (S.goals?.water ? S.goals.water * Utils.number(S.cupSize,250) : 2000), 2000);
    },
    goalCups(){
      const S=State.ensure();
      const cup=Utils.number(S.cupSize,250) || 250;
      try{ if(typeof window.getWaterGoalCups==='function') return Math.max(1, Utils.number(window.getWaterGoalCups(), Math.ceil(this.goalMl()/cup))); }catch(e){}
      return Math.max(1, Math.ceil(this.goalMl()/cup));
    },
    syncCupSizeUI(){
      const S=State.ensure();
      const cup=Utils.number(S.cupSize,250);
      document.querySelectorAll('#cupSizeTabs .chip').forEach(chip=>{
        const ml=chip.dataset?.ml;
        chip.classList.toggle('on', String(ml)===String(cup));
      });
      const custom=document.getElementById('customCupSize');
      if(custom && ![150,250,350,500,700].includes(cup)) custom.value=cup;
      if(S.drinkType){
        document.querySelectorAll('#drinkTabs .chip').forEach(chip=>chip.classList.toggle('on', chip.dataset?.drink===S.drinkType));
      }
    },
    setCups(value){
      const S=State.ensure();
      const max=Math.max(this.goalCups()*2,1);
      S.water=Utils.clamp(Math.round(Utils.number(value,0)),0,max);
      S.lastDrankAt=Date.now();
      window.Flow.Storage?.commit('water');
    },
    add(delta=1){ this.setCups(Utils.number(State.ensure().water,0)+Utils.number(delta,0)); },
    setDrinkFromButton(el){
      const S=State.ensure();
      document.querySelectorAll('#drinkTabs .chip').forEach(c=>c.classList.remove('on'));
      if(el) el.classList.add('on');
      S.drinkType=el?.dataset?.drink || '💧 Água';
      window.Flow.Storage?.commit('water');
    },
    setCupSizeFromButton(el,ml){
      const S=State.ensure();
      document.querySelectorAll('#cupSizeTabs .chip').forEach(c=>c.classList.remove('on'));
      if(el) el.classList.add('on');
      S.cupSize=Utils.number(ml,250);
      window.Flow.Storage?.commit('water');
    },
    focusCustomCup(){
      document.querySelectorAll('#cupSizeTabs .chip').forEach(c=>c.classList.remove('on'));
      const chip=document.querySelector('#cupSizeTabs [data-ml="custom"]');
      if(chip) chip.classList.add('on');
      const inp=document.getElementById('customCupSize');
      if(inp){ inp.value=State.ensure().cupSize||''; inp.focus(); try{inp.select();}catch(e){} }
    },
    applyCustomCupSize(){
      const inp=document.getElementById('customCupSize');
      const ml=Utils.clamp(Utils.number(inp?.value,250),50,3000);
      State.ensure().cupSize=ml;
      window.Flow.Storage?.commit('water');
    },
    streak(){
      const S=State.ensure();
      const keys=Object.keys(S.history||{}).sort();
      let count=0;
      for(const key of keys.slice(-7).reverse()){
        const h=S.history[key]||{};
        const actual=Utils.number(h.water,0)*Utils.number(h.cupSize,S.cupSize||250);
        const target=Utils.number(h.waterGoalMl||h.waterGoal,this.goalMl());
        if(actual>=target) count++; else break;
      }
      if(this.ml()>=this.goalMl()) count=Math.max(count,1);
      return count;
    },
    renderChart(){
      const el=document.getElementById('waterChart');
      if(!el || !window.Flow.History?.week) return;
      const week=window.Flow.History.week();
      try{
        if(typeof window.renderBarChart==='function'){
          window.renderBarChart(el, week.map(d=>Utils.number(d.water,0)*Utils.number(d.cupSize,250)), week.map(d=>new Date(d.date||d.key).toLocaleDateString('pt-BR',{weekday:'short'}).slice(0,3)));
        }
      }catch(e){}
    },
    render(){
      const S=State.ensure();
      S.cupSize=Utils.number(S.cupSize,250) || 250;
      S.water=Utils.number(S.water,0);
      const goalMl=this.goalMl();
      const goalCups=this.goalCups();
      const ml=this.ml();
      S.goals.water=goalCups;
      this.syncCupSizeUI();
      setText('waterNum', S.water);
      setHTML('waterUnit', `copos &bull; ${Math.round(ml)}ml / <span id="waterGoalDisp">${Math.round(goalMl)}</span>ml`);
      setWidth('waterBar', goalMl?ml/goalMl*100:0);
      setText('waterMl', Math.round(ml)+'ml');
      setText('waterMax', Math.round(goalMl)+'ml');
      const wrap=document.getElementById('waterCups');
      if(wrap){
        wrap.innerHTML='';
        for(let i=0;i<goalCups;i++){
          const c=document.createElement('div');
          c.className='cup'+(i<S.water?' fill':'');
          c.textContent='💧';
          c.onclick=()=>this.setCups(i<S.water ? i : i+1);
          wrap.appendChild(c);
        }
      }
      const streak=this.streak();
      setText('waterStreak', streak>0?'🔥 '+streak+' dias':'');
      this.renderChart();
    },
    installCompatibility(){
      window.renderWater=()=>this.render();
      window.addWater=(d)=>this.add(d);
      window.quickAddWater=()=>this.add(1);
      window.setDrink=(el)=>this.setDrinkFromButton(el);
      window.setCupSize=(el,ml)=>this.setCupSizeFromButton(el,ml);
      window.focusCustomCup=()=>this.focusCustomCup();
      window.applyCustomCupSize=()=>this.applyCustomCupSize();
    }
  };

  window.Flow.Water = Water;
})();
