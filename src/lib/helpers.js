export const todayISO = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,"0");
  const day = String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${day}`;
};
export const daysAgoISO = (n) => {
  const d = new Date();
  d.setDate(d.getDate()-n);
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,"0");
  const day = String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${day}`;
};
export const fmt1 = (n) => Math.round(n*10)/10;
// Shows an empty field instead of a literal "0" for number inputs that are
// still unset — so the user can type straight away instead of having to
// delete a "0" first. The underlying stored value stays a real 0 either way.
export const numDisplay = (v) => (v === 0 || v === null || v === undefined || Number.isNaN(v)) ? "" : v;
export const uid = () => Math.random().toString(36).slice(2,10);

/* ---- Body composition calculations ---- */
export function calcBMI(weightKg, heightCm){
  const h = (heightCm||0)/100;
  if(!h) return 0;
  return fmt1(weightKg / (h*h));
}
// Jackson & Pollock — 7 dobras (mm): peitoral, axilar média, tricipital, subescapular, abdominal, supra-ilíaca, coxa
export function calcJP7(sf, age, gender){
  const sum = ["chest","midaxillary","triceps","subscapular","abdominal","suprailiac","thigh"]
    .reduce((s,k)=> s + (Number(sf[k])||0), 0);
  if(!sum || !age) return null;
  const bd = gender === "F"
    ? 1.097 - 0.00046971*sum + 0.00000056*sum*sum - 0.00012828*age
    : 1.112 - 0.00043499*sum + 0.00000055*sum*sum - 0.00028826*age;
  const pct = (495/bd) - 450;
  return { sum:fmt1(sum), pct: fmt1(pct) };
}
// Jackson & Pollock — 3 dobras: homens (peitoral, abdominal, coxa) · mulheres (tricipital, supra-ilíaca, coxa)
export function calcJP3(sf, age, gender){
  const sites = gender === "F" ? ["triceps","suprailiac","thigh"] : ["chest","abdominal","thigh"];
  const sum = sites.reduce((s,k)=> s + (Number(sf[k])||0), 0);
  if(!sum || !age) return null;
  const bd = gender === "F"
    ? 1.0994921 - 0.0009929*sum + 0.0000023*sum*sum - 0.0001392*age
    : 1.10938 - 0.0008267*sum + 0.0000016*sum*sum - 0.0002574*age;
  const pct = (495/bd) - 450;
  return { sum:fmt1(sum), pct: fmt1(pct) };
}
export function calcLeanMass(weightKg, bodyFatPct){
  if(!weightKg || bodyFatPct==null) return null;
  return fmt1(weightKg * (1 - bodyFatPct/100));
}
// averages left/right skinfold sides when both are filled; falls back to whichever side has a value
export function sideAvg(r, l){
  const rn = Number(r)||0, ln = Number(l)||0;
  if(rn && ln) return (rn+ln)/2;
  return rn || ln || 0;
}

/* ============================================================
   STORAGE HELPERS
   Every user's app data (diary, water, fichas, workout history,
   body measurements, goals, custom foods) is stored as one row
   per key in the "user_data" table in Supabase — real persistence,
   synced across any device the user logs into.

export function wrapText(ctx, text, x, y, maxWidth, lineHeight){
  const words = text.split(" ");
  let line = "";
  const lines = [];
  words.forEach(w=>{
    const test = line ? line+" "+w : w;
    if(ctx.measureText(test).width > maxWidth && line){
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  });
  if(line) lines.push(line);
  const startY = y - (lines.length-1)*lineHeight/2;
  lines.forEach((l,i)=> ctx.fillText(l, x, startY + i*lineHeight));
}


export function getWeekLabel(d){
  const onejan = new Date(d.getFullYear(),0,1);
  const week = Math.ceil((((d - onejan) / 86400000) + onejan.getDay()+1)/7);
  return `S${week}`;
}

/* ============================================================
   BODY TAB
============================================================ */
