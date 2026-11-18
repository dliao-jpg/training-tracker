// Training Tracker V2.4.2 – China 10-week block
// Legacy names are retained so historical sessions keep readable labels in Progress/CSV.
const LEGACY_EXERCISES=[
 {id:"incline_press",name:"Incline Dumbbell / Smith Press"},
 {id:"lat_pull",name:"Latzug neutral / Assisted Pull-up"},
 {id:"cable_row",name:"Cable Row neutral"},
 {id:"cable_fly",name:"Cable Fly"},
 {id:"lateral_raise",name:"Lateral Raise"},
 {id:"cable_curl",name:"Cable Curl"},
 {id:"triceps",name:"Triceps Pushdown"},
 {id:"bulgarian",name:"Bulgarian Split Squat"},
 {id:"squat",name:"Smith Squat / Heel-Elevated Goblet Squat"},
 {id:"hip_thrust",name:"Barbell Hip Thrust"},
 {id:"leg_curl",name:"Single-Leg Cable Leg Curl"},
 {id:"calf_raise",name:"Calf Raise"},
 {id:"pallof",name:"Pallof Press"},
 {id:"speed_squat",name:"Speed Smith Squat"},
 {id:"pushup",name:"Push-up / Weighted Push-up"},
 {id:"chinup",name:"Assisted Pull-up / Chin-up"},
 {id:"reverse_lunge",name:"Reverse Lunge / Step-up"},
 {id:"hyperextension",name:"45° Hyperextension"},
 {id:"farmer",name:"Farmer Carry"},
 {id:"face_pull",name:"Face Pull"},
 {id:"china_lat_pull",name:"Lat Pulldown – China-Maschine"}
];

