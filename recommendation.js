// Training Tracker V2.4.1 – RIR-first recommendation layer + timed carry reserve
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
      .map(s=>{
        const ex=s.exercises?.find(x=>x.id===id);
        return ex?{...ex,_sessionDate:s.date,_savedAt:s.savedAt}:null;
      })
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

  // Until 28 Aug 2026 Farmer Carry reserve was entered as RIR with the convention
  // 1 RIR = 5 seconds. From 29 Aug onward the same field stores seconds directly.
  function carryReserve(s,ex){
    if(s?.reserveSeconds!=null)return +s.reserveSeconds;
    if(s?.rir==null)return null;
    const v=+s.rir;
    return ex?._sessionDate&&ex._sessionDate<'2026-08-29'?v*5:v;
  }
  function carryTarget(ex,p){
    const a=sets(ex).slice(0,p.sets).map(s=>Math.min(p.max,+s.reps||0));
    while(a.length<p.sets)a.push(p.min);
    const idx=a.findIndex(v=>v<p.max);
    if(idx>=0)a[idx]=Math.min(p.max,a[idx]+5);
    return a.join(' / ');
  }

  function summary(ex,p){
    const a=sets(ex).slice(0,p.sets); if(!a.length)return '';
    const reps=a.map(s=>s.reps).join(' / ');
    const w=load(ex)||0;
    const prefix=p.mode==='assist'?`${w} kg Unterstützung`:`${w} kg`;
    if(p.mode==='time'){
      const reserves=a.map(s=>{const v=carryReserve(s,ex);return v==null?'–':v}).join(' / ');
      return `${prefix} • ${reps} Sek. • Reserve ${reserves} Sek.`;
    }
    const rirs=a.map(s=>s.rir==null?'–':s.rir).join(' / ');
    return `${prefix} • ${reps} ${p.unit} • RIR ${rirs}`;
  }
  function holdHead(p,w){
    if(p.mode==='assist')return `Heute: ${w} kg Unterstützung beibehalten`;
    return w?`Heute: ${w} kg beibehalten`:'Heute: gleiche Variante beibehalten';
  }
  function recommendation(k,p){
    const h=history(k,p.id), last=h[0];
    if(!last){
      if(p.mode==='time')return {tone:'neutral',head:'Heute: Einstiegsgewicht wählen',detail:`Wähle ein Gewicht für etwa ${p.min}–35 Sekunden pro Satz bei stabiler Haltung und ungefähr 10–15 Sekunden Reserve.`};
      return {tone:'neutral',head:'Heute: Einstiegsgewicht wählen',detail:`Wähle eine Last, mit der du ungefähr die Mitte von ${p.min}–${p.max} ${p.unit} sauber mit ${rirLabel(p)} schaffst. Technik und volle ROM bleiben konstant.`};
    }
    const w=load(last);

    if(p.mode==='speed')return {tone:'neutral',head:`Heute: ${w?w+' kg beibehalten':'leicht bleiben'}`,detail:'Power vor Last: alle Wiederholungen schnell und technisch identisch. Nur steigern, wenn die Geschwindigkeit über alle Sätze stabil bleibt.'};

    if(p.mode==='time'){
      const a=sets(last).slice(0,p.sets);
      const reserves=a.map(s=>carryReserve(s,last));
      const lowTime=a.some(s=>+s.reps<p.min);
      const lowReserve=reserves.some(v=>v!=null&&v<5);
      const top=a.length>=p.sets&&a.every(s=>+s.reps>=p.max)&&reserves.every(v=>v==null||v>=5);
      if(top)return {tone:'good',head:'Heute: Gewicht leicht erhöhen',detail:`Alle Carries erreichten ${p.max} Sekunden mit mindestens etwa 5 Sekunden Reserve. Nimm den kleinsten sinnvollen Gewichtsschritt und starte wieder bei ungefähr ${p.min}–35 Sekunden.`};
      if(lowReserve)return {tone:'warn',head:holdHead(p,w),detail:'Die Zeitreserve war in mindestens einem Satz unter 5 Sekunden. Heute keine zusätzliche Zeit erzwingen; jeden Carry mit sauberer Haltung und mindestens etwa 5 Sekunden Reserve beenden.'};
      if(lowTime)return {tone:'neutral',head:holdHead(p,w),detail:`Gewicht zunächst halten und wieder mindestens ${p.min} Sekunden pro Satz mit sauberer Haltung erreichen.`};
      return {tone:'neutral',head:holdHead(p,w),detail:`Ziel: ${carryTarget(last,p)} Sek. Maximal +5 Sekunden Gesamtzeit – nur wenn die Haltung stabil bleibt und noch mindestens etwa 5 Sekunden Reserve vorhanden sind.`};
    }

    const repeatedLow=h.length>=2&&h.slice(0,2).every(x=>below(x,p));
    if(repeatedLow)return {tone:'warn',head:p.mode==='assist'?'Heute: Unterstützung leicht erhöhen':'Heute: Last leicht reduzieren',detail:`Die Untergrenze wurde in zwei Einheiten hintereinander verfehlt. Nimm den kleinsten verfügbaren Schritt und arbeite wieder sauber im Bereich ${p.min}–${p.max} ${p.unit} bei ${rirLabel(p)}.`};

    if(hardRir(last,p))return {tone:'warn',head:holdHead(p,w),detail:`RIR vor Wiederholungen: Letztes Mal fiel mindestens ein Satz unter ${rirLabel(p)}. Heute keine zusätzlichen Reps erzwingen. Jeden Satz bei ${rirLabel(p)} stoppen – auch wenn dadurch weniger Wiederholungen entstehen. Erst danach wieder progressieren.`};

    if(below(last,p))return {tone:'neutral',head:holdHead(p,w),detail:`Gewicht zunächst halten. Ziel ist wieder mindestens ${p.min} ${p.unit} pro Satz bei ${rirLabel(p)}. Wird die Untergrenze auch diesmal verfehlt, reduzieren wir beim nächsten Mal leicht.`};

    if(topReady(last,p)){
      if(p.mode==='assist')return {tone:'good',head:'Heute: Unterstützung reduzieren',detail:`Alle Sätze erreichten die Obergrenze mit ausreichender Reserve. Nimm den kleinsten verfügbaren Schritt weniger Unterstützung und starte wieder im unteren bis mittleren Wiederholungsbereich bei ${rirLabel(p)}.`};
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

      if(ex.mode==='time'){
        const rows=[...card.querySelectorAll('.setrow')];
        rows.forEach((row,i)=>{
          const input=row.querySelector('.rir');
          const label=input?.closest('div')?.querySelector('label');
          if(label)label.textContent='Reserve Sek.';
          if(input){input.min='0';input.max='60';input.step='1';}
          const old=last?.sets?.[i];
          if(input&&old){const v=carryReserve(old,last);input.value=v==null?'':v;}
        });
        const oldLast=card.querySelector('.last');
        if(oldLast&&last){
          oldLast.textContent='Letztes Mal: '+last.sets.map(s=>`${s.weight||0} kg × ${s.reps||0} Sek. • ${carryReserve(s,last)??'-'} Sek. Reserve`).join(' · ');
        }
      }

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
    if(p.mode==='time'){
      if(rows.some(r=>r.rir==null)){box.className='reco';box.textContent='Bitte zusätzlich die geschätzten Sekunden Reserve eintragen.';return}
      if(rows.some(r=>r.rir<5)){box.className='reco warn';box.textContent='Zeitreserve unter 5 Sek. – nächstes Mal keine zusätzliche Zeit erzwingen und den Carry etwas früher beenden.';return}
      if(rows.every(r=>r.reps>=p.max&&r.rir>=5)){box.className='reco good';box.textContent='✓ 45 Sek. sauber mit Reserve erreicht – nächstes Mal Gewicht leicht erhöhen und wieder bei 30–35 Sek. starten.';return}
      box.className='reco';box.textContent='✓ Belastung passt. Gewicht halten; nächstes Mal höchstens +5 Sek. Gesamtzeit bei stabiler Haltung und ≥5 Sek. Reserve.';return;
    }
    const rr=rirRange(p);
    if(rows.some(r=>r.rir!=null&&r.rir<rr.min)){
      box.className='reco warn';box.textContent=`RIR-Ziel unterschritten. Nächstes Mal keine Reps erzwingen: bei ${rirLabel(p)} stoppen und Last zunächst halten.`;return;
    }
    if(rows.some(r=>r.reps<p.min)){
      box.className='reco warn';box.textContent='Untergrenze verfehlt. Last zunächst halten; bei erneuter Unterschreitung in der nächsten Einheit leicht reduzieren.';return;
    }
    if(rows.every(r=>r.reps>=p.max&&(r.rir==null||r.rir>=rr.min))){
      box.className='reco good';
      box.textContent=p.mode==='assist'?'✓ Obergrenze sauber erreicht – nächstes Mal Unterstützung leicht reduzieren.':'✓ Obergrenze sauber erreicht – nächstes Mal den kleinsten sinnvollen Gewichtsschritt erhöhen.';
      return;
    }
    box.className='reco';box.textContent=`✓ Belastung passt. Gewicht halten; nächstes Mal höchstens +1 saubere Gesamt-Wdh., solange ${rirLabel(p)} erhalten bleiben.`;
  };
})();
