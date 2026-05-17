import { useState, useEffect, useRef, useCallback } from "react";
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis } from "recharts";

// ═══ CONSTANTS ═══
const URG={emergency:{l:"Emergency",c:"#DC2626",bg:"#FEF2F2",i:"🚨",a:"Seek immediate emergency care."},urgent:{l:"Urgent",c:"#EA580C",bg:"#FFF7ED",i:"⚠️",a:"See a doctor within 24 hours."},moderate:{l:"Moderate",c:"#D97706",bg:"#FFFBEB",i:"📋",a:"Schedule a doctor visit within days."},low:{l:"Low Concern",c:"#059669",bg:"#ECFDF5",i:"✅",a:"Monitor at home. Seek care if worsening."}};
const AREAS=[{id:"head",l:"Head",i:"🧠"},{id:"chest",l:"Chest",i:"❤️"},{id:"abdomen",l:"Stomach",i:"🫁"},{id:"throat",l:"Throat",i:"🗣️"},{id:"back",l:"Back",i:"🦴"},{id:"limbs",l:"Limbs",i:"💪"},{id:"skin",l:"Skin",i:"🩹"},{id:"eyes",l:"Eyes",i:"👁️"},{id:"mental",l:"Mental",i:"🧘"},{id:"general",l:"General",i:"🌡️"}];
const SEVS=[{v:1,l:"Barely noticeable"},{v:2,l:"Mild"},{v:3,l:"Mild but present"},{v:4,l:"Moderate"},{v:5,l:"Affecting daily life"},{v:6,l:"Significant"},{v:7,l:"Hard to ignore"},{v:8,l:"Severe"},{v:9,l:"Very severe"},{v:10,l:"Worst imaginable"}];
const DURS=["Just started","A few hours","Since yesterday","2–3 days","About a week","2–4 weeks","Over a month","Recurring"];
const ASSOC=["Fever","Nausea","Vomiting","Dizziness","Fatigue","Shortness of breath","Sweating","Chills","Headache","Blurred vision","Numbness","Swelling","Rash","Weight loss","Poor sleep","Anxiety","Confusion","Chest tightness","Palpitations"];
const LANGS=[{c:"en",l:"English",f:"🇬🇧"},{c:"es",l:"Español",f:"🇪🇸"},{c:"fr",l:"Français",f:"🇫🇷"},{c:"hi",l:"हिन्दी",f:"🇮🇳"},{c:"zh",l:"中文",f:"🇨🇳"},{c:"ar",l:"العربية",f:"🇸🇦"},{c:"zu",l:"isiZulu",f:"🇿🇦"},{c:"sw",l:"Kiswahili",f:"🇰🇪"},{c:"pt",l:"Português",f:"🇧🇷"},{c:"de",l:"Deutsch",f:"🇩🇪"},{c:"ja",l:"日本語",f:"🇯🇵"},{c:"ru",l:"Русский",f:"🇷🇺"}];
const MOODS=[{v:1,e:"😢",l:"Very Low"},{v:2,e:"😔",l:"Low"},{v:3,e:"😐",l:"Okay"},{v:4,e:"🙂",l:"Good"},{v:5,e:"😊",l:"Great"}];
const VITAL_TYPES=[{id:"bp",l:"Blood Pressure",u:"mmHg",i:"🫀",fields:["systolic","diastolic"]},{id:"hr",l:"Heart Rate",u:"bpm",i:"💓",fields:["value"]},{id:"temp",l:"Temperature",u:"°C",i:"🌡️",fields:["value"]},{id:"weight",l:"Weight",u:"kg",i:"⚖️",fields:["value"]},{id:"sugar",l:"Blood Sugar",u:"mg/dL",i:"🩸",fields:["value"]}];

const SYS=`You are MedGuide AI. You reason like a senior emergency physician with 20 years of experience who genuinely cares about each patient.

CLINICAL REASONING — apply ALL steps:

STEP 1 — LISTEN: What is the patient really telling you? What are they worried about?

STEP 2 — RED FLAGS: Screen for life-threatening conditions FIRST. MI, stroke, PE, sepsis, meningitis, aortic dissection, ectopic pregnancy, cauda equina, testicular torsion. If present → emergency.

STEP 3 — ANATOMICAL THINKING: What specific structures are in the affected area? For knee pain: meniscus, ACL/PCL/MCL/LCL, patella, bursae, cartilage, tendons, bone. Be SPECIFIC about which structure is likely involved and WHY based on the symptom pattern.

STEP 4 — PATTERN MATCHING: What conditions present with THIS EXACT combination? Consider age, sex, onset, mechanism, severity. A 25-year-old athlete with acute knee swelling after twisting is completely different from a 65-year-old with gradual onset.

STEP 5 — WHAT AM I MISSING? Fight anchoring bias. What uncommon but serious condition could mimic this? What would a doctor regret missing?

STEP 6 — MEDICATION & HISTORY CHECK: Could medications cause or mask these symptoms?

STEP 7 — PHOTO ANALYSIS: If provided, describe clinical observations (color, swelling pattern, distribution, symmetry, borders) and what they suggest.

COMMUNICATION — THIS IS CRITICAL:
- Write like a brilliant doctor speaking to the patient face-to-face. Warm, specific, educational.
- Use anatomical terms BUT explain them: "the medial meniscus — the C-shaped cartilage on the inner side of your knee that cushions the joint"
- NEVER say vague things like "underlying pathology" or "further evaluation needed." Say WHAT you suspect and WHY.
- Your reasoning must teach the patient something about their body they didn't know.
- Connect dots visibly: "The fact that this recurs specifically when squatting — which loads the knee at a deep angle — strongly points toward..."
- Be specific: not "joint problem" but "possible meniscal irritation, because the medial meniscus bears most of the load during deep squats, and your pain location plus the swelling pattern on the inner knee matches this."
- Each possible condition explanation should be 3-4 sentences showing real clinical thinking.
- Your reasoning section should be 5-6 sentences of connected, visible thought process.

SAFETY:
- Never diagnose definitively. Use "strongly suggests," "consistent with," "most likely."
- Err toward higher urgency when uncertain.
- Chest pain + breathing/sweating/arm pain = EMERGENCY.
- Sudden worst headache + stiff neck = EMERGENCY.
- One-sided weakness or speech changes = EMERGENCY.
- Children: lower all thresholds.

LANGUAGE: Respond entirely in the specified language.

OUTPUT — valid JSON only, no other text:
{"urgency":"emergency|urgent|moderate|low","summary":"2-3 warm sentences telling the patient what you think is going on and what they should do, as if speaking directly to them","possible_conditions":[{"name":"Specific condition","explanation":"2 sentences max: which structure is involved, why this fits their presentation"}],"recommended_actions":["Specific actionable step with reasoning"],"relief_tips":["Specific practical tip — ice vs heat, positions, movements to avoid, OTC options with dosage"],"reasoning":"4-5 sentences of connected clinical thinking: walk through your differential, explain ranking, note what would change your assessment","red_flags_to_watch":["Specific symptom AND why it matters — e.g. 'sudden shortness of breath could indicate PE'"],"history_insight":"ONLY reference actual previous visits provided in the data. Example: 'You reported similar chest pain 2 days ago — the recurrence increases concern.' If no previous visits exist, respond with null. Do NOT ask questions here — questions go in questions_for_doctor.","questions_for_doctor":["Specific diagnostic question"],"sources_used":["Clinical reasoning basis"],"follow_up_days":3}`;

// No simulated data — everything is real user data or clearly labeled as coming soon

// ═══ STORAGE ═══
const K={p:"mg4-pro",h:"mg4-hist",s:"mg4-set",v:"mg4-vitals",m:"mg4-meds",mo:"mg4-mood",fu:"mg4-followup",ec:"mg4-econtacts"};
async function sG(k,f){try{const r=await window.storage.get(k);return r?JSON.parse(r.value):f}catch{return f}}
async function sS(k,v){try{await window.storage.set(k,JSON.stringify(v))}catch(e){console.error(e)}}

function cleanJSON(text){
  let cl=text.replace(/```json\s*/g,"").replace(/```\s*/g,"").replace(/\[\d+\]/g,"").trim();
  const m=cl.match(/\{[\s\S]*\}/);if(m)cl=m[0];
  cl=cl.replace(/,\s*}/g,"}").replace(/,\s*]/g,"]");
  cl=cl.replace(/[\x00-\x1F\x7F]/g," ");

  // Try as-is
  try{return JSON.parse(cl)}catch{}

  // Try trimming from end to find valid JSON
  for(let i=0;i<80;i++){
    const t=cl.slice(0,cl.length-i);
    const lb=t.lastIndexOf('}');
    if(lb<10)continue;
    let a=t.slice(0,lb+1);
    const ob=(a.match(/\{/g)||[]).length-(a.match(/\}/g)||[]).length;
    const oa=(a.match(/\[/g)||[]).length-(a.match(/\]/g)||[]).length;
    for(let j=0;j<oa;j++)a+=']';
    for(let j=0;j<ob;j++)a+='}';
    try{return JSON.parse(a)}catch{}
  }

  console.error("JSON repair failed. Extracting fields.");
  console.error("Preview:",cl.slice(0,500));

  // Regex extraction fallback
  const ex=(k)=>{const r=new RegExp('"'+k+'"\\s*:\\s*"([^"]{3,900})"');const mm=r.exec(cl);return mm?mm[1]:null};
  const exArr=(k)=>{const r=new RegExp('"'+k+'"\\s*:\\s*\\[([\\s\\S]*?)\\]');const mm=r.exec(cl);
    if(mm){const items=mm[1].match(/"([^"]{5,})"/g);if(items)return items.map(i=>i.replace(/^"|"$/g,''))}return[]};
  const exConds=()=>{const r=[];const n=[...cl.matchAll(/"name"\s*:\s*"([^"]+)"/g)];const e=[...cl.matchAll(/"explanation"\s*:\s*"([^"]{10,})"/g)];
    for(let i=0;i<n.length;i++)r.push({name:n[i][1],explanation:e[i]?e[i][1]:"Discuss with your doctor."});return r};

  if(cl.includes('"disease"')&&!cl.includes('"urgency"')){
    const out=[];const d=[...cl.matchAll(/"disease"\s*:\s*"([^"]+)"/g)];const rg=[...cl.matchAll(/"region"\s*:\s*"([^"]+)"/g)];
    for(let i=0;i<Math.min(d.length,rg.length);i++)out.push({disease:d[i][1],region:rg[i][1],status:"active",summary:"Ongoing outbreak.",severity:"moderate"});
    if(out.length>0)return{global_outbreaks:out,local_alerts:[],health_tips:[{tip:"Stay informed about health developments."}],last_updated:"Based on latest data"}}

  return{urgency:ex("urgency")||"moderate",summary:ex("summary")||"Please consult a healthcare professional.",possible_conditions:exConds(),recommended_actions:exArr("recommended_actions").length>0?exArr("recommended_actions"):["Consult a healthcare professional."],relief_tips:exArr("relief_tips"),reasoning:ex("reasoning")||"Assessment completed.",red_flags_to_watch:exArr("red_flags_to_watch"),history_insight:ex("history_insight"),questions_for_doctor:exArr("questions_for_doctor"),sources_used:["Clinical reasoning"],follow_up_days:3};
}

