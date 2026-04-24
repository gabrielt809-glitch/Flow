/* FLOW Foundation v15.0 — Mood
   Módulo oficial para humor, gratidão e revisão diária.
*/
(function(){
  'use strict';
  const { State, Storage, Utils } = window.Flow;

  const Mood = {
    ensure(){
      const S=State.ensure();
      S.mood=Utils.number(S.mood,0);
      S.gratitude=Array.isArray(S.gratitude)?S.gratitude:['','',''];
      S.review=Array.isArray(S.review)?S.review:['','',''];
      return S;
    },
    setMood(value, shouldSave=true){
      const S=this.ensure();
      S.mood=Utils.number(value,0);
      document.querySelectorAll('.mood-btn').forEach(btn=>btn.classList.toggle('sel', Utils.number(btn.dataset.m,0)===S.mood));
      if(shouldSave) Storage.commit('mood');
    },
    render(){
      const S=this.ensure();
      if(S.mood) this.setMood(S.mood,false);
      ['grat1','grat2','grat3'].forEach((id,idx)=>{ const el=document.getElementById(id); if(el && document.activeElement!==el) el.value=S.gratitude[idx] || ''; });
      ['rev1','rev2','rev3'].forEach((id,idx)=>{ const el=document.getElementById(id); if(el && document.activeElement!==el) el.value=S.review[idx] || ''; });
    },
    saveGratitude(){
      const S=this.ensure();
      S.gratitude=['grat1','grat2','grat3'].map(id=>document.getElementById(id)?.value || '');
      Storage.commit('mood');
    },
    saveReview(){
      const S=this.ensure();
      S.review=['rev1','rev2','rev3'].map(id=>document.getElementById(id)?.value || '');
      Storage.commit('mood');
    },
    bind(){
      if(window.__flowMoodBound) return;
      window.__flowMoodBound=true;
      ['grat1','grat2','grat3'].forEach(id=>{
        const el=document.getElementById(id);
        if(el) el.addEventListener('input', Utils.debounce(()=>this.saveGratitude(), 180));
      });
      ['rev1','rev2','rev3'].forEach(id=>{
        const el=document.getElementById(id);
        if(el) el.addEventListener('input', Utils.debounce(()=>this.saveReview(), 180));
      });
    },
    installCompatibility(){
      window.setMood=(m,sv=true)=>this.setMood(m,sv);
      window.renderMood=()=>this.render();
      window.saveGratitude=()=>this.saveGratitude();
      window.saveReview=()=>this.saveReview();
    }
  };

  window.Flow.Mood = Mood;
})();
