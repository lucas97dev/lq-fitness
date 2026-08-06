import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from "recharts";
import {
  LayoutDashboard, Utensils, Droplets, Dumbbell, TrendingUp, Ruler,
  Target, User, Plus, Minus, Search, X, Flame, Trophy, Check,
  ChevronRight, ChevronLeft, Play, Pause, Square, Trash2, Edit3,
  Star, Copy, Calendar as CalendarIcon, Award, Zap, ChevronDown,
  Camera, ArrowUp, ArrowDown, Sparkles, Menu, ChevronsLeft, LogOut, Users, Download, RefreshCw
} from "lucide-react";
import { supabase } from "../supabaseClient.js";
import { todayISO, daysAgoISO, fmt1, numDisplay, uid, calcBMI, calcJP7, calcJP3, calcLeanMass, sideAvg, wrapText, getWeekLabel } from "../lib/helpers.js";
import { FOOD_DB_SEED, MUSCLE_GROUPS, EXERCISE_LIBRARY, EQUIPMENT_LABELS, NAV, WEEKDAYS } from "../lib/constants.js";
import { loadKey, saveKey, deleteAllUserData, deleteKey, loadDiaryHistory, savePatientData, searchOpenFoodFacts, dbRowToProfile, profileToDbRow, loadProfileFromSupabase, saveProfileToSupabase, PHOTOS_BUCKET, uploadEvolutionPhoto, loadEvolutionPhotos, deleteEvolutionPhoto } from "../lib/api.js";
import { ProgressBar, Ring, VitalRings, Modal, CelebrationModal, ErrorBoundary, PromptModal, NumField } from "../components/UI.jsx";

export function TrainingCalendar({ history }){
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
      <div style={{display:"flex",justifyContent:"center",alignItems:"center",gap:16,marginTop:12,flexWrap:"wrap"}}>
        <div className="cal-legend"><span className="cal-legend-dot"/> dia treinado</div>
        <div style={{fontSize:11.5,color:"var(--text-faint)"}}>
          {trainedCount} {trainedCount===1?"dia treinado":"dias treinados"} em {monthLabel}
        </div>
      </div>
    </div>
  );
}

export function Dashboard({ profile, macroTotals, todayWater, todayMeals, history, bodyData, streak, latestWeight, fichas, schedule, adminNote, onDismissNote }){
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
      {adminNote && adminNote.text && (
        <div className="card" style={{marginBottom:16, borderColor:"rgba(184,134,58,0.4)", background:"var(--accent-glow)"}}>
          <div style={{display:"flex",gap:12,alignItems:"flex-start"}}>
            <div style={{width:34,height:34,borderRadius:10,background:"var(--card)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <Sparkles size={16} color="var(--accent)"/>
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:12,fontWeight:700,color:"var(--accent-dim)",textTransform:"uppercase",letterSpacing:"0.04em",marginBottom:4}}>
                Recado da Elane {adminNote.date ? `· ${new Date(adminNote.date).toLocaleDateString("pt-BR")}` : ""}
              </div>
              <div style={{fontSize:13.5,color:"var(--text)",lineHeight:1.5,whiteSpace:"pre-wrap"}}>{adminNote.text}</div>
            </div>
            <button className="btn btn-sm btn-ghost" style={{flexShrink:0}} onClick={onDismissNote}>Marcar como lido</button>
          </div>
        </div>
      )}

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
                <CartesianGrid strokeDasharray="3 3" stroke="#ece4d2" vertical={false}/>
                <XAxis dataKey="date" tick={{fill:"#a89a84",fontSize:11}} axisLine={false} tickLine={false}/>
                <YAxis domain={['dataMin - 1','dataMax + 1']} tick={{fill:"#a89a84",fontSize:11}} axisLine={false} tickLine={false} width={34}/>
                <Tooltip contentStyle={{background:"#ffffff",border:"1px solid #e4dcc9",borderRadius:10,fontSize:12}}/>
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
