// Training Tracker V2.1 – recommendation layer
(function(){
  const css=`
  .todayReco{margin-top:10px;border-radius:12px;padding:11px 12px;background:#18202b;border:1px solid #314158}
  .todayReco.good{background:#143225;border-color:#2b6247}
  .todayReco.warn{background:#302611;border-color:#5a461b}
  .todayLabel{font-size:9px;letter-spacing:.09em;font-weight:900;color:var(--accent);margin-bottom:3px}
  .todayReco.good .todayLabel{color:#76d8a6}.todayReco.warn .todayLabel{color:#f1c76b}
  .todayHeadline{font-size:14px;font-weight:900}
  .todayDetail{font-size:11px;line-height:1.4;color:#cbd3de;margin-top:4px}
  .todayLast{font-size:10px;color:var(--muted);margin-top:7px;padding-top:7px;border-top:1px solid rgba(255,255,255,.07)}
  `;
  const style=document.createElement('style'); style.textContent=css; document.head.appendChild(style);

  function history(k,id){
    return data.sessions
      .filter(s=>s.key===k&&s.type==='strength')
      .sort((a,b)=>(b.date+(b.savedAt||'')).localeCompare(a.date+(a.savedAt||'')))
      .map(s=>s.exercises?.find(x=>x.id===id))
      .filter(Boolean);
  }
  function sets(ex){return (ex?.sets||[]).filter(s=>(+s.reps||0)>0)}
  function load(ex){const s=sets(ex).find(x=>Number.isFinite(+x.weight));return s?+s.weight:0}
  function top(ex,p){const a=sets(ex);return a.length>=p.sets&&a.slice(0,p.sets).every(s=>+s.reps>=p.max&&(s.rir==null||+s.rir>=1))}
  function below(ex,p){return sets(ex).some(s=>+s.reps<p.min)}
  function hardTop(ex,p){const a=sets(ex);return a.length>=p.sets&&a.slice(0,p.sets).every(s=>+s.reps>=p.max)&&a.slice(0,p.sets).some(s=>s.rir!=null&&+s.rir<1)}
  function repTarget(ex,p){
    const a=sets(ex).slice(0,p.sets).map(s=>Math.min(p.max,+s.reps||0));
    while(a.length<p.sets)a.push(p.min);
    for(let i=a.length-1;i>=0;i--){if(a[i]<p.max){a[i]++;break}}
    return a.join(' / ');
  }
  function summary(ex,p){
    const a=sets(ex).slice(0,p.sets); if(!a.length)return '';
    const reps=a.map(s=>s.reps).join(' / ');
    const rirs=a.map(s=>s.rir==null?'–':s.rir).join(' / ');
    return `${load(ex)||0} kg • ${reps} ${p.unit} • RIR ${rirs}`;
  }
  function recommendation(k,p){
    const h=history(k,p.id), last=h[0];
    if(!last)return {tone:'neutral',head:'Heute: Einstiegsgewicht wählen',detail:`Wähle eine Last, mit der du ${p.min}–${p.max} ${p.unit} sauber mit etwa 2 RIR schaffst.`};
    const w=load(last), reached=top(last,p), tooHard=hardTop(last,p);
    const repeatedLow=h.length>=2&&h.slice(0,2).every(x=>below(x,p));

    if(p.mode==='speed')return {tone:'neutral',head:`Heute: ${w?w+' kg beibehalten':'leicht bleiben'}`,detail:'Ziel: alle Wiederholungen schnell und technisch sauber. Last erst erhöhen, wenn die Geschwindigkeit stabil bleibt.'};

    if(repeatedLow)return {tone:'warn',head:p.mode==='assist'?'Heute: Unterstützung leicht erhöhen':'Heute: Last leicht reduzieren',detail:`Die Untergrenze wurde in zwei Einheiten verfehlt. Nimm den kleinsten verfügbaren Schritt und peile mindestens ${p.min} ${p.unit} pro Satz mit sauberer Technik an.`};

    if(reached){
      if(p.mode==='assist')return {tone:'good',head:'Heute: Unterstützung reduzieren',detail:`Letztes Mal war die Obergrenze erreicht. Nimm den kleinsten verfügbaren Schritt weniger Unterstützung als ${w} kg und starte wieder bei ${p.min}–${p.max} ${p.unit}.`};
      if(p.mode==='time')return {tone:'good',head:'Heute: Gewicht leicht erhöhen',detail:`Alle Carries lagen am oberen Zeitlimit. Nimm den nächsten verfügbaren Gewichtsschritt und starte wieder bei etwa ${p.min}–${Math.min(p.min+5,p.max)} Sek.`};
      if(w===0)return {tone:'good',head:'Heute: Schwierigkeit erhöhen',detail:`Die Obergrenze war mit ≥1 RIR erreicht. Nutze eine etwas schwerere Variante oder kleine Zusatzlast und starte wieder am unteren Ende von ${p.min}–${p.max} ${p.unit}.`};
      return {tone:'good',head:'Heute: Gewicht erhöhen',detail:`Die Obergrenze war mit ≥1 RIR erreicht. Gehe von ${w} kg auf den nächsten verfügbaren Gewichtsschritt (grob +2,5–5 %) und starte wieder am unteren Ende des Bereichs.`};
    }

    if(tooHard)return {tone:'neutral',head:`Heute: ${w?w+' kg':'gleiche Variante'} beibehalten`,detail:`Wiederhole die Obergrenze mit mindestens 1 RIR. Erst danach erhöhen.`};

    return {tone:'neutral',head:p.mode==='assist'?`Heute: ${w} kg Unterstützung beibehalten`:(w?`Heute: ${w} kg beibehalten`:'Heute: gleiche Variante beibehalten'),detail:`Ziel heute: ${repTarget(last,p)}. Versuche zuerst insgesamt eine saubere Wiederholung mehr als beim letzten Mal.`};
  }

  function boxHTML(k,p,last){
    const r=recommendation(k,p);
    return `<div class="todayReco ${r.tone}"><div class="todayLabel">HEUTE EMPFOHLEN</div><div class="todayHeadline">${r.head}</div><div class="todayDetail">${r.detail}</div>${last?`<div class="todayLast">Letztes Training: ${summary(last,p)}</div>`:''}</div>`;
  }

  const original=renderStrength;
  renderStrength=function(p,k){
    original(p,k);
    p.exercises.forEach(ex=>{
      const card=workoutBody.querySelector(`.exercise[data-id="${ex.id}"]`);
      if(!card)return;
      const last=history(k,ex.id)[0];
      card.querySelector('.exnote')?.insertAdjacentHTML('afterend',boxHTML(k,ex,last));
    });
  };
})();
