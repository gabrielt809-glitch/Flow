/* FLOW Foundation v12.0 — Onboarding
   Entrada oficial para anamnese inicial, criação do perfil e abertura do app.
*/
(function(){
  'use strict';
  const Flow = window.Flow;
  const { State, Utils } = Flow;

  function value(id){ return document.getElementById(id)?.value; }
  function show(id, display){ const el = document.getElementById(id); if(el) el.style.display = display; }

  const Onboarding = {
    finish(){
      const name = (value('ob-name') || '').trim();
      const weight = Utils.number(value('ob-weight'), 0);
      const height = Utils.number(value('ob-height'), 0);
      const age = Utils.number(value('ob-age'), 0);
      if(!name){ alert('Por favor, insira seu nome!'); return; }
      if(!weight || weight < 20){ alert('Informe seu peso para calcular a meta inicial de água.'); return; }
      if(!height || height < 80){ alert('Informe sua altura para calcular o IMC corretamente.'); return; }
      if(!age || age < 10){ alert('Informe sua idade para concluir a anamnese inicial.'); return; }

      const S = State.ensure();
      S.userName = name;
      S.profile = Object.assign({}, S.profile || {}, { age, heightCm: height, weightKg: weight });
      S.measures = S.measures || {};
      S.measures.height = String(height);
      S.goals = S.goals || {};
      S.goals.waterBaseMl = Math.round(weight * 35);
      S.goals.calories = Utils.number(value('ob-cal'), 2000) || 2000;
      S.goals.steps = Utils.number(value('ob-steps'), 10000) || 10000;
      S.goals.sleep = Utils.number(value('ob-sleep'), 8) || 8;
      S.goals.pomodoros = S.goals.pomodoros || 4;
      const today = new Date().toLocaleDateString('pt-BR');
      S.weights = Array.isArray(S.weights) ? S.weights : [];
      S.weights = [{date: today, val: weight}, ...S.weights.filter(w => String(w?.date) !== today)].slice(0, 30);
      S.onboarded = true;
      Flow.Storage?.commit('all');
      this.showApp();
    },

    showApp(){
      show('onboard', 'none');
      show('hdr', '');
      show('appWrap', '');
      show('mainNav', '');
      try{ if(typeof window.initApp === 'function') window.initApp(); }catch(e){}
      try{ Flow.UI?.refresh('all'); }catch(e){}
      try{ Flow.Settings?.render(); }catch(e){}
    },

    installCompatibility(){
      window.finishOnboard = () => this.finish();
      window.showApp = () => this.showApp();
    }
  };

  Flow.Onboarding = Onboarding;
})();
