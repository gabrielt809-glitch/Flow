/* FLOW Foundation v12.0 — Settings
   Perfil, metas, tema, avatar, exportação e reset em uma camada oficial.
*/
(function(){
  'use strict';
  const Flow = window.Flow;
  const { State, Utils } = Flow;

  const EMOJIS = ['😊','🙂','😎','🤩','🥳','💪','🧠','🚀','⚡','🦊','🐺','🦁','🐉','🌟','🔥'];
  const ACCENTS = {
    purple:'#c084fc',
    blue:'#22d3ee',
    green:'#34d399',
    orange:'#fb923c',
    pink:'#f472b6',
    yellow:'#fbbf24'
  };

  function setValue(id, value){ const el = document.getElementById(id); if(el) el.value = value ?? ''; }
  function text(id, value){ const el = document.getElementById(id); if(el) el.textContent = value ?? ''; }
  function numberFrom(id, fallback = 0){ return Utils.number(document.getElementById(id)?.value, fallback); }

  const Settings = {
    render(){
      const S = State.ensure();
      const baseWater = typeof window.calcBaseWaterMl === 'function'
        ? window.calcBaseWaterMl()
        : Utils.number(S.goals.waterBaseMl, 2000) || 2000;

      setValue('goalWater', baseWater);
      setValue('goalSteps', S.goals.steps || 10000);
      setValue('goalCal', S.goals.calories || 2000);
      setValue('goalSleep', S.goals.sleep || 8);
      setValue('goalPom', S.goals.pomodoros || 4);
      setValue('pomGoalInput', S.goals.pomodoros || 4);

      setValue('profileName', S.userName || '');
      setValue('profileAge', S.profile?.age || '');
      setValue('measHeight', S.measures?.height || S.profile?.heightCm || '');
      setValue('measWaist', S.measures?.waist || '');
      setValue('measArm', S.measures?.arm || '');
      setValue('measHip', S.measures?.hip || '');

      this.applyTheme();
      this.applyAccent();
      this.renderAvatar();
    },

    readGoalsFromDOM(){
      const S = State.ensure();
      S.goals.waterBaseMl = numberFrom('goalWater', S.goals.waterBaseMl || 2000) || S.goals.waterBaseMl || 2000;
      S.goals.steps = numberFrom('goalSteps', S.goals.steps || 10000) || 10000;
      S.goals.calories = numberFrom('goalCal', S.goals.calories || 2000) || 2000;
      S.goals.sleep = numberFrom('goalSleep', S.goals.sleep || 8) || 8;
      S.goals.pomodoros = numberFrom('goalPom', S.goals.pomodoros || 4) || 4;
      const pomInput = document.getElementById('pomGoalInput');
      if(pomInput) pomInput.value = S.goals.pomodoros;
      return S.goals;
    },

    readProfileFromDOM(){
      const S = State.ensure();
      S.userName = (document.getElementById('profileName')?.value || S.userName || '').trim();
      S.profile = S.profile || {};
      S.measures = S.measures || {};
      const age = numberFrom('profileAge', S.profile.age || 0);
      const height = numberFrom('measHeight', S.measures.height || S.profile.heightCm || 0);
      if(age) S.profile.age = age;
      if(height){
        S.profile.heightCm = height;
        S.measures.height = String(height);
      }
      ['waist','arm','hip'].forEach(key=>{
        const id = key === 'waist' ? 'measWaist' : key === 'arm' ? 'measArm' : 'measHip';
        const val = document.getElementById(id)?.value;
        if(val !== undefined && val !== '') S.measures[key] = val;
      });
      return S.profile;
    },

    commit(scope = 'settings'){
      this.readGoalsFromDOM();
      this.readProfileFromDOM();
      Flow.Storage?.commit(scope, {refresh:false});
      this.render();
      try{ Flow.Overview?.render(); }catch(e){}
    },

    applyTheme(){
      const S = State.ensure();
      const theme = S.theme || 'dark';
      document.documentElement.setAttribute('data-theme', theme);
      const toggle = document.getElementById('themeToggle');
      if(toggle) toggle.classList.toggle('on', theme !== 'light');
    },

    toggleTheme(btn){
      const S = State.ensure();
      const willDark = btn ? !btn.classList.contains('on') : S.theme === 'light';
      S.theme = willDark ? 'dark' : 'light';
      this.applyTheme();
      Flow.Storage?.commit('settings', {refresh:false});
    },

    applyAccent(){
      const S = State.ensure();
      const key = S.accentColor || 'purple';
      const color = ACCENTS[key] || ACCENTS.purple;
      document.documentElement.style.setProperty('--study', color);
      document.querySelectorAll('.swatch').forEach(sw=>{
        sw.classList.toggle('sel', sw.dataset.color === key);
      });
    },

    setAccentColor(el, color){
      const S = State.ensure();
      const key = el?.dataset?.color || Object.keys(ACCENTS).find(k => ACCENTS[k] === color) || 'purple';
      S.accentColor = key;
      if(color) document.documentElement.style.setProperty('--study', color);
      this.applyAccent();
      Flow.Storage?.commit('settings', {refresh:false});
    },

    renderAvatar(){
      const S = State.ensure();
      if(!S.userEmoji || /Ã|ð|â|�/.test(String(S.userEmoji))) S.userEmoji = '😊';
      text('avatarBtn', S.userEmoji || '😊');
      text('bigAvatar', S.userEmoji || '😊');
    },

    changeEmoji(){
      const S = State.ensure();
      const currentIndex = EMOJIS.indexOf(S.userEmoji || '😊');
      S.userEmoji = EMOJIS[(currentIndex + 1 + EMOJIS.length) % EMOJIS.length];
      this.renderAvatar();
      Flow.Storage?.commit('settings', {refresh:false});
    },

    exportData(){
      const S = State.ensure();
      const payload = JSON.stringify(S, null, 2);
      const blob = new Blob([payload], {type:'application/json;charset=utf-8'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `flow_data_${Utils.ymd(new Date())}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(()=>URL.revokeObjectURL(url), 500);
    },

    resetToday(){
      const S = State.ensure();
      S.water = 0;
      S.tasks = [];
      S.steps = 0;
      S.meals = [];
      S.mealBuilder = [];
      S.pomsDone = 0;
      S.studySessions = [];
      S.mood = 0;
      S.gratitude = ['', '', ''];
      S.review = ['', '', ''];
      S.dreamNotes = '';
      S.timeBlocks = [];
      S.workouts = [];
      Flow.Storage?.commit('all');
    },

    confirmReset(){
      if(confirm('Tem certeza que quer resetar os dados de hoje?')) this.resetToday();
    },

    bind(){
      if(window.__flowSettingsBound) return;
      window.__flowSettingsBound = true;
      ['goalWater','goalSteps','goalCal','goalSleep','goalPom','profileName','profileAge','measHeight','measWaist','measArm','measHip'].forEach(id=>{
        const el = document.getElementById(id);
        if(el) el.addEventListener('change', ()=>this.commit('settings'));
      });
    },

    installCompatibility(){
      window.renderSettings = () => this.render();
      window.toggleTheme = (btn) => this.toggleTheme(btn);
      window.applyTheme = () => this.applyTheme();
      window.setAccentColor = (el,color) => this.setAccentColor(el,color);
      window.changeEmoji = () => this.changeEmoji();
      window.exportData = () => this.exportData();
      window.confirmReset = () => this.confirmReset();
      window.saveSettings = () => this.commit('settings');
      window.saveGoals = () => this.commit('settings');
    }
  };

  Flow.Settings = Settings;
})();
