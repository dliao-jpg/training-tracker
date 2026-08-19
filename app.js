let data=loadData(),currentKey=null,deferredPrompt=null,timerInt=null,timerEnd=0;

function loadData(){try{return JSON.parse(localStorage.getItem("tt_v2"))||{sessions:[]}}catch(e){return{sessions:[]}}}
function persist(){localStorage.setItem("tt_v2",JSON.stringify(data))}
function iso(d=new Date()){const o=d.getTimezoneOffset();return new Date(d-o*60000).toISOString().slice(0,10)}
function fmt(s){return new Intl.DateTimeFormat("de-DE",{day:"2-digit",month:"2-digit",year:"2-digit"}).format(new Date(s+"T12:00:00"))}
function sow(d=new Date()){let x=new Date(d),k=(x.getDay()+6)%7;x.setHours(0,0,0,0);x.setDate(x.getDate()-k);return x}
function inWeek(s){const d=new Date(s+"T12:00:00"),a=sow(),b=new Date(a);b.setDate(b.getDate()+7);return d>=a&&d<b}
function allEx(){let m=new Map();Object.values(PLAN).filter(p=>p.type==="strength").forEach(p=>p.exercises.forEach(e=>m.set(e.id,e)));return [...m.values()]}

function render(){
 const wk=data.sessions.filter(s=>inWeek(s.date));
 weekDone.textContent=wk.length;
 strengthTotal.textContent=data.sessions.filter(s=>s.type==="strength").length;
 cardioWeek.textContent=wk.filter(s=>s.type==="cardio").reduce((a,b)=>a+(+b.duration||0),0);
 streak.textContent=calcStreak();
 renderWeek();renderCards();renderHistory();renderProgressSelect();drawProgress();
}
function calcStreak(){
 if(!data.sessions.length)return 0;
 let weeks=new Set(data.sessions.map(s=>{const d=sow(new Date(s.date+"T12:00:00"));return iso(d)}));
 let c=0,d=sow();
 while(weeks.has(iso(d))){c++;d.setDate(d.getDate()-7)}
 return c;
}
function renderWeek(){
 weekStrip.innerHTML="";const a=sow(),names=["Mo","Di","Mi","Do","Fr","Sa","So"];
 for(let i=0;i<7;i++){let d=new Date(a);d.setDate(d.getDate()+i);let x=iso(d),done=data.sessions.some(s=>s.date===x);weekStrip.innerHTML+=`<div class="day ${done?"done":""}"><strong>${names[i]}</strong><br>${String(d.getDate()).padStart(2,"0")}.${String(d.getMonth()+1).padStart(2,"0")}.</div>`}
}
function renderCards(){
 planCards.innerHTML="";
 Object.entries(PLAN).forEach(([k,p])=>{
  let last=[...data.sessions].reverse().find(s=>s.key===k);
  let c=document.createElement("div");c.className="card";
  c.innerHTML=`<div class="row"><div><div class="title">${p.title}</div><div class="subtitle">${p.subtitle}</div></div><span class="tag">${p.type==="strength"?p.exercises.length+" Übungen":"Cardio"}</span></div>
  <div class="small muted" style="margin-top:8px">${last?"Zuletzt: "+fmt(last.date):"Noch kein Eintrag"}</div>
  <div class="cardactions"><button class="btn primary" onclick="openWorkout('${k}')">${p.type==="strength"?"Training starten":"Cardio eintragen"}</button><button class="btn" onclick="quickView('${k}')">ℹ︎</button></div>`;
  planCards.appendChild(c);
 })
}
function quickView(k){const p=PLAN[k];alert(p.type==="strength"?p.exercises.map(e=>`${e.name}: ${e.sets}×${e.min}${e.max!==e.min?"–"+e.max:""} ${e.unit}`).join("\n"):`${p.title}\n${p.subtitle}`)}
function renderHistory(){
 const l=[...data.sessions].sort((a,b)=>(b.date+b.savedAt).localeCompare(a.date+a.savedAt)).slice(0,8);
 history.innerHTML=l.length?l.map(s=>`<div class="hist"><div class="row"><div><strong>${PLAN[s.key]?.title||s.key}</strong><div class="small muted">${fmt(s.date)}${s.type==="cardio"?" • "+s.duration+" Min. • "+s.cardioMode:""}</div></div><button class="btn" onclick="delSession('${s.id}')">Löschen</button></div></div>`).join(""):`<div class="small muted">Noch keine Einheiten gespeichert.</div>`;
}
function delSession(id){if(confirm("Einheit löschen?")){data.sessions=data.sessions.filter(s=>s.id!==id);persist();render()}}
function renderProgressSelect(){
 let old=progressExercise.value;
 progressExercise.innerHTML='<option value="">Übung wählen …</option>'+allEx().map(e=>`<option value="${e.id}">${e.name}</option>`).join("");
 if([...progressExercise.options].some(o=>o.value===old))progressExercise.value=old;
}
function drawProgress(){
 const c=progressChart,x=c.getContext("2d"),id=progressExercise.value;x.clearRect(0,0,c.width,c.height);x.fillStyle="#11151b";x.fillRect(0,0,c.width,c.height);
 if(!id){progressHint.textContent="Wähle eine Übung.";return}
 let pts=[];
 data.sessions.filter(s=>s.type==="strength").sort((a,b)=>a.date.localeCompare(b.date)).forEach(s=>{let e=s.exercises?.find(e=>e.id===id);if(!e)return;let v=e.sets.filter(z=>z.reps>0);if(!v.length)return;let best=[...v].sort((a,b)=>(b.weight*b.reps)-(a.weight*a.reps))[0];pts.push({d:s.date,v:best.weight,r:best.reps})});
 if(!pts.length){progressHint.textContent="Noch keine Daten.";return}
 let pad=32,W=c.width,H=c.height,vals=pts.map(p=>p.v),mn=Math.min(...vals),mx=Math.max(...vals),sp=mx-mn||1;
 x.strokeStyle="#2a303b";x.lineWidth=1;for(let i=0;i<4;i++){let y=pad+(H-2*pad)*i/3;x.beginPath();x.moveTo(pad,y);x.lineTo(W-pad,y);x.stroke()}
 x.strokeStyle="#5ea0ff";x.lineWidth=3;x.beginPath();pts.forEach((p,i)=>{let xx=pad+(W-2*pad)*(pts.length===1?.5:i/(pts.length-1)),yy=H-pad-(H-2*pad)*(p.v-mn)/sp;i?x.lineTo(xx,yy):x.moveTo(xx,yy)});x.stroke();
 x.fillStyle="#5ea0ff";pts.forEach((p,i)=>{let xx=pad+(W-2*pad)*(pts.length===1?.5:i/(pts.length-1)),yy=H-pad-(H-2*pad)*(p.v-mn)/sp;x.beginPath();x.arc(xx,yy,4,0,Math.PI*2);x.fill()});
 let last=pts.at(-1);progressHint.textContent=`Letzter Wert: ${last.v} kg × ${last.r} • ${fmt(last.d)}`;
}

