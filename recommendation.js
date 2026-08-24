// Training Tracker V2.3 – RIR-first recommendation layer
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
  function rirRange(p){
    const t=String(p.note||'').replace(/–|—/g,'-');
    let m=t.match(/(\d+)\s*-\s*(\d+)\s*RIR/i);if(m)return {min:+m[1],max:+m[2]};
    m=t.match(/(\d+)\s*RIR/i);if(m)return {min:+m[1],max:+m[1]};
    return {min:1,max:2};
  }
  function rirLabel(p){const r=rirRange(p);return r.min===r.max?`${r.min} RIR`:`${r.min}–${r.max} RIR`}
  function below(ex,p){return sets(ex).some(s=>+s.reps<p.min)}
  function hardRir(ex,p){
    const r=rirRange(p);return sets(ex).some(s=>s.rir!=null&&+s.rir<r.min);
  }
  function topReady(ex,p){
    const a=sets(ex),r=rirRange(p);
    return a.length>=p.sets&&a.slice(0,p.sets).every(s=>+s.reps>=p.max&&(s.rir==null||+s.rir>=r.min));
  }
  function repTarget(ex,p){
    const r=rirRange(p), a=sets(ex).slice(0,p.sets).map(s=>({reps:Math.min(p.max,+s.reps||0),rir:s.rir==null?null:+s.rir}));
    while(a.length<p.sets)a.push({reps:p.min,rir:null});
    let idx=a.findIndex(s=>s.reps<p.max&&(s.rir==null||s.rir>r.min));
    if(idx<0)idx=a.findIndex(s=>s.reps<p.max);
    if(idx>=0)a[idx].reps++;
    return a.map(s=>s.reps).join(' / ');
  }
  function summary(ex,p){
    const a=sets(ex).slice(0,p.sets); if(!a.length)return '';
    const reps=a.map(s=>s.reps).join(' / ');
    const rirs=a.map(s=>s.rir==null?'–':s.rir).join(' / ');
    const w=load(ex)||0;
    const prefix=p.mode==='assist'?`${w} kg Unterstützung`:`${w} kg`;
    return `${prefix} • ${reps} ${p.unit} • RIR ${rirs}`;
  }
  function holdHead(p,w){
    if(p.mode==='assist')return `Heute: ${w} kg Unterstützung beibehalten`;
    return w?`Heute: ${w} kg beibehalten`:'Heute: gleiche Variante beibehalten';
  }
  function recommendation(k,p){
    const h=history(k,p.id), last=h[0];
    if(!last)return {tone:'neutral',head:'Heute: Einstiegsgewicht wählen',detail:`Wähle eine Last, mit der du ungefähr die Mitte von ${p.min}–${p.max} ${p.unit} sauber mit ${rirLabel(p)} schaffst. Technik und volle ROM bleiben konstant.`};
    const w=load(last), repeatedLow=h.length>=2&&h.slice(0,2).every(x=>below(x,p));

    if(p.mode==='speed')return {tone:'neutral',head:`Heute: ${w?w+' kg beibehalten':'leicht bleiben'}`,detail:'Power vor Last: alle Wiederholungen schnell und technisch identisch. Nur steigern, wenn die Geschwindigkeit über alle Sätze stabil bleibt.'};

    // RIR has priority over rep progression. A hard set never earns more reps/load next time.
    if(hardRir(last,p))return {tone:'warn',head:holdHead(p,w),detail:`RIR vor Wiederholungen: Letztes Mal fiel mindestens ein Satz unter ${rirLabel(p)}. Heute keine zusätzlichen Reps erzwingen. Jeden Satz bei ${rirLabel(p)} stoppen – auch wenn dadurch weniger Wiederholungen entstehen. Erst danach wieder progressieren.`};

    if(repeatedLow)return {tone:'warn',head:p.mode==='assist'?'Heute: Unterstützung leicht erhöhen':'Heute: Last leicht reduzieren',detail:`Die Untergrenze wurde in zwei Einheiten hintereinander verfehlt. Nimm den kleinsten verfügbaren Schritt und arbeite wieder sauber im Bereich ${p.min}–${p.max} ${p.unit} bei ${rirLabel(p)}.`};

    if(below(last,p))return {tone:'neutral',head:holdHead(p,w),detail:`Gewicht zunächst halten. Ziel ist wieder mindestens ${p.min} ${p.unit} pro Satz bei ${rirLabel(p)}. Wird die Untergrenze auch diesmal verfehlt, reduzieren wir beim nächsten Mal leicht.`};

    if(topReady(last,p)){
      if(p.mode==='assist')return {tone:'good',head:'Heute: Unterstützung reduzieren',detail:`Alle Sätze erreichten die Obergrenze mit ausreichender Reserve. Nimm den kleinsten verfügbaren Schritt weniger Unterstützung und starte wieder im unteren bis mittleren Wiederholungsbereich bei ${rirLabel(p)}.`};
      if(p.mode==='time')return {tone:'good',head:'Heute: Gewicht leicht erhöhen',detail:`Alle Carries erreichten das obere Zeitlimit kontrolliert. Nimm den kleinsten sinnvollen Gewichtsschritt und starte wieder im unteren Zeitbereich.`};
      if(w===0)return {tone:'good',head:'Heute: Schwierigkeit leicht erhöhen',detail:`Die Obergrenze war in allen Sätzen mit ausreichender Reserve erreicht. Nutze eine etwas schwierigere Variante oder kleine Zusatzlast und starte wieder unten im Bereich.`};
      return {tone:'good',head:'Heute: Gewicht leicht erhöhen',detail:`Die Obergrenze war in allen Sätzen bei mindestens ${rirRange(p).min} RIR erreicht. Nimm den kleinsten sinnvollen Gewichtsschritt und starte wieder im unteren bis mittleren Bereich.`};
    }

    return {tone:'neutral',head:holdHead(p,w),detail:`Ziel: ${repTarget(last,p)}. Maximal eine saubere Gesamtwiederholung mehr – aber nur solange ${rirLabel(p)}, volle ROM und identische Technik erhalten bleiben. RIR schlägt das Rep-Ziel.`};
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

  // Live feedback for the session currently being entered.
  updateReco=function(ex){
    const id=ex.dataset.id;
    const p=PLAN[currentKey]?.exercises?.find(x=>x.id===id);
    if(!p)return;
    const rows=[...ex.querySelectorAll('.setrow')].map(r=>({
      reps:+r.querySelector('.reps').value||0,
      rir:r.querySelector('.rir').value===''?null:+r.querySelector('.rir').value
    }));
    const box=ex.querySelector('.reco');
    if(rows.some(r=>!r.reps)){box.className='reco';box.textContent='Werte eintragen → Empfehlung erscheint automatisch.';return}
    if(p.mode==='speed'){box.className='reco';box.textContent='Power: Geschwindigkeit und Technik haben Vorrang. Nicht bis zum Grind trainieren.';return}
    const rr=rirRange(p);
    if(rows.some(r=>r.rir!=null&&r.rir<rr.min)){
      box.className='reco warn';box.textContent=`RIR-Ziel unterschritten. Nächstes Mal keine Reps erzwingen: bei ${rirLabel(p)} stoppen und Last zunächst halten.`;return;
    }
    if(rows.some(r=>r.reps<p.min)){
      box.className='reco warn';box.textContent='Untergrenze verfehlt. Last zunächst halten; bei erneuter Unterschreitung in der nächsten Einheit leicht reduzieren.';return;
    }
    if(rows.every(r=>r.reps>=p.max&&(r.rir==null||r.rir>=rr.min))){
      box.className='reco good';
      box.textContent=p.mode==='assist'?'✓ Obergrenze sauber erreicht – nächstes Mal Unterstützung leicht reduzieren.':p.mode==='time'?'✓ Obergrenze sauber erreicht – nächstes Mal Gewicht leicht erhöhen.':'✓ Obergrenze sauber erreicht – nächstes Mal den kleinsten sinnvollen Gewichtsschritt erhöhen.';
      return;
    }
    box.className='reco';box.textContent=`✓ Belastung passt. Gewicht halten; nächstes Mal höchstens +1 saubere Gesamt-Wdh., solange ${rirLabel(p)} erhalten bleiben.`;
  };
})();
