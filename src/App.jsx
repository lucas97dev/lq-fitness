import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import {
  LayoutDashboard, Utensils, Droplets, Dumbbell, TrendingUp, Ruler,
  Target, User, Plus, Minus, Search, X, Flame, Trophy, Check,
  ChevronRight, ChevronLeft, Play, Pause, Square, Trash2, Edit3,
  Star, Copy, Calendar as CalendarIcon, Award, Zap, ChevronDown,
  Camera, ArrowUp, ArrowDown, Sparkles, Menu, ChevronsLeft, LogOut
} from "lucide-react";
import { supabase } from "./supabaseClient.js";

/* ============================================================
   DESIGN TOKENS
   Background: deep graphite navy. Accent A (primary/energy): teal-lime
   Accent B (hydration): electric blue. Accent C (alert/streak): amber.
   Display face: Space Grotesk (geometric, athletic). Body: Inter.
   Signature element: concentric "Vital Rings" on the dashboard.
============================================================ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700;800&display=swap');

:root{
  --bg: #15100d;
  --bg-elev: #1c1611;
  --card: #221a15;
  --card-hover: #2a201a;
  --border: #382a20;
  --border-soft: #29201a;
  --text: #f5ede3;
  --text-dim: #ab9c8c;
  --text-faint: #71655a;
  --accent: #d9a94f;
  --accent-dim: #8a6a2e;
  --accent-glow: rgba(217,169,79,0.20);
  --blue: #808f43;
  --blue-dim: rgba(128,143,67,0.18);
  --amber: #93334a;
  --amber-dim: rgba(147,51,74,0.20);
  --red: #b8492f;
  --purple: #b06a78;
}
*{box-sizing:border-box;}
.fitapp{
  font-family:'Inter',system-ui,sans-serif;
  background:var(--bg);
  color:var(--text);
  min-height:100vh;
  width:100%;
  display:flex;
  position:relative;
  -webkit-font-smoothing:antialiased;
}
.fitapp h1,.fitapp h2,.fitapp h3,.fitapp .display{
  font-family:'Space Grotesk',system-ui,sans-serif;
  letter-spacing:-0.01em;
}
.fitapp ::-webkit-scrollbar{width:8px;height:8px;}
.fitapp ::-webkit-scrollbar-thumb{background:#232c38;border-radius:8px;}
.fitapp ::-webkit-scrollbar-track{background:transparent;}
.fitapp button{font-family:inherit;cursor:pointer;}
.fitapp input,.fitapp select,.fitapp textarea{font-family:inherit;}

/* ---- SIDEBAR ---- */
.sidebar{
  width:236px; flex-shrink:0; background:var(--bg-elev);
  border-right:1px solid var(--border-soft);
  padding:22px 14px; display:flex; flex-direction:column; gap:4px;
  position:fixed; top:0; left:0; height:100vh; z-index:200;
  transition:transform .25s ease; transform:translateX(0);
  box-shadow:0 0 50px rgba(0,0,0,0.35);
}
.sidebar.closed{ transform:translateX(-100%); box-shadow:none; }
.sidebar-backdrop{ display:none; }
@media(max-width:900px){
  .sidebar-backdrop.show{ display:block; position:fixed; inset:0; background:rgba(4,7,10,0.6); z-index:150; }
}
.sidebar-top{display:flex;align-items:center;justify-content:space-between;padding:0 2px 4px;}
.collapse-btn{background:none;border:1px solid var(--border);border-radius:8px;color:var(--text-dim);padding:6px;flex-shrink:0;}
.collapse-btn:hover{background:var(--card);color:var(--text);}
.menu-toggle{
  position:fixed; top:18px; left:18px; z-index:120;
  background:var(--card); border:1px solid var(--border); border-radius:10px;
  padding:9px; color:var(--text); display:flex; box-shadow:0 4px 18px rgba(0,0,0,0.3);
}
.menu-toggle:hover{border-color:#334252;}
.brand{display:flex;align-items:center;gap:10px;padding:6px 10px 22px 10px;}
.brand-mark{
  width:40px;height:40px;border-radius:11px;
  background:#efe6d8;
  display:flex;align-items:center;justify-content:center;
  overflow:hidden; flex-shrink:0;
  border:1px solid rgba(217,169,79,0.35);
  box-shadow:0 2px 10px rgba(0,0,0,0.25);
}
.brand-mark img{width:100%;height:100%;object-fit:cover;}
.brand-name{font-family:'Space Grotesk';font-weight:700;font-size:16.5px;letter-spacing:-0.02em;}
.brand-sub{font-size:10.5px;color:var(--text-faint);margin-top:1px;}

.navitem{
  display:flex;align-items:center;gap:11px;padding:10px 12px;border-radius:10px;
  color:var(--text-dim); font-size:13.5px; font-weight:600; border:1px solid transparent;
  transition:all .15s ease; background:none;
}
.navitem:hover{background:var(--card); color:var(--text);}
.navitem.active{background:var(--accent-glow); color:var(--accent); border-color:rgba(62,230,168,0.25);}
.navitem svg{flex-shrink:0;}

.sidebar-foot{margin-top:auto;padding:12px 10px;border-top:1px solid var(--border-soft);}
.streak-pill{
  display:flex;align-items:center;gap:8px;background:var(--amber-dim);
  border:1px solid rgba(255,182,72,0.25); border-radius:12px;padding:9px 12px;
}
.streak-pill b{font-family:'Space Grotesk';font-size:15px;color:var(--amber);}
.streak-pill span{font-size:11px;color:var(--text-dim);}

/* ---- MAIN ---- */
.main{flex:1; min-width:0; padding:28px 34px 60px; max-width:1360px; margin-left:236px; transition:margin-left .25s ease;}
.main.full{margin-left:0; padding-top:64px;}
@media(max-width:900px){ .main{margin-left:0 !important; padding:66px 16px 40px;} }
.topbar{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:26px;flex-wrap:wrap;gap:14px;}
.greeting{font-size:23px;font-weight:700;}
.greeting-date{color:var(--text-dim);font-size:13px;margin-top:3px;text-transform:capitalize;}

.grid{display:grid;gap:16px;}
.grid-4{grid-template-columns:repeat(4,1fr);}
.grid-3{grid-template-columns:repeat(3,1fr);}
.grid-2{grid-template-columns:repeat(2,1fr);}
@media(max-width:1100px){.grid-4{grid-template-columns:repeat(2,1fr);}.grid-3{grid-template-columns:repeat(2,1fr);}}
@media(max-width:720px){.grid-4,.grid-3,.grid-2{grid-template-columns:1fr;}}

.card{
  background:var(--card); border:1px solid var(--border-soft); border-radius:16px;
  padding:18px 20px;
}
.card-title{font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:0.06em; color:var(--text-dim); margin-bottom:12px; display:flex;align-items:center;justify-content:space-between;}

.stat-card{display:flex;flex-direction:column;gap:6px;}
.stat-label{font-size:11.5px;color:var(--text-dim);font-weight:600;text-transform:uppercase;letter-spacing:0.04em;}
.stat-value{font-family:'Space Grotesk';font-size:26px;font-weight:700;}
.stat-sub{font-size:12px;color:var(--text-faint);}
.stat-delta{font-size:12px;font-weight:700;display:flex;align-items:center;gap:3px;}
.delta-up{color:var(--accent);}
.delta-down{color:var(--red);}

/* rings */
.rings-wrap{display:flex;align-items:center;gap:26px;flex-wrap:wrap;}
.ring-legend{display:flex;flex-direction:column;gap:10px;flex:1;min-width:180px;}
.ring-leg-item{display:flex;align-items:center;gap:9px;font-size:12.5px;}
.ring-dot{width:9px;height:9px;border-radius:3px;flex-shrink:0;}
.ring-leg-val{margin-left:auto;font-weight:700;color:var(--text);font-family:'Space Grotesk';}

/* progress bars */
.pbar-row{margin-bottom:12px;}
.pbar-top{display:flex;justify-content:space-between;font-size:12.5px;margin-bottom:6px;}
.pbar-top b{font-weight:700;}
.pbar-track{height:8px;border-radius:5px;background:var(--border-soft);overflow:hidden;}
.pbar-fill{height:100%;border-radius:5px;transition:width .4s ease;}

.btn{
  display:inline-flex;align-items:center;gap:7px;padding:9px 15px;border-radius:10px;
  border:1px solid var(--border); background:var(--card-hover); color:var(--text);
  font-size:13px; font-weight:600; transition:all .15s;
}
.btn:hover{border-color:#334252;}
.btn-primary{background:var(--accent); color:#241505; border-color:var(--accent);}
.btn-primary:hover{background:#e6bb6c;}
.btn-blue{background:var(--blue); color:#161d08; border-color:var(--blue);}
.btn-amber{background:var(--amber); color:#fbe9ec; border-color:var(--amber);}
.btn-amber:hover{background:#a83c54;}
.btn-ghost{background:transparent;border-color:transparent;color:var(--text-dim);}
.btn-ghost:hover{background:var(--card-hover);color:var(--text);}
.btn-danger{background:transparent;border-color:rgba(255,107,107,0.3);color:var(--red);}
.btn-sm{padding:6px 11px;font-size:12px;border-radius:8px;}
.btn:disabled{opacity:0.4;cursor:not-allowed;}

.input, select.input, textarea.input{
  background:var(--bg-elev); border:1px solid var(--border); border-radius:9px;
  padding:9px 12px; color:var(--text); font-size:13.5px; width:100%; outline:none;
}
.input:focus{border-color:var(--accent);}
label.flabel{font-size:11.5px;font-weight:700;color:var(--text-dim);text-transform:uppercase;letter-spacing:0.04em;display:block;margin-bottom:6px;}
.field{margin-bottom:14px;}

.section-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:10px;}
.section-head h2{font-size:19px;font-weight:700;}

.tabs{display:flex;gap:4px;background:var(--bg-elev);padding:4px;border-radius:11px;border:1px solid var(--border-soft);width:fit-content;flex-wrap:wrap;}
.tab-btn{padding:7px 14px;border-radius:8px;font-size:12.5px;font-weight:600;color:var(--text-dim);background:none;border:none;}
.tab-btn.active{background:var(--card); color:var(--text);}

.list-row{display:flex;align-items:center;gap:12px;padding:11px 4px;border-bottom:1px solid var(--border-soft);}
.list-row:last-child{border-bottom:none;}

.badge{font-size:10.5px;font-weight:700;padding:3px 8px;border-radius:6px;text-transform:uppercase;letter-spacing:0.03em;}
.badge-accent{background:var(--accent-glow);color:var(--accent);}
.badge-blue{background:var(--blue-dim);color:var(--blue);}
.badge-amber{background:var(--amber-dim);color:var(--amber);}
.badge-muted{background:var(--border-soft);color:var(--text-dim);}

.empty{text-align:center;padding:34px 20px;color:var(--text-faint);font-size:13px;}

.modal-overlay{position:fixed;inset:0;background:rgba(4,7,10,0.68);backdrop-filter:blur(3px);z-index:100;display:flex;align-items:center;justify-content:center;padding:16px;}
.modal{background:var(--bg-elev);border:1px solid var(--border);border-radius:18px;padding:22px;width:100%;max-width:480px;max-height:88vh;overflow-y:auto;}
.modal-wide{max-width:640px;}
.modal-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;}
.modal-head h3{font-size:16.5px;font-weight:700;}
.iconbtn{background:none;border:none;color:var(--text-dim);padding:5px;border-radius:8px;}
.iconbtn:hover{background:var(--card);color:var(--text);}

.food-search-item{display:flex;justify-content:space-between;align-items:center;padding:10px 8px;border-radius:9px;cursor:pointer;}
.food-search-item:hover{background:var(--card);}

.exercise-card{background:var(--bg-elev);border:1px solid var(--border-soft);border-radius:13px;padding:14px 16px;margin-bottom:10px;}
.set-row{display:grid;grid-template-columns:28px 1fr 1fr 1fr 32px;gap:8px;align-items:center;margin-bottom:6px;}
.set-row input{text-align:center;padding:7px 4px;}
.set-num{font-size:11.5px;color:var(--text-faint);font-weight:700;text-align:center;}
.set-done{background:var(--accent-glow) !important;border-color:var(--accent) !important;}

.chip{display:inline-flex;align-items:center;gap:5px;padding:5px 10px;border-radius:20px;background:var(--bg-elev);border:1px solid var(--border);font-size:12px;font-weight:600;color:var(--text-dim);}
.chip.active{background:var(--accent-glow);border-color:var(--accent);color:var(--accent);}

.timer-fab{
  position:fixed; bottom:24px; right:24px; background:var(--accent); color:#241505;
  border-radius:50px; padding:14px 22px; font-family:'Space Grotesk'; font-weight:700; font-size:16px;
  display:flex; align-items:center; gap:10px; box-shadow:0 8px 30px rgba(62,230,168,0.35); z-index:60; border:none;
}
@media(max-width:720px){.timer-fab{bottom:80px;}}

.water-glass-grid{display:grid;grid-template-columns:repeat(8,1fr);gap:7px;margin-top:14px;}
.water-glass{aspect-ratio:1;border-radius:8px;border:1.5px solid var(--border);background:var(--bg-elev);}
.water-glass.filled{background:var(--amber-dim);border-color:var(--amber);}

.pr-tag{display:flex;align-items:center;gap:5px;font-size:11px;font-weight:700;color:#0a1a12;background:linear-gradient(135deg,#ffd76b,#ffb648);padding:3px 9px;border-radius:7px;}

.calendar-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:5px;}
.cal-cell{aspect-ratio:1;border-radius:9px;border:1px solid var(--border-soft);display:flex;align-items:center;justify-content:center;font-size:12px;color:var(--text-dim);position:relative;background:var(--bg-elev);}
.cal-cell.trained{background:var(--accent-glow);border-color:rgba(217,169,79,0.4);color:var(--accent);font-weight:700;}
.cal-cell.today{outline:1.5px solid var(--text);}
.cal-dot{position:absolute;bottom:4px;width:4px;height:4px;border-radius:50%;background:var(--blue);}

@media(max-width:900px){
  .greeting{font-size:20px;}
}
`;

/* ============================================================
   SEED DATA
============================================================ */
const FOOD_DB_SEED = [
  { id:"f1", name:"Arroz branco cozido", brand:"", per:100, unit:"g", kcal:110, protein:2.5, carb:28, fat:0.2, fiber:1.6, sodium:1 },
  { id:"f2", name:"Feijão carioca cozido", brand:"", per:100, unit:"g", kcal:76, protein:4.8, carb:13.6, fat:0.5, fiber:8.4, sodium:2 },
  { id:"f3", name:"Peito de frango grelhado", brand:"", per:100, unit:"g", kcal:165, protein:31, carb:0, fat:3.6, fiber:0, sodium:74 },
  { id:"f4", name:"Ovo cozido", brand:"", per:1, unit:"unidade", kcal:78, protein:6.3, carb:0.6, fat:5.3, fiber:0, sodium:62 },
  { id:"f5", name:"Pão francês", brand:"", per:1, unit:"unidade", kcal:150, protein:4.7, carb:28, fat:1.6, fiber:1.2, sodium:290 },
  { id:"f6", name:"Banana prata", brand:"", per:1, unit:"unidade", kcal:89, protein:1.1, carb:23, fat:0.3, fiber:2.6, sodium:1 },
  { id:"f7", name:"Aveia em flocos", brand:"", per:100, unit:"g", kcal:389, protein:16.9, carb:66, fat:6.9, fiber:10.6, sodium:2 },
  { id:"f8", name:"Whey protein concentrado", brand:"Growth", per:1, unit:"colher (30g)", kcal:120, protein:24, carb:3, fat:1.5, fiber:0, sodium:50 },
  { id:"f9", name:"Batata doce cozida", brand:"", per:100, unit:"g", kcal:86, protein:1.6, carb:20, fat:0.1, fiber:3, sodium:36 },
  { id:"f10", name:"Azeite de oliva extra virgem", brand:"", per:1, unit:"colher de sopa", kcal:119, protein:0, carb:0, fat:13.5, fiber:0, sodium:0 },
  { id:"f11", name:"Leite integral", brand:"", per:100, unit:"ml", kcal:61, protein:3.2, carb:4.8, fat:3.3, fiber:0, sodium:40 },
  { id:"f12", name:"Iogurte natural integral", brand:"", per:100, unit:"g", kcal:61, protein:3.5, carb:4.7, fat:3.3, fiber:0, sodium:46 },
  { id:"f13", name:"Tapioca (goma hidratada)", brand:"", per:100, unit:"g", kcal:97, protein:0.2, carb:24, fat:0, fiber:0.5, sodium:5 },
  { id:"f14", name:"Patinho moído grelhado", brand:"", per:100, unit:"g", kcal:163, protein:29, carb:0, fat:5, fiber:0, sodium:60 },
  { id:"f15", name:"Salmão grelhado", brand:"", per:100, unit:"g", kcal:208, protein:20, carb:0, fat:13, fiber:0, sodium:59 },
  { id:"f16", name:"Brócolis cozido", brand:"", per:100, unit:"g", kcal:35, protein:2.4, carb:7.2, fat:0.4, fiber:3.3, sodium:33 },
  { id:"f17", name:"Amendoim torrado", brand:"", per:100, unit:"g", kcal:567, protein:25.8, carb:16, fat:49, fiber:8, sodium:18 },
  { id:"f18", name:"Queijo minas frescal", brand:"", per:100, unit:"g", kcal:264, protein:17.4, carb:3.2, fat:20, fiber:0, sodium:346 },
  { id:"f19", name:"Macarrão cozido", brand:"", per:100, unit:"g", kcal:158, protein:5.8, carb:31, fat:0.9, fiber:1.8, sodium:6 },
  { id:"f20", name:"Abacate", brand:"", per:100, unit:"g", kcal:160, protein:2, carb:8.5, fat:14.7, fiber:6.7, sodium:7 },
  { id:"f21", name:"Maçã", brand:"", per:1, unit:"unidade", kcal:95, protein:0.5, carb:25, fat:0.3, fiber:4.4, sodium:2 },
  { id:"f22", name:"Creatina monohidratada", brand:"", per:1, unit:"colher (5g)", kcal:0, protein:0, carb:0, fat:0, fiber:0, sodium:0 },
];

const MUSCLE_GROUPS = ["Peito","Costas","Pernas","Ombro","Bíceps","Tríceps","Abdômen","Glúteos","Panturrilha","Cardio"];

const todayISO = () => new Date().toISOString().slice(0,10);
const daysAgoISO = (n) => { const d=new Date(); d.setDate(d.getDate()-n); return d.toISOString().slice(0,10); };
const fmt1 = (n) => Math.round(n*10)/10;
const uid = () => Math.random().toString(36).slice(2,10);

/* ---- Body composition calculations ---- */
function calcBMI(weightKg, heightCm){
  const h = (heightCm||0)/100;
  if(!h) return 0;
  return fmt1(weightKg / (h*h));
}
// Jackson & Pollock — 7 dobras (mm): peitoral, axilar média, tricipital, subescapular, abdominal, supra-ilíaca, coxa
function calcJP7(sf, age, gender){
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
function calcJP3(sf, age, gender){
  const sites = gender === "F" ? ["triceps","suprailiac","thigh"] : ["chest","abdominal","thigh"];
  const sum = sites.reduce((s,k)=> s + (Number(sf[k])||0), 0);
  if(!sum || !age) return null;
  const bd = gender === "F"
    ? 1.0994921 - 0.0009929*sum + 0.0000023*sum*sum - 0.0001392*age
    : 1.10938 - 0.0008267*sum + 0.0000016*sum*sum - 0.0002574*age;
  const pct = (495/bd) - 450;
  return { sum:fmt1(sum), pct: fmt1(pct) };
}
function calcLeanMass(weightKg, bodyFatPct){
  if(!weightKg || bodyFatPct==null) return null;
  return fmt1(weightKg * (1 - bodyFatPct/100));
}
// averages left/right skinfold sides when both are filled; falls back to whichever side has a value
function sideAvg(r, l){
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
============================================================ */
async function loadKey(userId, key, fallback){
  try{
    const { data, error } = await supabase.from("user_data").select("value").eq("user_id", userId).eq("key", key).maybeSingle();
    if(error || !data) return fallback;
    return data.value;
  }catch(e){ return fallback; }
}
async function saveKey(userId, key, value){
  try{
    await supabase.from("user_data").upsert({ user_id:userId, key, value, updated_at:new Date().toISOString() });
  }catch(e){ console.error("Erro ao salvar", key, e); }
}
async function deleteAllUserData(userId){
  try{ await supabase.from("user_data").delete().eq("user_id", userId); }catch(e){ /* noop */ }
}

/* ---- Supabase profile row <-> app profile object mapping ---- */
function dbRowToProfile(row){
  return {
    name: row.name ?? "", height: row.height ?? 170, weight: row.weight ?? 70,
    initialWeight: row.initial_weight ?? row.weight ?? 70, gender: row.gender ?? "M", age: row.age ?? 25,
    goal: row.goal ?? "Manutenção", experience: row.experience ?? "Iniciante",
    caloriesTarget: row.calories_target ?? 2200, proteinTarget: row.protein_target ?? 150,
    carbTarget: row.carb_target ?? 220, fatTarget: row.fat_target ?? 60, waterTarget: row.water_target ?? 3,
  };
}
function profileToDbRow(p, userId){
  return {
    id: userId, name: p.name, height: p.height, weight: p.weight, initial_weight: p.initialWeight,
    gender: p.gender, age: p.age, goal: p.goal, experience: p.experience,
    calories_target: p.caloriesTarget, protein_target: p.proteinTarget,
    carb_target: p.carbTarget, fat_target: p.fatTarget, water_target: p.waterTarget,
    updated_at: new Date().toISOString(),
  };
}
async function loadProfileFromSupabase(userId){
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  if(error){ console.error("Erro ao carregar perfil:", error.message); return null; }
  return data ? dbRowToProfile(data) : null;
}
async function saveProfileToSupabase(profile, userId){
  const row = profileToDbRow(profile, userId);
  const { error } = await supabase.from("profiles").upsert(row);
  if(error) console.error("Erro ao salvar perfil:", error.message);
}

/* ---- Evolution photos: Supabase Storage + body_photos table ---- */
const PHOTOS_BUCKET = "progress-photos";

async function uploadEvolutionPhoto(file, dateStr, userId){
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `${userId}/${Date.now()}-${uid()}.${ext}`;
  const { error: upErr } = await supabase.storage.from(PHOTOS_BUCKET).upload(path, file, { upsert:false });
  if(upErr) throw upErr;
  const { data, error: insErr } = await supabase.from("body_photos")
    .insert({ user_id:userId, date:dateStr, storage_path:path }).select().single();
  if(insErr) throw insErr;
  return data;
}
async function loadEvolutionPhotos(userId){
  const { data, error } = await supabase.from("body_photos").select("*").eq("user_id", userId).order("date", { ascending:false });
  if(error){ console.error("Erro ao carregar fotos:", error.message); return []; }
  const withUrls = await Promise.all((data||[]).map(async p=>{
    const { data: signed } = await supabase.storage.from(PHOTOS_BUCKET).createSignedUrl(p.storage_path, 3600);
    return { ...p, url: signed?.signedUrl || null };
  }));
  return withUrls;
}
async function deleteEvolutionPhoto(photo){
  await supabase.storage.from(PHOTOS_BUCKET).remove([photo.storage_path]);
  const { error } = await supabase.from("body_photos").delete().eq("id", photo.id);
  if(error) throw error;
}

/* ============================================================
   SMALL UI PRIMITIVES
============================================================ */
function ProgressBar({ label, value, max, unit="", color="var(--accent)" }){
  const pct = Math.min(100, Math.round((value/Math.max(max,0.0001))*100));
  return (
    <div className="pbar-row">
      <div className="pbar-top">
        <span style={{color:"var(--text-dim)"}}>{label}</span>
        <b>{fmt1(value)}{unit} <span style={{color:"var(--text-faint)",fontWeight:500}}>/ {fmt1(max)}{unit} · {pct}%</span></b>
      </div>
      <div className="pbar-track"><div className="pbar-fill" style={{width:pct+"%", background:color}} /></div>
    </div>
  );
}

function Ring({ pct, color, r, sw, cx, cy }){
  const circ = 2*Math.PI*r;
  const off = circ * (1 - Math.min(1,pct));
  return (
    <>
      <circle cx={cx} cy={cy} r={r} stroke="var(--border-soft)" strokeWidth={sw} fill="none" />
      <circle cx={cx} cy={cy} r={r} stroke={color} strokeWidth={sw} fill="none"
        strokeDasharray={circ} strokeDashoffset={off} strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`} style={{transition:"stroke-dashoffset .6s ease"}}/>
    </>
  );
}

function VitalRings({ calPct, proPct, waterPct }){
  const size=178, cx=size/2, cy=size/2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Ring pct={calPct} color="var(--accent)" r={78} sw={12} cx={cx} cy={cy} />
      <Ring pct={proPct} color="var(--blue)" r={58} sw={12} cx={cx} cy={cy} />
      <Ring pct={waterPct} color="var(--amber)" r={38} sw={12} cx={cx} cy={cy} />
    </svg>
  );
}

function Modal({ title, onClose, children, wide }){
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={"modal" + (wide?" modal-wide":"")} onClick={e=>e.stopPropagation()}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="iconbtn" onClick={onClose}><X size={19}/></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function CelebrationModal({ celebration, onClose }){
  if(!celebration) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{textAlign:"center", maxWidth:360}} onClick={e=>e.stopPropagation()}>
        <div style={{fontSize:52, marginBottom:10, lineHeight:1}}>{celebration.emoji || "🎉"}</div>
        <h3 style={{fontSize:19, marginBottom:8}}>{celebration.title}</h3>
        <div style={{fontSize:13.5, color:"var(--text-dim)", marginBottom:22, lineHeight:1.5}}>{celebration.subtitle}</div>
        <button className="btn btn-primary" style={{width:"100%",justifyContent:"center"}} onClick={onClose}>Continuar</button>
      </div>
    </div>
  );
}