function openWorkout(k){
 currentKey=k;let p=PLAN[k];
 homeScreen.classList.remove("active");workoutScreen.classList.add("active");
 workoutTitle.textContent=p.title;workoutSubtitle.textContent=p.subtitle;
 if(p.type==="cardio")renderCardio(p);else renderStrength(p,k);
 window.scrollTo(0,0);
}
function backHome(){stopTimer();currentKey=null;workoutScreen.classList.remove("active");homeScreen.classList.add("active");render();window.scrollTo(0,0)}
function lastExercise(k,id){
 let list=data.sessions.filter(s=>s.key===k&&s.type==="strength").sort((a,b)=>b.date.localeCompare(a.date));
 for(let s of list){let e=s.exercises?.find(e=>e.id===id);if(e)return e}return null;
}
function renderCardio(p){
 workoutBody.innerHTML=`<div class="card">
 <label>Datum</label><input id="sessionDate" type="date" value="${iso()}">
 <div style="height:10px"></div><label>Art</label><select id="cardioMode"><option>Zone 2</option><option>4×4 HIIT</option><option>Spaziergang</option><option>Sonstiges</option></select>
 <div style="height:10px"></div><label>Dauer (Min.)</label><input id="cardioDuration" type="number" value="${p.defaults.duration}">
 <div style="height:10px"></div><label>RPE (1–10)</label><input id="cardioRpe" type="number" min="1" max="10" value="${p.defaults.rpe}">
 <div style="height:10px"></div><label>Ø Herzfrequenz optional</label><input id="cardioHr" type="number" placeholder="z. B. 128">
 <div style="height:10px"></div><label>Notiz</label><textarea id="sessionNotes" rows="3"></textarea></div>`;
}
function renderStrength(p,k){
 let h=`<div class="notice">${p.warmup}</div><div style="height:10px"></div><label>Datum</label><input id="sessionDate" type="date" value="${iso()}">`;
 p.exercises.forEach((e,idx)=>{
  let last=lastExercise(k,e.id);
  h+=`<div class="exercise" data-id="${e.id}" data-min="${e.min}" data-max="${e.max}" data-mode="${e.mode}" data-rest="${e.rest}">
   <div class="exname">${idx+1}. ${e.name}</div><div class="exnote">${e.sets} × ${e.min}${e.max!==e.min?"–"+e.max:""} ${e.unit} • ${e.note}</div>`;
  for(let i=0;i<e.sets;i++){
   let s=last?.sets?.[i]||{};
   h+=`<div class="setrow"><div class="setnum">S${i+1}</div>
    <div><label>${e.mode==="assist"?"Unterst. kg":"Gewicht kg"}</label><input class="weight" type="number" step=".5" value="${s.weight??""}"></div>
    <div><label>${e.unit}</label><input class="reps" type="number" value="${s.reps??""}"></div>
    <div><label>RIR</label><input class="rir" type="number" min="0" max="6" value="${s.rir??""}"></div>
    <button class="check" onclick="toggleSet(this)">✓</button></div>`;
  }
  if(last)h+=`<div class="last">Letztes Mal: ${last.sets.map(s=>`${s.weight||0} kg × ${s.reps||0} @${s.rir??"-"}`).join(" · ")}</div>`;
  h+=`<div class="reco" id="reco_${e.id}">Werte eintragen → Empfehlung erscheint automatisch.</div></div>`;
 });
 h+=`<label>Notiz zur Einheit</label><textarea id="sessionNotes" rows="3" placeholder="Rücken/Hüfte, Schlaf, Besonderheiten …"></textarea>`;
 workoutBody.innerHTML=h;
 workoutBody.querySelectorAll(".exercise input").forEach(i=>i.addEventListener("input",()=>updateReco(i.closest(".exercise"))));
}
function toggleSet(btn){
 btn.classList.toggle("done");
 let ex=btn.closest(".exercise"),rest=+ex.dataset.rest||90;
 if(btn.classList.contains("done"))startTimer(rest);
 updateReco(ex);
}
function updateReco(ex){
 let mn=+ex.dataset.min,mx=+ex.dataset.max,mode=ex.dataset.mode;
 let rows=[...ex.querySelectorAll(".setrow")].map(r=>({w:+r.querySelector(".weight").value,reps:+r.querySelector(".reps").value,rir:r.querySelector(".rir").value===""?null:+r.querySelector(".rir").value}));
 let box=ex.querySelector(".reco");
 if(rows.some(r=>!r.reps)){box.className="reco";box.textContent="Werte eintragen → Empfehlung erscheint automatisch.";return}
 if(mode==="speed"){box.className="reco";box.textContent="Power: nur steigern, wenn alle Wiederholungen schnell und technisch sauber bleiben.";return}
 let top=rows.every(r=>r.reps>=mx&&(r.rir===null||r.rir>=1)),low=rows.some(r=>r.reps<mn);
 if(top){box.className="reco good";box.textContent=mode==="assist"?"✓ Nächstes Mal Unterstützung leicht reduzieren.":mode==="time"?"✓ Zeitbereich erreicht – Gewicht leicht erhöhen.":"✓ Nächstes Mal Gewicht leicht erhöhen."}
 else if(low){box.className="reco warn";box.textContent="Gewicht halten. Wenn die Untergrenze wiederholt verfehlt wird: Last leicht reduzieren."}
 else {box.className="reco";box.textContent="Gewicht halten und zuerst Wiederholungen steigern."}
}
function saveWorkout(){
 let p=PLAN[currentKey],date=sessionDate.value||iso(),id=(crypto.randomUUID?crypto.randomUUID():String(Date.now()));
 if(p.type==="cardio"){
  data.sessions.push({id,key:currentKey,type:"cardio",date,savedAt:new Date().toISOString(),cardioMode:cardioMode.value,duration:+cardioDuration.value||0,rpe:+cardioRpe.value||null,hr:+cardioHr.value||null,notes:sessionNotes.value.trim()});
 }else{
  let exs=[...workoutBody.querySelectorAll(".exercise")].map(ex=>({id:ex.dataset.id,sets:[...ex.querySelectorAll(".setrow")].map(r=>({weight:+r.querySelector(".weight").value||0,reps:+r.querySelector(".reps").value||0,rir:r.querySelector(".rir").value===""?null:+r.querySelector(".rir").value}))}));
  if(!exs.some(e=>e.sets.some(s=>s.reps>0))){alert("Bitte mindestens einen Satz eintragen.");return}
  data.sessions.push({id,key:currentKey,type:"strength",date,savedAt:new Date().toISOString(),exercises:exs,notes:sessionNotes.value.trim()});
 }
 persist();backHome();
}
function startTimer(sec){
 clearInterval(timerInt);timerEnd=Date.now()+sec*1000;timerbar.classList.add("show");tickTimer();timerInt=setInterval(tickTimer,250);
}
function tickTimer(){
 let left=Math.max(0,Math.ceil((timerEnd-Date.now())/1000)),m=Math.floor(left/60),s=left%60;timerDisplay.textContent=`${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
 if(left<=0){clearInterval(timerInt);timerInt=null;navigator.vibrate?.([250,150,250]);timerDisplay.textContent="Fertig";}
}
function stopTimer(){clearInterval(timerInt);timerInt=null;timerbar.classList.remove("show")}
function openData(){dataDialog.showModal()}
function blobDl(blob,name){let a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
function exportJSON(){blobDl(new Blob([JSON.stringify(data,null,2)],{type:"application/json"}),`training-backup-${iso()}.json`)}
function exportCSV(){
 let rows=[["Datum","Training","Typ","Übung","Satz","Gewicht/Unterstützung kg","Wdh./Sek.","RIR","Cardio Art","Dauer Min.","RPE","HF","Notiz"]];
 data.sessions.forEach(s=>{if(s.type==="strength"){s.exercises.forEach(e=>e.sets.forEach((z,i)=>rows.push([s.date,PLAN[s.key]?.title||s.key,"Kraft",allEx().find(x=>x.id===e.id)?.name||e.id,i+1,z.weight,z.reps,z.rir??"","","","","",s.notes||""])))}else rows.push([s.date,PLAN[s.key]?.title||s.key,"Cardio","","","","","",s.cardioMode,s.duration,s.rpe??"",s.hr??"",s.notes||""])});
 let csv=rows.map(r=>r.map(v=>`"${String(v??"").replaceAll('"','""')}"`).join(";")).join("\n");blobDl(new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8"}),`training-export-${iso()}.csv`);
}
function importJSON(ev){
 let f=ev.target.files[0];if(!f)return;let r=new FileReader();r.onload=()=>{try{let o=JSON.parse(r.result);if(!Array.isArray(o.sessions))throw 0;data=o;persist();render();alert("Backup importiert.");dataDialog.close()}catch(e){alert("Ungültige Datei.")}};r.readAsText(f);ev.target.value="";
}
function resetData(){if(confirm("Wirklich ALLE Trainingsdaten löschen?")&&confirm("Letzte Bestätigung?")){data={sessions:[]};persist();render();dataDialog.close()}}

window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredPrompt=e;installBanner.classList.add("show")});
window.addEventListener("appinstalled",()=>{installBanner.classList.remove("show");deferredPrompt=null});
async function installApp(){
 if(deferredPrompt){deferredPrompt.prompt();await deferredPrompt.userChoice;deferredPrompt=null;return}
 alert("iPhone/iPad: In Safari auf Teilen → ‘Zum Home-Bildschirm’.\n\nAndroid: Chrome-Menü → ‘App installieren’ bzw. ‘Zum Startbildschirm hinzufügen’.");
}
function detectIOS(){
 const ua=navigator.userAgent.toLowerCase(),ios=/iphone|ipad|ipod/.test(ua),standalone=window.navigator.standalone;
 if(ios&&!standalone){installBanner.classList.add("show");installBtn.textContent="Anleitung";installText.textContent="Safari → Teilen → Zum Home-Bildschirm";}
}
if("serviceWorker" in navigator){window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}))}
detectIOS();render();