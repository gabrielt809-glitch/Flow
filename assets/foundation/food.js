/* FLOW Foundation v15.0 — Food
   Módulo oficial para nutrição: totais, renderização, exclusões e ponte com favoritos/meal builder legados.
*/
(function(){
  'use strict';
  const { State, Utils } = window.Flow;

  function setText(id,value){ const el=document.getElementById(id); if(el) el.textContent=value; }
  function setDisplay(id,value){ const el=document.getElementById(id); if(el) el.style.display=value; }

  const CATS=['☀️ Café da manhã','🥗 Almoço','🌙 Jantar','🍎 Lanche','💊 Suplemento'];

  const Food = {
    totals(){
      const S=State.ensure();
      return (S.meals||[]).reduce((acc,m)=>{
        acc.kcal += Utils.number(m.kcal ?? m.calories,0);
        acc.carb += Utils.number(m.carb,0);
        acc.prot += Utils.number(m.prot,0);
        acc.fat += Utils.number(m.fat,0);
        return acc;
      },{kcal:0,carb:0,prot:0,fat:0,count:(S.meals||[]).length});
    },
    deleteMeal(id){
      const S=State.ensure();
      S.meals=(S.meals||[]).filter(m=>String(m.id)!==String(id));
      window.Flow.Storage?.commit('food');
    },
    deleteMealGroup(groupId){
      const S=State.ensure();
      S.meals=(S.meals||[]).filter(m=>String(m.groupId||m.id)!==String(groupId));
      window.Flow.Storage?.commit('food');
    },
    renderChart(){
      const el=document.getElementById('foodChart');
      if(!el || !window.Flow.History?.week) return;
      const week=window.Flow.History.week();
      try{
        if(typeof window.renderBarChart==='function'){
          window.renderBarChart(el, week.map(d=>Utils.number(d.calories,0)), week.map(d=>new Date(d.date||d.key).toLocaleDateString('pt-BR',{weekday:'short'}).slice(0,3)));
        }
      }catch(e){}
    },
    render(){
      const S=State.ensure();
      const t=this.totals();
      const goal=Utils.number(S.goals?.calories,2000);
      setText('foodMealCount', t.count);
      setText('foodProteinDay', Math.round(t.prot)+'g');
      setText('foodCarbDay', Math.round(t.carb)+'g');
      setText('foodFatDay', Math.round(t.fat)+'g');
      setText('calTotalDisp', Math.round(t.kcal));
      setText('calGoalDisp', goal);
      const pct=goal?Utils.clamp(t.kcal/goal*100,0,100):0;
      const arc=document.getElementById('calArc');
      if(arc) arc.style.strokeDashoffset=314-(314*pct/100);
      setText('carbVal', Math.round(t.carb)+'g');
      setText('protVal', Math.round(t.prot)+'g');
      setText('fatVal', Math.round(t.fat)+'g');
      setDisplay('calAlert', t.kcal>goal?'':'none');
      try{ if(typeof window.renderMealBuilder==='function') window.renderMealBuilder(); }catch(e){}
      const wrap=document.getElementById('mealList');
      if(wrap){
        if(!S.meals || !S.meals.length){ wrap.innerHTML='<div class="empty">Nenhuma refeição registrada.</div>'; }
        else{
          wrap.innerHTML='';
          CATS.forEach(cat=>{
            const items=(S.meals||[]).filter(m=>m.cat===cat);
            if(!items.length) return;
            const h=document.createElement('div');
            h.style.cssText='font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:1px;font-weight:700;margin:8px 0 6px';
            h.textContent=cat;
            wrap.appendChild(h);
            [...new Set(items.map(m=>m.groupId||m.id))].forEach(gid=>{
              const groupItems=items.filter(m=>String(m.groupId||m.id)===String(gid));
              const sum=groupItems.reduce((acc,m)=>{ acc.k+=Utils.number(m.kcal,0); acc.c+=Utils.number(m.carb,0); acc.p+=Utils.number(m.prot,0); acc.f+=Utils.number(m.fat,0); return acc; },{k:0,c:0,p:0,f:0});
              const card=document.createElement('div');
              card.style.cssText='background:var(--surface2);border:1px solid var(--border);border-radius:12px;padding:12px;margin-bottom:8px';
              card.innerHTML=`<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;margin-bottom:8px"><div><div style="font-size:14px;font-weight:700">${Utils.escape(cat)}</div><div class="meal-cat">${Utils.escape(groupItems[0].groupTime||'registrada')} · ${groupItems.length} item(ns)</div></div><div style="display:flex;align-items:center;gap:10px"><span class="meal-kcal">${Math.round(sum.k)} kcal</span><button class="li-del" onclick="Flow.Food.deleteMealGroup('${Utils.escape(gid)}')">×</button></div></div><div style="font-size:12px;color:var(--text2);line-height:1.6">${groupItems.map(m=>`• ${Utils.escape(m.food)} (${Utils.escape(m.qty)}× ${Utils.escape(m.unit)})`).join('<br>')}</div><div class="meal-cat" style="margin-top:8px">C ${Math.round(sum.c)}g · P ${Math.round(sum.p)}g · G ${Math.round(sum.f)}g</div>`;
              wrap.appendChild(card);
            });
          });
        }
      }
      this.renderChart();
    },
    installCompatibility(){
      window.renderFood=()=>this.render();
      window.deleteMeal=(id)=>this.deleteMeal(id);
      window.deleteMealGroup=(groupId)=>this.deleteMealGroup(groupId);
    }
  };

  window.Flow.Food = Food;
})();