const NAV = [
  { key:"dashboard", label:"Dashboard", icon:LayoutDashboard },
  { key:"diet", label:"Dieta", icon:Utensils },
  { key:"water", label:"Água", icon:Droplets },
  { key:"workout", label:"Treino", icon:Dumbbell },
  { key:"evolution", label:"Evolução", icon:TrendingUp },
  { key:"body", label:"Medidas", icon:Ruler },
  { key:"goals", label:"Metas", icon:Target },
  { key:"profile", label:"Perfil", icon:User },
];

/* ============================================================
   MAIN APP
============================================================ */
export default function FitnessApp({ user }){
  const [tab, setTab] = useState("dashboard");
  const [loaded, setLoaded] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(()=>{
    if(typeof window !== "undefined" && window.innerWidth <= 900) setSidebarOpen(false);
  },[]);

  function selectTab(key){
    setTab(key);
    if(typeof window !== "undefined" && window.innerWidth <= 900) setSidebarOpen(false);
  }

  const [profile, setProfile] = useState({
    name:"", height:170, weight:70, initialWeight:70, gender:"M", age:25,
    goal:"Manutenção", experience:"Iniciante",
    caloriesTarget:2200, proteinTarget:150, carbTarget:220, fatTarget:60, waterTarget:3,
  });
  const [foods, setFoods] = useState(FOOD_DB_SEED);
  const [diary, setDiary] = useState({}); // date -> {meals:[{id,name,items:[]}]}
  const [water, setWater] = useState({}); // date -> liters
  const [fichas, setFichas] = useState([]);
  const [history, setHistory] = useState([]);
  const [bodyData, setBodyData] = useState([]);
  const [goals, setGoals] = useState([]);
  const [schedule, setSchedule] = useState({}); // { "0"-"6" (dia da semana) -> treinoId | null }
  const [dietPlan, setDietPlan] = useState([]); // [{id, name, items:[{id,foodId,qty}]}] — dieta fixa/planejada
  const [activeSession, setActiveSession] = useState(null); // {treinoId, ficha, startedAt, log:[{exId,sets:[{weight,reps,done}]}]}
  const [restTimer, setRestTimer] = useState(null); // {endTime, total}
  const [now, setNow] = useState(Date.now());
  const [celebration, setCelebration] = useState(null);
  const waterCelebratedRef = useRef(null); // stores the date string already celebrated, to avoid repeating

  const today = todayISO();

  useEffect(()=>{
    (async ()=>{
      const [f,d,w,fi,h,b,g,sc,dp] = await Promise.all([
        loadKey(user.id, "foods-custom", []),
        loadKey(user.id, "diary:"+today, null),
        loadKey(user.id, "water-log", {}),
        loadKey(user.id, "fichas", null),
        loadKey(user.id, "workout-history", null),
        loadKey(user.id, "body-measurements", null),
        loadKey(user.id, "goals", null),
        loadKey(user.id, "schedule", {}),
        loadKey(user.id, "diet-plan", null),
      ]);

      let p = await loadProfileFromSupabase(user.id);
      if(!p){
        // first login: create a default profile row for this user
        p = { name:"", height:170, weight:70, initialWeight:70, gender:"M", age:25,
          goal:"Manutenção", experience:"Iniciante", caloriesTarget:2200, proteinTarget:150,
          carbTarget:220, fatTarget:60, waterTarget:3 };
        await saveProfileToSupabase(p, user.id);
      }
      setProfile(p);

      if(f && f.length) setFoods([...FOOD_DB_SEED, ...f]);
      if(d) setDiary({[today]:d});
      else setDiary({[today]: seedDiary()});
      setWater(w||{});
      setFichas(fi||[]);
      setHistory(h||[]);
      setBodyData(b||[]);
      setGoals(g||[]);
      setSchedule(sc||{});
      setDietPlan(dp||[]);
      setLoaded(true);
    })();
    // eslint-disable-next-line
  },[]);

  function seedDiary(){
    // starting meal categories only — no pre-filled food, so day one isn't fake
    return { meals:[
      { id:uid(), name:"Café da manhã", items:[] },
      { id:uid(), name:"Almoço", items:[] },
      { id:uid(), name:"Lanche da tarde", items:[] },
      { id:uid(), name:"Jantar", items:[] },
    ]};
  }

  // persist on change (after initial load)
  useEffect(()=>{ if(loaded) saveProfileToSupabase(profile, user.id); },[profile, loaded]);
  useEffect(()=>{ if(loaded) saveKey(user.id, "foods-custom", foods.filter(f=>f.custom)); },[foods, loaded]);
  useEffect(()=>{ if(loaded && diary[today]) saveKey(user.id, "diary:"+today, diary[today]); },[diary, loaded]);
  useEffect(()=>{ if(loaded) saveKey(user.id, "water-log", water); },[water, loaded]);
  useEffect(()=>{ if(loaded) saveKey(user.id, "fichas", fichas); },[fichas, loaded]);
  useEffect(()=>{ if(loaded) saveKey(user.id, "schedule", schedule); },[schedule, loaded]);
  useEffect(()=>{ if(loaded) saveKey(user.id, "diet-plan", dietPlan); },[dietPlan, loaded]);
  useEffect(()=>{ if(loaded) saveKey(user.id, "workout-history", history); },[history, loaded]);
  useEffect(()=>{ if(loaded) saveKey(user.id, "body-measurements", bodyData); },[bodyData, loaded]);
  useEffect(()=>{ if(loaded) saveKey(user.id, "goals", goals); },[goals, loaded]);

  // rest timer: recompute from a fixed end timestamp, so it's correct
  // even if the browser throttled timers while the phone was locked/backgrounded
  useEffect(()=>{
    if(!restTimer) return;
    const iv = setInterval(()=> setNow(Date.now()), 1000);
    return ()=>clearInterval(iv);
  },[restTimer]);

  useEffect(()=>{
    function resync(){ setNow(Date.now()); }
    function onVisibility(){ if(document.visibilityState === "visible") resync(); }
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", resync);
    window.addEventListener("pageshow", resync);
    return ()=>{
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", resync);
      window.removeEventListener("pageshow", resync);
    };
  },[]);

  const restRemaining = restTimer ? Math.max(0, Math.round((restTimer.endTime - now)/1000)) : 0;

  const todayMeals = diary[today]?.meals || [];
  const todayWaterEntries = water[today] || [];
  const todayWater = todayWaterEntries.reduce((s,e)=>s+(e.ml||0),0)/1000;

  useEffect(()=>{
    if(!loaded) return;
    if(profile.waterTarget && todayWater >= profile.waterTarget && waterCelebratedRef.current !== today){
      waterCelebratedRef.current = today;
      setCelebration({
        emoji: "💧",
        title: "Meta de água batida!",
        subtitle: `Você bebeu ${fmt1(todayWater)}L hoje, atingindo sua meta de ${profile.waterTarget}L. Continue se hidratando!`,
      });
    }
  },[todayWater, profile.waterTarget, today, loaded]);

  const macroTotals = useMemo(()=>{
    let kcal=0, p=0, c=0, f=0;
    todayMeals.forEach(m=> m.items.forEach(it=>{
      const food = foods.find(x=>x.id===it.foodId); if(!food) return;
      const factor = it.qty / food.per;
      kcal += food.kcal*factor; p += food.protein*factor; c += food.carb*factor; f += food.fat*factor;
    }));
    return { kcal, p, c, f };
  },[todayMeals, foods]);

  const streak = useMemo(()=>{
    const dates = new Set(history.map(h=>h.date));
    let s=0, d=new Date();
    while(true){
      const iso = d.toISOString().slice(0,10);
      if(dates.has(iso)){ s++; d.setDate(d.getDate()-1); } else break;
    }
    return s;
  },[history]);

  const latestWeight = bodyData.length ? bodyData[bodyData.length-1].weight : profile.weight;

  async function resetAllData(){
    await deleteAllUserData(user.id);
    setProfile({
      name:"", height:170, weight:70, initialWeight:70, gender:"M", age:25,
      goal:"Manutenção", experience:"Iniciante",
      caloriesTarget:2200, proteinTarget:150, carbTarget:220, fatTarget:60, waterTarget:3,
    });
    setFoods(FOOD_DB_SEED);
    setDiary({ [today]: { meals: [] } });
    setWater({});
    setFichas([]);
    setHistory([]);
    setBodyData([]);
    setGoals([]);
    setSchedule({});
    setDietPlan([]);
  }

  function updateFood(items, mealId, itemId, newQty){
    setDiary(prev=>{
      const d = { ...(prev[today]||{meals:[]}) };
      d.meals = d.meals.map(m => m.id!==mealId ? m : { ...m, items: m.items.map(it => it.id===itemId ? {...it, qty:newQty} : it) });
      return { ...prev, [today]: d };
    });
  }

  if(!loaded){
    return <div className="fitapp" style={{alignItems:"center",justifyContent:"center",width:"100%"}}><style>{CSS}</style>
      <div style={{color:"var(--text-dim)",fontFamily:"Space Grotesk"}}>Carregando…</div></div>;
  }

  return (
    <div className="fitapp">
      <style>{CSS}</style>

      <div className={"sidebar-backdrop"+(sidebarOpen?" show":"")} onClick={()=>setSidebarOpen(false)} />

      {!sidebarOpen && (
        <button className="menu-toggle" onClick={()=>setSidebarOpen(true)} aria-label="Abrir menu"><Menu size={19}/></button>
      )}

      <aside className={"sidebar"+(sidebarOpen?"":" closed")}>
        <div className="sidebar-top">
          <div className="brand" style={{padding:"6px 0 22px 0"}}>
            <div className="brand-mark"><img src="/logo.jpg" alt="EQ Fitness"/></div>
            <div>
              <div className="brand-name">EQ Fitness</div>
              <div className="brand-sub">treino · dieta · evolução</div>
              <div className="brand-sub" style={{color:"var(--accent)",fontWeight:600,marginTop:2}}>Elane Quezia Dias · Nutricionista</div>
            </div>
          </div>
          <button className="collapse-btn" onClick={()=>setSidebarOpen(false)} aria-label="Recolher menu"><ChevronsLeft size={16}/></button>
        </div>
        {NAV.map(n=>(
          <button key={n.key} className={"navitem"+(tab===n.key?" active":"")} onClick={()=>selectTab(n.key)}>
            <n.icon size={17}/> {n.label}
          </button>
        ))}
        <div className="sidebar-foot">
          <div className="streak-pill">
            <Flame size={18} color="var(--amber)"/>
            <div><b>{streak} dias</b><br/><span>sequência atual</span></div>
          </div>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:10,padding:"0 2px"}}>
            <span style={{fontSize:11,color:"var(--text-faint)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:150}}>{user.email}</span>
            <button className="iconbtn" title="Sair" onClick={()=>supabase.auth.signOut()}><LogOut size={15}/></button>
          </div>
          <div style={{textAlign:"center",fontSize:10,color:"var(--text-faint)",marginTop:12,paddingTop:10,borderTop:"1px solid var(--border-soft)"}}>
            Feito por Lucas Morais
          </div>
        </div>
      </aside>

      <main className={"main"+(sidebarOpen?"":" full")}>
        {tab==="dashboard" && <Dashboard {...{profile, macroTotals, todayWater, todayMeals, history, bodyData, streak, latestWeight, fichas, schedule}} />}
        {tab==="diet" && <DietTab {...{foods, setFoods, diary, setDiary, today, todayMeals, macroTotals, profile, dietPlan, setDietPlan}} />}
        {tab==="water" && <WaterTab {...{water, setWater, today, todayWater, todayWaterEntries, profile}} />}
        {tab==="workout" && <WorkoutTab {...{fichas, setFichas, history, setHistory, activeSession, setActiveSession, restTimer, setRestTimer, profile, schedule, setSchedule, celebrate:setCelebration}} />}
        {tab==="evolution" && <EvolutionTab {...{history, bodyData, diary, water, fichas}} />}
        {tab==="body" && <BodyTab {...{bodyData, setBodyData, profile, setProfile, user}} />}
        {tab==="goals" && <GoalsTab {...{goals, setGoals, bodyData, profile, history}} />}
        {tab==="profile" && <ProfileTab {...{profile, setProfile, resetAllData}} />}
      </main>

      {restTimer && (
        <button className="timer-fab" onClick={()=>setRestTimer(null)}>
          {restRemaining>0 ? <Pause size={18}/> : <Check size={18}/>}
          {restRemaining>0 ? `${Math.floor(restRemaining/60)}:${String(restRemaining%60).padStart(2,"0")} descanso` : "Descanso concluído"}
        </button>
      )}

      <CelebrationModal celebration={celebration} onClose={()=>setCelebration(null)}/>
    </div>
  );
}