// ═══ CLAUDE HAIKU AI ═══
async function aiCall(msg,sys,hasImage,imageB64,maxTok){
  const content=hasImage&&imageB64?[{type:"image",source:{type:"base64",media_type:"image/jpeg",data:imageB64}},{type:"text",text:msg}]:[{type:"text",text:msg}];
  const body={model:"claude-haiku-4-5-20251001",max_tokens:maxTok||2500,system:sys||SYS,messages:[{role:"user",content}]};
  const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json","x-api-key":import.meta.env.VITE_ANTHROPIC_KEY,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},body:JSON.stringify(body)});
  if(!res.ok){let d="";try{d=(await res.json())?.error?.message||""}catch{}throw new Error(d||"Request failed.")}
  const data=await res.json();const text=(data.content||[]).filter(c=>c.type==="text").map(c=>c.text).join("");
  if(!text)throw new Error("Empty response.");
  return cleanJSON(text);
}

async function aiSearch(msg,sys){
  const body={model:"claude-haiku-4-5-20251001",max_tokens:800,system:sys,tools:[{type:"web_search_20250305",name:"web_search"}],messages:[{role:"user",content:msg}]};
  const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json","x-api-key":import.meta.env.VITE_ANTHROPIC_KEY,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},body:JSON.stringify(body)});
  if(!res.ok){let d="";try{d=(await res.json())?.error?.message||""}catch{}throw new Error(d||"Search failed.")}
  const data=await res.json();
  let text="";for(const block of(data.content||[])){if(block.type==="text")text+=block.text}
  if(!text)throw new Error("No results.");
  return cleanJSON(text);
}

async function triageAI(sy,hi,lang){
  const ln=LANGS.find(l=>l.c===lang)?.l||"English";
  const hC=hi.length>0?"\nPREVIOUS VISITS:\n"+hi.slice(0,8).map(h=>"- "+h.date+": "+h.symptoms.primarySymptom+" ("+h.urgency+")").join("\n"):"";
  const msg="RESPOND IN: "+ln+"\n\nPATIENT: "+(sy.patientName||"?")+", Age "+(sy.age||"?")+", "+(sy.sex||"?")+"\nLocation: "+(sy.location||"?")+"\nConditions: "+(sy.medHist||"None")+"\nMedications: "+(sy.meds||"None")+"\nAllergies: "+(sy.allergies||"None")+"\n\nCOMPLAINT:\n- Chief: "+sy.primarySymptom+"\n- Areas: "+(sy.bodyAreas||[]).join(", ")+"\n- Severity: "+sy.severity+"/10\n- Duration: "+sy.duration+"\n- Associated: "+(sy.assoc.length>0?sy.assoc.join(", "):"None")+"\n- Details: "+(sy.details||"None")+(sy.hasPhoto?"\n- PHOTO: Analyze for clinical signs.":"")+hC+"\n\nJSON only in "+ln+".";
  return aiCall(msg,SYS,sy.hasPhoto,sy.photoB64);
}

function useVoice(lang){const[on,setOn]=useState(false),[txt,setTxt]=useState(""),[ok,setOk]=useState(false);const ref=useRef(null);
  useEffect(()=>{const SR=window.SpeechRecognition||window.webkitSpeechRecognition;setOk(!!SR);if(SR){const r=new SR();r.continuous=false;r.interimResults=true;r.lang=lang;r.onresult=e=>setTxt(Array.from(e.results).map(x=>x[0].transcript).join(""));r.onend=()=>setOn(false);r.onerror=()=>setOn(false);ref.current=r}},[lang]);
  return{on,txt,ok,start:useCallback(()=>{if(ref.current){setTxt("");ref.current.start();setOn(true)}},[]),stop:useCallback(()=>{if(ref.current){ref.current.stop();setOn(false)}},[])}}

function genPDF(r,name,date){const u=URG[r?.urgency]||URG.moderate;
  const h=`<!DOCTYPE html><html><head><meta charset="utf-8"><title>MedGuide AI Report</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;color:#1a2b2a;padding:40px;max-width:700px;margin:0 auto;font-size:14px;line-height:1.6}.hd{display:flex;justify-content:space-between;align-items:center;padding-bottom:16px;border-bottom:3px solid #0F766E;margin-bottom:24px}.logo{font-size:22px;font-weight:700;color:#0F766E}.dt{font-size:12px;color:#7a9492}.urg{padding:16px;border-radius:8px;text-align:center;margin-bottom:20px;font-size:18px;font-weight:700;color:${u.c};background:${u.bg};border:2px solid ${u.c}}.sec{margin-bottom:16px}.st{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#0F766E;margin-bottom:8px;padding-bottom:4px;border-bottom:1px solid #e2edec}.sec p{font-size:13px;color:#4a6463}.ci{padding:8px 0;border-bottom:1px solid #f0f5f4}.ci:last-child{border:none}.cn{font-weight:600;font-size:13px}.ce{font-size:12px;color:#4a6463}.it{display:flex;gap:8px;padding:4px 0;font-size:12px;color:#4a6463}.d{width:5px;height:5px;border-radius:50%;background:#0F766E;margin-top:6px;flex-shrink:0}.w{color:#DC2626;font-size:12px;padding:4px 0}.ft{margin-top:24px;padding-top:16px;border-top:2px solid #e2edec;font-size:10px;color:#7a9492;text-align:center}@media print{button{display:none!important}}</style></head><body><div class="hd"><div class="logo">🩺 MedGuide AI — Health Report</div><div class="dt">${date||new Date().toLocaleDateString()}</div></div><div style="background:#f4f8f7;padding:12px 16px;border-radius:8px;margin-bottom:20px;font-size:13px"><strong>Patient:</strong> ${name||"Not specified"}</div><div class="urg">${u.i} ${u.l}<br><span style="font-size:13px;font-weight:400">${u.a}</span></div><div class="sec"><div class="st">Assessment Summary</div><p>${r.summary||""}</p></div>${r.possible_conditions?.length>0?`<div class="sec"><div class="st">Possible Conditions</div>${r.possible_conditions.map(c=>`<div class="ci"><div class="cn">${c.name}</div><div class="ce">${c.explanation}</div></div>`).join("")}</div>`:""}${r.recommended_actions?.length>0?`<div class="sec"><div class="st">Recommended Actions</div>${r.recommended_actions.map(a=>`<div class="it"><div class="d"></div><span>${a}</span></div>`).join("")}</div>`:""}${r.relief_tips?.length>0?`<div class="sec"><div class="st" style="color:#059669">💡 Relief Tips</div>${r.relief_tips.map(t=>`<div class="it"><div class="d" style="background:#059669"></div><span>${t}</span></div>`).join("")}</div>`:""}${r.reasoning?`<div class="sec"><div class="st">Clinical Reasoning</div><p>${r.reasoning}</p></div>`:""}${r.red_flags_to_watch?.length>0?`<div class="sec"><div class="st" style="color:#DC2626">⚠️ Warning Signs</div>${r.red_flags_to_watch.map(f=>`<div class="w">⚠️ ${f}</div>`).join("")}</div>`:""}${r.history_insight&&r.history_insight!=="null"?`<div class="sec"><div class="st" style="color:#0F766E">📋 Patient History Notes</div><p>${r.history_insight}</p></div>`:""}${r.questions_for_doctor?.length>0?`<div class="sec"><div class="st">Questions for Doctor</div>${r.questions_for_doctor.map(q=>`<div class="it"><div class="d"></div><span>${q}</span></div>`).join("")}</div>`:""}<div class="ft"><p>Generated by MedGuide AI — Health Intelligence Platform</p><p>This report is for informational purposes only. Not a medical diagnosis.</p><p>Always consult a qualified healthcare professional for medical decisions.</p><p style="margin-top:8px"><button onclick="window.print()" style="padding:8px 24px;background:#0F766E;color:white;border:none;border-radius:6px;font-size:13px;cursor:pointer;font-weight:600">Save as PDF / Print</button></p></div></body></html>`;
  const w=window.open("","_blank");if(w){w.document.write(h);w.document.close()}else alert("Allow popups for PDF.")}