const PLAN={
 upper:{title:"Einheit 1 – Upper Body",subtitle:"China Block • Hypertrophie & Haltung",type:"strength",warmup:"Wall Angels ×10 + Inchworm Walkouts ×2 + World's Greatest Stretch ×10 + Band Pull Apart ×15 + leichter einarmiger Cable Row ×10/Seite + 1–2 Aufwärmsätze Press.",exercises:[
  {id:"incline_press",name:"Incline Dumbbell Press",sets:3,min:8,max:12,unit:"Wdh.",mode:"load",rest:120,note:"1–2 RIR"},
  {id:"china_seated_underhand_lat",name:"Seated Underhand Cable Lat Pulldown",sets:3,min:8,max:12,unit:"Wdh.",mode:"load",rest:120,note:"1–2 RIR • beidhändig • Unterhandgriff • volle kontrollierte ROM"},
  {id:"china_one_arm_row",name:"One-Arm Cable Row",sets:3,min:8,max:12,unit:"Wdh./Seite",mode:"load",rest:90,note:"1–2 RIR • schwächere Seite zuerst"},
  {id:"china_cable_fly",name:"Cable Fly",sets:2,min:12,max:15,unit:"Wdh.",mode:"load",rest:75,note:"1–2 RIR"},
  {id:"china_lateral_raise",name:"Cable / DB Lateral Raise",sets:3,min:12,max:20,unit:"Wdh.",mode:"load",rest:60,note:"1–2 RIR"},
  {id:"china_db_curl",name:"Dumbbell Curl",sets:2,min:10,max:15,unit:"Wdh.",mode:"load",rest:60,note:"1 RIR • Supersatz"},
  {id:"china_triceps",name:"Triceps Pushdown",sets:2,min:10,max:15,unit:"Wdh.",mode:"load",rest:60,note:"1 RIR • Supersatz"}
 ]},
 zone2a:{title:"Einheit 2 – Zone 2",subtitle:"Aerobe Basis • Laufband / Rower",type:"cardio",defaults:{mode:"Zone 2",duration:45,rpe:4}},
 lower:{title:"Einheit 3 – Lower + Core",subtitle:"China Block • Beine, Hüfte & Rumpf",type:"strength",warmup:"Wall Angels ×10 + Inchworm Walkouts ×2 + World's Greatest Stretch ×10 + Leg Swings vor/zurück ×10 je Bein + Leg Swings seitlich ×10 je Bein + Bodyweight Split Squat ×6/Seite + Glute Bridge ×10 + Squat ×8.",exercises:[
  {id:"bulgarian",name:"Bulgarian Split Squat",sets:3,min:8,max:10,unit:"Wdh./Seite",mode:"load",rest:120,note:"2 RIR • schwächere Seite zuerst"},
  {id:"china_smith_squat",name:"Smith Squat",sets:3,min:8,max:12,unit:"Wdh.",mode:"load",rest:120,note:"2 RIR • China-Smith"},
  {id:"china_smith_hip_thrust",name:"Smith Hip Thrust",sets:3,min:8,max:12,unit:"Wdh.",mode:"load",rest:90,note:"1–2 RIR • Bank/Setup konstant halten"},
  {id:"china_medball_curl",name:"Medicine Ball Hamstring Curl",sets:2,min:10,max:15,unit:"Wdh.",mode:"load",rest:75,note:"1–2 RIR • Hüfte stabil/angehoben"},
  {id:"china_leg_extension",name:"Leg Extension",sets:2,min:10,max:15,unit:"Wdh.",mode:"load",rest:75,note:"1–2 RIR • Sitz/ROM konstant halten"},
  {id:"china_calf_raise",name:"Calf Raise",sets:3,min:10,max:15,unit:"Wdh.",mode:"load",rest:60,note:"1 RIR"},
  {id:"china_pallof",name:"Pallof Press",sets:2,min:10,max:12,unit:"Wdh./Seite",mode:"load",rest:60,note:"2–3 RIR"}
 ]},
 full:{title:"Einheit 4 – Full Body + Power",subtitle:"China Block • Ganzkörper & funktionelle Kraft",type:"strength",warmup:"Wall Angels ×10 + Inchworm Walkouts ×2 + World's Greatest Stretch ×10 + Leg Swings vor/zurück ×10 je Bein + Leg Swings seitlich ×10 je Bein + Squat ×6 + Scapular Push-up ×8 + leichter Cable Row ×8.",exercises:[
  {id:"china_speed_squat",name:"Speed Smith Squat",sets:3,min:5,max:5,unit:"Wdh.",mode:"speed",rest:90,note:"leicht • explosiv hoch • bei deutlichem Speed-Verlust stoppen"},
  {id:"pushup",name:"Push-up / Weighted Push-up",sets:3,min:8,max:15,unit:"Wdh.",mode:"load",rest:90,note:"1–2 RIR"},
  {id:"china_one_arm_lat_pull_full",name:"One-Arm Cable Lat Pulldown",sets:3,min:8,max:12,unit:"Wdh./Seite",mode:"load",rest:90,note:"1–2 RIR • hoher Kabelzug schräg zur Hüfte • schwächere Seite zuerst"},
  {id:"reverse_lunge",name:"Reverse Lunge",sets:2,min:8,max:10,unit:"Wdh./Seite",mode:"load",rest:90,note:"2 RIR • schwächere Seite zuerst"},
  {id:"china_db_rdl",name:"Dumbbell Romanian Deadlift",sets:2,min:8,max:12,unit:"Wdh.",mode:"load",rest:90,note:"2–3 RIR • Hanteln dicht am Körper • kontrollierte ROM"},
  {id:"farmer",name:"Farmer Carry",sets:3,min:30,max:45,unit:"Sek.",mode:"time",rest:75,note:"stabile Haltung • Reserve in Sek."},
  {id:"china_face_pull",name:"Face Pull",sets:2,min:15,max:20,unit:"Wdh.",mode:"load",rest:60,note:"1–2 RIR"}
 ]},
 cardioSat:{title:"Einheit 5 – Cardio",subtitle:"Laufband / Rower • Zone 2 oder gelegentlich 4×4",type:"cardio",defaults:{mode:"Zone 2",duration:50,rpe:4}}
};