/* ============================================================
   DASHBOARD
============================================================ */
function TrainingCalendar({ history }){
  const [viewDate, setViewDate] = useState(new Date());
  const trainedDates = useMemo(()=> new Set(history.map(h=>h.date)), [history]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const startOffset = (firstDay.getDay()+6)%7; // Monday-first
  const daysInMonth = new Date(year, month+1, 0).getDate();
  const todayStr = todayISO();

  const cells = [];
  for(let i=0;i<startOffset;i++) cells.push(null);
  for(let d=1; d<=daysInMonth; d++) cells.push(d);

  let trainedCount = 0;
  for(let d=1; d<=daysInMonth; d++){
    const iso = `${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    if(trainedDates.has(iso)) trainedCount++;
  }

  const monthLabel = viewDate.toLocaleDateString("pt-BR", {month:"long", year:"numeric"});

  return (
    <div className="card">
      <div className="card-title">
        <span>Calendário de treinos</span>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          <button className="iconbtn" onClick={()=>setViewDate(new Date(year, month-1, 1))}><ChevronLeft size={15}/></button>
          <span style={{fontSize:12.5,fontWeight:600,textTransform:"capitalize",minWidth:112,textAlign:"center",color:"var(--text)"}}>{monthLabel}</span>
          <button className="iconbtn" onClick={()=>setViewDate(new Date(year, month+1, 1))}><ChevronRight size={15}/></button>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:5,marginBottom:6}}>
        {["S","T","Q","Q","S","S","D"].map((d,i)=>(
          <div key={i} style={{textAlign:"center",fontSize:10.5,color:"var(--text-faint)",fontWeight:700}}>{d}</div>
        ))}
      </div>
      <div className="calendar-grid">
        {cells.map((d,i)=>{
          if(d===null) return <div key={i}/>;
          const iso = `${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
          const trained = trainedDates.has(iso);
          const isToday = iso === todayStr;
          return <div key={i} className={"cal-cell"+(trained?" trained":"")+(isToday?" today":"")}>{d}</div>;
        })}
      </div>
      <div style={{fontSize:11.5,color:"var(--text-faint)",marginTop:12,textAlign:"center"}}>
        {trainedCount} {trainedCount===1?"dia treinado":"dias treinados"} em {monthLabel}
      </div>
    </div>
  );
}

function Dashboard({ profile, macroTotals, todayWater, todayMeals, history, bodyData, streak, latestWeight, fichas, schedule }){
  const calPct = macroTotals.kcal/profile.caloriesTarget;
  const proPct = macroTotals.p/profile.proteinTarget;
  const waterPct = todayWater/profile.waterTarget;
  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate()-7);
  const weekWorkouts = history.filter(h=> new Date(h.date) >= weekAgo).length;
  const weekVolume = history.filter(h=> new Date(h.date) >= weekAgo).reduce((s,h)=>s+h.volume,0);
  const recentWorkouts = [...history].sort((a,b)=> b.date.localeCompare(a.date)).slice(0,4);
  const weightSeries = bodyData.slice(-10).map(b=>({date:b.date.slice(5), peso:b.weight}));
  const weightDelta = bodyData.length>1 ? fmt1(bodyData[bodyData.length-1].weight - bodyData[0].weight) : 0;

  const todayDow = new Date().getDay();
  const scheduledTreinoId = schedule[todayDow];
  let todaysTreino = null, todaysFichaName = "";
  if(scheduledTreinoId){
    for(const f of fichas){
      const t = f.treinos.find(t=>t.id===scheduledTreinoId);
      if(t){ todaysTreino = t; todaysFichaName = f.name; break; }
    }
  }
  const todaysWorkoutName = scheduledTreinoId === "rest" ? "Descanso" : (todaysTreino ? todaysTreino.name : "Não definido");

  const dow = new Date().toLocaleDateString("pt-BR",{weekday:"long", day:"numeric", month:"long"});

  return (
    <div>
      <div className="topbar">
        <div>
          <div className="greeting">Olá, {profile.name} 👋</div>
          <div className="greeting-date">{dow}</div>
        </div>
        <div className="badge badge-accent" style={{fontSize:12,padding:"7px 12px"}}>Objetivo: {profile.goal}</div>
      </div>

      <div className="grid grid-4" style={{marginBottom:16}}>
        <div className="card stat-card">
          <span className="stat-label">Peso atual</span>
          <span className="stat-value">{fmt1(latestWeight)} kg</span>
          <span className={"stat-delta "+(weightDelta<=0?"delta-up":"delta-down")}>
            {weightDelta<=0? <ArrowDown size={13}/>:<ArrowUp size={13}/>} {Math.abs(weightDelta)} kg desde o início ({profile.initialWeight} kg)
          </span>
        </div>
        <div className="card stat-card">
          <span className="stat-label">Treino de hoje</span>
          <span className="stat-value" style={{fontSize:17}}>{todaysWorkoutName}</span>
          <span className="stat-sub">{todaysFichaName || "Defina em Treino → Agenda semanal"}</span>
        </div>
        <div className="card stat-card">
          <span className="stat-label">Sequência</span>
          <span className="stat-value">{streak} 🔥</span>
          <span className="stat-sub">dias treinando seguidos</span>
        </div>
        <div className="card stat-card">
          <span className="stat-label">Resumo semanal</span>
          <span className="stat-value">{weekWorkouts} treinos</span>
          <span className="stat-sub">{Math.round(weekVolume).toLocaleString("pt-BR")} kg volume total</span>
        </div>
      </div>

      <div className="grid" style={{gridTemplateColumns:"1.1fr 1fr", marginBottom:16}}>
        <div className="card">
          <div className="card-title">Metas diárias<span className="badge badge-muted">hoje</span></div>
          <div className="rings-wrap">
            <VitalRings calPct={calPct} proPct={proPct} waterPct={waterPct}/>
            <div className="ring-legend">
              <div className="ring-leg-item"><span className="ring-dot" style={{background:"var(--accent)"}}/>Calorias <span className="ring-leg-val">{Math.round(macroTotals.kcal)}/{profile.caloriesTarget}</span></div>
              <div className="ring-leg-item"><span className="ring-dot" style={{background:"var(--blue)"}}/>Proteína <span className="ring-leg-val">{Math.round(macroTotals.p)}/{profile.proteinTarget}g</span></div>
              <div className="ring-leg-item"><span className="ring-dot" style={{background:"var(--amber)"}}/>Água <span className="ring-leg-val">{fmt1(todayWater)}/{profile.waterTarget}L</span></div>
              <div style={{height:1,background:"var(--border-soft)",margin:"4px 0"}}/>
              <ProgressBar label="Carboidratos" value={macroTotals.c} max={profile.carbTarget} unit="g" color="var(--purple)"/>
              <ProgressBar label="Gorduras" value={macroTotals.f} max={profile.fatTarget} unit="g" color="var(--red)"/>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-title">Evolução do peso</div>
          {weightSeries.length>1 ? (
            <ResponsiveContainer width="100%" height={190}>
              <AreaChart data={weightSeries}>
                <defs><linearGradient id="wgrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.35}/>
                  <stop offset="100%" stopColor="var(--accent)" stopOpacity={0}/>
                </linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1c2530" vertical={false}/>
                <XAxis dataKey="date" tick={{fill:"#5c6774",fontSize:11}} axisLine={false} tickLine={false}/>
                <YAxis domain={['dataMin - 1','dataMax + 1']} tick={{fill:"#5c6774",fontSize:11}} axisLine={false} tickLine={false} width={34}/>
                <Tooltip contentStyle={{background:"#141b24",border:"1px solid #232c38",borderRadius:10,fontSize:12}}/>
                <Area type="monotone" dataKey="peso" stroke="var(--accent)" strokeWidth={2.5} fill="url(#wgrad)"/>
              </AreaChart>
            </ResponsiveContainer>
          ) : <div className="empty">Registre medidas para ver o gráfico</div>}
        </div>
      </div>

      <div className="grid" style={{gridTemplateColumns:"1fr 1fr"}}>
        <div className="card">
          <div className="card-title">Refeições de hoje</div>
          {todayMeals.map(m=>{
            const kcal = m.items.reduce((s,it)=>s+0,0);
            return (
              <div className="list-row" key={m.id}>
                <Utensils size={15} color="var(--text-faint)"/>
                <span style={{flex:1,fontSize:13.5}}>{m.name}</span>
                <span className="badge badge-muted">{m.items.length} itens</span>
              </div>
            );
          })}
          {!todayMeals.length && <div className="empty">Nenhuma refeição criada ainda</div>}
        </div>

        <div className="card">
          <div className="card-title">Últimos treinos realizados</div>
          {recentWorkouts.map(w=>(
            <div className="list-row" key={w.id}>
              <Dumbbell size={15} color="var(--text-faint)"/>
              <div style={{flex:1}}>
                <div style={{fontSize:13.5,fontWeight:600}}>{w.treinoName}</div>
                <div style={{fontSize:11.5,color:"var(--text-faint)"}}>{new Date(w.date+"T12:00").toLocaleDateString("pt-BR")} · {w.duration} min</div>
              </div>
              <span className="badge badge-accent">{Math.round(w.volume)} kg</span>
            </div>
          ))}
          {!recentWorkouts.length && <div className="empty">Nenhum treino registrado ainda</div>}
        </div>
      </div>

      <div className="grid" style={{gridTemplateColumns:"1fr", marginTop:16}}>
        <TrainingCalendar history={history}/>
      </div>
    </div>
  );
}