// ═══ CSS ═══
const CSS=`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Fraunces:wght@400;600;700&display=swap');
:root{--p:#0F766E;--pl:#14B8A6;--pll:#CCFBF1;--pd:#0A5C56;--bg:#F4F8F7;--c:#FFF;--t:#1A2B2A;--t2:#4A6463;--t3:#7A9492;--b:#E2EDEC;--bl:#EEF3F2;--r:16px;--rs:10px;--ss:0 1px 3px rgba(15,118,110,.05);--sm:0 4px 16px rgba(15,118,110,.07);--red:#DC2626;--org:#EA580C;--yel:#D97706;--grn:#059669}
*{margin:0;padding:0;box-sizing:border-box}html,body{height:100%;overflow-y:auto}body{font-family:'DM Sans',sans-serif;background:var(--bg);color:var(--t);-webkit-font-smoothing:antialiased}
.app{max-width:480px;margin:0 auto;height:100vh;background:var(--bg);padding-bottom:80px;overflow-y:auto;overflow-x:hidden;-webkit-overflow-scrolling:touch}
.hdr{padding:12px 18px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;background:rgba(244,248,247,.95);backdrop-filter:blur(16px);z-index:100;border-bottom:1px solid var(--bl)}
.hl{display:flex;align-items:center;gap:8px}.hi2{width:30px;height:30px;background:linear-gradient(135deg,var(--p),var(--pl));border-radius:8px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:13px;font-weight:700}.ht2{font-size:15px;font-weight:600}
.hbs{display:flex;gap:5px}.hb{width:34px;height:34px;border:none;background:var(--c);border-radius:var(--rs);display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:14px;box-shadow:var(--ss)}
.scr{padding:0 16px 20px;animation:fi .3s ease}@keyframes fi{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
.hero{text-align:center;padding:24px 0 18px}.ho{width:72px;height:72px;margin:0 auto 14px;background:linear-gradient(135deg,var(--pll),#E0F7FA);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:32px;animation:pu 3s ease-in-out infinite}@keyframes pu{0%,100%{box-shadow:0 6px 24px rgba(20,184,166,.12)}50%{box-shadow:0 6px 40px rgba(20,184,166,.22)}}
.hero h1{font-family:Fraunces,serif;font-size:22px;font-weight:600;margin-bottom:5px;letter-spacing:-.4px}.hero p{font-size:12px;color:var(--t2);line-height:1.5;max-width:280px;margin:0 auto}
.bp{width:100%;padding:13px;background:linear-gradient(135deg,var(--p),var(--pd));color:#fff;border:none;border-radius:var(--r);font-family:'DM Sans';font-size:14px;font-weight:600;cursor:pointer;box-shadow:0 4px 16px rgba(15,118,110,.25);transition:all .2s}.bp:disabled{opacity:.4;cursor:not-allowed}
.bs2{width:100%;padding:11px;background:var(--c);color:var(--p);border:1.5px solid var(--b);border-radius:var(--r);font-family:'DM Sans';font-size:12px;font-weight:500;cursor:pointer;margin-top:8px}.bs2:hover{border-color:var(--pl);background:var(--pll)}
.card{background:var(--c);border-radius:var(--r);padding:14px;margin-bottom:9px;box-shadow:var(--ss);border:1px solid var(--bl)}
.card-t{font-size:12px;font-weight:600;margin-bottom:8px;display:flex;align-items:center;justify-content:space-between}
.badge{padding:2px 7px;border-radius:10px;font-size:8px;font-weight:600;text-transform:uppercase;letter-spacing:.5px}
.sl{font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:1.5px;color:var(--p);margin-bottom:2px}.st2{font-family:Fraunces,serif;font-size:18px;font-weight:600;line-height:1.3}.ss2{font-size:11px;color:var(--t2);margin-top:2px}.sh{margin:16px 0 10px}
.pb{height:3px;background:var(--b);border-radius:2px;margin:10px 0;overflow:hidden}.pf{height:100%;background:linear-gradient(90deg,var(--p),var(--pl));border-radius:2px;transition:width .5s}
.og{display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px}.oc{background:var(--c);border:1.5px solid var(--b);border-radius:var(--rs);padding:10px 6px;cursor:pointer;transition:all .2s;text-align:center;font-size:10px;font-weight:500}.oc:hover{border-color:var(--pl);background:var(--pll)}.oc.s{border-color:var(--p);background:var(--pll)}.oi{font-size:20px;margin-bottom:3px}
.oll{display:flex;flex-direction:column;gap:5px}.oli{background:var(--c);border:1.5px solid var(--b);border-radius:var(--rs);padding:10px 11px;cursor:pointer;font-size:12px}.oli.s{border-color:var(--p);background:var(--pll)}
.inp{width:100%;padding:10px 11px;border:1.5px solid var(--b);border-radius:var(--rs);font-family:'DM Sans';font-size:12px;color:var(--t);background:var(--c);outline:none}.inp:focus{border-color:var(--p)}.inp::placeholder{color:var(--t3)}
.isel{flex:1;padding:10px 11px;border:1.5px solid var(--b);border-radius:var(--rs);font-family:'DM Sans';font-size:12px;color:var(--t);background:var(--c);outline:none;cursor:pointer;-webkit-appearance:none}
.ir{display:flex;gap:7px;margin-bottom:7px}
.ch{display:flex;flex-wrap:wrap;gap:4px}.ci{padding:5px 10px;background:var(--c);border:1.5px solid var(--b);border-radius:16px;font-size:10px;font-family:'DM Sans';cursor:pointer}.ci.s{border-color:var(--p);background:var(--p);color:#fff}
.nb{display:flex;gap:7px;margin-top:16px}.bb{flex:0 0 auto;padding:10px 14px;background:var(--c);border:1.5px solid var(--b);border-radius:var(--rs);font-family:'DM Sans';font-size:12px;color:var(--t2);cursor:pointer}.bn{flex:1;padding:10px;background:linear-gradient(135deg,var(--p),var(--pd));color:#fff;border:none;border-radius:var(--rs);font-family:'DM Sans';font-size:12px;font-weight:600;cursor:pointer}.bn:disabled{opacity:.4;cursor:not-allowed}
.pr{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:60vh;text-align:center;padding:40px 16px}
.po{width:96px;height:96px;border-radius:50%;background:linear-gradient(135deg,var(--pll),#E0F7FA);display:flex;align-items:center;justify-content:center;margin-bottom:22px;animation:op 2s ease-in-out infinite}@keyframes op{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}}
.ub{border-radius:var(--r);padding:16px;margin:10px 0;text-align:center}
.rc{background:var(--c);border-radius:var(--r);padding:14px;margin-bottom:8px;box-shadow:var(--ss);border:1px solid var(--bl)}.rt{font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:var(--p);margin-bottom:8px}
.rc p{font-size:12px;line-height:1.5;color:var(--t2)}.cn2{padding:7px 0;border-bottom:1px solid var(--bl)}.cn2:last-child{border:none}.cna{font-size:12px;font-weight:600;margin-bottom:2px}.cne{font-size:11px;color:var(--t2);line-height:1.4}
.ai3{display:flex;gap:6px;padding:5px 0;font-size:11px;color:var(--t2);line-height:1.4}.ad3{flex-shrink:0;width:4px;height:4px;border-radius:50%;background:var(--p);margin-top:5px}
.di{background:#FFF8E1;border:1px solid #FFE082;border-radius:var(--rs);padding:9px 11px;font-size:9px;color:#795548;line-height:1.5;margin-top:8px}
.mc{display:flex;align-items:center;gap:9px;padding:10px;border:1.5px solid var(--b);border-radius:var(--rs);margin-bottom:6px;cursor:pointer;background:var(--c)}.mc.s{border-color:var(--p);background:var(--pll)}
.ma2{width:34px;height:34px;border-radius:50%;background:var(--pll);display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0}.mn{font-size:12px;font-weight:600}.md2{font-size:10px;color:var(--t3)}
.sg{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-bottom:10px}.sc{background:var(--c);border-radius:var(--rs);padding:10px;text-align:center;box-shadow:var(--ss)}.sn2{font-size:20px;font-weight:700;color:var(--p)}.slb{font-size:8px;color:var(--t3);margin-top:1px}
.tab-bar{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:480px;background:rgba(255,255,255,.97);backdrop-filter:blur(16px);border-top:1px solid var(--bl);display:flex;z-index:200;padding:5px 0 env(safe-area-inset-bottom,6px)}
.tab{flex:1;display:flex;flex-direction:column;align-items:center;gap:1px;padding:5px 0;cursor:pointer;border:none;background:none;font-family:'DM Sans'}.tab-i{font-size:18px}.tab-l{font-size:8px;font-weight:500;color:var(--t3)}.tab.a .tab-l{color:var(--p);font-weight:600}.tab.a .tab-i{transform:scale(1.1)}
.alert-banner{background:linear-gradient(135deg,#FEF2F2,#FFF7ED);border:1px solid #FECACA;border-radius:var(--rs);padding:8px 10px;margin-bottom:8px;display:flex;align-items:center;gap:7px}
.alert-dot{width:7px;height:7px;border-radius:50%;background:var(--red);animation:bk 1.5s infinite}@keyframes bk{0%,100%{opacity:1}50%{opacity:.3}}
.htab{display:flex;gap:4px;margin-bottom:10px;overflow-x:auto;padding-bottom:4px;-webkit-overflow-scrolling:touch}.htab-i{padding:6px 12px;border-radius:16px;font-size:10px;font-weight:500;white-space:nowrap;cursor:pointer;border:1.5px solid var(--b);background:var(--c);font-family:'DM Sans'}.htab-i.a{background:var(--p);color:#fff;border-color:var(--p)}
.mood-row{display:flex;gap:6px;justify-content:center;margin:10px 0}.mood-btn{width:48px;height:48px;border-radius:50%;border:2px solid var(--b);background:var(--c);font-size:22px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .2s}.mood-btn.s{border-color:var(--p);background:var(--pll);transform:scale(1.15)}
.photo-area{border:2px dashed var(--b);border-radius:var(--r);padding:20px;text-align:center;cursor:pointer;transition:all .2s;background:var(--c)}.photo-area:hover{border-color:var(--pl);background:var(--pll)}
.photo-preview{width:100%;max-height:200px;object-fit:cover;border-radius:var(--rs);margin-top:8px}
.ec{background:#FEF2F2;border:1px solid #FECACA;border-radius:var(--r);padding:14px;text-align:center;margin:10px 0}.ec p{color:#991B1B;font-size:11px}
.emerg-card{background:linear-gradient(135deg,#FEF2F2,#FFF1F1);border:2px solid var(--red);border-radius:var(--r);padding:14px;margin:8px 0;text-align:center}
.emerg-btn{width:100%;padding:12px;background:var(--red);color:#fff;border:none;border-radius:var(--rs);font-family:'DM Sans';font-size:13px;font-weight:700;cursor:pointer;margin-top:6px}
.lg2{display:grid;grid-template-columns:1fr 1fr 1fr;gap:5px;margin-top:6px}.lo2{padding:7px 3px;border:1.5px solid var(--b);border-radius:var(--rs);cursor:pointer;text-align:center;font-size:9px}.lo2.s{border-color:var(--p);background:var(--pll)}.lf2{font-size:14px;display:block}
@keyframes vp{0%,100%{box-shadow:0 0 0 0 rgba(220,38,38,.4)}50%{box-shadow:0 0 0 8px rgba(220,38,38,0)}}`;

const PC=["#0F766E","#14B8A6","#D97706","#DC2626"];

