/* FLOW Foundation v15.0 — App Runtime
   Runtime limpo sem app.legacy.js ativo. Carrega estado, define utilitários globais mínimos
   e centraliza navegação/boot para os módulos Flow.*.
*/
(function(){
  'use strict';
  const Flow = window.Flow = window.Flow || {};
  const Utils = Flow.Utils || {};

  const DEFAULT_STATE = {
    onboarded:false,
    userName:'',
    userEmoji:'😊',
    theme:'dark',
    accentColor:'purple',
    homeModules:['water','study','work','health','sleep','food','habits','mood'],
    profile:{age:''},
    measures:{height:0, waist:0, arm:0, hip:0},
    goals:{waterBaseMl:2000, steps:10000, calories:2000, sleep:8, pomodoros:4},
    water:0,
    cupSize:250,
    currentDrink:'💧 Água',
    steps:0,
    hr:'',
    meals:[],
    mealBuilder:[],
    favoriteMeals:[],
    recentFoods:[],
    foodMacroMode:'balanced',
    tasks:[],
    taskRules:[],
    taskFilter:'all',
    timeBlocks:[],
    timeBlockRules:[],
    timeBlockSkips:[],
    calendarBlockSkips:[],
    studySessions:[],
    studyNotes:'',
    pomsDone:0,
    habits:[],
    habitLogs:{},
    mood:0,
    gratitude:['','',''],
    review:['','',''],
    sleepStart:'23:00',
    sleepEnd:'07:00',
    sleepQuality:0,
    sleepHours:0,
    workouts:[],
    weights:[],
    history:{},
    dreamNotes:''
  };

  const FOOD_LIBRARY = [
    {name:'Arroz branco cozido', unit:'100g', kcal:130, carb:28, prot:2.7, fat:0.3},
    {name:'Feijão cozido', unit:'100g', kcal:76, carb:14, prot:4.8, fat:0.5},
    {name:'Frango grelhado', unit:'100g', kcal:165, carb:0, prot:31, fat:3.6},
    {name:'Ovo', unit:'un', kcal:70, carb:0.6, prot:6, fat:5},
    {name:'Banana', unit:'un', kcal:90, carb:23, prot:1.1, fat:0.3},
    {name:'Maçã', unit:'un', kcal:72, carb:19, prot:0.4, fat:0.2},
    {name:'Aveia', unit:'30g', kcal:114, carb:20, prot:4, fat:2.2},
    {name:'Leite integral', unit:'200ml', kcal:122, carb:9.6, prot:6.4, fat:6.6},
    {name:'Pão francês', unit:'un', kcal:140, carb:28, prot:4.5, fat:1.4},
    {name:'Queijo minas', unit:'30g', kcal:80, carb:1, prot:5, fat:6},
    {name:'Carne bovina', unit:'100g', kcal:250, carb:0, prot:26, fat:15},
    {name:'Batata doce', unit:'100g', kcal:86, carb:20, prot:1.6, fat:0.1},
    {name:'Whey protein', unit:'dose', kcal:120, carb:3, prot:24, fat:2},
    {name:'Iogurte natural', unit:'170g', kcal:110, carb:8, prot:9, fat:5},
    {name:'Salada', unit:'porção', kcal:35, carb:7, prot:2, fat:0.3}
  ];
  let selectedFood = null;
  let workoutTimer = {seconds:0, interval:null, running:false};
  let medTimer = {seconds:300, interval:null, running:false};
  let breathTimer = {interval:null, running:false, count:4, phase:'Inspire'};

  function deepMerge(base, extra){
    const out = Array.isArray(base) ? [...base] : Object.assign({}, base || {});
    Object.entries(extra || {}).forEach(([key,value])=>{
      if(value && typeof value === 'object' && !Array.isArray(value) && base && typeof base[key] === 'object' && !Array.isArray(base[key])) out[key]=deepMerge(base[key], value);
      else out[key]=value;
    });
    return out;
  }
  function $(id){ return document.getElementById(id); }
  function setText(id,value){ const el=$(id); if(el) el.textContent=value; }
  function todayKey(date=new Date()){ return new Date(date).toDateString(); }
  function ymd(date=new Date()){
    const d=new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }
  function number(value,fallback=0){ const n=Number(value); return Number.isFinite(n)?n:fallback; }
  function escape(value){ return String(value ?? '').replace(/[&<>"']/g, ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch])); }
  function setDisplay(id,value){ const el=$(id); if(el) el.style.display=value; }

  function renderBarChart(el, values=[], labels=[]){
    if(!el) return;
    const nums = values.map(v=>number(v,0));
    const max = Math.max(1, ...nums);
    el.innerHTML='';
    nums.forEach((v,i)=>{
      const col=document.createElement('div');
      col.className='bar-col';
      const bar=document.createElement('div');
      bar.className='bar';
      bar.style.height=Math.max(3, (v/max)*78)+'px';
      const lbl=document.createElement('div');
      lbl.className='bar-lbl';
      lbl.textContent=labels[i] || '';
      col.appendChild(bar); col.appendChild(lbl); el.appendChild(col);
    });
  }

  function calcBaseWaterMl(){
    const S=Flow.State?.ensure?.() || window.S || {};
    const latest = Array.isArray(S.weights) && S.weights[0] ? number(S.weights[0].val,0) : number(S.measures?.weight || S.weight,0);
    return latest ? Math.round(latest*35) : number(S.goals?.waterBaseMl,2000) || 2000;
  }
  function calcWaterGoalMl(){
    const S=Flow.State?.ensure?.() || window.S || {};
    return number(S.goals?.waterBaseMl || S.goals?.waterMl, calcBaseWaterMl()) || 2000;
  }
  function getWaterGoalCups(){
    const S=Flow.State?.ensure?.() || window.S || {};
    return Math.max(1, Math.ceil(calcWaterGoalMl() / (number(S.cupSize,250) || 250)));
  }
  function formatDue(value){
    if(!value) return '';
    try{
      const d=new Date(value);
      if(Number.isNaN(d.getTime())) return String(value);
      return d.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'}) + (String(value).includes('T') ? ' · ' + String(value).slice(11,16) : '');
    }catch(e){ return String(value); }
  }

  const App = {
    loadState(){
      let stored={};
      try{ stored=JSON.parse(localStorage.getItem(Flow.storageKey || 'flow_v3') || '{}'); }catch(e){ stored={}; }
      window.S = deepMerge(DEFAULT_STATE, stored);
      try{ Flow.State?.ensure?.(); }catch(e){}
      return window.S;
    },
    saveOnly(){ try{ localStorage.setItem(Flow.storageKey || 'flow_v3', JSON.stringify(Flow.State?.ensure?.() || window.S || {})); }catch(e){} },
    start(){
      this.loadState();
      this.installCompatibility();
      try{ Flow.TimeBlocks?.ensureModalControls?.(); }catch(e){}
      if((window.S || {}).onboarded) this.showApp();
      else this.showOnboarding();
      try{ Flow.UI?.bindGlobalPersistence?.(); }catch(e){}
      try{ Flow.Storage?.commit?.('all'); }catch(e){ this.saveOnly(); }
      console.info('[FLOW Foundation] v15 Aggressive Clean ativa — runtime legado desativado.');
    },
    showOnboarding(){
      setDisplay('onboard','flex'); setDisplay('hdr','none'); setDisplay('appWrap','none'); setDisplay('mainNav','none');
    },
    showApp(){
      setDisplay('onboard','none'); setDisplay('hdr',''); setDisplay('appWrap',''); setDisplay('mainNav','');
      this.applyTheme(); this.updateGreeting(); this.applyAvatar();
      try{ Flow.TimeBlocks?.ensureModalControls?.(); }catch(e){}
      try{ Flow.UI?.refresh?.('all'); }catch(e){}
    },
    refreshAfterShow(){ this.showApp(); },
    applyTheme(){
      const S=Flow.State?.ensure?.() || window.S || {};
      document.documentElement.setAttribute('data-theme', S.theme || 'dark');
      const tt=$('themeToggle'); if(tt) tt.classList.toggle('on', (S.theme || 'dark') !== 'light');
    },
    applyAvatar(){
      const S=Flow.State?.ensure?.() || window.S || {};
      const emoji = S.userEmoji && !(/[Ãð�]/.test(String(S.userEmoji))) ? S.userEmoji : '😊';
      S.userEmoji=emoji;
      setText('avatarBtn', emoji); setText('bigAvatar', emoji);
      const name=$('profileName'); if(name && document.activeElement!==name) name.value=S.userName||'';
    },
    updateGreeting(){
      const S=Flow.State?.ensure?.() || window.S || {};
      const name=S.userName || 'Gabriel';
      const h=new Date().getHours();
      const greeting=h<12?'Bom dia':h<18?'Boa tarde':'Boa noite';
      setText('greeting', `${greeting}, ${name} ${S.userEmoji || '😊'}`);
      setText('greetSub', h<12?'Você está indo bem 🌤️':h<18?'Continue no ritmo 🎯':'Vamos fechar bem o dia 🌙');
      const hd=$('hdrDate'); if(hd) hd.textContent=new Date().toLocaleDateString('pt-BR',{weekday:'short',day:'2-digit',month:'short'}).replace('.','').toUpperCase();
      const mot=$('motivationEl'); if(mot && !mot.textContent) mot.textContent='"Não espere motivação — crie o ambiente para agir."';
    },
    goSec(sec){
      document.querySelectorAll('.sec').forEach(el=>el.classList.remove('active'));
      const target=$('sec-'+sec); if(target) target.classList.add('active');
      document.querySelectorAll('.nav-btn').forEach(btn=>btn.classList.remove('active'));
      const map={overview:'nav-overview', water:'nav-water', study:'nav-study', work:'nav-work'};
      if(map[sec] && $(map[sec])) $(map[sec]).classList.add('active');
      if(!map[sec] && $('nav-more')) $('nav-more').classList.add('active');
      try{ Flow.UI?.refresh?.(sec==='work'?'tasks':sec); }catch(e){}
      window.scrollTo({top:0,behavior:'smooth'});
    },
    toggleSideMenu(open){
      $('sideMenu')?.classList.toggle('open', !!open);
      $('sideMenuOverlay')?.classList.toggle('open', !!open);
      const menu=$('sideMenu'); if(menu) menu.setAttribute('aria-hidden', open?'false':'true');
    },
    closeModal(id){ const el=$(id); if(el) el.classList.remove('open'); },
    openModal(id){ const el=$(id); if(el) el.classList.add('open'); },
    addTimeBlock(){
      try{ Flow.TimeBlocks?.ensureModalControls?.(); }catch(e){}
      this.openModal('tbModal');
    },
    installModalEvents(){
      if(window.__flowV15ModalBound) return; window.__flowV15ModalBound=true;
      document.querySelectorAll('.modal-bg').forEach(m=>m.addEventListener('click',e=>{ if(e.target===m) m.classList.remove('open'); }));
      document.addEventListener('keydown',e=>{ if(e.key==='Escape'){ document.querySelectorAll('.modal-bg.open').forEach(m=>m.classList.remove('open')); this.toggleSideMenu(false); } });
    },
    installCompatibility(){
      window.renderBarChart=renderBarChart;
      window.calcBaseWaterMl=calcBaseWaterMl;
      window.calcWaterGoalMl=calcWaterGoalMl;
      window.getWaterGoalCups=getWaterGoalCups;
      window.formatDue=window.formatDueSafe=formatDue;
      window.goSec=(sec)=>this.goSec(sec);
      window.openSectionFromMenu=(sec)=>{ this.goSec(sec); this.toggleSideMenu(false); };
      window.toggleSideMenu=(open)=>this.toggleSideMenu(open);
      window.closeModal=(id)=>this.closeModal(id);
      window.addTimeBlock=()=>this.addTimeBlock();
      window.updateGreeting=()=>this.updateGreeting();
      window.initApp=()=>this.refreshAfterShow();
      window.showApp=()=>this.showApp();
      window.save=()=>Flow.Storage?.commit?.('all',{refresh:false}) || this.saveOnly();
      window.saveSafe=window.save;
      this.installFoodCompatibility();
      this.installAudioCompatibility();
      this.installWellnessCompatibility();
      this.installModalEvents();
    },
    selectedFood(){ return selectedFood; },
    findFood(query){
      const q=String(query||'').trim().toLowerCase();
      if(!q) return FOOD_LIBRARY.slice(0,8);
      return FOOD_LIBRARY.filter(f=>f.name.toLowerCase().includes(q)).slice(0,8);
    },
    renderFoodSuggestions(){
      const list=$('foodSuggestList'); const input=$('foodSearch'); if(!list||!input) return;
      const items=this.findFood(input.value);
      list.innerHTML=items.map((f,i)=>`<div class="autocomplete-item" data-food-idx="${i}"><strong>${escape(f.name)}</strong><span>${escape(f.unit)} · ${f.kcal} kcal</span></div>`).join('');
      list.classList.toggle('open', !!items.length && document.activeElement===input);
      list.querySelectorAll('.autocomplete-item').forEach((el,i)=>el.onclick=()=>{
        selectedFood=items[i]; input.value=selectedFood.name; list.classList.remove('open'); this.updateFoodPreview();
      });
    },
    updateFoodPreview(){
      const preview=$('foodPreview'); if(!preview) return;
      const qty=number($('mealQty')?.value,1)||1;
      if(!selectedFood){ preview.textContent='Selecione um alimento da lista para o app estimar automaticamente calorias e macros.'; return; }
      preview.innerHTML=`<strong>${escape(selectedFood.name)}</strong><br>${Math.round(selectedFood.kcal*qty)} kcal · C ${Math.round(selectedFood.carb*qty)}g · P ${Math.round(selectedFood.prot*qty)}g · G ${Math.round(selectedFood.fat*qty)}g`;
    },
    renderMealBuilder(){
      const S=Flow.State?.ensure?.() || window.S || {};
      S.mealBuilder=Array.isArray(S.mealBuilder)?S.mealBuilder:[];
      const list=$('mealBuilderList'); const total=$('mealBuilderTotal');
      const sum=S.mealBuilder.reduce((a,m)=>a+number(m.kcal,0),0);
      if(total) total.textContent=Math.round(sum)+' kcal';
      if(list){
        if(!S.mealBuilder.length) list.innerHTML='<div class="empty">Monte uma refeição com arroz + feijão + frango, por exemplo.</div>';
        else list.innerHTML=S.mealBuilder.map((m,i)=>`<div class="meal-builder-item"><div class="meal-builder-copy"><div class="meal-builder-name">${escape(m.food)}</div><div class="meal-builder-meta">${escape(m.qty)}× ${escape(m.unit)} · ${Math.round(m.kcal)} kcal</div></div><button class="li-del" onclick="S.mealBuilder.splice(${i},1);renderMealBuilder();save()">×</button></div>`).join('');
      }
    },
    renderRecentFoods(){
      const wrap=$('recentFoods'); if(!wrap) return;
      const S=Flow.State?.ensure?.() || window.S || {};
      const names=(S.recentFoods||[]).slice(0,8);
      wrap.innerHTML=names.map(n=>`<button class="chip" onclick="document.getElementById('foodSearch').value='${escape(n)}';handleFoodSearchInput()">${escape(n)}</button>`).join('');
    },
    addFoodToBuilder(){
      const S=Flow.State?.ensure?.() || window.S || {};
      if(!selectedFood){ this.renderFoodSuggestions(); return; }
      const qty=number($('mealQty')?.value,1)||1;
      S.mealBuilder=Array.isArray(S.mealBuilder)?S.mealBuilder:[];
      S.mealBuilder.push({food:selectedFood.name, unit:selectedFood.unit, qty, kcal:selectedFood.kcal*qty, carb:selectedFood.carb*qty, prot:selectedFood.prot*qty, fat:selectedFood.fat*qty});
      S.recentFoods=[selectedFood.name,...(S.recentFoods||[]).filter(x=>x!==selectedFood.name)].slice(0,10);
      this.clearFoodEntry(false); this.renderMealBuilder(); this.renderRecentFoods(); Flow.Storage?.commit?.('food');
    },
    clearFoodEntry(clearSelected=true){
      if(clearSelected) selectedFood=null;
      const input=$('foodSearch'); if(input) input.value='';
      const qty=$('mealQty'); if(qty) qty.value='1';
      $('foodSuggestList')?.classList.remove('open'); this.updateFoodPreview();
    },
    clearMealBuilder(){ const S=Flow.State?.ensure?.() || window.S || {}; S.mealBuilder=[]; this.renderMealBuilder(); Flow.Storage?.commit?.('food'); },
    saveMealGroup(){
      const S=Flow.State?.ensure?.() || window.S || {}; const items=S.mealBuilder||[]; if(!items.length) return;
      const cat=$('mealCat')?.value || '🍎 Lanche'; const gid=Date.now(); const time=new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
      S.meals=Array.isArray(S.meals)?S.meals:[];
      items.forEach((m,idx)=>S.meals.push(Object.assign({id:gid+idx, groupId:gid, groupTime:time, cat}, m)));
      S.mealBuilder=[]; this.renderMealBuilder(); Flow.Storage?.commit?.('food');
    },
    saveFavorite(){
      const S=Flow.State?.ensure?.() || window.S || {}; S.favoriteMeals=Array.isArray(S.favoriteMeals)?S.favoriteMeals:[];
      if(selectedFood) S.favoriteMeals=[selectedFood.name,...S.favoriteMeals.filter(x=>x!==selectedFood.name)].slice(0,20);
      Flow.Storage?.commit?.('food',{refresh:false});
    },
    setMacro(el){
      document.querySelectorAll('#sec-food [data-macro]').forEach(b=>b.classList.remove('on'));
      el?.classList.add('on'); const S=Flow.State?.ensure?.() || window.S || {}; S.foodMacroMode=el?.dataset?.macro||'balanced'; Flow.Storage?.commit?.('food');
    },
    installFoodCompatibility(){
      window.handleFoodSearchInput=()=>this.renderFoodSuggestions();
      window.updateFoodPreview=()=>this.updateFoodPreview();
      window.addFoodToBuilder=()=>this.addFoodToBuilder();
      window.clearFoodEntry=()=>this.clearFoodEntry();
      window.clearMealBuilder=()=>this.clearMealBuilder();
      window.saveMealGroup=()=>this.saveMealGroup();
      window.saveFavorite=()=>this.saveFavorite();
      window.renderMealBuilder=()=>this.renderMealBuilder();
      window.renderRecentFoods=()=>this.renderRecentFoods();
      window.setMacro=(el)=>this.setMacro(el);
    },
    installAudioCompatibility(){
      window.setFocusSound=(mode,el)=>{ document.querySelectorAll('[data-focus-mode]').forEach(b=>b.classList.remove('on')); el?.classList.add('on'); setText('focusSoundMode','Lo-fi calmo'); };
      window.setFocusVolume=(value)=>{ const S=Flow.State?.ensure?.() || window.S || {}; S.focusVolume=number(value,45); };
      window.toggleFocusAudio=()=>{ const p=$('focusPlayer'); const b=$('focusAudioBtn'); const st=$('focusAudioStatus'); const on=!p?.classList.contains('off'); if(p) p.classList.toggle('off', on); if(b) b.textContent=on?'▶ Tocar':'⏸ Pausar'; if(st) st.textContent=on?'Toque em reproduzir para ativar o lo-fi calmo dentro do app.':'Lo-fi visual ativo. Áudio real pode depender das permissões do navegador/PWA.'; };
    },
    installWellnessCompatibility(){
      window.newAffirmation=()=>{ const arr=['Eu consigo avançar um passo por vez.','Minha rotina melhora quando eu cuido do básico.','Consistência vale mais do que pressa.']; setText('affirmationText', arr[Math.floor(Math.random()*arr.length)]); };
      window.toggleBreath=()=>{ breathTimer.running=!breathTimer.running; const b=$('breathBtn'); if(b) b.textContent=breathTimer.running?'Pausar':'Iniciar'; };
      window.resetBreath=()=>{ breathTimer.running=false; setText('breathBtn','Iniciar'); setText('breathLabel','Respire'); setText('breathCount','4'); };
      window.toggleMed=()=>{ medTimer.running=!medTimer.running; const b=$('medBtn'); if(b) b.textContent=medTimer.running?'Pausar':'Iniciar'; };
      window.resetMed=()=>{ medTimer.running=false; setText('medBtn','Iniciar'); };
      window.setMedTime=(min)=>{ medTimer.seconds=number(min,5)*60; };
      window.toggleWorkoutTimer=()=>{ workoutTimer.running=!workoutTimer.running; const b=$('woTimerBtn'); if(b) b.textContent=workoutTimer.running?'Pausar':'Iniciar'; };
      window.resetWorkoutTimer=()=>{ workoutTimer.running=false; workoutTimer.seconds=0; setText('woTimerDisp','00:00'); setText('woTimerBtn','Iniciar'); };
    }
  };

  window.Flow.App = App;
  App.loadState();
})();
