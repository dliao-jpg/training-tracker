const PLAN={
 upper:{title:"Einheit 1 – Upper Body",subtitle:"Hypertrophie & Haltung",type:"strength",warmup:"Wall Angels ×10 + Inchworm Walkouts ×2 + World's Greatest Stretch ×10 + Band Pull Apart ×15 + leichter Cable Row ×12 + 1–2 Aufwärmsätze Press.",exercises:[
  {id:"incline_press",name:"Incline Dumbbell / Smith Press",sets:3,min:8,max:12,unit:"Wdh.",mode:"load",rest:120,note:"1–2 RIR"},
  {id:"lat_pull",name:"Latzug neutral / Assisted Pull-up",sets:3,min:8,max:12,unit:"Wdh.",mode:"load",rest:120,note:"1–2 RIR"},
  {id:"cable_row",name:"Cable Row neutral",sets:3,min:8,max:12,unit:"Wdh.",mode:"load",rest:90,note:"1–2 RIR"},
  {id:"cable_fly",name:"Cable Fly",sets:2,min:12,max:15,unit:"Wdh.",mode:"load",rest:75,note:"1–2 RIR"},
  {id:"lateral_raise",name:"Lateral Raise",sets:3,min:12,max:20,unit:"Wdh.",mode:"load",rest:60,note:"1–2 RIR"},
  {id:"cable_curl",name:"Cable Curl",sets:2,min:10,max:15,unit:"Wdh.",mode:"load",rest:60,note:"1 RIR • Supersatz"},
  {id:"triceps",name:"Triceps Pushdown",sets:2,min:10,max:15,unit:"Wdh.",mode:"load",rest:60,note:"1 RIR • Supersatz"}
 ]},
 zone2a:{title:"Einheit 2 – Zone 2",subtitle:"Aerobe Basis",type:"cardio",defaults:{mode:"Zone 2",duration:45,rpe:4}},
 lower:{title:"Einheit 3 – Lower + Core",subtitle:"Beine, Hüfte & Rumpf",type:"strength",warmup:"Wall Angels ×10 + Inchworm Walkouts ×2 + World's Greatest Stretch ×10 + Leg Swings vor/zurück ×10 je Bein + Leg Swings seitlich ×10 je Bein + Bodyweight Split Squat ×6/Seite + Glute Bridge ×10 + Squat ×8.",exercises:[
  {id:"bulgarian",name:"Bulgarian Split Squat",sets:3,min:8,max:10,unit:"Wdh./Seite",mode:"load",rest:120,note:"2 RIR • schwächere Seite zuerst"},
  {id:"squat",name:"Smith Squat / Heel-Elevated Goblet Squat",sets:3,min:8,max:12,unit:"Wdh.",mode:"load",rest:120,note:"2 RIR"},
  {id:"hip_thrust",name:"Smith Hip Thrust",sets:3,min:8,max:12,unit:"Wdh.",mode:"load",rest:90,note:"1–2 RIR"},
  {id:"leg_curl",name:"Single-Leg Cable Leg Curl",sets:2,min:10,max:15,unit:"Wdh./Seite",mode:"load",rest:75,note:"1–2 RIR"},
  {id:"calf_raise",name:"Calf Raise",sets:3,min:10,max:15,unit:"Wdh.",mode:"load",rest:60,note:"1 RIR"},
  {id:"pallof",name:"Pallof Press",sets:2,min:10,max:12,unit:"Wdh./Seite",mode:"load",rest:60,note:"2–3 RIR"}
 ]},
 full:{title:"Einheit 4 – Full Body + Power",subtitle:"Ganzkörper & funktionelle Kraft",type:"strength",warmup:"Wall Angels ×10 + Inchworm Walkouts ×2 + World's Greatest Stretch ×10 + Leg Swings vor/zurück ×10 je Bein + Leg Swings seitlich ×10 je Bein + Squat ×6 + Scapular Push-up ×8 + leichter Row ×8.",exercises:[
  {id:"speed_squat",name:"Speed Smith Squat",sets:3,min:5,max:5,unit:"Wdh.",mode:"speed",rest:75,note:"leicht • explosiv hoch"},
  {id:"pushup",name:"Push-up / Weighted Push-up",sets:3,min:8,max:15,unit:"Wdh.",mode:"load",rest:90,note:"1–2 RIR"},
  {id:"chinup",name:"Assisted Pull-up / Chin-up",sets:3,min:6,max:10,unit:"Wdh.",mode:"assist",rest:120,note:"1–2 RIR"},
  {id:"reverse_lunge",name:"Reverse Lunge / Step-up",sets:2,min:8,max:10,unit:"Wdh./Seite",mode:"load",rest:90,note:"2 RIR"},
  {id:"hyperextension",name:"45° Hyperextension",sets:2,min:10,max:15,unit:"Wdh.",mode:"load",rest:90,note:"2–3 RIR"},
  {id:"farmer",name:"Farmer Carry",sets:3,min:30,max:45,unit:"Sek.",mode:"time",rest:75,note:"stabile Haltung"},
  {id:"face_pull",name:"Face Pull",sets:2,min:15,max:20,unit:"Wdh.",mode:"load",rest:60,note:"1–2 RIR"}
 ]},
 cardioSat:{title:"Einheit 5 – Cardio",subtitle:"Zone 2 oder gelegentlich 4×4",type:"cardio",defaults:{mode:"Zone 2",duration:50,rpe:4}}
};