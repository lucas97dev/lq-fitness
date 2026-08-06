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

export function EvolutionTab({ history, bodyData, diary, water, fichas }){
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

  const exerciseGroupMap = useMemo(()=>{
    const map = new Map();
    fichas.forEach(f=>f.treinos.forEach(t=>t.exercises.forEach(e=> map.set(e.name, e.group))));
    return map;
  },[fichas]);

  const volumeByMuscle = useMemo(()=>{
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate()-7);
    const groups = {};
    history.filter(h=> new Date(h.date+"T12:00") >= weekAgo).forEach(h=>{
      h.exercises.forEach(e=>{
        const group = exerciseGroupMap.get(e.name) || "Outro";
        groups[group] = (groups[group]||0) + e.sets.length; // séries concluídas
      });
    });
    return Object.entries(groups).map(([group,sets])=>({group, sets})).sort((a,b)=>b.sets-a.sets);
  },[history, exerciseGroupMap]);
  const maxMuscleSets = Math.max(1, ...volumeByMuscle.map(g=>g.sets));

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
              <CartesianGrid strokeDasharray="3 3" stroke="#ece4d2" vertical={false}/>
              <XAxis dataKey="date" tick={{fill:"#a89a84",fontSize:11}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:"#a89a84",fontSize:11}} axisLine={false} tickLine={false} width={34} domain={['dataMin-1','dataMax+1']}/>
              <Tooltip contentStyle={{background:"#ffffff",border:"1px solid #e4dcc9",borderRadius:10,fontSize:12}}/>
              <Line type="monotone" dataKey="value" stroke="var(--accent)" strokeWidth={2.5} dot={false}/>
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <div className="card-title">Percentual de gordura</div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={bfSeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ece4d2" vertical={false}/>
              <XAxis dataKey="date" tick={{fill:"#a89a84",fontSize:11}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:"#a89a84",fontSize:11}} axisLine={false} tickLine={false} width={34}/>
              <Tooltip contentStyle={{background:"#ffffff",border:"1px solid #e4dcc9",borderRadius:10,fontSize:12}}/>
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
              <CartesianGrid strokeDasharray="3 3" stroke="#ece4d2" vertical={false}/>
              <XAxis dataKey="week" tick={{fill:"#a89a84",fontSize:10}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:"#a89a84",fontSize:11}} axisLine={false} tickLine={false} width={40}/>
              <Tooltip contentStyle={{background:"#ffffff",border:"1px solid #e4dcc9",borderRadius:10,fontSize:12}}/>
              <Bar dataKey="volume" fill="var(--accent)" radius={[5,5,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <div className="card-title">Frequência semanal (treinos)</div>
          <ResponsiveContainer width="100%" height={190}>
            <BarChart data={freqByWeek}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ece4d2" vertical={false}/>
              <XAxis dataKey="week" tick={{fill:"#a89a84",fontSize:10}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:"#a89a84",fontSize:11}} axisLine={false} tickLine={false} width={30}/>
              <Tooltip contentStyle={{background:"#ffffff",border:"1px solid #e4dcc9",borderRadius:10,fontSize:12}}/>
              <Bar dataKey="treinos" fill="var(--blue)" radius={[5,5,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card" style={{marginBottom:16}}>
        <div className="card-title">Volume semanal por grupo muscular <span className="badge badge-muted">últimos 7 dias · séries concluídas</span></div>
        {!volumeByMuscle.length ? (
          <div className="empty">Nenhuma série concluída nos últimos 7 dias</div>
        ) : (
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {volumeByMuscle.map(g=>(
              <div key={g.group}>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:12.5,marginBottom:4}}>
                  <span style={{color:"var(--text-dim)"}}>{g.group}</span>
                  <b>{g.sets} {g.sets===1?"série":"séries"}</b>
                </div>
                <div className="pbar-track">
                  <div className="pbar-fill" style={{width:(g.sets/maxMuscleSets*100)+"%", background:"var(--accent)"}}/>
                </div>
              </div>
            ))}
          </div>
        )}
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
              <CartesianGrid strokeDasharray="3 3" stroke="#ece4d2" vertical={false}/>
              <XAxis dataKey="date" tick={{fill:"#a89a84",fontSize:11}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:"#a89a84",fontSize:11}} axisLine={false} tickLine={false} width={34}/>
              <Tooltip contentStyle={{background:"#ffffff",border:"1px solid #e4dcc9",borderRadius:10,fontSize:12}}/>
              <Line type="monotone" dataKey="carga" stroke="var(--amber)" strokeWidth={2.5} dot={{r:3}}/>
            </LineChart>
          </ResponsiveContainer>
        ) : <div className="empty">Registre mais treinos com este exercício para ver a evolução</div>}
      </div>
    </div>
  );
}