/* ============================================================
   DIET TAB
============================================================ */
function DietTab({ foods, setFoods, diary, setDiary, today, todayMeals, macroTotals, profile, dietPlan, setDietPlan }){
  const [view, setView] = useState("today"); // today | plan
  const [confirmUseId, setConfirmUseId] = useState(null);

  function setTodayMeals(updater){
    setDiary(prev=>{
      const d = {...(prev[today]||{meals:[]})};
      d.meals = typeof updater === "function" ? updater(d.meals) : updater;
      return {...prev, [today]: d};
    });
  }

  function mealTotals(items){
    let kcal=0,p=0,c=0,f=0;
    items.forEach(it=>{
      const food = foods.find(x=>x.id===it.foodId); if(!food) return;
      const factor = it.qty/food.per;
      kcal+=food.kcal*factor; p+=food.protein*factor; c+=food.carb*factor; f+=food.fat*factor;
    });
    return {kcal,p,c,f};
  }

  function findPlanMeal(mealName){
    return dietPlan.find(pm => pm.name.trim().toLowerCase() === mealName.trim().toLowerCase() && pm.items.length);
  }

  function usePlanMeal(meal, planMeal){
    setTodayMeals(prev => prev.map(m => m.id!==meal.id ? m : {
      ...m, items: planMeal.items.map(it => ({ id:uid(), foodId:it.foodId, qty:it.qty }))
    }));
    setConfirmUseId(null);
  }

  return (
    <div>
      <div className="section-head">
        <h2>Dieta</h2>
        <div className="tabs">
          <button className={"tab-btn"+(view==="today"?" active":"")} onClick={()=>setView("today")}>Hoje</button>
          <button className={"tab-btn"+(view==="plan"?" active":"")} onClick={()=>setView("plan")}>Plano alimentar</button>
        </div>
      </div>

      {view === "today" ? (
        <>
          <div className="grid grid-4" style={{marginBottom:18}}>
            <div className="card stat-card"><span className="stat-label">Calorias</span><span className="stat-value">{Math.round(macroTotals.kcal)}</span><span className="stat-sub">meta {profile.caloriesTarget} kcal</span></div>
            <div className="card stat-card"><span className="stat-label">Proteínas</span><span className="stat-value">{fmt1(macroTotals.p)}g</span><span className="stat-sub">meta {profile.proteinTarget}g</span></div>
            <div className="card stat-card"><span className="stat-label">Carboidratos</span><span className="stat-value">{fmt1(macroTotals.c)}g</span><span className="stat-sub">meta {profile.carbTarget}g</span></div>
            <div className="card stat-card"><span className="stat-label">Gorduras</span><span className="stat-value">{fmt1(macroTotals.f)}g</span><span className="stat-sub">meta {profile.fatTarget}g</span></div>
          </div>

          <div className="card" style={{marginBottom:18}}>
            <div className="card-title">Progresso do dia</div>
            <ProgressBar label="Calorias" value={macroTotals.kcal} max={profile.caloriesTarget} unit=" kcal" color="var(--accent)"/>
            <ProgressBar label="Proteínas" value={macroTotals.p} max={profile.proteinTarget} unit="g" color="var(--blue)"/>
            <ProgressBar label="Carboidratos" value={macroTotals.c} max={profile.carbTarget} unit="g" color="var(--purple)"/>
            <ProgressBar label="Gorduras" value={macroTotals.f} max={profile.fatTarget} unit="g" color="var(--red)"/>
          </div>

          <MealsList
            meals={todayMeals} setMeals={setTodayMeals} foods={foods} setFoods={setFoods}
            mealTotals={mealTotals}
            renderExtra={(meal)=>{
              const planMeal = findPlanMeal(meal.name);
              if(!planMeal) return null;
              const pt = mealTotals(planMeal.items);
              return (
                <div style={{marginBottom:10}}>
                  {confirmUseId===meal.id ? (
                    <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                      <span style={{fontSize:11.5,color:"var(--text-dim)"}}>Isso substitui os alimentos já lançados nessa refeição. Confirmar?</span>
                      <button className="btn btn-sm btn-danger" onClick={()=>usePlanMeal(meal, planMeal)}>Sim, usar planejada</button>
                      <button className="btn btn-sm btn-ghost" onClick={()=>setConfirmUseId(null)}>Cancelar</button>
                    </div>
                  ) : (
                    <button className="btn btn-sm" style={{background:"var(--accent-glow)",borderColor:"rgba(217,169,79,0.35)",color:"var(--accent)"}}
                      onClick={()=> meal.items.length ? setConfirmUseId(meal.id) : usePlanMeal(meal, planMeal)}>
                      <Check size={13}/> Usar refeição planejada ({Math.round(pt.kcal)} kcal)
                    </button>
                  )}
                </div>
              );
            }}
          />

          {!dietPlan.length && (
            <div className="card" style={{textAlign:"center",padding:"20px"}}>
              <div style={{fontSize:13,color:"var(--text-dim)",marginBottom:10}}>Ainda não existe um plano alimentar fixo cadastrado.</div>
              <button className="btn btn-sm btn-primary" onClick={()=>setView("plan")}>Criar plano alimentar</button>
            </div>
          )}
        </>
      ) : (
        <>
          <div style={{fontSize:12.5,color:"var(--text-faint)",marginBottom:14}}>
            Monte aqui a dieta fixa recomendada (ex: pela nutricionista). No dia a dia, se a refeição realizada bater com o plano, basta um clique em "Usar refeição planejada" — sem precisar lançar tudo de novo.
          </div>
          <MealsList meals={dietPlan} setMeals={setDietPlan} foods={foods} setFoods={setFoods} mealTotals={mealTotals}/>
        </>
      )}
    </div>
  );
}

function MealsList({ meals, setMeals, foods, setFoods, mealTotals, renderExtra }){
  const [addingTo, setAddingTo] = useState(null);
  const [newMealName, setNewMealName] = useState("");
  const [showNewMeal, setShowNewMeal] = useState(false);

  function addMeal(){
    if(!newMealName.trim()) return;
    setMeals(prev=>[...prev, {id:uid(), name:newMealName.trim(), items:[]}]);
    setNewMealName(""); setShowNewMeal(false);
  }
  function deleteMeal(mealId){
    setMeals(prev=>prev.filter(m=>m.id!==mealId));
  }
  function removeItem(mealId, itemId){
    setMeals(prev=>prev.map(m=>m.id!==mealId?m:{...m, items:m.items.filter(i=>i.id!==itemId)}));
  }
  function setQty(mealId, itemId, qty){
    setMeals(prev=>prev.map(m=>m.id!==mealId?m:{...m, items:m.items.map(i=>i.id===itemId?{...i,qty}:i)}));
  }
  function addFoodToMeal(mealId, food, qty){
    setMeals(prev=>prev.map(m=>m.id!==mealId?m:{...m, items:[...m.items, {id:uid(), foodId:food.id, qty}]}));
    setAddingTo(null);
  }

  return (
    <div>
      <div className="section-head" style={{marginBottom:14}}>
        <span/>
        <button className="btn btn-sm btn-primary" onClick={()=>setShowNewMeal(true)}><Plus size={13}/> Nova refeição</button>
      </div>

      {meals.map(meal=>{
        const t = mealTotals(meal.items);
        return (
          <div className="card" key={meal.id} style={{marginBottom:14}}>
            <div className="card-title">
              <span style={{color:"var(--text)",fontSize:14}}>{meal.name}</span>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                <span className="badge badge-muted">{Math.round(t.kcal)} kcal · P{fmt1(t.p)} C{fmt1(t.c)} G{fmt1(t.f)}</span>
                <button className="iconbtn" onClick={()=>deleteMeal(meal.id)}><Trash2 size={14}/></button>
              </div>
            </div>
            {renderExtra && renderExtra(meal)}
            {meal.items.map(it=>{
              const food = foods.find(f=>f.id===it.foodId);
              if(!food) return null;
              const factor = it.qty/food.per;
              return (
                <div className="list-row" key={it.id}>
                  <span style={{flex:1,fontSize:13.5}}>{food.name}{food.brand?` · ${food.brand}`:""}</span>
                  <input className="input" type="number" value={it.qty} style={{width:70}} min={0}
                    onChange={e=>setQty(meal.id, it.id, Number(e.target.value))}/>
                  <span style={{fontSize:11.5,color:"var(--text-faint)",width:70}}>{food.unit}</span>
                  <span style={{fontSize:12.5,width:130,color:"var(--text-dim)"}}>{Math.round(food.kcal*factor)} kcal · P{fmt1(food.protein*factor)}g</span>
                  <button className="iconbtn" onClick={()=>removeItem(meal.id, it.id)}><X size={15}/></button>
                </div>
              );
            })}
            {!meal.items.length && <div className="empty" style={{padding:"14px 0"}}>Nenhum alimento adicionado</div>}
            <button className="btn btn-sm btn-ghost" style={{marginTop:8}} onClick={()=>setAddingTo(meal.id)}><Plus size={13}/> Adicionar alimento</button>
          </div>
        );
      })}

      {showNewMeal && (
        <Modal title="Nova refeição" onClose={()=>setShowNewMeal(false)}>
          <div className="field">
            <label className="flabel">Nome da refeição</label>
            <input className="input" autoFocus value={newMealName} onChange={e=>setNewMealName(e.target.value)}
              placeholder="Ex: Pré-treino" onKeyDown={e=>e.key==="Enter"&&addMeal()}/>
          </div>
          <button className="btn btn-primary" style={{width:"100%",justifyContent:"center"}} onClick={addMeal}>Criar refeição</button>
        </Modal>
      )}

      {addingTo && (
        <FoodPicker foods={foods} setFoods={setFoods} onPick={(food,qty)=>addFoodToMeal(addingTo, food, qty)} onClose={()=>setAddingTo(null)}/>
      )}
    </div>
  );
}

function FoodPicker({ foods, setFoods, onPick, onClose }){
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState(null);
  const [qty, setQty] = useState(100);
  const [showCustom, setShowCustom] = useState(false);
  const [editingFood, setEditingFood] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const filtered = foods.filter(f=> f.name.toLowerCase().includes(q.toLowerCase())).slice(0,40);

  function selectFood(f){ setSelected(f); setQty(f.per); }

  function saveEditedFood(updated){
    setFoods(prev=>prev.map(f=>f.id===updated.id?updated:f));
    setEditingFood(null);
  }
  function requestDeleteFood(id){
    if(confirmDeleteId===id){
      setFoods(prev=>prev.filter(f=>f.id!==id));
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(id);
    }
  }

  return (
    <Modal title="Adicionar alimento" onClose={onClose}>
      {!selected ? (
        <>
          <div className="field" style={{position:"relative"}}>
            <Search size={15} style={{position:"absolute",left:12,top:12,color:"var(--text-faint)"}}/>
            <input className="input" style={{paddingLeft:34}} autoFocus placeholder="Buscar alimento (ex: arroz, frango...)"
              value={q} onChange={e=>setQ(e.target.value)}/>
          </div>
          <div style={{maxHeight:320,overflowY:"auto"}}>
            {filtered.map(f=>(
              <div className="food-search-item" key={f.id} onClick={()=>selectFood(f)}>
                <div>
                  <div style={{fontSize:13.5,fontWeight:600}}>{f.name} {f.custom && <span className="badge badge-blue" style={{marginLeft:6}}>custom</span>}</div>
                  <div style={{fontSize:11.5,color:"var(--text-faint)"}}>{f.kcal} kcal / {f.per}{f.unit==="g"||f.unit==="ml"?f.unit:` ${f.unit}`}</div>
                </div>
                {f.custom ? (
                  <div style={{display:"flex",gap:2,alignItems:"center"}} onClick={e=>e.stopPropagation()}>
                    <button className="iconbtn" onClick={()=>setEditingFood(f)}><Edit3 size={14}/></button>
                    {confirmDeleteId===f.id ? (
                      <button className="btn btn-sm btn-danger" onClick={()=>requestDeleteFood(f.id)}>Excluir?</button>
                    ) : (
                      <button className="iconbtn" onClick={()=>requestDeleteFood(f.id)}><Trash2 size={14}/></button>
                    )}
                  </div>
                ) : (
                  <ChevronRight size={15} color="var(--text-faint)"/>
                )}
              </div>
            ))}
            {!filtered.length && <div className="empty">Nenhum alimento encontrado</div>}
          </div>
          <button className="btn btn-ghost btn-sm" style={{marginTop:10}} onClick={()=>setShowCustom(true)}><Plus size={13}/> Criar alimento personalizado</button>
          {showCustom && <CustomFoodForm onSave={(f)=>{setFoods(prev=>[...prev,f]); setShowCustom(false); selectFood(f);}} onClose={()=>setShowCustom(false)}/>}
          {editingFood && <CustomFoodForm initial={editingFood} onSave={saveEditedFood} onClose={()=>setEditingFood(null)}/>}
        </>
      ) : (
        <div>
          <div style={{fontSize:15,fontWeight:700,marginBottom:4}}>{selected.name}</div>
          <div style={{fontSize:12,color:"var(--text-faint)",marginBottom:16}}>Base: {selected.per} {selected.unit}</div>
          <div className="field">
            <label className="flabel">Quantidade ({selected.unit})</label>
            <input className="input" type="number" value={qty} onChange={e=>setQty(Number(e.target.value))} autoFocus/>
          </div>
          <div className="card" style={{background:"var(--bg-elev)",marginBottom:16}}>
            {(()=>{ const factor=qty/selected.per; return (
              <div style={{display:"flex",justifyContent:"space-between",fontSize:13}}>
                <span>{Math.round(selected.kcal*factor)} kcal</span>
                <span>P {fmt1(selected.protein*factor)}g</span>
                <span>C {fmt1(selected.carb*factor)}g</span>
                <span>G {fmt1(selected.fat*factor)}g</span>
              </div>
            );})()}
          </div>
          <div style={{display:"flex",gap:10}}>
            <button className="btn btn-ghost" style={{flex:1,justifyContent:"center"}} onClick={()=>setSelected(null)}>Voltar</button>
            <button className="btn btn-primary" style={{flex:2,justifyContent:"center"}} onClick={()=>onPick(selected,qty)}>Adicionar</button>
          </div>
        </div>
      )}
    </Modal>
  );
}