// ═══ MAIN APP ═══
export default function App(){
  const[tab,setTab]=useState("home");const[scr,setScr]=useState("loading");
  const[pro,setPro]=useState(null);const[hist,setHist]=useState([]);const[sets,setSets]=useState({lang:"en"});
  const[err,setErr]=useState(null);const[res,setRes]=useState(null);const[vI,setVI]=useState(null);
  const[loc,setLoc]=useState(null);
  // Auth
  const[user,setUser]=useState(null);const[authMode,setAuthMode]=useState("login");
  const[authEmail,setAuthEmail]=useState("");const[authPass,setAuthPass]=useState("");const[authErr,setAuthErr]=useState("");const[authLoading,setAuthLoading]=useState(false);
  // Assessment
  const[step,setStep]=useState(0);const[selP,setSelP]=useState(null);const[bAs,setBAs]=useState([]);
  const[prim,setPrim]=useState("");const[sev,setSev]=useState(5);const[dur,setDur]=useState("");
  const[aS,setAS]=useState([]);const[det,setDet]=useState("");
  const[photo,setPhoto]=useState(null);const[photoB64,setPhotoB64]=useState(null);
  // Setup
  const[sN,setSN]=useState("");const[sA,setSA]=useState("");const[sX,setSX]=useState("");
  // Family
  const[addM,setAddM]=useState(false);const[mN,setMN]=useState("");const[mAg,setMAg]=useState("");const[mS,setMS]=useState("");const[mR,setMR]=useState("");
  // Health tab
  const[hTab,setHTab]=useState("vitals");
  // Vitals
  const[vitals,setVitals]=useState([]);const[vType,setVType]=useState("bp");const[v1,setV1]=useState("");const[v2,setV2]=useState("");
  // Meds
  const[meds,setMeds]=useState([]);const[newMed,setNewMed]=useState("");const[newDose,setNewDose]=useState("");const[newFreq,setNewFreq]=useState("");
  // Mood
  const[moods,setMoods]=useState([]);
  // Emergency contacts
  const[eCons,setECons]=useState([]);const[newEcN,setNewEcN]=useState("");const[newEcP,setNewEcP]=useState("");const[newEcR,setNewEcR]=useState("");
  // Follow-ups
  const[followUps,setFollowUps]=useState([]);
  // Doctor
  const[editDoc,setEditDoc]=useState(false);const[docN,setDocN]=useState("");const[docP,setDocP]=useState("");
  // Medical profile
  const[editMH,setEditMH]=useState(false);const[mhC,setMhC]=useState("");const[mhM,setMhM]=useState("");const[mhA,setMhA]=useState("");
  // Lab
  const[labVals,setLabVals]=useState("");const[labRes,setLabRes]=useState(null);const[labLoading,setLabLoading]=useState(false);

  const voice=useVoice(sets.lang);
  const fileRef=useRef(null);

  useEffect(()=>{(async()=>{
    // Check auth
    const sb=window.supabase;
    if(sb){
      const{data:{session}}=await sb.auth.getSession();
      if(session?.user){setUser(session.user);
        // Load profile from Supabase
        const{data:profile}=await sb.from("profiles").select("*").eq("id",session.user.id).single();
        if(profile?.name){
          const p={primary:{name:profile.name,age:profile.age,sex:profile.sex,mh:{conditions:profile.medical_conditions,allergies:profile.allergies},doctor:{name:profile.doctor_name,phone:profile.doctor_phone}},members:[]};
          const{data:members}=await sb.from("family_members").select("*").eq("user_id",session.user.id);
          if(members)p.members=members.map(m=>({name:m.name,age:m.age,sex:m.sex,relation:m.relation}));
          setPro(p);await sS(K.p,p);
          // Load health checks
          const{data:checks}=await sb.from("health_checks").select("*").eq("user_id",session.user.id).order("created_at",{ascending:false}).limit(100);
          if(checks){const h=checks.map(c=>({id:c.id,date:new Date(c.created_at).toLocaleDateString("en-US",{year:"numeric",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}),symptoms:{primarySymptom:c.primary_symptom,bodyAreas:c.body_areas,severity:c.severity,duration:c.duration},urgency:c.urgency,result:c.result,pid:c.patient_id,pName:c.patient_name}));setHist(h);await sS(K.h,h)}
        }
      }
      // Listen for auth changes
      sb.auth.onAuthStateChange((event,session)=>{if(session?.user)setUser(session.user);else setUser(null)});
    }
    // Load from local storage as fallback/cache
    const p=await sG(K.p,null),h=await sG(K.h,[]),s=await sG(K.s,{lang:"en"});
    if(!pro&&p)setPro(p);if(hist.length===0&&h.length>0)setHist(h);setSets(s);
    const vi=await sG(K.v,[]),me=await sG(K.m,[]),mo=await sG(K.mo,[]),fu=await sG(K.fu,[]),ec=await sG(K.ec,[]);
    setVitals(vi);setMeds(me);setMoods(mo);setFollowUps(fu);setECons(ec);
    // Determine initial screen
    if(!sb){setScr(p?"ready":"setup")}
    else{const{data:{session}}=await sb.auth.getSession();setScr(session?"ready":"auth")}
    // Geolocation
    if(navigator.geolocation)navigator.geolocation.getCurrentPosition(async pos=>{
      try{const r=await fetch("https://nominatim.openstreetmap.org/reverse?lat="+pos.coords.latitude+"&lon="+pos.coords.longitude+"&format=json");
        const d=await r.json();setLoc({city:d.address?.city||d.address?.town||d.address?.village||"Unknown",country:d.address?.country||"Unknown"})}catch{}},()=>{})
  })()},[]);

  useEffect(()=>{if(voice.txt&&step===2)setPrim(voice.txt)},[voice.txt,step]);

  const reset=()=>{setStep(0);setSelP(null);setBAs([]);setPrim("");setSev(5);setDur("");setAS([]);setDet("");setErr(null);setRes(null);setPhoto(null);setPhotoB64(null)};
  const getPat=()=>{if(!selP||selP==="self")return{patientName:pro?.primary?.name,age:pro?.primary?.age,sex:pro?.primary?.sex};const m=pro?.members?.[selP];return m||{}};
  const savePro=async p=>{setPro(p);await sS(K.p,p);
    const sb=window.supabase;
    if(sb&&user){
      await sb.from("profiles").upsert({id:user.id,name:p.primary?.name,age:parseInt(p.primary?.age)||null,sex:p.primary?.sex,medical_conditions:p.primary?.mh?.conditions,allergies:p.primary?.mh?.allergies,doctor_name:p.primary?.doctor?.name,doctor_phone:p.primary?.doctor?.phone,updated_at:new Date().toISOString()});
    }
  };

  const handlePhoto=e=>{const f=e.target.files?.[0];if(!f)return;setPhoto(URL.createObjectURL(f));
    const img=new Image();img.onload=()=>{const max=512;let w=img.width,h=img.height;
      if(w>max||h>max){if(w>h){h=Math.round(h*max/w);w=max}else{w=Math.round(w*max/h);h=max}}
      const c=document.createElement("canvas");c.width=w;c.height=h;
      c.getContext("2d").drawImage(img,0,0,w,h);
      setPhotoB64(c.toDataURL("image/jpeg",0.6).split(",")[1])};
    img.src=URL.createObjectURL(f)};

  const submit=async()=>{setScr("processing");setErr(null);const pat=getPat();const mh=pro?.primary?.mh||{};
    const sy={...pat,bodyAreas:bAs.map(id=>AREAS.find(b=>b.id===id)?.l||id),primarySymptom:prim,severity:sev,duration:dur,assoc:aS,details:det,
      location:loc?loc.city+", "+loc.country:"",medHist:mh.conditions||"",meds:meds.map(m=>m.name+" "+m.dose).join(", "),allergies:mh.allergies||"",
      hasPhoto:!!photoB64,photoB64};
    try{const pH=hist.filter(h=>(selP==="self"||!selP)?(!h.pid||h.pid==="self"):h.pid===selP);
      const ai=await triageAI(sy,pH,sets.lang);
      const sess={id:Date.now()+"",date:new Date().toLocaleDateString("en-US",{year:"numeric",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}),symptoms:{...sy,photoB64:undefined},urgency:ai.urgency,result:ai,pid:selP||"self",pName:pat.patientName||"Self"};
      const nh=[sess,...hist].slice(0,100);setHist(nh);await sS(K.h,nh);
      // Sync to Supabase
      const sb=window.supabase;
      if(sb&&user){
        await sb.from("health_checks").insert({user_id:user.id,patient_name:pat.patientName,patient_id:selP||"self",body_areas:bAs.map(id=>AREAS.find(b=>b.id===id)?.l||id),primary_symptom:prim,severity:sev,duration:dur,associated_symptoms:aS,additional_details:det,urgency:ai.urgency,result:ai});
      }
      // Anonymous data always saves (no personal info)
      if(sb){
        try{await sb.from("anonymous_checks").insert({region:loc?.city||null,country:loc?.country||null,age_bracket:pat.age?Math.floor(pat.age/10)*10+"s":"unknown",sex:pat.sex||null,body_areas:bAs,symptom_keywords:prim.split(" ").slice(0,5),urgency:ai.urgency})}catch(e){console.warn("Anonymous sync skipped:",e)}
      }
      // Add follow-up
      if(ai.follow_up_days){const fuDate=new Date();fuDate.setDate(fuDate.getDate()+(ai.follow_up_days||3));
        const newFU=[{id:Date.now()+"",date:fuDate.toISOString(),symptom:prim.slice(0,50),urgency:ai.urgency,patient:pat.patientName||"Self"},...followUps].slice(0,20);
        setFollowUps(newFU);await sS(K.fu,newFU)}
      setRes(ai);setScr("results");
    }catch(e){setErr(e.message);setScr("assess");setStep(6)}};

  const canN=()=>{if(step===0)return selP!==null;if(step===1)return bAs.length>0;if(step===2)return prim.trim().length>5;if(step===3)return true;if(step===4)return true;if(step===5)return dur!=="";return true};

  const logMood=async(val)=>{const entry={date:new Date().toISOString(),value:val,day:new Date().toLocaleDateString("en",{month:"short",day:"numeric"})};
    const nm=[entry,...moods].slice(0,90);setMoods(nm);await sS(K.mo,nm)};

  const interpretLab=async()=>{setLabLoading(true);try{
    const r=await aiCall("Interpret these lab results in plain language. For each value, explain if it's normal, high, or low, and what it means. Respond in JSON: {\"interpretations\":[{\"test\":\"name\",\"value\":\"value\",\"status\":\"normal|high|low\",\"explanation\":\"plain language\"}],\"summary\":\"overall summary\",\"concerns\":[\"any concerns\"]}\n\nLab values:\n"+labVals,
      "You are a lab results interpreter. Explain lab values in simple language. Output ONLY JSON.",false);
    setLabRes(r)}catch{setLabRes({summary:"Could not interpret. Please try again.",interpretations:[],concerns:[]})}
    setLabLoading(false)};

  // ═══ RENDER ═══
  if(scr==="loading")return <div className="app"><style>{CSS}</style><div className="pr"><div className="po" style={{fontSize:34}}>🩺</div><div style={{fontSize:14,fontWeight:500}}>Loading...</div></div></div>;

  // Auth screen
  if(scr==="auth")return (<div className="app"><style>{CSS}</style><div className="scr">
    <div className="hero"><div className="ho">🩺</div><h1>MedGuide AI</h1><p>AI-powered health intelligence. Sign in to sync your data across devices.</p></div>
    <div className="card">
      <div style={{display:"flex",marginBottom:14}}>{["login","signup"].map(m=>
        <button key={m} onClick={()=>{setAuthMode(m);setAuthErr("")}} style={{flex:1,padding:10,border:"none",background:authMode===m?"var(--p)":"var(--c)",color:authMode===m?"#fff":"var(--t2)",fontSize:13,fontWeight:600,cursor:"pointer",borderRadius:authMode===m?"var(--rs)":"0"}}>{m==="login"?"Log In":"Sign Up"}</button>)}</div>
      <input className="inp" type="email" placeholder="Email" value={authEmail} onChange={e=>setAuthEmail(e.target.value)} style={{marginBottom:7}}/>
      <input className="inp" type="password" placeholder="Password (min 6 characters)" value={authPass} onChange={e=>setAuthPass(e.target.value)} style={{marginBottom:7}}/>
      {authErr&&<p style={{fontSize:11,color:"var(--red)",marginBottom:7}}>{authErr}</p>}
      <button className="bp" disabled={authLoading||!authEmail||authPass.length<6} onClick={async()=>{
        setAuthLoading(true);setAuthErr("");const sb=window.supabase;if(!sb){setAuthErr("Supabase not configured.");setAuthLoading(false);return}
        try{
          if(authMode==="signup"){
            const{error}=await sb.auth.signUp({email:authEmail,password:authPass});
            if(error)throw error;
            const{data:{session}}=await sb.auth.getSession();
            if(session?.user){setUser(session.user);setScr("setup")}else{setAuthErr("Account created! Check your email to verify, then log in.");setAuthMode("login")}
          }else{
            const{data,error}=await sb.auth.signInWithPassword({email:authEmail,password:authPass});
            if(error)throw error;
            setUser(data.user);
            // Check if profile exists
            const{data:profile}=await sb.from("profiles").select("name").eq("id",data.user.id).single();
            setScr(profile?.name?"ready":"setup");
          }
        }catch(e){setAuthErr(e.message||"Authentication failed.")}
        setAuthLoading(false);
      }}>{authLoading?"...":(authMode==="login"?"Log In":"Create Account")}</button>
    </div>
    <button className="bs2" onClick={()=>setScr("setup")} style={{marginTop:4}}>Continue without account</button>
    <p style={{fontSize:9,color:"var(--t3)",textAlign:"center",marginTop:8}}>Without an account, your data stays on this device only.</p>
  </div></div>);
  if(scr==="setup")return (<div className="app"><style>{CSS}</style><div className="scr">
    <div className="hero"><div className="ho">🩺</div><h1>MedGuide AI</h1><p>The world's first health intelligence network. Set up your profile.</p></div>
    <div className="card"><div className="card-t">Your Details</div>
      <input className="inp" placeholder="Name" value={sN} onChange={e=>setSN(e.target.value)} style={{marginBottom:7}}/>
      <div className="ir"><input className="inp" type="number" placeholder="Age" value={sA} onChange={e=>setSA(e.target.value)} min="0" max="120"/>
        <select className="isel" value={sX} onChange={e=>setSX(e.target.value)}><option value="">Sex</option><option>Male</option><option>Female</option><option>Other</option></select></div></div>
    <button className="bp" disabled={!sN.trim()||!sA} onClick={async()=>{await savePro({primary:{name:sN.trim(),age:sA,sex:sX,mh:{},doctor:{}},members:[]});setScr("ready")}}>Get Started</button>
  </div></div>);

  return (<div className="app"><style>{CSS}</style>
    {scr!=="processing"&&<div className="hdr"><div className="hl"><div className="hi2">M</div><div className="ht2">MedGuide AI</div></div>
      {(scr==="assess"||scr==="consent"||scr==="results"||scr==="viewHist"||scr==="settings")?
        <button className="hb" onClick={()=>{reset();setScr("ready");setTab("home")}}>✕</button>:
        <div className="hbs"><button className="hb" onClick={()=>setScr("settings")}>⚙️</button></div>}</div>}

    {/* ═══ HOME ═══ */}
    {scr==="ready"&&tab==="home"&&<div className="scr">
      <div className="hero"><div className="ho">🩺</div><h1>Hi, {pro?.primary?.name?.split(" ")[0]}</h1><p>AI-powered health guidance with medical research, photo analysis, and continuous health tracking.</p>
        {loc&&<div style={{display:"inline-flex",alignItems:"center",gap:3,marginTop:6,padding:"3px 10px",background:"var(--c)",borderRadius:16,fontSize:10,color:"var(--t2)"}}>📍 {loc.city}, {loc.country}</div>}</div>
      <button className="bp" onClick={()=>{reset();setScr("consent")}}>Start Health Check</button>

      {/* Quick Mood */}
      <div className="card" style={{marginTop:10}}><div className="card-t">How are you feeling today? <span className="badge" style={{background:"var(--pll)",color:"var(--p)"}}>DAILY</span></div>
        {moods.length>0&&moods[0].date?.startsWith(new Date().toISOString().slice(0,10))?
          <div style={{textAlign:"center",fontSize:11,color:"var(--t2)"}}>Today's mood: {MOODS.find(m=>m.v===moods[0].value)?.e} {MOODS.find(m=>m.v===moods[0].value)?.l} ✓</div>:
          <div className="mood-row">{MOODS.map(m=><button key={m.v} className="mood-btn" onClick={()=>logMood(m.v)}>{m.e}</button>)}</div>}</div>

      {/* Follow-ups */}
      {followUps.filter(f=>new Date(f.date)<=new Date()).length>0&&<div className="card" style={{borderLeft:"3px solid var(--org)"}}>
        <div className="card-t" style={{color:"var(--org)"}}>Follow-Up Reminders</div>
        {followUps.filter(f=>new Date(f.date)<=new Date()).slice(0,3).map((f,i)=><div key={i} style={{fontSize:11,padding:"5px 0",borderBottom:"1px solid var(--bl)",color:"var(--t2)"}}>
          <strong>{f.patient}</strong>: {f.symptom} — <span style={{color:"var(--org)"}}>check-in due</span>
          <button onClick={()=>{reset();setScr("consent")}} style={{marginLeft:6,fontSize:9,padding:"2px 8px",borderRadius:10,border:"1px solid var(--org)",background:"none",color:"var(--org)",cursor:"pointer"}}>Re-assess</button>
        </div>)}</div>}

      {/* Reports Button */}
      {hist.length>0&&<button className="bs2" onClick={()=>{setTab("health");setHTab("history")}}>📋 View Reports ({hist.length})</button>}

      {/* Your Stats */}
      <div className="sg" style={{marginTop:6}}>
        <div className="sc"><div className="sn2">{hist.length}</div><div className="slb">My Checks</div></div>
        <div className="sc"><div className="sn2">{(pro?.members?.length||0)+1}</div><div className="slb">People Tracked</div></div>
      </div>
    </div>}

    {/* ═══ INTELLIGENCE ═══ */}
    {scr==="ready"&&tab==="intel"&&<IntelTab lang={sets.lang} hist={hist} loc={loc}/>}

    {/* ═══ HEALTH TAB ═══ */}
    {scr==="ready"&&tab==="health"&&<div className="scr">
      <div className="sh"><div className="st2">My Health</div></div>
      <div className="htab">
        {[["vitals","📊 Vitals"],["meds","💊 Meds"],["lab","🔬 Lab"],["mood","🧘 Mood"],["family","👨‍👩‍👧‍👦 Family"],["doctor","👨‍⚕️ Doctor"],["emergency","🚨 SOS"],["profile","📋 Profile"],["history","📜 History"]].map(([id,l])=>
          <div key={id} className={"htab-i"+(hTab===id?" a":"")} onClick={()=>setHTab(id)}>{l}</div>)}
      </div>

      {/* VITALS */}
      {hTab==="vitals"&&<>
        <div className="card"><div className="card-t">Log Vitals</div>
          <div className="ir"><select className="isel" value={vType} onChange={e=>setVType(e.target.value)}>{VITAL_TYPES.map(v=><option key={v.id} value={v.id}>{v.i} {v.l}</option>)}</select></div>
          <div className="ir">{VITAL_TYPES.find(v=>v.id===vType)?.fields.map((f,i)=>
            <input key={f} className="inp" type="number" placeholder={vType==="bp"?(i===0?"Systolic":"Diastolic"):VITAL_TYPES.find(v=>v.id===vType)?.l}
              value={i===0?v1:v2} onChange={e=>i===0?setV1(e.target.value):setV2(e.target.value)}/>)}
          </div>
          <button className="bn" style={{width:"100%"}} disabled={!v1} onClick={async()=>{
            const entry={type:vType,v1:parseFloat(v1),v2:v2?parseFloat(v2):null,date:new Date().toISOString(),day:new Date().toLocaleDateString("en",{month:"short",day:"numeric"})};
            const nv=[entry,...vitals].slice(0,500);setVitals(nv);await sS(K.v,nv);setV1("");setV2("")}}>Log</button></div>
        {VITAL_TYPES.map(vt=>{const data=vitals.filter(v=>v.type===vt.id).slice(0,14).reverse();
          return data.length>0&&<div key={vt.id} className="card"><div className="card-t">{vt.i} {vt.l} <span style={{fontSize:10,color:"var(--t3)"}}>{vt.u}</span></div>
            <div style={{width:"100%",height:120}}><ResponsiveContainer><LineChart data={data}>
              <XAxis dataKey="day" tick={{fontSize:8}} interval={2}/><YAxis tick={{fontSize:8}} width={30}/><Tooltip contentStyle={{fontSize:10,borderRadius:8}}/>
              <Line type="monotone" dataKey="v1" stroke="#0F766E" strokeWidth={2} dot={{r:3}}/>
              {vt.fields.length>1&&<Line type="monotone" dataKey="v2" stroke="#14B8A6" strokeWidth={2} dot={{r:3}}/>}
            </LineChart></ResponsiveContainer></div></div>})}</>}

      {/* MEDICATIONS */}
      {hTab==="meds"&&<>
        <div className="card"><div className="card-t">My Medications</div>
          {meds.length===0?<p style={{fontSize:11,color:"var(--t3)",textAlign:"center",padding:10}}>No medications added.</p>:
            meds.map((m,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 0",borderBottom:"1px solid var(--bl)",fontSize:11}}>
              <div><strong>{m.name}</strong> {m.dose}<div style={{fontSize:9,color:"var(--t3)"}}>{m.freq}</div></div>
              <button style={{width:22,height:22,borderRadius:"50%",border:"none",background:"var(--bl)",color:"var(--t3)",cursor:"pointer",fontSize:10}} onClick={async()=>{const nm=meds.filter((_,j)=>j!==i);setMeds(nm);await sS(K.m,nm)}}>✕</button></div>)}
          <div style={{marginTop:8}}><input className="inp" placeholder="Medication name" value={newMed} onChange={e=>setNewMed(e.target.value)} style={{marginBottom:5}}/>
            <div className="ir"><input className="inp" placeholder="Dosage" value={newDose} onChange={e=>setNewDose(e.target.value)}/>
              <input className="inp" placeholder="Frequency" value={newFreq} onChange={e=>setNewFreq(e.target.value)}/></div>
            <button className="bn" style={{width:"100%"}} disabled={!newMed.trim()} onClick={async()=>{
              const nm=[...meds,{name:newMed.trim(),dose:newDose,freq:newFreq}];setMeds(nm);await sS(K.m,nm);setNewMed("");setNewDose("");setNewFreq("")}}>Add Medication</button></div></div>
        {meds.length>=2&&<div className="card" style={{borderLeft:"3px solid var(--org)"}}>
          <div className="card-t" style={{color:"var(--org)"}}>⚠️ Interaction Check</div>
          <p style={{fontSize:10,color:"var(--t2)"}}>You're taking {meds.length} medications. Always inform your doctor about all medications to check for interactions. The AI considers your medications when analyzing symptoms.</p></div>}</>}

      {/* LAB RESULTS */}
      {hTab==="lab"&&<>
        <div className="card"><div className="card-t">Lab Results Interpreter <span className="badge" style={{background:"var(--pll)",color:"var(--p)"}}>AI</span></div>
          <p style={{fontSize:10,color:"var(--t3)",marginBottom:6}}>Paste or type your lab values and the AI will explain each one in plain language.</p>
          <textarea className="inp" style={{minHeight:80,resize:"vertical"}} placeholder="e.g. Cholesterol: 220 mg/dL&#10;Blood Sugar: 105 mg/dL&#10;Hemoglobin: 13.5 g/dL&#10;White Blood Cells: 7,500" value={labVals} onChange={e=>setLabVals(e.target.value)}/>
          <button className="bn" style={{width:"100%",marginTop:6}} disabled={!labVals.trim()||labLoading} onClick={interpretLab}>{labLoading?"Interpreting...":"Interpret Results"}</button></div>
        {labRes&&<div className="card"><div className="card-t">Interpretation</div>
          <p style={{fontSize:12,fontWeight:500,marginBottom:8}}>{labRes.summary}</p>
          {labRes.interpretations?.map((t,i)=><div key={i} style={{padding:"6px 0",borderBottom:"1px solid var(--bl)",fontSize:11}}>
            <div style={{display:"flex",justifyContent:"space-between"}}><strong>{t.test}: {t.value}</strong>
              <span className="badge" style={{background:t.status==="normal"?"#ECFDF5":t.status==="high"?"#FEF2F2":"#FFF7ED",color:t.status==="normal"?"var(--grn)":t.status==="high"?"var(--red)":"var(--org)"}}>{t.status}</span></div>
            <div style={{color:"var(--t2)",marginTop:2}}>{t.explanation}</div></div>)}
          {labRes.concerns?.length>0&&<div style={{marginTop:8,padding:8,background:"#FEF2F2",borderRadius:"var(--rs)",fontSize:10,color:"var(--red)"}}>
            <strong>Concerns:</strong> {labRes.concerns.join("; ")}</div>}</div>}</>}

      {/* MOOD */}
      {hTab==="mood"&&<>
        <div className="card"><div className="card-t">Mood Tracker</div>
          {moods.length>0&&moods[0].date?.startsWith(new Date().toISOString().slice(0,10))?
            <p style={{fontSize:11,color:"var(--t2)",textAlign:"center"}}>Today: {MOODS.find(m=>m.v===moods[0].value)?.e} {MOODS.find(m=>m.v===moods[0].value)?.l} ✓</p>:
            <><p style={{fontSize:10,color:"var(--t3)",textAlign:"center",marginBottom:6}}>How are you feeling today?</p>
            <div className="mood-row">{MOODS.map(m=><button key={m.v} className="mood-btn" onClick={()=>logMood(m.v)}>{m.e}</button>)}</div></>}
        </div>
        {moods.length>2&&<div className="card"><div className="card-t">Mood Trend</div>
          <div style={{width:"100%",height:120}}><ResponsiveContainer><LineChart data={moods.slice(0,30).reverse()}>
            <XAxis dataKey="day" tick={{fontSize:8}} interval={4}/><YAxis domain={[1,5]} tick={{fontSize:8}} width={20}/><Tooltip contentStyle={{fontSize:10,borderRadius:8}}/>
            <Line type="monotone" dataKey="value" stroke="#7C3AED" strokeWidth={2} dot={{r:3}}/>
          </LineChart></ResponsiveContainer></div></div>}</>}

      {/* FAMILY */}
      {hTab==="family"&&<>
        <div className="card"><div className="card-t">Family Members <span style={{fontSize:10,color:"var(--t3)"}}>{(pro?.members?.length||0)}/5</span></div>
          <div className="mc s" style={{cursor:"default"}}><div className="ma2">👤</div><div><div className="mn">{pro?.primary?.name} (You)</div><div className="md2">Age {pro?.primary?.age}</div></div></div>
          {pro?.members?.map((m,i)=><div key={i} className="mc" style={{cursor:"default"}}>
            <div className="ma2">{m.relation==="Child"?"👶":"👤"}</div><div style={{flex:1}}><div className="mn">{m.name}</div><div className="md2">Age {m.age} · {m.relation}</div></div>
            <button style={{width:22,height:22,borderRadius:"50%",border:"none",background:"var(--bl)",color:"var(--t3)",cursor:"pointer",fontSize:10}} onClick={async()=>{await savePro({...pro,members:pro.members.filter((_,j)=>j!==i)})}}>✕</button></div>)}
          {(pro?.members?.length||0)<5&&!addM&&<button className="bs2" onClick={()=>setAddM(true)}>+ Add</button>}
          {addM&&<div style={{marginTop:6,padding:10,background:"var(--bg)",borderRadius:"var(--rs)"}}>
            <input className="inp" placeholder="Name" value={mN} onChange={e=>setMN(e.target.value)} style={{marginBottom:5}}/>
            <div className="ir"><input className="inp" type="number" placeholder="Age" value={mAg} onChange={e=>setMAg(e.target.value)}/>
              <select className="isel" value={mR} onChange={e=>setMR(e.target.value)}><option value="">Relation</option><option>Child</option><option>Partner</option><option>Parent</option><option>Sibling</option></select></div>
            <div style={{display:"flex",gap:5}}><button className="bb" style={{flex:1}} onClick={()=>{setAddM(false);setMN("");setMAg("");setMR("")}}>Cancel</button>
              <button className="bn" style={{flex:1}} disabled={!mN.trim()||!mAg||!mR} onClick={async()=>{await savePro({...pro,members:[...(pro.members||[]),{name:mN.trim(),age:mAg,sex:mS,relation:mR}]});setAddM(false);setMN("");setMAg("");setMR("")}}>Add</button></div></div>}
        </div></>}

      {/* DOCTOR */}
      {hTab==="doctor"&&<div className="card"><div className="card-t">My Doctor 👨‍⚕️</div>
        {!editDoc?<>
          {pro?.primary?.doctor?.name?<div style={{display:"flex",alignItems:"center",gap:8,padding:8,background:"var(--bg)",borderRadius:"var(--rs)"}}>
            <div className="ma2">👨‍⚕️</div><div style={{flex:1}}><div className="mn">Dr. {pro.primary.doctor.name}</div><div className="md2">{pro.primary.doctor.phone}</div></div>
            <a href={"tel:"+pro.primary.doctor.phone} style={{width:32,height:32,borderRadius:"50%",background:"var(--grn)",display:"flex",alignItems:"center",justifyContent:"center",textDecoration:"none",fontSize:14}}>📞</a></div>
            :<p style={{fontSize:11,color:"var(--t3)",textAlign:"center",padding:10}}>No doctor added.</p>}
          <button className="bs2" onClick={()=>{setDocN(pro?.primary?.doctor?.name||"");setDocP(pro?.primary?.doctor?.phone||"");setEditDoc(true)}}>{pro?.primary?.doctor?.name?"Edit":"+ Add Doctor"}</button>
        </>:<div style={{marginTop:4}}>
          <input className="inp" placeholder="Doctor name" value={docN} onChange={e=>setDocN(e.target.value)} style={{marginBottom:5}}/>
          <input className="inp" type="tel" placeholder="Phone" value={docP} onChange={e=>setDocP(e.target.value)} style={{marginBottom:6}}/>
          <div style={{display:"flex",gap:5}}><button className="bb" style={{flex:1}} onClick={()=>setEditDoc(false)}>Cancel</button>
            <button className="bn" style={{flex:1}} disabled={!docN.trim()||!docP.trim()} onClick={async()=>{await savePro({...pro,primary:{...pro.primary,doctor:{name:docN.trim(),phone:docP.trim()}}});setEditDoc(false)}}>Save</button></div></div>}
      </div>}

      {/* EMERGENCY CONTACTS */}
      {hTab==="emergency"&&<>
        <div className="card" style={{borderLeft:"3px solid var(--red)"}}><div className="card-t" style={{color:"var(--red)"}}>🚨 Emergency Contacts</div>
          <p style={{fontSize:10,color:"var(--t2)",marginBottom:6}}>People to contact in a medical emergency.</p>
          {eCons.map((c,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 0",borderBottom:"1px solid var(--bl)"}}>
            <div style={{flex:1,fontSize:11}}><strong>{c.name}</strong> ({c.rel})<div style={{fontSize:10,color:"var(--t3)"}}>{c.phone}</div></div>
            <a href={"tel:"+c.phone} style={{width:30,height:30,borderRadius:"50%",background:"var(--red)",display:"flex",alignItems:"center",justifyContent:"center",textDecoration:"none",fontSize:12}}>📞</a>
            <button style={{width:20,height:20,borderRadius:"50%",border:"none",background:"var(--bl)",cursor:"pointer",fontSize:9,color:"var(--t3)"}} onClick={async()=>{const ne=eCons.filter((_,j)=>j!==i);setECons(ne);await sS(K.ec,ne)}}>✕</button></div>)}
          <div style={{marginTop:8}}><input className="inp" placeholder="Name" value={newEcN} onChange={e=>setNewEcN(e.target.value)} style={{marginBottom:5}}/>
            <div className="ir"><input className="inp" type="tel" placeholder="Phone" value={newEcP} onChange={e=>setNewEcP(e.target.value)}/>
              <input className="inp" placeholder="Relation" value={newEcR} onChange={e=>setNewEcR(e.target.value)}/></div>
            <button className="bn" style={{width:"100%"}} disabled={!newEcN.trim()||!newEcP.trim()} onClick={async()=>{
              const ne=[...eCons,{name:newEcN.trim(),phone:newEcP.trim(),rel:newEcR.trim()}];setECons(ne);await sS(K.ec,ne);setNewEcN("");setNewEcP("");setNewEcR("")}}>Add Emergency Contact</button></div></div></>}

      {/* MEDICAL PROFILE */}
      {hTab==="profile"&&<div className="card"><div className="card-t">Medical Profile <span className="badge" style={{background:"var(--pll)",color:"var(--p)"}}>SENT WITH CHECKS</span></div>
        {!editMH?<>
          {[["Conditions",pro?.primary?.mh?.conditions],["Medications",meds.map(m=>m.name).join(", ")||null],["Allergies",pro?.primary?.mh?.allergies]].map(([l,v],i)=>
            <div key={i} style={{padding:"6px 0",borderBottom:i<2?"1px solid var(--bl)":"none",fontSize:11}}><strong>{l}:</strong> <span style={{color:v?"var(--t2)":"var(--t3)"}}>{v||"Not recorded"}</span></div>)}
          <button className="bs2" onClick={()=>{setMhC(pro?.primary?.mh?.conditions||"");setMhA(pro?.primary?.mh?.allergies||"");setEditMH(true)}}>Edit</button>
        </>:<div style={{marginTop:4}}>
          <input className="inp" placeholder="Conditions (e.g. Asthma, Diabetes)" value={mhC} onChange={e=>setMhC(e.target.value)} style={{marginBottom:5}}/>
          <input className="inp" placeholder="Allergies (e.g. Penicillin)" value={mhA} onChange={e=>setMhA(e.target.value)} style={{marginBottom:6}}/>
          <div style={{display:"flex",gap:5}}><button className="bb" style={{flex:1}} onClick={()=>setEditMH(false)}>Cancel</button>
            <button className="bn" style={{flex:1}} onClick={async()=>{await savePro({...pro,primary:{...pro.primary,mh:{...pro.primary.mh,conditions:mhC,allergies:mhA}}});setEditMH(false)}}>Save</button></div></div>}
      </div>}

      {/* HISTORY */}
      {hTab==="history"&&<>{hist.length===0?<div style={{textAlign:"center",padding:30,color:"var(--t3)",fontSize:12}}>No checks yet.</div>:
        hist.map((h,i)=>{const ug=URG[h.urgency]||URG.moderate;return <div key={i} className="card" style={{cursor:"pointer"}} onClick={()=>{setVI(h);setScr("viewHist")}}>
          <div style={{fontSize:9,color:"var(--t3)"}}>{h.date}</div><div style={{fontSize:12,fontWeight:500,margin:"2px 0"}}>{h.symptoms?.primarySymptom?.slice(0,60)}</div>
          <span className="badge" style={{background:ug.bg,color:ug.c}}>{ug.l}</span><span style={{fontSize:9,color:"var(--t3)",marginLeft:5}}>{h.pName}</span></div>})}</>}
    </div>}

    {/* ═══ CONSENT ═══ */}
    {scr==="consent"&&<div className="scr">
      <div className="sh"><div className="sl">Before we begin</div><div className="st2">Your safety matters</div></div>
      <div className="card">{[["🩺","Health guidance only."],["🔬","AI searches medical sources."],["📸","Photo analysis available for visual symptoms."],["🚨","In emergency, call local services."],["🔒","Data stored locally."],["🌍","Not a medical device."]].map(([i,t],k)=>
        <div key={k} style={{display:"flex",gap:7,padding:"6px 0",borderBottom:k<5?"1px solid var(--bl)":"none",fontSize:11,color:"var(--t2)"}}><span style={{fontSize:12}}>{i}</span><span>{t}</span></div>)}</div>
      <button className="bp" style={{marginTop:12}} onClick={()=>{reset();setScr("assess")}}>I understand — continue</button>
    </div>}

    {/* ═══ ASSESSMENT ═══ */}
    {scr==="assess"&&<div className="scr">
      {step===0&&<><div className="sh"><div className="sl">Step 1 of 7</div><div className="st2">Who is this for?</div></div><div className="pb"><div className="pf" style={{width:"14%"}}/></div>
        <div className={"mc"+(selP==="self"?" s":"")} onClick={()=>setSelP("self")}><div className="ma2">👤</div><div><div className="mn">{pro?.primary?.name} (Me)</div><div className="md2">Age {pro?.primary?.age}</div></div></div>
        {pro?.members?.map((m,i)=><div key={i} className={"mc"+(selP===i?" s":"")} onClick={()=>setSelP(i)}><div className="ma2">{m.relation==="Child"?"👶":"👤"}</div><div><div className="mn">{m.name}</div><div className="md2">Age {m.age} · {m.relation}</div></div></div>)}</>}
      {step===1&&<><div className="sh"><div className="sl">Step 2 of 7</div><div className="st2">Where is the concern?</div><div className="ss2">Select all that apply.</div></div><div className="pb"><div className="pf" style={{width:"28%"}}/></div>
        <div className="og">{AREAS.map(a=><div key={a.id} className={"oc"+(bAs.includes(a.id)?" s":"")} onClick={()=>setBAs(p=>p.includes(a.id)?p.filter(x=>x!==a.id):[...p,a.id])}><div className="oi">{a.i}</div>{a.l}</div>)}</div></>}
      {step===2&&<><div className="sh"><div className="sl">Step 3 of 7</div><div className="st2">Describe the symptom</div></div><div className="pb"><div className="pf" style={{width:"42%"}}/></div>
        <div style={{position:"relative"}}><textarea className="inp" style={{minHeight:80,resize:"vertical",paddingRight:voice.ok?44:10}} placeholder="e.g. Sharp pain on the left side of my head..." value={prim} onChange={e=>setPrim(e.target.value)}/>
          {voice.ok&&<button onClick={voice.on?voice.stop:voice.start} style={{position:"absolute",right:7,top:7,width:30,height:30,borderRadius:"50%",border:"none",cursor:"pointer",fontSize:13,background:voice.on?"var(--red)":"var(--pll)",color:voice.on?"#fff":"var(--p)",animation:voice.on?"vp 1s infinite":"none"}}>{voice.on?"⏹":"🎙️"}</button>}</div>
        {!voice.ok&&<p style={{fontSize:9,color:"var(--t3)",marginTop:4}}>🎙️ Voice input available in Chrome on your device.</p>}</>}

      {step===3&&<><div className="sh"><div className="sl">Step 4 of 7</div><div className="st2">Add a photo (optional)</div><div className="ss2">Take or upload a photo of the affected area for visual AI analysis.</div></div><div className="pb"><div className="pf" style={{width:"56%"}}/></div>
        <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{display:"none"}} onChange={handlePhoto}/>
        {!photo?<div className="photo-area" onClick={()=>fileRef.current?.click()}>
          <div style={{fontSize:32,marginBottom:6}}>📸</div>
          <div style={{fontSize:12,fontWeight:500}}>Tap to take photo or upload</div>
          <div style={{fontSize:10,color:"var(--t3)",marginTop:3}}>Rashes, swelling, wounds, skin changes, etc.</div>
        </div>:<div style={{position:"relative"}}>
          <img src={photo} className="photo-preview" alt="symptom"/>
          <button onClick={()=>{setPhoto(null);setPhotoB64(null)}} style={{position:"absolute",top:6,right:6,width:28,height:28,borderRadius:"50%",background:"rgba(0,0,0,.6)",color:"#fff",border:"none",cursor:"pointer",fontSize:14}}>✕</button>
          <p style={{fontSize:10,color:"var(--grn)",marginTop:4}}>✓ Photo attached — AI will analyze this visually</p></div>}
        <p style={{fontSize:9,color:"var(--t3)",marginTop:6}}>Skip this step if your symptoms aren't visible.</p></>}

      {step===4&&<><div className="sh"><div className="sl">Step 5 of 7</div><div className="st2">How severe?</div></div><div className="pb"><div className="pf" style={{width:"70%"}}/></div>
        <div style={{textAlign:"center",marginBottom:10}}><div style={{fontSize:42,fontWeight:700,color:sev<=3?"var(--grn)":sev<=5?"var(--yel)":sev<=7?"var(--org)":"var(--red)"}}>{sev}</div><div style={{fontSize:11,color:"var(--t2)"}}>{SEVS.find(s=>s.v===sev)?.l}</div></div>
        <input type="range" style={{width:"100%",height:6,WebkitAppearance:"none",background:"linear-gradient(90deg,var(--grn),var(--yel),var(--org),var(--red))",borderRadius:3,outline:"none"}} min={1} max={10} value={sev} onChange={e=>setSev(parseInt(e.target.value))}/></>}
      {step===5&&<><div className="sh"><div className="sl">Step 6 of 7</div><div className="st2">How long?</div></div><div className="pb"><div className="pf" style={{width:"85%"}}/></div>
        <div className="oll">{DURS.map(d=><div key={d} className={"oli"+(dur===d?" s":"")} onClick={()=>setDur(d)}>{d}</div>)}</div></>}
      {step===6&&<><div className="sh"><div className="sl">Step 7 of 7</div><div className="st2">Anything else?</div></div><div className="pb"><div className="pf" style={{width:"100%"}}/></div>
        <div style={{marginBottom:10}}><div style={{fontSize:11,fontWeight:600,marginBottom:5}}>Associated symptoms</div>
          <div className="ch">{ASSOC.map(s=><div key={s} className={"ci"+(aS.includes(s)?" s":"")} onClick={()=>setAS(p=>p.includes(s)?p.filter(x=>x!==s):[...p,s])}>{s}</div>)}</div></div>
        <textarea className="inp" style={{minHeight:50,resize:"vertical"}} placeholder="Other details..." value={det} onChange={e=>setDet(e.target.value)}/></>}
      {err&&<div className="ec"><p style={{fontWeight:600}}>Error</p><p style={{fontSize:10,marginTop:3}}>{err}</p><button style={{marginTop:8,padding:"7px 14px",background:"var(--red)",color:"#fff",border:"none",borderRadius:6,fontSize:11,cursor:"pointer"}} onClick={submit}>Retry</button></div>}
      <div className="nb">{step>0&&<button className="bb" onClick={()=>setStep(s=>s-1)}>←</button>}
        {step<6?<button className="bn" disabled={!canN()} onClick={()=>setStep(s=>s+1)}>Continue</button>:<button className="bn" onClick={submit}>Analyze Symptoms</button>}</div>
    </div>}

    {scr==="processing"&&<Proc/>}
    {scr==="results"&&res&&<ResV r={res} pName={getPat().patientName||pro?.primary?.name} doc={pro?.primary?.doctor} eCons={eCons} onN={()=>{reset();setScr("consent")}} onH={()=>{reset();setScr("ready");setTab("home")}}/>}
    {scr==="viewHist"&&vI&&<ResV r={vI.result} pName={vI.pName} doc={pro?.primary?.doctor} eCons={eCons} onN={()=>{reset();setScr("consent")}} onH={()=>{setVI(null);setScr("ready");setTab("health");setHTab("history")}} hl="← Back"/>}

    {scr==="settings"&&<div className="scr">
      <div className="sh"><div className="st2">Settings</div></div>
      {user&&<div className="card"><div className="card-t">Account</div>
        <div style={{fontSize:11,color:"var(--t2)",marginBottom:8}}>Signed in as: <strong>{user.email}</strong></div>
        <div style={{fontSize:10,color:"var(--grn)",marginBottom:8}}>✓ Data syncing to cloud</div>
        <button className="bs2" style={{marginTop:0,color:"var(--org)",borderColor:"var(--org)",fontSize:11}} onClick={async()=>{
          const sb=window.supabase;if(sb)await sb.auth.signOut();setUser(null);setScr("auth");
        }}>Log Out</button></div>}
      {!user&&<div className="card"><div className="card-t">Account</div>
        <div style={{fontSize:11,color:"var(--t3)",marginBottom:8}}>Not signed in. Data stored locally only.</div>
        <button className="bs2" style={{marginTop:0}} onClick={()=>setScr("auth")}>Sign In or Create Account</button></div>}
      <div className="card"><div className="card-t">Language</div>
        <div className="lg2">{LANGS.map(l=><div key={l.c} className={"lo2"+(sets.lang===l.c?" s":"")} onClick={async()=>{const s={...sets,lang:l.c};setSets(s);await sS(K.s,s)}}><span className="lf2">{l.f}</span>{l.l}</div>)}</div></div>
      <div className="card"><div className="card-t">Profile</div>
        {[["Name",pro?.primary?.name],["Age",pro?.primary?.age],["Sex",pro?.primary?.sex||"—"]].map(([k,v],i)=><div key={i} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:i<2?"1px solid var(--bl)":"none",fontSize:11}}><span>{k}</span><span style={{color:"var(--p)",fontWeight:500}}>{v}</span></div>)}</div>
      <div className="card"><div className="card-t">Data</div>
        <button className="bs2" style={{marginTop:0,color:"var(--red)",borderColor:"#FECACA",fontSize:11}} onClick={async()=>{if(confirm("Clear everything?")){setPro(null);setHist([]);setVitals([]);setMeds([]);setMoods([]);setFollowUps([]);setECons([]);
          for(const k of Object.values(K))await sS(k,null);setScr("setup")}}}>Reset Everything</button></div>
      <button className="bb" style={{width:"100%",marginTop:8}} onClick={()=>setScr("ready")}>← Back</button>
    </div>}

    {scr==="ready"&&<div className="tab-bar">
      {[["home","🏠","Home"],["intel","🌍","Intel"],["check","➕","Check"],["health","❤️","Health"]].map(([id,ico,lbl])=>
        <button key={id} className={"tab"+(tab===id?" a":"")} onClick={()=>{if(id==="check"){reset();setScr("consent")}else setTab(id)}}>
          <span className="tab-i">{ico}</span><span className="tab-l">{lbl}</span></button>)}
    </div>}
  </div>);
}

// ═══ SUB-COMPONENTS ═══
function IntelTab({lang,hist,loc}){
  const[news,setNews]=useState(null);const[loading,setLoading]=useState(true);const[err,setErr]=useState(false);

  const loadNews=async()=>{setLoading(true);setErr(false);try{
    const region=loc?loc.city+", "+loc.country:"global";
    const r=await aiCall("List the top 5 most significant ongoing global disease outbreaks or health alerts. Keep it brief. Include disease name, region, status, and one sentence summary.\n\nAlso include 2 health tips relevant to: "+region+"\n\nJSON only:\n{\"global_outbreaks\":[{\"disease\":\"name\",\"region\":\"where\",\"status\":\"active|monitoring\",\"summary\":\"1 sentence\",\"severity\":\"high|moderate|low\"}],\"local_alerts\":[],\"health_tips\":[{\"tip\":\"tip\"}],\"last_updated\":\"Based on latest data\"}",
      "List REAL known disease outbreaks only. Keep responses short. JSON only.",false,null,1200);
    setNews(r)}catch{setErr(true)}setLoading(false)};

  useEffect(()=>{const t=setTimeout(()=>loadNews(),500);return()=>clearTimeout(t)},[]);

  // Local user stats (real data)
  const totalChecks=hist.length;
  const urgCounts=hist.reduce((a,h)=>{a[h.urgency]=(a[h.urgency]||0)+1;return a},{});
  const recentAreas=hist.slice(0,20).reduce((a,h)=>{(h.symptoms?.bodyAreas||[]).forEach(b=>{a[b]=(a[b]||0)+1});return a},{});
  const topAreas=Object.entries(recentAreas).sort((a,b)=>b[1]-a[1]).slice(0,5);

  return <div className="scr">
    <div className="sh"><div className="st2">Intelligence</div><div className="ss2">Real-time health news and your personal data.</div></div>

    {/* Global Outbreaks - REAL */}
    <div className="card"><div className="card-t">🌍 Global Health Alerts <span className="badge" style={{background:"var(--pll)",color:"var(--p)"}}>KNOWN OUTBREAKS</span></div>
      {loading?<div style={{textAlign:"center",padding:16,fontSize:11,color:"var(--t3)"}}>Searching for current health alerts...</div>
        :err?<div style={{textAlign:"center",padding:16}}><p style={{fontSize:11,color:"var(--t3)",marginBottom:8}}>Could not load alerts.</p><button onClick={loadNews} style={{padding:"8px 16px",background:"var(--p)",color:"#fff",border:"none",borderRadius:"var(--rs)",fontSize:11,fontWeight:600,cursor:"pointer"}}>Try Again</button></div>
        :news?.global_outbreaks?.length>0?news.global_outbreaks.map((o,i)=>
          <div key={i} style={{padding:"8px 0",borderBottom:i<news.global_outbreaks.length-1?"1px solid var(--bl)":"none"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{fontSize:12,fontWeight:600}}>{o.disease}</div>
              <span className="badge" style={{background:o.severity==="high"?"#FEF2F2":o.severity==="moderate"?"#FFF7ED":"#ECFDF5",color:o.severity==="high"?"var(--red)":o.severity==="moderate"?"var(--org)":"var(--grn)"}}>{o.status}</span>
            </div>
            <div style={{fontSize:10,color:"var(--t2)",marginTop:2}}>📍 {o.region}</div>
            <div style={{fontSize:10,color:"var(--t2)",marginTop:1}}>{o.summary}</div>
          </div>)
        :<div style={{textAlign:"center",padding:12,fontSize:11,color:"var(--grn)"}}>✅ No major outbreaks detected globally right now.</div>}
      {news?.last_updated&&<div style={{fontSize:8,color:"var(--t3)",marginTop:6,textAlign:"right"}}>Updated: {news.last_updated}</div>}
    </div>

    {/* Local Alerts */}
    {news?.local_alerts?.length>0&&<div className="card"><div className="card-t">📍 Alerts Near You</div>
      {news.local_alerts.map((a,i)=><div key={i} style={{padding:"6px 0",borderBottom:i<news.local_alerts.length-1?"1px solid var(--bl)":"none",fontSize:11,color:"var(--t2)"}}>
        <strong>{a.title}</strong><div style={{marginTop:1}}>{a.summary}</div></div>)}</div>}

    {/* Health Tips */}
    {news?.health_tips?.length>0&&<div className="card"><div className="card-t">💡 Health Tips</div>
      {news.health_tips.map((t,i)=><div key={i} style={{display:"flex",gap:6,padding:"5px 0",fontSize:11,color:"var(--t2)"}}><span>•</span><span>{t.tip}</span></div>)}</div>}

    {/* Your Community Data - REAL */}
    <div className="card"><div className="card-t">📊 Your Data</div>
      {totalChecks===0?<p style={{fontSize:11,color:"var(--t3)",textAlign:"center",padding:10}}>No health checks yet. Your personal health trends will appear here after your first check.</p>
        :<div>
        <div className="sg">
          <div className="sc"><div className="sn2">{totalChecks}</div><div className="slb">Total Checks</div></div>
          <div className="sc"><div className="sn2">{urgCounts.emergency||0}</div><div className="slb">Emergencies</div></div>
        </div>
        {topAreas.length>0&&<div style={{marginTop:6}}><div style={{fontSize:10,fontWeight:600,marginBottom:4}}>Most Checked Areas</div>
          {topAreas.map(([area,count],i)=>{const a=AREAS.find(b=>b.id===area); return (
            <div key={i} style={{display:"flex",alignItems:"center",gap:6,padding:"4px 0",fontSize:11}}>
              <span>{a?.i||"•"}</span><span style={{flex:1}}>{a?.l||area}</span>
              <div style={{width:60,height:6,background:"var(--bl)",borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",background:"var(--p)",borderRadius:3,width:(count/topAreas[0][1]*100)+"%"}} /></div>
              <span style={{fontSize:9,color:"var(--t3)",width:16,textAlign:"right"}}>{count}</span>
            </div>)})}</div>}
        </div>}
    </div>

    {/* Network Growth */}
    <div className="card" style={{background:"var(--pll)",border:"1.5px solid var(--p)"}}>
      <div style={{fontSize:12,fontWeight:600,marginBottom:6}}>Community Intelligence Milestones</div>
      {[["🎯 100 users in your area","Local symptom trends go live — see what health issues are rising near you."],
        ["🎯 1,000 users in your region","Outbreak detection activates — get alerts when unusual symptom clusters appear."],
        ["🎯 10,000 total users","AI discoveries unlock — find hidden health patterns across populations."]
      ].map(([milestone,feature],i)=>
        <div key={i} style={{display:"flex",gap:6,padding:"5px 0",borderBottom:i<2?"1px solid rgba(15,118,110,0.15)":"none"}}>
          <div style={{fontSize:11}}><div style={{fontWeight:600}}>{milestone}</div>
            <div style={{fontSize:10,color:"var(--t2)"}}>{feature}</div></div>
        </div>)}
      <p style={{fontSize:9,color:"var(--t2)",marginTop:6}}>Share MedGuide AI to help reach these milestones faster.</p>
    </div>

    <button className="bs2" onClick={loadNews}>🔄 Refresh Alerts</button>
  </div>}

function Proc(){const ms=["Researching symptoms...","Searching medical sources...","Analyzing patterns...","Checking for hidden risks...","Preparing guidance..."];
  const[i,setI]=useState(0);useEffect(()=>{const iv=setInterval(()=>setI(p=>(p+1)%ms.length),2200);return ()=>clearInterval(iv)},[]);
  return <div className="pr"><div className="po" style={{fontSize:34}}>🧠</div><div style={{fontSize:14,fontWeight:500}}>Analyzing with AI + research</div><div style={{fontSize:11,color:"var(--t3)"}}>{ms[i]}</div></div>}

function ResV({r,onN,onH,hl,doc,eCons,pName}){
  const u=URG[r?.urgency]||URG.moderate;const[spk,setSpk]=useState(false);const[cpd,setCpd]=useState(false);
  if(!r)return null;
  const read=()=>{if(spk){speechSynthesis.cancel();setSpk(false);return}
    const t="Urgency: "+u.l+". "+u.a+" . "+r.summary+" . "+(r.possible_conditions||[]).map(c=>c.name+": "+c.explanation).join(". ")+" . Actions: "+(r.recommended_actions||[]).join(". ")+" . Relief tips: "+(r.relief_tips||[]).join(". ")+" . "+r.reasoning;
    const ut=new SpeechSynthesisUtterance(t);ut.rate=.85;ut.onend=()=>setSpk(false);ut.onerror=()=>setSpk(false);setSpk(true);speechSynthesis.speak(ut)};
  const share=async()=>{const t="MedGuide AI Report\nUrgency: "+u.l+"\n\n"+r.summary+"\n\nConditions:\n"+(r.possible_conditions||[]).map(c=>"• "+c.name+": "+c.explanation).join("\n")+"\n\nActions:\n"+(r.recommended_actions||[]).join("\n")+"\n\n💡 Relief Tips:\n"+(r.relief_tips||[]).map(t=>"• "+t).join("\n")+"\n\n⚠️ Watch for:\n"+(r.red_flags_to_watch||[]).join("\n")+"\n\nNot a medical diagnosis.";
    if(navigator.share)try{await navigator.share({title:"Report",text:t});return}catch{}
    try{await navigator.clipboard.writeText(t);setCpd(true);setTimeout(()=>setCpd(false),2000)}catch{}};

  return <div className="scr" style={{paddingBottom:100}}>
    <div style={{display:"flex",gap:4,margin:"10px 0 4px"}}>
      <button onClick={read} style={{flex:1,padding:8,borderRadius:"var(--rs)",border:"1.5px solid var(--b)",background:spk?"var(--p)":"var(--c)",color:spk?"#fff":"var(--t)",fontSize:10,fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans'"}}>{spk?"⏹ Stop":"🔊 Read"}</button>
      <button onClick={share} style={{flex:1,padding:8,borderRadius:"var(--rs)",border:"1.5px solid var(--b)",background:cpd?"var(--grn)":"var(--c)",color:cpd?"#fff":"var(--t)",fontSize:10,fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans'"}}>{cpd?"✓ Copied":"📤 Share"}</button>
      <button onClick={()=>genPDF(r,pName)} style={{flex:1,padding:8,borderRadius:"var(--rs)",border:"1.5px solid var(--b)",background:"var(--c)",fontSize:10,fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans'"}}>📄 PDF</button></div>

    {r.urgency==="emergency"&&<div className="emerg-card"><div style={{fontSize:24}}>🚨</div><div style={{fontSize:15,fontWeight:700,color:"var(--red)"}}>EMERGENCY</div>
      <p style={{fontSize:11,color:"var(--t2)",margin:"4px 0"}}>This may require immediate attention.</p>
      <button className="emerg-btn">📞 Call Emergency Services</button>
      {eCons?.length>0&&<div style={{marginTop:6}}>{eCons.map((c,i)=><a key={i} href={"tel:"+c.phone} style={{display:"block",padding:8,marginTop:4,background:"#fff",borderRadius:6,fontSize:11,textDecoration:"none",color:"var(--red)",fontWeight:600}}>📞 Alert {c.name} ({c.rel})</a>)}</div>}</div>}

    <div className="ub" style={{background:u.bg,color:u.c}}><div style={{fontSize:28}}>{u.i}</div><div style={{fontSize:17,fontWeight:700}}>{u.l}</div><div style={{fontSize:12,opacity:.9}}>{u.a}</div></div>
    <div className="rc"><div className="rt">Summary</div><p>{r.summary}</p></div>
    {r.possible_conditions?.length>0&&<div className="rc"><div className="rt">Possible Conditions</div>{r.possible_conditions.map((c,i)=><div key={i} className="cn2"><div className="cna">{c.name}</div><div className="cne">{c.explanation}</div></div>)}</div>}
    {r.recommended_actions?.length>0&&<div className="rc"><div className="rt">Actions</div>{r.recommended_actions.map((a,i)=><div key={i} className="ai3"><div className="ad3"/><span>{a}</span></div>)}</div>}
    {r.relief_tips?.length>0&&<div className="rc" style={{borderLeft:"3px solid var(--grn)"}}><div className="rt" style={{color:"var(--grn)"}}>💡 Relief Tips</div>{r.relief_tips.map((t,i)=><div key={i} className="ai3"><div className="ad3" style={{background:"var(--grn)"}}/><span>{t}</span></div>)}</div>}
    <div className="rc"><div className="rt">Reasoning</div><p>{r.reasoning}</p></div>
    {r.red_flags_to_watch?.length>0&&<div className="rc" style={{borderLeft:"3px solid var(--red)"}}><div className="rt" style={{color:"var(--red)"}}>⚠️ Watch For</div>{r.red_flags_to_watch.map((f,i)=><div key={i} style={{fontSize:11,color:"var(--red)",padding:"3px 0"}}>⚠️ {f}</div>)}</div>}
    {r.history_insight&&r.history_insight!=="null"&&<div className="rc" style={{borderLeft:"3px solid var(--p)"}}><div className="rt">History</div><p>{r.history_insight}</p></div>}
    {r.questions_for_doctor?.length>0&&<div className="rc"><div className="rt">Ask Your Doctor</div>{r.questions_for_doctor.map((q,i)=><div key={i} className="ai3"><div className="ad3"/><span>{q}</span></div>)}</div>}

    <div className="rc" style={{background:"var(--pll)",border:"1.5px solid var(--p)"}}>
      <div className="rt">Get Care</div>
      {doc?.name&&<a href={"tel:"+doc.phone} style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6,padding:10,background:"var(--p)",borderRadius:"var(--rs)",color:"#fff",textDecoration:"none",fontSize:12,fontWeight:600,marginBottom:6}}>📞 Call Dr. {doc.name}</a>}
      <button onClick={share} style={{width:"100%",padding:9,background:"var(--c)",border:"1.5px solid var(--p)",borderRadius:"var(--rs)",color:"var(--p)",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans'",marginBottom:6}}>📤 Share Report With Doctor</button>
      <button style={{width:"100%",padding:9,background:"var(--c)",border:"1.5px solid var(--b)",borderRadius:"var(--rs)",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans'",color:"var(--t)"}} onClick={()=>window.open("https://www.google.com/maps/search/hospital+clinic+pharmacy+near+me","_blank")}>🏥 Find Nearby Hospital, Clinic or Pharmacy</button></div>

    <div className="di">Informational guidance only — not a diagnosis. Always consult a healthcare professional.</div>
    <div style={{display:"flex",gap:7,marginTop:12}}><button style={{flex:1,padding:10,borderRadius:"var(--rs)",border:"1.5px solid var(--b)",background:"var(--c)",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans'"}} onClick={()=>{speechSynthesis.cancel();onH()}}>{hl||"Home"}</button>
      <button style={{flex:1,padding:10,borderRadius:"var(--rs)",border:"none",background:"var(--p)",color:"#fff",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans'"}} onClick={()=>{speechSynthesis.cancel();onN()}}>New Check</button></div>
  </div>}
