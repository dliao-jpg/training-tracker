// Training Tracker V2.2 – resilient local storage layer
(function(){
  const PRIMARY_KEY="tt_v2";
  const SHADOW_KEY="tt_v2_shadow";
  const DRAFT_KEY="tt_v2_draft";
  const DB_NAME="training-tracker-db";
  const DB_VERSION=1;
  const STORE="kv";
  let draftTimer=null;

  function validData(x){return x&&Array.isArray(x.sessions)}
  function clone(x){return JSON.parse(JSON.stringify(x))}
  function safeParse(x){try{return JSON.parse(x)}catch(e){return null}}

  function openDB(){
    return new Promise((resolve,reject)=>{
      if(!("indexedDB" in window)){reject(new Error("IndexedDB unavailable"));return}
      const req=indexedDB.open(DB_NAME,DB_VERSION);
      req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains(STORE))db.createObjectStore(STORE)};
      req.onsuccess=()=>resolve(req.result);
      req.onerror=()=>reject(req.error||new Error("IndexedDB open failed"));
    });
  }
  async function idbPut(key,value){
    try{
      const db=await openDB();
      await new Promise((resolve,reject)=>{const tx=db.transaction(STORE,"readwrite");tx.objectStore(STORE).put(clone(value),key);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)});
      db.close();return true;
    }catch(e){return false}
  }
  async function idbGet(key){
    try{
      const db=await openDB();
      const value=await new Promise((resolve,reject)=>{const tx=db.transaction(STORE,"readonly");const r=tx.objectStore(STORE).get(key);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});
      db.close();return value||null;
    }catch(e){return null}
  }
  async function idbDel(key){
    try{
      const db=await openDB();
      await new Promise((resolve,reject)=>{const tx=db.transaction(STORE,"readwrite");tx.objectStore(STORE).delete(key);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)});
      db.close();
    }catch(e){}
  }

  function mergeData(...sources){
    const valid=sources.filter(validData);
    if(!valid.length)return {sessions:[]};
    const map=new Map();
    valid.forEach(src=>(src.sessions||[]).forEach(s=>{
      if(!s||!s.id)return;
      const old=map.get(s.id);
      if(!old||String(s.savedAt||"")>=String(old.savedAt||""))map.set(s.id,s);
    }));
    return {sessions:[...map.values()].sort((a,b)=>String(a.savedAt||a.date||"").localeCompare(String(b.savedAt||b.date||"")))};
  }

  const originalPersist=persist;
  persist=function(){
    originalPersist();
    try{localStorage.setItem(SHADOW_KEY,JSON.stringify(data))}catch(e){}
    idbPut("data",data);
    try{
      const check=safeParse(localStorage.getItem(PRIMARY_KEY));
      if(!validData(check)||check.sessions.length!==data.sessions.length)console.error("Training Tracker: local save verification failed");
    }catch(e){}
  };

  async function recoverData(){
    const primary=validData(data)?data:{sessions:[]};
    const shadow=safeParse(localStorage.getItem(SHADOW_KEY));
    const dbCopy=await idbGet("data");
    const merged=mergeData(primary,shadow,dbCopy);
    const before=primary.sessions.length;
    if(merged.sessions.length>before){
      data=merged;
      persist();
      render();
      alert(`${merged.sessions.length-before} gespeicherte Einheit(en) aus der Sicherheitskopie wiederhergestellt.`);
    }else if(merged.sessions.length){
      data=merged;
      persist();
    }
  }

  function captureDraft(){
    if(!currentKey||!workoutScreen.classList.contains("active"))return null;
    const p=PLAN[currentKey];
    const d={key:currentKey,type:p.type,savedAt:new Date().toISOString()};
    const dateEl=document.getElementById("sessionDate");d.date=dateEl?.value||iso();
    const noteEl=document.getElementById("sessionNotes");d.notes=noteEl?.value||"";
    if(p.type==="strength"){
      d.exercises=[...workoutBody.querySelectorAll(".exercise")].map(ex=>({id:ex.dataset.id,sets:[...ex.querySelectorAll(".setrow")].map(r=>({
        weight:r.querySelector(".weight")?.value??"",
        reps:r.querySelector(".reps")?.value??"",
        rir:r.querySelector(".rir")?.value??"",
        done:r.querySelector(".check")?.classList.contains("done")||false
      }))}));
      const hasValues=d.exercises.some(e=>e.sets.some(s=>s.weight!==""||s.reps!==""||s.rir!==""||s.done));
      if(!hasValues&&!d.notes)return null;
    }else{
      d.cardioMode=document.getElementById("cardioMode")?.value||"Zone 2";
      d.duration=document.getElementById("cardioDuration")?.value||"";
      d.rpe=document.getElementById("cardioRpe")?.value||"";
      d.hr=document.getElementById("cardioHr")?.value||"";
    }
    return d;
  }
  function saveDraftNow(){
    const d=captureDraft();if(!d)return;
    try{localStorage.setItem(DRAFT_KEY,JSON.stringify(d))}catch(e){}
    idbPut("draft",d);
  }
  function scheduleDraft(){clearTimeout(draftTimer);draftTimer=setTimeout(saveDraftNow,120)}
  async function clearDraft(){
    try{localStorage.removeItem(DRAFT_KEY)}catch(e){}
    await idbDel("draft");
  }
  function applyDraft(d){
    if(!d||d.key!==currentKey)return false;
    const dateEl=document.getElementById("sessionDate");if(dateEl&&d.date)dateEl.value=d.date;
    const noteEl=document.getElementById("sessionNotes");if(noteEl)noteEl.value=d.notes||"";
    if(d.type==="strength"){
      (d.exercises||[]).forEach(e=>{
        const ex=workoutBody.querySelector(`.exercise[data-id="${e.id}"]`);if(!ex)return;
        const rows=[...ex.querySelectorAll(".setrow")];
        (e.sets||[]).forEach((s,i)=>{const r=rows[i];if(!r)return;
          const w=r.querySelector(".weight"),rp=r.querySelector(".reps"),rr=r.querySelector(".rir"),ck=r.querySelector(".check");
          if(w)w.value=s.weight??"";if(rp)rp.value=s.reps??"";if(rr)rr.value=s.rir??"";if(ck)ck.classList.toggle("done",!!s.done);
        });
        updateReco(ex);
      });
    }else{
      if(document.getElementById("cardioMode")&&d.cardioMode)cardioMode.value=d.cardioMode;
      if(document.getElementById("cardioDuration"))cardioDuration.value=d.duration??"";
      if(document.getElementById("cardioRpe"))cardioRpe.value=d.rpe??"";
      if(document.getElementById("cardioHr"))cardioHr.value=d.hr??"";
    }
    return true;
  }
  async function restoreDraft(){
    const local=safeParse(localStorage.getItem(DRAFT_KEY));
    const dbDraft=await idbGet("draft");
    let d=local||dbDraft;
    if(local&&dbDraft&&String(dbDraft.savedAt||"")>String(local.savedAt||""))d=dbDraft;
    if(d&&d.key===currentKey&&applyDraft(d)){
      const age=Date.now()-new Date(d.savedAt||0).getTime();
      if(age<7*24*60*60*1000){
        const n=document.createElement("div");n.className="notice";n.style.marginBottom="10px";n.textContent="Zwischengespeicherte Trainingswerte wiederhergestellt.";workoutBody.prepend(n);
      }
    }
  }
  function attachDraftListeners(){
    workoutBody.querySelectorAll("input,textarea,select").forEach(el=>{
      el.addEventListener("input",scheduleDraft);el.addEventListener("change",scheduleDraft);
    });
  }

  const originalOpenWorkout=openWorkout;
  openWorkout=function(k){originalOpenWorkout(k);attachDraftListeners();restoreDraft()};

  const originalToggleSet=toggleSet;
  toggleSet=function(btn){originalToggleSet(btn);scheduleDraft()};

  const originalSaveWorkout=saveWorkout;
  saveWorkout=function(){
    const before=data.sessions.length;
    originalSaveWorkout();
    if(data.sessions.length>before){
      clearDraft();
      const verify=safeParse(localStorage.getItem(PRIMARY_KEY));
      if(!validData(verify)||verify.sessions.length<data.sessions.length){
        alert("Speicherprüfung fehlgeschlagen. Bitte JSON-Backup exportieren und App neu öffnen.");
      }
    }
  };

  window.addEventListener("pagehide",saveDraftNow);
  document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="hidden")saveDraftNow()});

  if(navigator.storage?.persist)navigator.storage.persist().catch(()=>{});
  recoverData();
})();