function CustomFoodForm({ onSave, onClose, initial }){
  const [f, setF] = useState(initial || {name:"",brand:"",per:100,unit:"g",kcal:0,protein:0,carb:0,fat:0,fiber:0,sodium:0});
  const isEditing = !!initial;
  return (
    <Modal title={isEditing ? "Editar alimento" : "Alimento personalizado"} onClose={onClose}>
      <div className="field"><label className="flabel">Nome</label><input className="input" value={f.name} onChange={e=>setF({...f,name:e.target.value})}/></div>
      <div className="grid grid-2" style={{marginBottom:14}}>
        <div><label className="flabel">Base</label><input className="input" type="number" value={f.per} onChange={e=>setF({...f,per:Number(e.target.value)})}/></div>
        <div><label className="flabel">Unidade</label>
          <select className="input" value={f.unit} onChange={e=>setF({...f,unit:e.target.value})}>
            <option value="g">g</option><option value="ml">ml</option><option value="unidade">unidade</option><option value="colher">colher</option>
          </select>
        </div>
      </div>
      <div className="grid grid-2">
        <div className="field"><label className="flabel">Calorias</label><input className="input" type="number" value={f.kcal} onChange={e=>setF({...f,kcal:Number(e.target.value)})}/></div>
        <div className="field"><label className="flabel">Proteína (g)</label><input className="input" type="number" value={f.protein} onChange={e=>setF({...f,protein:Number(e.target.value)})}/></div>
        <div className="field"><label className="flabel">Carboidrato (g)</label><input className="input" type="number" value={f.carb} onChange={e=>setF({...f,carb:Number(e.target.value)})}/></div>
        <div className="field"><label className="flabel">Gordura (g)</label><input className="input" type="number" value={f.fat} onChange={e=>setF({...f,fat:Number(e.target.value)})}/></div>
      </div>
      <button className="btn btn-primary" style={{width:"100%",justifyContent:"center"}}
        onClick={()=> f.name.trim() && onSave(isEditing ? f : {...f, id:"custom-"+uid(), custom:true})}>
        {isEditing ? "Salvar alterações" : "Salvar alimento"}
      </button>
    </Modal>
  );
}

