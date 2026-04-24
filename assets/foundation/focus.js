/* FLOW Foundation v12.0 — Focus
   Módulo oficial para foco/pomodoro e sessões de estudo.
*/
(function(){
  'use strict';
  const { State, Storage, Utils } = window.Flow;

  const MODES = {
    focus:{seconds:25*60,label:'Foco · 25 minutos',doneMinutes:25,counts:true,phase:'em foco...'},
    short:{seconds:5*60,label:'Pausa curta · 5 min',doneMinutes:5,counts:false,phase:'descansando...'},
    long:{seconds:15*60,label:'Pausa longa · 15 min',doneMinutes:15,counts:false,phase:'descansando...'},
    deep:{seconds:50*60,label:'Deep Work · 50 minutos',doneMinutes:50,counts:true,phase:'em foco...'}
  };

  const Focus = {
    state:{mode:'focus',seconds:25*60,running:false,interval:null,sessionStart:null},
    ensure(){
      const S = State.ensure();
      S.studySessions = Array.isArray(S.studySessions) ? S.studySessions : [];
      S.pomsDone = Utils.number(S.pomsDone, 0);
      S.goals = S.goals || {};
      S.goals.pomodoros = Utils.number(S.goals.pomodoros, 4) || 4;
      return S;
    },
    modeDef(mode = this.state.mode){ return MODES[mode] || MODES.focus; },
    setText(id, value){ const el=document.getElementById(id); if(el) el.textContent=value; },
    renderTimer(){
      const m = Math.floor(this.state.seconds/60);
      const s = this.state.seconds % 60;
      this.setText('timerDisp', String(m).padStart(2,'0') + ':' + String(s).padStart(2,'0'));
    },
    setMode(mode, el){
      const def = this.modeDef(mode);
      clearInterval(this.state.interval);
      this.state = Object.assign(this.state, {mode:MODES[mode]?mode:'focus',seconds:def.seconds,running:false,interval:null,sessionStart:null});
      this.setText('timerBtn','▶ Iniciar');
      this.setText('timerModeLabel',def.label);
      this.setText('timerPhase','pronto para começar');
      const disp=document.getElementById('timerDisp'); if(disp) disp.style.color='var(--study)';
      document.querySelectorAll('#sec-study .chip').forEach(c=>c.classList.remove('on'));
      if(el) el.classList.add('on');
      this.renderTimer();
      this.renderDots();
    },
    toggle(){
      const def = this.modeDef();
      if(this.state.running){
        clearInterval(this.state.interval);
        this.state.running = false;
        this.setText('timerBtn','▶ Continuar');
        this.setText('timerPhase','pausado');
        this.renderDots();
        return;
      }
      this.state.running = true;
      this.state.sessionStart = this.state.sessionStart || Date.now();
      this.setText('timerBtn','⏸ Pausar');
      this.setText('timerPhase', def.phase);
      const disp=document.getElementById('timerDisp'); if(disp) disp.style.color=def.counts?'var(--study)':'var(--health)';
      this.state.interval = setInterval(()=>{
        this.state.seconds = Math.max(0, this.state.seconds - 1);
        if(this.state.seconds <= 0){ this.completeCurrentSession(); }
        this.renderTimer();
        this.renderDots();
      },1000);
      this.renderDots();
    },
    completeCurrentSession(){
      clearInterval(this.state.interval);
      const def = this.modeDef();
      this.state.running = false;
      if(def.counts){
        const S = this.ensure();
        const tag = (document.getElementById('studyTag')?.value || 'Sem tag').trim() || 'Sem tag';
        const entry = {
          id:Date.now(),
          time:new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}),
          tag,
          dur:def.doneMinutes,
          minutes:def.doneMinutes,
          mode:this.state.mode,
          createdAt:new Date().toISOString()
        };
        S.pomsDone = Utils.number(S.pomsDone,0) + 1;
        S.studySessions.push(entry);
        Storage.commit('focus');
      }
      this.setText('timerBtn','▶ Iniciar');
      this.setText('timerPhase', def.counts ? '✅ Concluído!' : '✅ Pausa encerrada!');
      this.state.seconds = def.seconds;
      this.state.sessionStart = null;
      try{ if(navigator.vibrate) navigator.vibrate([200,100,200]); }catch(e){}
      this.render();
    },
    reset(){
      clearInterval(this.state.interval);
      const def = this.modeDef();
      this.state.running=false;
      this.state.seconds=def.seconds;
      this.state.sessionStart=null;
      this.setText('timerBtn','▶ Iniciar');
      this.setText('timerPhase','pronto para começar');
      this.renderTimer();
      this.renderDots();
    },
    saveGoal(){
      const S = this.ensure();
      S.goals.pomodoros = Utils.number(document.getElementById('pomGoalInput')?.value, 4) || 4;
      Storage.commit('focus');
    },
    renderBar(){
      const S = this.ensure();
      const goal = S.goals.pomodoros || 4;
      const pct = goal ? Math.min(S.pomsDone/goal*100, 100) : 0;
      const bar=document.getElementById('pomBar'); if(bar) bar.style.width=pct+'%';
      this.setText('pomDoneLabel', S.pomsDone + ' pomodoro' + (S.pomsDone!==1?'s':''));
      this.setText('pomGoalLabel', 'meta: ' + goal);
      const input=document.getElementById('pomGoalInput'); if(input) input.value=goal;
    },
    renderDots(){
      const S=this.ensure();
      const wrap=document.getElementById('pomDots'); if(!wrap) return;
      const goal=S.goals.pomodoros || 4;
      wrap.innerHTML='';
      for(let i=0;i<goal;i++){
        const d=document.createElement('div');
        d.className='pom-dot' + (i < (S.pomsDone % goal) ? ' done' : '') + (i === (S.pomsDone % goal) && this.state.running ? ' active' : '');
        wrap.appendChild(d);
      }
    },
    renderSessions(){
      const S=this.ensure();
      const wrap=document.getElementById('studySessions'); if(!wrap) return;
      const sessions=S.studySessions || [];
      const total=sessions.reduce((sum,item)=>sum + Utils.number(item.dur ?? item.minutes,0),0);
      this.setText('studyTotalTime', total + 'min');
      if(!sessions.length){ wrap.innerHTML='<div class="empty">Nenhuma sessão ainda.</div>'; return; }
      wrap.innerHTML='';
      sessions.slice().reverse().forEach(ss=>{
        const el=document.createElement('div');
        el.className='list-item';
        el.innerHTML=`<span style="font-size:18px">📚</span><div style="flex:1"><div class="li-text">${Utils.escape(ss.tag || 'Sem tag')}</div><div class="li-meta">${Utils.escape(ss.time || '')} · ${Utils.number(ss.dur ?? ss.minutes,0)}min</div></div>`;
        wrap.appendChild(el);
      });
    },
    render(){
      this.ensure();
      this.renderTimer();
      this.renderBar();
      this.renderDots();
      this.renderSessions();
      const notes=document.getElementById('studyNotes');
      const S=State.ensure();
      if(notes && document.activeElement !== notes) notes.value=S.studyNotes || '';
    },
    bind(){
      if(window.__flowFocusBound) return;
      window.__flowFocusBound=true;
      const notes=document.getElementById('studyNotes');
      if(notes){
        notes.addEventListener('input', Utils.debounce(()=>{
          State.ensure().studyNotes = notes.value;
          Storage.commit('focus', {refresh:false});
        },180));
      }
    },
    installCompatibility(){
      window.setMode=(m,el)=>this.setMode(m,el);
      window.renderTimerDisp=()=>this.renderTimer();
      window.toggleTimer=()=>this.toggle();
      window.resetTimer=()=>this.reset();
      window.renderPomDots=()=>this.renderDots();
      window.renderPomBar=()=>this.renderBar();
      window.savePomGoal=()=>this.saveGoal();
      window.renderStudy=()=>this.render();
      window.renderStudySessions=()=>this.renderSessions();
    }
  };

  window.Flow.Focus = Focus;
})();
