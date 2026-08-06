import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { supabase } from "./supabaseClient.js";
import { CSS } from "./lib/styles.js";
import { FOOD_DB_SEED, MUSCLE_GROUPS, EXERCISE_LIBRARY, EQUIPMENT_LABELS, NAV, WEEKDAYS } from "./lib/constants.js";
import { todayISO, daysAgoISO, fmt1, numDisplay, uid, calcBMI, calcJP7, calcJP3, calcLeanMass, sideAvg, wrapText, getWeekLabel } from "./lib/helpers.js";
import { loadKey, saveKey, deleteAllUserData, deleteKey, loadDiaryHistory, savePatientData, searchOpenFoodFacts, dbRowToProfile, profileToDbRow, loadProfileFromSupabase, saveProfileToSupabase, PHOTOS_BUCKET, uploadEvolutionPhoto, loadEvolutionPhotos, deleteEvolutionPhoto } from "./lib/api.js";
import { ProgressBar, Ring, VitalRings, Modal, CelebrationModal, ErrorBoundary, PromptModal, NumField } from "./components/UI.jsx";
import {
  LayoutDashboard, Utensils, Droplets, Dumbbell, TrendingUp, Ruler,
  Target, User, Plus, Minus, Search, X, Flame, Trophy, Check,
  ChevronRight, ChevronLeft, Play, Pause, Square, Trash2, Edit3,
  Star, Copy, Calendar as CalendarIcon, Award, Zap, ChevronDown,
  Camera, ArrowUp, ArrowDown, Sparkles, Menu, ChevronsLeft, LogOut, Users, Download, RefreshCw
} from "lucide-react";
import { Dashboard } from "./tabs/Dashboard.jsx";
import { DietTab } from "./tabs/Diet.jsx";
import { WaterTab } from "./tabs/Water.jsx";
import { WorkoutTab } from "./tabs/Workout.jsx";
import { EvolutionTab } from "./tabs/Evolution.jsx";
import { BodyTab } from "./tabs/Body.jsx";
import { GoalsTab } from "./tabs/Goals.jsx";
import { AdminTab } from "./tabs/Admin.jsx";
import { ProfileTab } from "./tabs/Profile.jsx";

export default function FitnessApp({ user }){
  const [tab, setTab] = useState("dashboard");
  const [loaded, setLoaded] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
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
  const [adminNote, setAdminNote] = useState(null); // {text, date} — recado deixado pela nutricionista
  const [activeSession, setActiveSession] = useState(null); // {treinoId, ficha, startedAt, log:[{exId,sets:[{weight,reps,done}]}]}
  const [restTimer, setRestTimer] = useState(null); // {endTime, total}
  const [now, setNow] = useState(Date.now());
  const [celebration, setCelebration] = useState(null);
  const waterCelebratedRef = useRef(null); // stores the date string already celebrated, to avoid repeating

  const today = todayISO();

  useEffect(()=>{
    (async ()=>{
      const [f,d,w,fi,h,b,g,sc,dp,an] = await Promise.all([
        loadKey(user.id, "foods-custom", []),
        loadKey(user.id, "diary:"+today, null),
        loadKey(user.id, "water-log", {}),
        loadKey(user.id, "fichas", null),
        loadKey(user.id, "workout-history", null),
        loadKey(user.id, "body-measurements", null),
        loadKey(user.id, "goals", null),
        loadKey(user.id, "schedule", {}),
        loadKey(user.id, "diet-plan", null),
        loadKey(user.id, "admin-note", null),
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
      setAdminNote(an||null);

      const { data: adminRow } = await supabase.from("admins").select("user_id").eq("user_id", user.id).maybeSingle();
      setIsAdmin(!!adminRow);

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
  const todayWaterRaw = water[today];
  const todayWaterEntries = Array.isArray(todayWaterRaw) ? todayWaterRaw : [];
  // legacy accounts had a single liters number per day instead of a list of entries
  const todayWater = Array.isArray(todayWaterRaw)
    ? todayWaterEntries.reduce((s,e)=>s+(e.ml||0),0)/1000
    : (typeof todayWaterRaw === "number" ? todayWaterRaw : 0);

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
        {(isAdmin ? [...NAV, {key:"admin",label:"Pacientes",icon:Users}] : NAV).map(n=>(
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
        <ErrorBoundary key={tab}>
          {tab==="dashboard" && <Dashboard {...{profile, macroTotals, todayWater, todayMeals, history, bodyData, streak, latestWeight, fichas, schedule, adminNote, onDismissNote:()=>{ setAdminNote(null); deleteKey(user.id,"admin-note"); }}} />}
          {tab==="diet" && <DietTab {...{foods, setFoods, diary, setDiary, today, todayMeals, macroTotals, profile, dietPlan, setDietPlan, user}} />}
          {tab==="water" && <WaterTab {...{water, setWater, today, todayWater, todayWaterEntries, profile}} />}
          {tab==="workout" && <WorkoutTab {...{fichas, setFichas, history, setHistory, activeSession, setActiveSession, restTimer, setRestTimer, profile, schedule, setSchedule, celebrate:setCelebration}} />}
          {tab==="evolution" && <EvolutionTab {...{history, bodyData, diary, water, fichas}} />}
          {tab==="body" && <BodyTab {...{bodyData, setBodyData, profile, setProfile, user}} />}
          {tab==="admin" && isAdmin && <AdminTab user={user}/>}
          {tab==="goals" && <GoalsTab {...{goals, setGoals, bodyData, profile, history}} />}
          {tab==="profile" && <ProfileTab {...{profile, setProfile, resetAllData}} />}
        </ErrorBoundary>
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