/* ============================================================
   WATER TAB
============================================================ */
function WaterTab({ water, setWater, today, todayWater, todayWaterEntries, profile }){
  const [custom, setCustom] = useState(250);
  const [editingId, setEditingId] = useState(null);
  const [editVal, setEditVal] = useState(0);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  function add(ml){
    if(!ml) return;
    setWater(prev=> ({...prev, [today]: [...(prev[today]||[]), { id:uid(), ml, ts:Date.now() }]}));
  }
  function removeEntry(id){
    if(confirmDeleteId===id){
      setWater(prev=> ({...prev, [today]: (prev[today]||[]).filter(e=>e.id!==id)}));
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(id);
    }
  }
  function startEdit(entry){ setEditingId(entry.id); setEditVal(entry.ml); }
  function saveEdit(id){
    setWater(prev=> ({...prev, [today]: (prev[today]||[]).map(e=> e.id===id ? {...e, ml:Number(editVal)} : e)}));
    setEditingId(null);
  }
  function clearDay(){
    setWater(prev=>({...prev,[today]:[]}));
  }

  const glasses = Math.round((profile.waterTarget*1000)/250);
  const filled = Math.round((todayWater*1000)/250);
  const pct = Math.min(100, Math.round((todayWater/profile.waterTarget)*100));
  const sortedEntries = [...todayWaterEntries].sort((a,b)=> (b.ts||0)-(a.ts||0));

  return (
    <div>
      <div className="section-head"><h2>Água</h2></div>
      <div className="grid" style={{gridTemplateColumns:"1fr 1fr"}}>
        <div className="card">
          <div className="card-title">Progresso de hoje</div>
          <div style={{textAlign:"center",padding:"10px 0 4px"}}>
            <Droplets size={38} color="var(--amber)"/>
            <div style={{fontFamily:"Space Grotesk",fontSize:38,fontWeight:700,marginTop:8}}>{fmt1(todayWater)} L</div>
            <div style={{color:"var(--text-dim)",fontSize:13}}>de {profile.waterTarget} L · restam {Math.max(0,fmt1(profile.waterTarget-todayWater))} L</div>
          </div>
          <div className="pbar-track" style={{height:12,marginTop:14}}>
            <div className="pbar-fill" style={{width:pct+"%", background:"var(--amber)"}}/>
          </div>
          <div style={{display:"flex",gap:8,marginTop:18,flexWrap:"wrap"}}>
            <button className="btn btn-amber" onClick={()=>add(200)}><Plus size={13}/> 200 ml</button>
            <button className="btn btn-amber" onClick={()=>add(300)}><Plus size={13}/> 300 ml</button>
            <button className="btn btn-amber" onClick={()=>add(500)}><Plus size={13}/> 500 ml</button>
            <button className="btn btn-amber" onClick={()=>add(1000)}><Plus size={13}/> 1 L</button>
            <button className="btn btn-danger" onClick={clearDay}><Trash2 size={13}/> Zerar dia</button>
          </div>
          <div style={{display:"flex",gap:8,marginTop:12,alignItems:"center"}}>
            <input className="input" type="number" value={custom} onChange={e=>setCustom(Number(e.target.value))} style={{width:110}}/>
            <span style={{fontSize:12.5,color:"var(--text-dim)"}}>ml</span>
            <button className="btn btn-primary" onClick={()=>add(custom)}>Adicionar</button>
          </div>
        </div>
        <div className="card">
          <div className="card-title">Copos consumidos ({filled}/{glasses})</div>
          <div className="water-glass-grid">
            {Array.from({length:glasses}).map((_,i)=>(
              <div key={i} className={"water-glass"+(i<filled?" filled":"")}/>
            ))}
          </div>
          <div style={{marginTop:16,fontSize:12.5,color:"var(--text-faint)"}}>Cada copo representa 250 ml. Meta diária definida em {profile.waterTarget} L no seu perfil.</div>
        </div>
      </div>

      <div className="card" style={{marginTop:16}}>
        <div className="card-title">Registros de hoje <span className="badge badge-muted">{sortedEntries.length} lançamentos</span></div>
        {!sortedEntries.length && <div className="empty">Nenhum registro de água hoje ainda</div>}
        {sortedEntries.map(entry=>(
          <div className="list-row" key={entry.id}>
            <Droplets size={15} color="var(--text-faint)"/>
            {editingId === entry.id ? (
              <>
                <input className="input" type="number" value={editVal} autoFocus style={{width:100}}
                  onChange={e=>setEditVal(e.target.value)} onKeyDown={e=>e.key==="Enter"&&saveEdit(entry.id)}/>
                <span style={{fontSize:12.5,color:"var(--text-faint)"}}>ml</span>
                <button className="btn btn-sm btn-primary" style={{marginLeft:"auto"}} onClick={()=>saveEdit(entry.id)}>Salvar</button>
                <button className="btn btn-sm btn-ghost" onClick={()=>setEditingId(null)}>Cancelar</button>
              </>
            ) : (
              <>
                <span style={{flex:1,fontSize:13.5}}>{entry.ml} ml</span>
                <span style={{fontSize:11.5,color:"var(--text-faint)"}}>{entry.ts ? new Date(entry.ts).toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"}) : ""}</span>
                <button className="iconbtn" onClick={()=>startEdit(entry)}><Edit3 size={14}/></button>
                {confirmDeleteId===entry.id ? (
                  <button className="btn btn-sm btn-danger" onClick={()=>removeEntry(entry.id)}>Confirmar?</button>
                ) : (
                  <button className="iconbtn" onClick={()=>removeEntry(entry.id)}><Trash2 size={14}/></button>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   WORKOUT TAB
============================================================ */
const WEEKDAYS = [
  { dow:1, label:"Segunda" }, { dow:2, label:"Terça" }, { dow:3, label:"Quarta" },
  { dow:4, label:"Quinta" }, { dow:5, label:"Sexta" }, { dow:6, label:"Sábado" }, { dow:0, label:"Domingo" },
];

function WeeklyScheduleCard({ fichas, schedule, setSchedule }){
  const allTreinos = fichas.flatMap(f => f.treinos.map(t => ({ id:t.id, label:`${t.name} · ${f.name}` })));
  const todayDow = new Date().getDay();

  function setDay(dow, value){
    setSchedule(prev => ({ ...prev, [dow]: value || undefined }));
  }

  return (
    <div className="card" style={{marginBottom:18}}>
      <div className="card-title">Agenda semanal <span className="badge badge-muted">define o "Treino de hoje" no Dashboard</span></div>
      {!allTreinos.length ? (
        <div className="empty">Crie treinos numa ficha pra poder escalar eles na semana.</div>
      ) : (
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {WEEKDAYS.map(d=>(
            <div key={d.dow} style={{display:"flex",alignItems:"center",gap:12}}>
              <span style={{width:80,fontSize:12.5,fontWeight:600,color: d.dow===todayDow ? "var(--accent)" : "var(--text-dim)"}}>
                {d.label}{d.dow===todayDow ? " (hoje)" : ""}
              </span>
              <select className="input" style={{flex:1}} value={schedule[d.dow] || ""} onChange={e=>setDay(d.dow, e.target.value)}>
                <option value="">— Não definido —</option>
                <option value="rest">Descanso</option>
                {allTreinos.map(t=>(
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function WorkoutTab({ fichas, setFichas, history, setHistory, activeSession, setActiveSession, restTimer, setRestTimer, profile, schedule, setSchedule, celebrate }){
  const [activeFichaId, setActiveFichaId] = useState(fichas[0]?.id);
  const [showNewFicha, setShowNewFicha] = useState(false);
  const [showNewTreino, setShowNewTreino] = useState(false);
  const [editingTreino, setEditingTreino] = useState(null); // treino object for exercise editing
  const [showNewExercise, setShowNewExercise] = useState(false);

  const ficha = fichas.find(f=>f.id===activeFichaId) || fichas[0];

  function addFicha(name){
    const nf = {id:uid(), name, treinos:[]};
    setFichas(prev=>[...prev, nf]);
    setActiveFichaId(nf.id);
    setShowNewFicha(false);
  }
  function deleteFicha(id){
    setFichas(prev=>prev.filter(f=>f.id!==id));
    if(activeFichaId===id) setActiveFichaId(fichas[0]?.id);
  }
  function addTreino(name){
    setFichas(prev=>prev.map(f=>f.id!==ficha.id?f:{...f,treinos:[...f.treinos,{id:uid(),name,exercises:[]}]}));
    setShowNewTreino(false);
  }
  function deleteTreino(treinoId){
    setFichas(prev=>prev.map(f=>f.id!==ficha.id?f:{...f,treinos:f.treinos.filter(t=>t.id!==treinoId)}));
  }
  function addExercise(treinoId, ex){
    setFichas(prev=>prev.map(f=>f.id!==ficha.id?f:{...f,treinos:f.treinos.map(t=>t.id!==treinoId?t:{...t,exercises:[...t.exercises,{...ex,id:uid()}]})}));
    setShowNewExercise(false);
  }
  function deleteExercise(treinoId, exId){
    setFichas(prev=>prev.map(f=>f.id!==ficha.id?f:{...f,treinos:f.treinos.map(t=>t.id!==treinoId?t:{...t,exercises:t.exercises.filter(e=>e.id!==exId)})}));
  }

  function startSession(treino){
    setActiveSession({
      treino, ficha, startedAt: Date.now(),
      log: treino.exercises.map(ex=>({exId:ex.id, exName:ex.name, sets: Array.from({length:ex.sets}).map(()=>({weight:ex.load, reps:0, done:false}))}))
    });
  }

  if(activeSession){
    return <WorkoutSession session={activeSession} setSession={setActiveSession} history={history} setHistory={setHistory}
      restTimer={restTimer} setRestTimer={setRestTimer} celebrate={celebrate}/>;
  }

  if(!ficha){
    return (
      <div>
        <div className="section-head"><h2>Treino</h2><button className="btn btn-primary" onClick={()=>setShowNewFicha(true)}><Plus size={15}/> Nova ficha</button></div>
        <div className="empty">Crie sua primeira ficha de treino para começar.</div>
        {showNewFicha && <PromptModal title="Nova ficha" placeholder="Ex: Hipertrofia, Cutting..." onSave={addFicha} onClose={()=>setShowNewFicha(false)}/>}
      </div>
    );
  }

  return (
    <div>
      <div className="section-head">
        <h2>Treino</h2>
        <div style={{display:"flex",gap:8}}>
          <button className="btn btn-ghost btn-sm" onClick={()=>setShowNewTreino(true)}><Plus size={13}/> Novo treino</button>
          <button className="btn btn-primary btn-sm" onClick={()=>setShowNewFicha(true)}><Plus size={13}/> Nova ficha</button>
        </div>
      </div>

      <div className="tabs" style={{marginBottom:18}}>
        {fichas.map(f=>(
          <button key={f.id} className={"tab-btn"+(f.id===ficha.id?" active":"")} onClick={()=>setActiveFichaId(f.id)}>{f.name}</button>
        ))}
      </div>

      <WeeklyScheduleCard fichas={fichas} schedule={schedule} setSchedule={setSchedule}/>

      <div className="grid grid-2">
        {ficha.treinos.map(treino=>{
          const last = [...history].filter(h=>h.treinoName===treino.name).sort((a,b)=>b.date.localeCompare(a.date))[0];
          return (
            <div className="card" key={treino.id}>
              <div className="card-title">
                <span style={{color:"var(--text)",fontSize:14.5}}>{treino.name}</span>
                <button className="iconbtn" onClick={()=>deleteTreino(treino.id)}><Trash2 size={14}/></button>
              </div>
              {treino.exercises.map(ex=>(
                <div className="list-row" key={ex.id}>
                  <span className="badge badge-muted" style={{minWidth:70,textAlign:"center"}}>{ex.group}</span>
                  <span style={{flex:1,fontSize:13}}>{ex.name}</span>
                  <span style={{fontSize:12,color:"var(--text-dim)"}}>{ex.sets}x{ex.reps}{ex.load ? ` · ${ex.load}kg` : ""}</span>
                  <button className="iconbtn" onClick={()=>deleteExercise(treino.id, ex.id)}><X size={13}/></button>
                </div>
              ))}
              {!treino.exercises.length && <div className="empty" style={{padding:"12px 0"}}>Sem exercícios</div>}
              <div style={{display:"flex",gap:8,marginTop:10}}>
                <button className="btn btn-sm btn-ghost" onClick={()=>{setEditingTreino(treino); setShowNewExercise(true);}}><Plus size={13}/> Exercício</button>
                <button className="btn btn-sm btn-primary" style={{marginLeft:"auto"}} disabled={!treino.exercises.length} onClick={()=>startSession(treino)}><Play size={13}/> Iniciar treino</button>
              </div>
              {last && <div style={{fontSize:11,color:"var(--text-faint)",marginTop:8}}>Último: {new Date(last.date+"T12:00").toLocaleDateString("pt-BR")} · {Math.round(last.volume)}kg volume</div>}
            </div>
          );
        })}
        {!ficha.treinos.length && <div className="empty">Nenhum treino nesta ficha ainda.</div>}
      </div>

      <WorkoutHistoryCard history={history} setHistory={setHistory} />

      {showNewFicha && <PromptModal title="Nova ficha" placeholder="Ex: Hipertrofia, Cutting..." onSave={addFicha} onClose={()=>setShowNewFicha(false)}/>}
      {showNewTreino && <PromptModal title="Novo treino" placeholder="Ex: Treino D — Ombro" onSave={addTreino} onClose={()=>setShowNewTreino(false)}/>}
      {showNewExercise && editingTreino && (
        <ExerciseForm onSave={(ex)=>addExercise(editingTreino.id, ex)} onClose={()=>{setShowNewExercise(false);setEditingTreino(null);}}/>
      )}
    </div>
  );
}

function WorkoutHistoryCard({ history, setHistory }){
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [editing, setEditing] = useState(null); // session entry
  const sorted = [...history].sort((a,b)=> b.date.localeCompare(a.date) || b.id.localeCompare(a.id));

  function requestDelete(id){
    if(confirmDeleteId===id){
      setHistory(prev=>prev.filter(h=>h.id!==id));
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(id);
    }
  }
  function saveEdit(updated){
    setHistory(prev=>prev.map(h=>h.id===updated.id?updated:h));
    setEditing(null);
  }

  return (
    <div className="card" style={{marginTop:18}}>
      <div className="card-title">Histórico de treinos <span className="badge badge-muted">{history.length} sessões</span></div>
      {!sorted.length && <div className="empty">Nenhum treino registrado ainda</div>}
      {sorted.map(h=>(
        <div className="list-row" key={h.id} style={{alignItems:"flex-start"}}>
          <Dumbbell size={15} color="var(--text-faint)" style={{marginTop:3}}/>
          <div style={{flex:1}}>
            <div style={{fontSize:13.5,fontWeight:600}}>{h.treinoName}</div>
            <div style={{fontSize:11.5,color:"var(--text-faint)"}}>{new Date(h.date+"T12:00").toLocaleDateString("pt-BR")} · {h.duration} min · {Math.round(h.volume)}kg volume</div>
            <div style={{fontSize:11,color:"var(--text-faint)",marginTop:4}}>
              {h.exercises.map(e=>`${e.name}: ${e.sets.map(s=>`${s.weight}kg×${s.reps}`).join(", ")}`).join(" · ")}
            </div>
          </div>
          <button className="iconbtn" onClick={()=>setEditing(h)}><Edit3 size={14}/></button>
          {confirmDeleteId===h.id ? (
            <button className="btn btn-sm btn-danger" onClick={()=>requestDelete(h.id)}>Confirmar?</button>
          ) : (
            <button className="iconbtn" onClick={()=>requestDelete(h.id)}><Trash2 size={14}/></button>
          )}
        </div>
      ))}
      {editing && <EditSessionModal session={editing} onSave={saveEdit} onClose={()=>setEditing(null)}/>}
    </div>
  );
}

function EditSessionModal({ session, onSave, onClose }){
  const [duration, setDuration] = useState(session.duration);
  const [exercises, setExercises] = useState(()=> session.exercises.map(e=>({...e, sets:e.sets.map(s=>({...s}))})));

  function updateSet(exIdx, setIdx, field, val){
    setExercises(prev=> prev.map((e,i)=> i!==exIdx? e : {...e, sets: e.sets.map((s,j)=> j!==setIdx? s : {...s,[field]:val})}));
  }
  function removeSet(exIdx, setIdx){
    setExercises(prev=> prev.map((e,i)=> i!==exIdx? e : {...e, sets: e.sets.filter((_,j)=>j!==setIdx)}));
  }

  function save(){
    const volume = exercises.reduce((sum,e)=> sum + e.sets.reduce((s2,st)=> s2 + (Number(st.weight)||0)*(Number(st.reps)||0), 0), 0);
    onSave({ ...session, duration:Number(duration), volume, exercises });
  }

  return (
    <Modal title={`Editar sessão · ${session.treinoName}`} onClose={onClose} wide>
      <div className="field">
        <label className="flabel">Duração (min)</label>
        <input className="input" type="number" value={duration} onChange={e=>setDuration(e.target.value)} style={{width:120}}/>
      </div>
      {exercises.map((e, exIdx)=>(
        <div key={exIdx} style={{marginBottom:14}}>
          <div style={{fontSize:13,fontWeight:700,marginBottom:6}}>{e.name}</div>
          <div className="set-row" style={{color:"var(--text-faint)",fontSize:11,gridTemplateColumns:"28px 1fr 1fr 32px"}}>
            <span></span><span>Peso (kg)</span><span>Reps</span><span></span>
          </div>
          {e.sets.map((s, setIdx)=>(
            <div className="set-row" key={setIdx} style={{gridTemplateColumns:"28px 1fr 1fr 32px"}}>
              <span className="set-num">{setIdx+1}</span>
              <input className="input" type="number" value={s.weight} onChange={ev=>updateSet(exIdx,setIdx,"weight",Number(ev.target.value))}/>
              <input className="input" type="number" value={s.reps} onChange={ev=>updateSet(exIdx,setIdx,"reps",Number(ev.target.value))}/>
              <button className="iconbtn" onClick={()=>removeSet(exIdx,setIdx)}><X size={14}/></button>
            </div>
          ))}
          {!e.sets.length && <div style={{fontSize:11.5,color:"var(--text-faint)"}}>Sem séries registradas</div>}
        </div>
      ))}
      <button className="btn btn-primary" style={{width:"100%",justifyContent:"center"}} onClick={save}>Salvar alterações</button>
    </Modal>
  );
}

function PromptModal({ title, placeholder, onSave, onClose }){
  const [val, setVal] = useState("");
  return (
    <Modal title={title} onClose={onClose}>
      <div className="field"><input className="input" autoFocus placeholder={placeholder} value={val} onChange={e=>setVal(e.target.value)} onKeyDown={e=>e.key==="Enter"&&val.trim()&&onSave(val.trim())}/></div>
      <button className="btn btn-primary" style={{width:"100%",justifyContent:"center"}} onClick={()=>val.trim()&&onSave(val.trim())}>Salvar</button>
    </Modal>
  );
}

function ExerciseForm({ onSave, onClose }){
  const [ex, setEx] = useState({name:"",group:MUSCLE_GROUPS[0],sets:3,reps:"10-12",load:0,rest:60,notes:""});
  return (
    <Modal title="Novo exercício" onClose={onClose}>
      <div className="field"><label className="flabel">Nome do exercício</label><input className="input" value={ex.name} onChange={e=>setEx({...ex,name:e.target.value})} autoFocus/></div>
      <div className="field"><label className="flabel">Grupo muscular</label>
        <select className="input" value={ex.group} onChange={e=>setEx({...ex,group:e.target.value})}>
          {MUSCLE_GROUPS.map(g=><option key={g} value={g}>{g}</option>)}
        </select>
      </div>
      <div className="grid grid-2">
        <div className="field"><label className="flabel">Séries</label><input className="input" type="number" value={ex.sets} onChange={e=>setEx({...ex,sets:Number(e.target.value)})}/></div>
        <div className="field"><label className="flabel">Repetições</label><input className="input" value={ex.reps} onChange={e=>setEx({...ex,reps:e.target.value})}/></div>
        <div className="field"><label className="flabel">Descanso (s)</label><input className="input" type="number" value={ex.rest} onChange={e=>setEx({...ex,rest:Number(e.target.value)})}/></div>
      </div>
      <div className="field"><label className="flabel">Observações</label><textarea className="input" rows={2} value={ex.notes} onChange={e=>setEx({...ex,notes:e.target.value})}/></div>
      <div style={{fontSize:11.5,color:"var(--text-faint)",marginBottom:14}}>A carga é registrada depois, quando você iniciar o treino — é lá que fica anotada a evolução.</div>
      <button className="btn btn-primary" style={{width:"100%",justifyContent:"center"}} onClick={()=>ex.name.trim()&&onSave(ex)}>Adicionar exercício</button>
    </Modal>
  );
}

function WorkoutSession({ session, setSession, history, setHistory, restTimer, setRestTimer, celebrate }){
  const elapsedMin = Math.round((Date.now()-session.startedAt)/60000);

  function toggleSet(exIdx, setIdx){
    setSession(prev=>{
      const log = prev.log.map((l,i)=> i!==exIdx ? l : {...l, sets: l.sets.map((s,j)=> j!==setIdx ? s : {...s, done: !s.done})});
      return {...prev, log};
    });
    const set = session.log[exIdx].sets[setIdx];
    if(!set.done){
      const restSec = session.treino.exercises[exIdx].rest || 60;
      setRestTimer({endTime: Date.now() + restSec*1000, total: restSec});
    }
  }
  function updateSetField(exIdx, setIdx, field, val){
    setSession(prev=>{
      const log = prev.log.map((l,i)=> i!==exIdx ? l : {...l, sets: l.sets.map((s,j)=> j!==setIdx ? s : {...s, [field]: val})});
      return {...prev, log};
    });
  }

  function finish(){
    const volume = session.log.reduce((sum,l)=> sum + l.sets.filter(s=>s.done).reduce((s2,st)=> s2 + st.weight*st.reps, 0), 0);
    const duration = Math.max(1, Math.round((Date.now()-session.startedAt)/60000));
    const entry = {
      id: uid(), date: todayISO(), treinoName: session.treino.name, duration,
      volume, caloriesEst: Math.round(duration*6.2),
      exercises: session.log.map(l=>({name:l.exName, sets:l.sets.filter(s=>s.done).map(s=>({weight:s.weight,reps:s.reps}))}))
    };
    setHistory(prev=>[...prev, entry]);
    setSession(null);
    setRestTimer(null);
    if(celebrate){
      celebrate({
        emoji: "🏆",
        title: "Treino concluído!",
        subtitle: `${session.treino.name} finalizado em ${duration} min, com ${Math.round(volume).toLocaleString("pt-BR")}kg de volume total. Mandou bem!`,
      });
    }
  }

  return (
    <div>
      <div className="section-head">
        <div>
          <h2>{session.treino.name}</h2>
          <div style={{fontSize:12.5,color:"var(--text-dim)",marginTop:4}}>Em andamento · {elapsedMin} min</div>
        </div>
        <div style={{display:"flex",gap:8}}>
          <button className="btn btn-ghost" onClick={()=>{setSession(null);setRestTimer(null);}}>Cancelar</button>
          <button className="btn btn-primary" onClick={finish}><Square size={14}/> Finalizar treino</button>
        </div>
      </div>

      {session.log.map((l, exIdx)=>{
        const exDef = session.treino.exercises[exIdx];
        return (
          <div className="exercise-card" key={l.exId}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
              <div style={{fontWeight:700,fontSize:14.5}}>{l.exName}</div>
              <span className="badge badge-muted">Meta: {exDef.sets}x{exDef.reps}{exDef.load ? ` · ${exDef.load}kg` : ""}</span>
            </div>
            <div className="set-row" style={{color:"var(--text-faint)",fontSize:11}}>
              <span></span><span>Série</span><span>Peso (kg)</span><span>Reps</span><span></span>
            </div>
            {l.sets.map((s, setIdx)=>(
              <div className="set-row" key={setIdx}>
                <span className="set-num">{setIdx+1}</span>
                <input className={"input"+(s.done?" set-done":"")} type="number" value={s.weight} onChange={e=>updateSetField(exIdx,setIdx,"weight",Number(e.target.value))}/>
                <input className={"input"+(s.done?" set-done":"")} type="number" value={s.reps} onChange={e=>updateSetField(exIdx,setIdx,"reps",Number(e.target.value))}/>
                <span></span>
                <button className="iconbtn" style={{background:s.done?"var(--accent-glow)":"none",color:s.done?"var(--accent)":"var(--text-faint)"}} onClick={()=>toggleSet(exIdx,setIdx)}><Check size={16}/></button>
              </div>
            ))}
            {exDef.notes && <div style={{fontSize:11.5,color:"var(--text-faint)",marginTop:6}}>Obs: {exDef.notes}</div>}
          </div>
        );
      })}
    </div>
  );
}

/* ============================================================
   EVOLUTION TAB
============================================================ */
function EvolutionTab({ history, bodyData, diary, water, fichas }){
  const [metric, setMetric] = useState("weight");
  const allExercises = useMemo(()=>{
    const set = new Map();
    fichas.forEach(f=>f.treinos.forEach(t=>t.exercises.forEach(e=>set.set(e.name, e))));
    return Array.from(set.keys());
  },[fichas]);
  const [exName, setExName] = useState(allExercises[0]);

  const weightSeries = bodyData.map(b=>({date:b.date.slice(5), value:b.weight}));
  const bfSeries = bodyData.filter(b=>b.bodyFatJP7!=null).map(b=>({date:b.date.slice(5), value:b.bodyFatJP7}));
  const volumeByWeek = useMemo(()=>{
    const weeks = {};
    history.forEach(h=>{
      const d = new Date(h.date+"T12:00"); const wk = getWeekLabel(d);
      weeks[wk] = (weeks[wk]||0) + h.volume;
    });
    return Object.entries(weeks).sort((a,b)=>a[0]<b[0]?-1:1).slice(-10).map(([wk,v])=>({week:wk, volume:Math.round(v)}));
  },[history]);
  const freqByWeek = useMemo(()=>{
    const weeks = {};
    history.forEach(h=>{
      const d = new Date(h.date+"T12:00"); const wk = getWeekLabel(d);
      weeks[wk] = (weeks[wk]||0) + 1;
    });
    return Object.entries(weeks).sort((a,b)=>a[0]<b[0]?-1:1).slice(-10).map(([wk,v])=>({week:wk, treinos:v}));
  },[history]);

  const exProgress = useMemo(()=>{
    if(!exName) return [];
    const pts = [];
    history.forEach(h=>{
      const found = h.exercises.find(e=>e.name===exName);
      if(found && found.sets.length){
        const top = Math.max(...found.sets.map(s=>s.weight));
        pts.push({date:h.date.slice(5), carga: top});
      }
    });
    return pts;
  },[history, exName]);

  const bestSet = useMemo(()=>{
    let best=null;
    history.forEach(h=>{
      const found = h.exercises.find(e=>e.name===exName);
      found?.sets.forEach(s=>{ if(!best || s.weight>best.weight) best={...s,date:h.date}; });
    });
    return best;
  },[history, exName]);

  const lastSession = useMemo(()=>{
    const found = [...history].filter(h=>h.exercises.some(e=>e.name===exName)).sort((a,b)=>b.date.localeCompare(a.date))[0];
    if(!found) return null;
    return found.exercises.find(e=>e.name===exName);
  },[history, exName]);

  const suggestion = useMemo(()=>{
    if(!lastSession || !lastSession.sets.length) return null;
    const top = lastSession.sets.reduce((a,b)=> b.weight>a.weight?b:a);
    if(top.reps>=10) return { weight: fmt1(top.weight*1.025), reps:"8-10" };
    return { weight: top.weight, reps:`${top.reps+1}-${top.reps+2}` };
  },[lastSession]);

  return (
    <div>
      <div className="section-head"><h2>Evolução</h2></div>

      <div className="grid grid-2" style={{marginBottom:16}}>
        <div className="card">
          <div className="card-title">Peso corporal</div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={weightSeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1c2530" vertical={false}/>
              <XAxis dataKey="date" tick={{fill:"#5c6774",fontSize:11}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:"#5c6774",fontSize:11}} axisLine={false} tickLine={false} width={34} domain={['dataMin-1','dataMax+1']}/>
              <Tooltip contentStyle={{background:"#141b24",border:"1px solid #232c38",borderRadius:10,fontSize:12}}/>
              <Line type="monotone" dataKey="value" stroke="var(--accent)" strokeWidth={2.5} dot={false}/>
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <div className="card-title">Percentual de gordura</div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={bfSeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1c2530" vertical={false}/>
              <XAxis dataKey="date" tick={{fill:"#5c6774",fontSize:11}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:"#5c6774",fontSize:11}} axisLine={false} tickLine={false} width={34}/>
              <Tooltip contentStyle={{background:"#141b24",border:"1px solid #232c38",borderRadius:10,fontSize:12}}/>
              <Line type="monotone" dataKey="value" stroke="var(--blue)" strokeWidth={2.5} dot={false}/>
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-2" style={{marginBottom:16}}>
        <div className="card">
          <div className="card-title">Volume semanal (kg)</div>
          <ResponsiveContainer width="100%" height={190}>
            <BarChart data={volumeByWeek}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1c2530" vertical={false}/>
              <XAxis dataKey="week" tick={{fill:"#5c6774",fontSize:10}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:"#5c6774",fontSize:11}} axisLine={false} tickLine={false} width={40}/>
              <Tooltip contentStyle={{background:"#141b24",border:"1px solid #232c38",borderRadius:10,fontSize:12}}/>
              <Bar dataKey="volume" fill="var(--accent)" radius={[5,5,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <div className="card-title">Frequência semanal (treinos)</div>
          <ResponsiveContainer width="100%" height={190}>
            <BarChart data={freqByWeek}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1c2530" vertical={false}/>
              <XAxis dataKey="week" tick={{fill:"#5c6774",fontSize:10}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:"#5c6774",fontSize:11}} axisLine={false} tickLine={false} width={30}/>
              <Tooltip contentStyle={{background:"#141b24",border:"1px solid #232c38",borderRadius:10,fontSize:12}}/>
              <Bar dataKey="treinos" fill="var(--blue)" radius={[5,5,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <div className="card-title">
          Progressão de carga por exercício
          <select className="input" style={{width:220}} value={exName} onChange={e=>setExName(e.target.value)}>
            {allExercises.map(n=><option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div className="grid grid-4" style={{marginBottom:16}}>
          <div className="stat-card"><span className="stat-label">Último treino</span><span className="stat-value" style={{fontSize:18}}>{lastSession ? `${lastSession.sets[0]?.weight}kg x${lastSession.sets[0]?.reps}` : "—"}</span></div>
          <div className="stat-card"><span className="stat-label">Melhor carga</span><span className="stat-value" style={{fontSize:18}}>{bestSet ? bestSet.weight+"kg" : "—"}</span></div>
          <div className="stat-card"><span className="stat-label">Recorde pessoal</span>{bestSet ? <span className="pr-tag" style={{width:"fit-content"}}><Trophy size={12}/> PR {bestSet.weight}kg</span> : <span className="stat-value" style={{fontSize:18}}>—</span>}</div>
          <div className="stat-card">
            <span className="stat-label">Sugestão para hoje <Sparkles size={11} style={{display:"inline",verticalAlign:"-1px"}}/></span>
            <span className="stat-value" style={{fontSize:18,color:"var(--accent)"}}>{suggestion ? `${suggestion.weight}kg` : "—"}</span>
            {suggestion && <span className="stat-sub">{suggestion.reps} repetições</span>}
          </div>
        </div>
        {exProgress.length>1 ? (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={exProgress}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1c2530" vertical={false}/>
              <XAxis dataKey="date" tick={{fill:"#5c6774",fontSize:11}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:"#5c6774",fontSize:11}} axisLine={false} tickLine={false} width={34}/>
              <Tooltip contentStyle={{background:"#141b24",border:"1px solid #232c38",borderRadius:10,fontSize:12}}/>
              <Line type="monotone" dataKey="carga" stroke="var(--amber)" strokeWidth={2.5} dot={{r:3}}/>
            </LineChart>
          </ResponsiveContainer>
        ) : <div className="empty">Registre mais treinos com este exercício para ver a evolução</div>}
      </div>
    </div>
  );
}
function getWeekLabel(d){
  const onejan = new Date(d.getFullYear(),0,1);
  const week = Math.ceil((((d - onejan) / 86400000) + onejan.getDay()+1)/7);
  return `S${week}`;
}

/* ============================================================
   BODY TAB
============================================================ */
function BodyTab({ bodyData, setBodyData, profile, setProfile, user }){
  const [showForm, setShowForm] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const latest = bodyData[bodyData.length-1];

  function requestDelete(id){
    if(confirmDeleteId === id){
      setBodyData(prev=>prev.filter(x=>x.id!==id));
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(id);
    }
  }

  function addEntry(entry){
    const isFirstEver = bodyData.length === 0;
    setBodyData(prev=>[...prev, {...entry, id:uid(), date:todayISO()}]);
    if(entry.weight){
      setProfile(p=>({
        ...p, weight:entry.weight, height:entry.height||p.height,
        initialWeight: isFirstEver ? entry.weight : p.initialWeight,
      }));
    }
    setShowForm(false);
  }

  return (
    <div>
      <div className="section-head"><h2>Medidas corporais</h2><button className="btn btn-primary" onClick={()=>setShowForm(true)}><Plus size={15}/> Nova medição</button></div>

      {latest && (
        <div className="grid grid-4" style={{marginBottom:18}}>
          <div className="card stat-card"><span className="stat-label">Peso</span><span className="stat-value">{latest.weight} kg</span></div>
          <div className="card stat-card"><span className="stat-label">IMC</span><span className="stat-value">{latest.bmi ?? "—"}</span></div>
          <div className="card stat-card"><span className="stat-label">% Gordura (JP7)</span><span className="stat-value">{latest.bodyFatJP7 != null ? latest.bodyFatJP7+"%" : "—"}</span></div>
          <div className="card stat-card"><span className="stat-label">Massa magra (JP7)</span><span className="stat-value">{latest.leanMassJP7 != null ? latest.leanMassJP7+" kg" : "—"}</span></div>
        </div>
      )}

      <div className="card" style={{marginBottom:18}}>
        <div className="card-title">Histórico</div>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12.5}}>
            <thead><tr style={{color:"var(--text-faint)",textAlign:"left"}}>
              {["Data","Peso","IMC","Cintura","Quadril","% G. (JP7)","% G. (JP3)","Massa magra",""].map(h=><th key={h} style={{padding:"6px 10px",fontWeight:600,whiteSpace:"nowrap"}}>{h}</th>)}
            </tr></thead>
            <tbody>
              {[...bodyData].reverse().slice(0,12).map(b=>(
                <tr key={b.id} style={{borderTop:"1px solid var(--border-soft)"}}>
                  <td style={{padding:"8px 10px"}}>{new Date(b.date+"T12:00").toLocaleDateString("pt-BR")}</td>
                  <td style={{padding:"8px 10px"}}>{b.weight}kg</td>
                  <td style={{padding:"8px 10px"}}>{b.bmi ?? "—"}</td>
                  <td style={{padding:"8px 10px"}}>{b.waist ?? "—"}cm</td>
                  <td style={{padding:"8px 10px"}}>{b.hip ?? "—"}cm</td>
                  <td style={{padding:"8px 10px"}}>{b.bodyFatJP7 != null ? b.bodyFatJP7+"%" : "—"}</td>
                  <td style={{padding:"8px 10px"}}>{b.bodyFatJP3 != null ? b.bodyFatJP3+"%" : "—"}</td>
                  <td style={{padding:"8px 10px"}}>{b.leanMassJP7 != null ? b.leanMassJP7+"kg" : "—"}</td>
                  <td style={{padding:"8px 10px"}}>
                    {confirmDeleteId===b.id ? (
                      <button className="btn btn-sm btn-danger" style={{padding:"4px 9px"}} onClick={()=>requestDelete(b.id)}>Confirmar?</button>
                    ) : (
                      <button className="iconbtn" onClick={()=>requestDelete(b.id)}><Trash2 size={14}/></button>
                    )}
                  </td>
                </tr>
              ))}
              {!bodyData.length && <tr><td colSpan={9} style={{padding:"16px 10px"}}><div className="empty">Nenhuma medição registrada ainda</div></td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <EvolutionPhotos user={user}/>

      {showForm && (
        <Modal title="Nova medição" onClose={()=>setShowForm(false)} wide>
          <BodyForm onSave={addEntry} defaults={latest} profile={profile}/>
        </Modal>
      )}
    </div>
  );
}
function EvolutionPhotos({ user }){
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState([]); // up to 2 photo ids for comparison
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [compareOpen, setCompareOpen] = useState(false);
  const fileInputRef = useRef(null);

  const refresh = useCallback(async ()=>{
    setLoading(true);
    setPhotos(await loadEvolutionPhotos(user.id));
    setLoading(false);
  },[user.id]);

  useEffect(()=>{ refresh(); },[refresh]);

  async function handleFile(e){
    const file = e.target.files?.[0];
    if(!file) return;
    setError(null);
    if(file.size > 8*1024*1024){ setError("Imagem muito grande (máximo 8 MB)."); e.target.value=""; return; }
    setUploading(true);
    try{
      await uploadEvolutionPhoto(file, todayISO(), user.id);
      await refresh();
    }catch(err){
      setError("Não foi possível enviar a foto: " + (err.message || "erro desconhecido"));
    }
    setUploading(false);
    e.target.value = "";
  }

  function toggleSelect(id){
    setSelected(prev=>{
      if(prev.includes(id)) return prev.filter(x=>x!==id);
      if(prev.length>=2) return [prev[1], id];
      return [...prev, id];
    });
  }

  async function requestDelete(photo){
    if(confirmDeleteId === photo.id){
      try{
        await deleteEvolutionPhoto(photo);
        setSelected(prev=>prev.filter(x=>x!==photo.id));
        await refresh();
      }catch(err){
        setError("Não foi possível excluir a foto: " + (err.message || "erro desconhecido"));
      }
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(photo.id);
    }
  }

  const photoA = photos.find(p=>p.id===selected[0]);
  const photoB = photos.find(p=>p.id===selected[1]);

  return (
    <div className="card">
      <div className="card-title">
        Fotos de evolução <Camera size={14}/>
        <div style={{display:"flex",gap:8}}>
          {selected.length===2 && (
            <button className="btn btn-sm btn-primary" onClick={()=>setCompareOpen(true)}>Comparar selecionadas</button>
          )}
          <button className="btn btn-sm btn-ghost" disabled={uploading} onClick={()=>fileInputRef.current?.click()}>
            <Plus size={13}/> {uploading ? "Enviando..." : "Adicionar foto"}
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" style={{display:"none"}} onChange={handleFile}/>
        </div>
      </div>

      {error && <div style={{color:"var(--red)",fontSize:12.5,marginBottom:12}}>{error}</div>}

      {loading ? (
        <div className="empty">Carregando fotos…</div>
      ) : !photos.length ? (
        <div className="empty">Nenhuma foto ainda. Adicione fotos ao longo do tempo pra comparar sua evolução lado a lado.</div>
      ) : (
        <>
          <div style={{fontSize:11.5,color:"var(--text-faint)",marginBottom:10}}>Toque em até 2 fotos pra selecionar e comparar.</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(100px,1fr))",gap:10}}>
            {photos.map(p=>(
              <div key={p.id} style={{position:"relative"}}>
                <div onClick={()=>toggleSelect(p.id)} style={{
                  aspectRatio:"3/4", borderRadius:10, overflow:"hidden", cursor:"pointer",
                  border: selected.includes(p.id) ? "2px solid var(--accent)" : "1px solid var(--border-soft)",
                  background:"var(--bg-elev)"
                }}>
                  {p.url ? <img src={p.url} alt={p.date} style={{width:"100%",height:"100%",objectFit:"cover"}}/> : null}
                </div>
                <div style={{fontSize:10.5,color:"var(--text-faint)",marginTop:4,textAlign:"center"}}>
                  {new Date(p.date+"T12:00").toLocaleDateString("pt-BR")}
                </div>
                {confirmDeleteId===p.id ? (
                  <button className="btn btn-sm btn-danger" style={{position:"absolute",top:4,right:4,padding:"3px 7px",fontSize:10.5}} onClick={()=>requestDelete(p)}>Excluir?</button>
                ) : (
                  <button className="iconbtn" style={{position:"absolute",top:4,right:4,background:"rgba(10,8,7,0.55)"}} onClick={(e)=>{e.stopPropagation();requestDelete(p);}}><Trash2 size={13}/></button>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {compareOpen && photoA && photoB && (
        <Modal title="Comparação de evolução" onClose={()=>setCompareOpen(false)} wide>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            {[photoA, photoB].map(p=>(
              <div key={p.id}>
                <div style={{borderRadius:12,overflow:"hidden",aspectRatio:"3/4",background:"var(--bg-elev)"}}>
                  <img src={p.url} alt={p.date} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                </div>
                <div style={{textAlign:"center",fontSize:12.5,color:"var(--text-dim)",marginTop:8,fontWeight:600}}>
                  {new Date(p.date+"T12:00").toLocaleDateString("pt-BR")}
                </div>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}

function NumField({ label, value, onChange }){
  return (
    <div className="field">
      <label className="flabel">{label}</label>
      <input className="input" type="number" step="0.1" value={value} onChange={e=>onChange(Number(e.target.value))}/>
    </div>
  );
}

function BodyForm({ onSave, defaults, profile }){
  const [vals, setVals] = useState(()=>({
    weight: defaults?.weight ?? profile.weight ?? 0,
    height: defaults?.height ?? profile.height ?? 0,
    waist: defaults?.waist ?? 0, hip: defaults?.hip ?? 0,
    armR: defaults?.armR ?? 0, armL: defaults?.armL ?? 0,
    calfR: defaults?.calfR ?? 0, calfL: defaults?.calfL ?? 0,
    thighR: defaults?.thighR ?? 0, thighL: defaults?.thighL ?? 0,
    sfTricepsR: defaults?.sfTricepsR ?? 0, sfTricepsL: defaults?.sfTricepsL ?? 0,
    sfBicepsR: defaults?.sfBicepsR ?? 0, sfBicepsL: defaults?.sfBicepsL ?? 0,
    sfSubscapular: defaults?.sfSubscapular ?? 0, sfSuprailiac: defaults?.sfSuprailiac ?? 0,
    sfAbdominal: defaults?.sfAbdominal ?? 0, sfChest: defaults?.sfChest ?? 0,
    sfMidaxillary: defaults?.sfMidaxillary ?? 0,
    sfThighR: defaults?.sfThighR ?? 0, sfThighL: defaults?.sfThighL ?? 0,
    sfCalfR: defaults?.sfCalfR ?? 0, sfCalfL: defaults?.sfCalfL ?? 0,
  }));

  function set(k,v){ setVals(prev=>({...prev,[k]:v})); }

  const skinfoldsForCalc = {
    triceps: sideAvg(vals.sfTricepsR, vals.sfTricepsL), biceps: sideAvg(vals.sfBicepsR, vals.sfBicepsL),
    subscapular: vals.sfSubscapular, suprailiac: vals.sfSuprailiac, abdominal: vals.sfAbdominal,
    chest: vals.sfChest, midaxillary: vals.sfMidaxillary,
    thigh: sideAvg(vals.sfThighR, vals.sfThighL), calf: sideAvg(vals.sfCalfR, vals.sfCalfL),
  };

  const preview = useMemo(()=>{
    const bmi = calcBMI(vals.weight, vals.height);
    const jp7 = calcJP7(skinfoldsForCalc, profile.age, profile.gender);
    const jp3 = calcJP3(skinfoldsForCalc, profile.age, profile.gender);
    const leanJP7 = jp7 ? calcLeanMass(vals.weight, jp7.pct) : null;
    const leanJP3 = jp3 ? calcLeanMass(vals.weight, jp3.pct) : null;
    return { bmi, jp7, jp3, leanJP7, leanJP3 };
    // eslint-disable-next-line
  },[vals, profile.age, profile.gender]);

  function handleSave(){
    onSave({
      ...vals,
      bmi: preview.bmi || null,
      bodyFatJP7: preview.jp7 ? preview.jp7.pct : null,
      bodyFatJP3: preview.jp3 ? preview.jp3.pct : null,
      leanMassJP7: preview.leanJP7,
      leanMassJP3: preview.leanJP3,
      sfSumJP7: preview.jp7 ? preview.jp7.sum : null,
      sfSumJP3: preview.jp3 ? preview.jp3.sum : null,
    });
  }

  return (
    <div>
      <div style={{fontSize:12,fontWeight:700,color:"var(--accent)",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:10}}>Peso e estatura</div>
      <div className="grid grid-2" style={{marginBottom:18}}>
        <NumField label="Peso corporal (kg)" value={vals.weight} onChange={v=>set('weight',v)}/>
        <NumField label="Altura / estatura (cm)" value={vals.height} onChange={v=>set('height',v)}/>
      </div>

      <div style={{fontSize:12,fontWeight:700,color:"var(--accent)",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:10}}>Circunferências (cm)</div>
      <div className="grid grid-3" style={{marginBottom:18}}>
        <NumField label="Cintura (CC)" value={vals.waist} onChange={v=>set('waist',v)}/>
        <NumField label="Quadril (CQ)" value={vals.hip} onChange={v=>set('hip',v)}/>
        <div/>
        <NumField label="Braço direito (CB)" value={vals.armR} onChange={v=>set('armR',v)}/>
        <NumField label="Braço esquerdo (CB)" value={vals.armL} onChange={v=>set('armL',v)}/>
        <div/>
        <NumField label="Panturrilha direita (CP)" value={vals.calfR} onChange={v=>set('calfR',v)}/>
        <NumField label="Panturrilha esquerda (CP)" value={vals.calfL} onChange={v=>set('calfL',v)}/>
        <div/>
        <NumField label="Coxa direita (CCx)" value={vals.thighR} onChange={v=>set('thighR',v)}/>
        <NumField label="Coxa esquerda (CCx)" value={vals.thighL} onChange={v=>set('thighL',v)}/>
      </div>

      <div style={{fontSize:12,fontWeight:700,color:"var(--accent)",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:10}}>Dobras cutâneas (mm)</div>
      <div className="grid grid-3" style={{marginBottom:18}}>
        <NumField label="Tricipital direita (DCT)" value={vals.sfTricepsR} onChange={v=>set('sfTricepsR',v)}/>
        <NumField label="Tricipital esquerda (DCT)" value={vals.sfTricepsL} onChange={v=>set('sfTricepsL',v)}/>
        <div/>
        <NumField label="Bicipital direita (DCB)" value={vals.sfBicepsR} onChange={v=>set('sfBicepsR',v)}/>
        <NumField label="Bicipital esquerda (DCB)" value={vals.sfBicepsL} onChange={v=>set('sfBicepsL',v)}/>
        <div/>
        <NumField label="Subescapular (DCSE)" value={vals.sfSubscapular} onChange={v=>set('sfSubscapular',v)}/>
        <NumField label="Supra-ilíaca (DCSI)" value={vals.sfSuprailiac} onChange={v=>set('sfSuprailiac',v)}/>
        <NumField label="Abdominal (DCA)" value={vals.sfAbdominal} onChange={v=>set('sfAbdominal',v)}/>
        <NumField label="Peitoral (DCP)" value={vals.sfChest} onChange={v=>set('sfChest',v)}/>
        <NumField label="Axilar média (DCAM)" value={vals.sfMidaxillary} onChange={v=>set('sfMidaxillary',v)}/>
        <div/>
        <NumField label="Coxa direita (DCC)" value={vals.sfThighR} onChange={v=>set('sfThighR',v)}/>
        <NumField label="Coxa esquerda (DCC)" value={vals.sfThighL} onChange={v=>set('sfThighL',v)}/>
        <div/>
        <NumField label="Panturrilha medial direita (DCPM)" value={vals.sfCalfR} onChange={v=>set('sfCalfR',v)}/>
        <NumField label="Panturrilha medial esquerda (DCPM)" value={vals.sfCalfL} onChange={v=>set('sfCalfL',v)}/>
      </div>

      <div style={{fontSize:12,fontWeight:700,color:"var(--accent)",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:10}}>Índices derivados (calculado automaticamente)</div>
      <div className="card" style={{background:"var(--bg-elev)",marginBottom:18}}>
        <div className="grid grid-4">
          <div className="stat-card"><span className="stat-label">IMC</span><span className="stat-value" style={{fontSize:19}}>{preview.bmi || "—"}</span></div>
          <div className="stat-card"><span className="stat-label">% Gordura (JP7)</span><span className="stat-value" style={{fontSize:19}}>{preview.jp7 ? preview.jp7.pct+"%" : "—"}</span></div>
          <div className="stat-card"><span className="stat-label">% Gordura (JP3)</span><span className="stat-value" style={{fontSize:19}}>{preview.jp3 ? preview.jp3.pct+"%" : "—"}</span></div>
          <div className="stat-card"><span className="stat-label">Massa magra (JP7)</span><span className="stat-value" style={{fontSize:19}}>{preview.leanJP7 != null ? preview.leanJP7+"kg" : "—"}</span></div>
        </div>
        {!profile.age && <div style={{fontSize:11.5,color:"var(--amber)",marginTop:10}}>Defina a idade no Perfil pra calcular o % de gordura.</div>}
      </div>

      <button className="btn btn-primary" style={{width:"100%",justifyContent:"center"}} onClick={handleSave}>Salvar medição</button>
    </div>
  );
}

/* ============================================================
   GOALS TAB
============================================================ */
function GoalsTab({ goals, setGoals, bodyData, profile, history }){
  const [showForm, setShowForm] = useState(false);
  const latestWeight = bodyData.length ? bodyData[bodyData.length-1].weight : profile.weight;

  function progressFor(g){
    if(g.type==="weight_loss"){
      const total = Math.abs(g.startVal - g.target);
      const done = Math.abs(g.startVal - latestWeight);
      return Math.min(100, Math.round((done/total)*100));
    }
    if(g.type==="lift"){
      let best=0;
      history.forEach(h=> h.exercises.forEach(e=>{ if(e.name===g.exerciseName) e.sets.forEach(s=>{ if(s.weight>best) best=s.weight; }); }));
      return Math.min(100, Math.round((best/g.target)*100));
    }
    if(g.type==="water") return 100;
    if(g.type==="protein") return 100;
    return 0;
  }
  function currentValFor(g){
    if(g.type==="weight_loss") return latestWeight;
    if(g.type==="lift"){
      let best=0; history.forEach(h=> h.exercises.forEach(e=>{ if(e.name===g.exerciseName) e.sets.forEach(s=>{ if(s.weight>best) best=s.weight; }); })); return best;
    }
    return g.target;
  }

  function addGoal(g){ setGoals(prev=>[...prev, {...g, id:uid()}]); setShowForm(false); }
  function removeGoal(id){ setGoals(prev=>prev.filter(g=>g.id!==id)); }

  return (
    <div>
      <div className="section-head"><h2>Metas</h2><button className="btn btn-primary" onClick={()=>setShowForm(true)}><Plus size={15}/> Nova meta</button></div>
      <div className="grid grid-2">
        {goals.map(g=>{
          const pct = progressFor(g);
          return (
            <div className="card" key={g.id}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                <div style={{display:"flex",gap:10,alignItems:"center"}}>
                  <div style={{width:36,height:36,borderRadius:10,background:"var(--accent-glow)",display:"flex",alignItems:"center",justifyContent:"center"}}><Target size={17} color="var(--accent)"/></div>
                  <div><div style={{fontWeight:700,fontSize:14}}>{g.text}</div><div style={{fontSize:11.5,color:"var(--text-faint)"}}>Meta: {g.target}{g.unit}</div></div>
                </div>
                <button className="iconbtn" onClick={()=>removeGoal(g.id)}><Trash2 size={14}/></button>
              </div>
              <div style={{marginTop:14}}>
                <ProgressBar label="Progresso" value={pct} max={100} unit="%" color={pct>=100?"var(--accent)":"var(--blue)"}/>
              </div>
              {pct>=100 && <div className="badge badge-accent" style={{marginTop:4}}><Award size={11} style={{display:"inline",marginRight:4,verticalAlign:"-1px"}}/>Meta concluída</div>}
            </div>
          );
        })}
        {!goals.length && <div className="empty">Nenhuma meta criada ainda</div>}
      </div>
      {showForm && <GoalForm onSave={addGoal} onClose={()=>setShowForm(false)} latestWeight={latestWeight}/>}
    </div>
  );
}
function GoalForm({ onSave, onClose, latestWeight }){
  const [type, setType] = useState("weight_loss");
  const [text, setText] = useState("");
  const [target, setTarget] = useState(0);
  const [exerciseName, setExerciseName] = useState("");
  function save(){
    if(!text.trim()) return;
    onSave({ text, type, target:Number(target), unit: type==="weight_loss"?"kg":type==="lift"?"kg":type==="water"?"L":"g",
      startVal: latestWeight, exerciseName });
  }
  return (
    <Modal title="Nova meta" onClose={onClose}>
      <div className="field"><label className="flabel">Descrição</label><input className="input" value={text} onChange={e=>setText(e.target.value)} placeholder="Ex: Perder 5kg"/></div>
      <div className="field"><label className="flabel">Tipo</label>
        <select className="input" value={type} onChange={e=>setType(e.target.value)}>
          <option value="weight_loss">Peso corporal</option>
          <option value="lift">Carga em exercício</option>
          <option value="water">Água diária</option>
          <option value="protein">Proteína diária</option>
        </select>
      </div>
      {type==="lift" && <div className="field"><label className="flabel">Exercício</label><input className="input" value={exerciseName} onChange={e=>setExerciseName(e.target.value)} placeholder="Ex: Supino reto barra"/></div>}
      <div className="field"><label className="flabel">Valor alvo</label><input className="input" type="number" value={target} onChange={e=>setTarget(e.target.value)}/></div>
      <button className="btn btn-primary" style={{width:"100%",justifyContent:"center"}} onClick={save}>Criar meta</button>
    </Modal>
  );
}

/* ============================================================
   PROFILE TAB
============================================================ */
function ProfileTab({ profile, setProfile, resetAllData }){
  const [p, setP] = useState(profile);
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetting, setResetting] = useState(false);
  useEffect(()=>setP(profile),[profile]);

  async function handleReset(){
    setResetting(true);
    await resetAllData();
    setResetting(false);
    setConfirmReset(false);
  }

  const tmb = useMemo(()=>{
    // Mifflin-St Jeor
    const base = 10*p.weight + 6.25*p.height - 5*p.age;
    return Math.round(p.gender==="M" ? base+5 : base-161);
  },[p]);
  const get = Math.round(tmb*1.55);

  function save(){ setProfile(p); }
  function applySuggested(){
    setP(prev=>({...prev, caloriesTarget: prev.goal==="Emagrecimento"? get-400 : prev.goal==="Ganho de massa"? get+350 : get,
      proteinTarget: Math.round(prev.weight*2), fatTarget: Math.round(prev.weight*0.9),
      carbTarget: Math.max(80, Math.round(((prev.goal==="Emagrecimento"? get-400 : prev.goal==="Ganho de massa"? get+350 : get) - (Math.round(prev.weight*2)*4) - (Math.round(prev.weight*0.9)*9))/4))
    }));
  }

  return (
    <div>
      <div className="section-head"><h2>Perfil</h2></div>
      <div className="grid" style={{gridTemplateColumns:"1fr 1fr", gap:16}}>
        <div className="card">
          <div className="card-title">Dados pessoais</div>
          <div className="field"><label className="flabel">Nome</label><input className="input" value={p.name} onChange={e=>setP({...p,name:e.target.value})}/></div>
          <div className="grid grid-2">
            <div className="field"><label className="flabel">Altura (cm)</label><input className="input" type="number" value={p.height} onChange={e=>setP({...p,height:Number(e.target.value)})}/></div>
            <div className="field"><label className="flabel">Peso atual (kg)</label><input className="input" type="number" value={p.weight} onChange={e=>setP({...p,weight:Number(e.target.value)})}/></div>
            <div className="field">
              <label className="flabel">Peso inicial (kg)</label>
              <input className="input" type="number" value={p.initialWeight} onChange={e=>setP({...p,initialWeight:Number(e.target.value)})}/>
            </div>
            <div className="field"><label className="flabel">Sexo</label>
              <select className="input" value={p.gender} onChange={e=>setP({...p,gender:e.target.value})}><option value="M">Masculino</option><option value="F">Feminino</option></select>
            </div>
            <div className="field"><label className="flabel">Idade</label><input className="input" type="number" value={p.age} onChange={e=>setP({...p,age:Number(e.target.value)})}/></div>
          </div>
          <div style={{fontSize:11.5,color:"var(--text-faint)",marginTop:-6,marginBottom:14}}>"Peso inicial" é o ponto de partida usado no Dashboard pra calcular quanto você já ganhou ou perdeu.</div>
          <div className="field"><label className="flabel">Objetivo</label>
            <select className="input" value={p.goal} onChange={e=>setP({...p,goal:e.target.value})}>
              <option>Ganho de massa</option><option>Emagrecimento</option><option>Manutenção</option>
            </select>
          </div>
          <div className="field"><label className="flabel">Nível de experiência</label>
            <select className="input" value={p.experience} onChange={e=>setP({...p,experience:e.target.value})}>
              <option>Iniciante</option><option>Intermediário</option><option>Avançado</option>
            </select>
          </div>
        </div>

        <div className="card">
          <div className="card-title">Metas nutricionais e de água</div>
          <div className="grid grid-2">
            <div className="field"><label className="flabel">Calorias alvo</label><input className="input" type="number" value={p.caloriesTarget} onChange={e=>setP({...p,caloriesTarget:Number(e.target.value)})}/></div>
            <div className="field"><label className="flabel">Proteína alvo (g)</label><input className="input" type="number" value={p.proteinTarget} onChange={e=>setP({...p,proteinTarget:Number(e.target.value)})}/></div>
            <div className="field"><label className="flabel">Carboidrato alvo (g)</label><input className="input" type="number" value={p.carbTarget} onChange={e=>setP({...p,carbTarget:Number(e.target.value)})}/></div>
            <div className="field"><label className="flabel">Gordura alvo (g)</label><input className="input" type="number" value={p.fatTarget} onChange={e=>setP({...p,fatTarget:Number(e.target.value)})}/></div>
            <div className="field"><label className="flabel">Meta de água (L)</label><input className="input" type="number" step="0.5" value={p.waterTarget} onChange={e=>setP({...p,waterTarget:Number(e.target.value)})}/></div>
          </div>

          <div className="card" style={{background:"var(--bg-elev)", marginTop:6}}>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:8}}>
              <span style={{color:"var(--text-dim)"}}>TMB (Mifflin-St Jeor)</span><b>{tmb} kcal</b>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:10}}>
              <span style={{color:"var(--text-dim)"}}>GET estimado (atividade moderada)</span><b>{get} kcal</b>
            </div>
            <button className="btn btn-sm btn-ghost" onClick={applySuggested}><Sparkles size={13}/> Aplicar metas sugeridas por IA</button>
          </div>
        </div>
      </div>
      <button className="btn btn-primary" style={{marginTop:18}} onClick={save}>Salvar alterações</button>

      <div className="card" style={{marginTop:24, borderColor:"rgba(255,107,107,0.3)"}}>
        <div className="card-title" style={{color:"var(--red)"}}>Zona de risco</div>
        <div style={{fontSize:12.5,color:"var(--text-dim)",marginBottom:12}}>
          Isso apaga permanentemente todo o histórico: dieta do dia, água, fichas de treino, treinos realizados, medidas corporais e metas. Não pode ser desfeito.
        </div>
        <button className="btn btn-danger" onClick={()=>setConfirmReset(true)}><Trash2 size={14}/> Zerar todos os dados</button>
      </div>

      {confirmReset && (
        <Modal title="Zerar todos os dados?" onClose={()=>!resetting && setConfirmReset(false)}>
          <div style={{fontSize:13.5,color:"var(--text-dim)",marginBottom:18}}>
            Essa ação é irreversível. Todo o seu histórico de treinos, medidas, dieta, água e metas será apagado, e o perfil voltará ao padrão. Tem certeza?
          </div>
          <div style={{display:"flex",gap:10}}>
            <button className="btn btn-ghost" style={{flex:1,justifyContent:"center"}} disabled={resetting} onClick={()=>setConfirmReset(false)}>Cancelar</button>
            <button className="btn btn-danger" style={{flex:1,justifyContent:"center",background:"var(--red)",color:"#2a0a0a"}} disabled={resetting} onClick={handleReset}>
              {resetting ? "Zerando..." : "Sim, zerar tudo"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
