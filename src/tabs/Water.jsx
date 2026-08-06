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

export function WaterBottle({ pct, goal }){
  const W=140, H=250, bodyTop=48, bodyBottom=238, bodyH=bodyBottom-bodyTop;
  const clamped = Math.max(0,Math.min(1,pct));
  const fillH = clamped*bodyH;
  const fillY = bodyBottom-fillH;
  const marks = [0.25,0.5,0.75,1].map(f=>({ y: bodyBottom-f*bodyH, label: fmt1(goal*f)+"L" }));
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={140} height={250}>
      <defs>
        <clipPath id="bottleClip"><rect x="22" y={bodyTop} width={W-44} height={bodyH} rx="24"/></clipPath>
      </defs>
      <rect x={W/2-15} y="4" width="30" height="18" rx="5" fill="var(--border)"/>
      <rect x={W/2-17} y="20" width="34" height="30" fill="var(--bg-elev)" stroke="var(--border)" strokeWidth="2"/>
      <rect x="22" y={bodyTop} width={W-44} height={bodyH} rx="24" fill="var(--bg-elev)" stroke="var(--border)" strokeWidth="2"/>
      <g clipPath="url(#bottleClip)">
        <rect x="22" y={fillY} width={W-44} height={fillH+6} fill="#5cb3e0" opacity="0.85"/>
        <rect x="22" y={fillY} width={W-44} height="5" fill="#8fd0ee"/>
      </g>
      <rect x="22" y={bodyTop} width={W-44} height={bodyH} rx="24" fill="none" stroke="var(--border)" strokeWidth="2"/>
      {marks.map((m,i)=>(
        <g key={i}>
          <line x1="15" y1={m.y} x2="27" y2={m.y} stroke="var(--text-faint)" strokeWidth="1.5"/>
          <text x="10" y={m.y+4} fontSize="9.5" fill="var(--text-faint)" textAnchor="end">{m.label}</text>
        </g>
      ))}
    </svg>
  );
}

export function WaterTab({ water, setWater, today, todayWater, todayWaterEntries, profile }){
  const [custom, setCustom] = useState(250);
  const [editingId, setEditingId] = useState(null);
  const [editVal, setEditVal] = useState(0);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  function add(ml){
    if(!ml) return;
    setWater(prev=> ({...prev, [today]: [...(Array.isArray(prev[today]) ? prev[today] : []), { id:uid(), ml, ts:Date.now() }]}));
  }
  function removeEntry(id){
    if(confirmDeleteId===id){
      setWater(prev=> ({...prev, [today]: (Array.isArray(prev[today]) ? prev[today] : []).filter(e=>e.id!==id)}));
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(id);
    }
  }
  function startEdit(entry){ setEditingId(entry.id); setEditVal(entry.ml); }
  function saveEdit(id){
    setWater(prev=> ({...prev, [today]: (Array.isArray(prev[today]) ? prev[today] : []).map(e=> e.id===id ? {...e, ml:Number(editVal)} : e)}));
    setEditingId(null);
  }
  function clearDay(){
    setWater(prev=>({...prev,[today]:[]}));
  }

  const pct = todayWater/profile.waterTarget;
  const sortedEntries = [...todayWaterEntries].sort((a,b)=> (b.ts||0)-(a.ts||0));

  const dailyTotals = useMemo(()=>{
    const map = {};
    Object.entries(water).forEach(([date, entries])=>{
      if(Array.isArray(entries)){
        map[date] = entries.reduce((s,e)=>s+(e.ml||0),0)/1000;
      } else if(typeof entries === "number"){
        map[date] = entries; // conta antiga: já vinha salvo em litros
      } else {
        map[date] = 0;
      }
    });
    return map;
  },[water]);

  const last7 = useMemo(()=>{
    const days=[];
    for(let i=6;i>=0;i--){
      const iso = daysAgoISO(i);
      const label = new Date(iso+"T12:00").toLocaleDateString("pt-BR",{weekday:"short"}).replace(".","").toUpperCase();
      days.push({ date:iso, label, litros: fmt1(dailyTotals[iso]||0) });
    }
    return days;
  },[dailyTotals]);

  const last30 = useMemo(()=>{
    const days=[];
    for(let i=29;i>=0;i--){
      const iso = daysAgoISO(i);
      days.push({ date: iso.slice(5), litros: fmt1(dailyTotals[iso]||0) });
    }
    return days;
  },[dailyTotals]);

  const avgDaily = last7.length ? fmt1(last7.reduce((s,d)=>s+d.litros,0)/last7.length) : 0;

  const longestStreak = useMemo(()=>{
    let best=0, cur=0;
    for(let i=89;i>=0;i--){
      const iso = daysAgoISO(i);
      const val = dailyTotals[iso]||0;
      if(val >= profile.waterTarget){ cur++; best=Math.max(best,cur); } else cur=0;
    }
    return best;
  },[dailyTotals, profile.waterTarget]);

  return (
    <div>
      <div className="section-head"><h2>Água</h2></div>

      <div className="grid" style={{gridTemplateColumns:"1fr 1fr",alignItems:"stretch"}}>
        <div className="card">
          <div className="card-title">Progresso de hoje</div>
          <div style={{display:"flex",alignItems:"center",gap:20,justifyContent:"center",padding:"8px 0"}}>
            <WaterBottle pct={pct} goal={profile.waterTarget}/>
            <div style={{textAlign:"center"}}>
              <div style={{fontFamily:"Space Grotesk",fontSize:34,fontWeight:700}}>{fmt1(todayWater)} L</div>
              <div style={{color:"var(--text-dim)",fontSize:12.5}}>de {profile.waterTarget} L</div>
              <div style={{fontFamily:"Space Grotesk",fontSize:20,fontWeight:700,color:"var(--amber)",marginTop:10}}>{Math.round(Math.min(1,pct)*100)}%</div>
              <div style={{color:"var(--text-faint)",fontSize:11.5}}>da meta diária</div>
            </div>
          </div>
          <div style={{display:"flex",gap:8,marginTop:16,flexWrap:"wrap",justifyContent:"center"}}>
            <button className="btn btn-amber" onClick={()=>add(250)}><Plus size={13}/> 250 ml</button>
            <button className="btn btn-amber" onClick={()=>add(500)}><Plus size={13}/> 500 ml</button>
            <button className="btn btn-amber" onClick={()=>add(1000)}><Plus size={13}/> 1 L</button>
          </div>
          <div style={{display:"flex",gap:8,marginTop:10,alignItems:"center",justifyContent:"center"}}>
            <input className="input" type="number" value={numDisplay(custom)} onChange={e=>setCustom(Number(e.target.value))} style={{width:100}}/>
            <span style={{fontSize:12.5,color:"var(--text-dim)"}}>ml</span>
            <button className="btn btn-primary btn-sm" onClick={()=>add(custom)}>Adicionar</button>
            <button className="btn btn-danger btn-sm" onClick={clearDay}><Trash2 size={13}/> Zerar dia</button>
          </div>
        </div>

        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          <div className="card">
            <div className="card-title">Resumo</div>
            <div className="grid grid-2">
              <div className="stat-card"><span className="stat-label">Média diária</span><span className="stat-value" style={{fontSize:19}}>{avgDaily}L</span></div>
              <div className="stat-card"><span className="stat-label">Maior sequência</span><span className="stat-value" style={{fontSize:19}}>{longestStreak} {longestStreak===1?"dia":"dias"}</span></div>
            </div>
            <div style={{marginTop:10,fontSize:12,color:"var(--text-faint)"}}>Meta diária: {profile.waterTarget}L</div>
          </div>
          <div className="card" style={{flex:1}}>
            <div className="card-title">Histórico semanal</div>
            <ResponsiveContainer width="100%" height={130}>
              <BarChart data={last7}>
                <XAxis dataKey="label" tick={{fill:"#a89a84",fontSize:10}} axisLine={false} tickLine={false}/>
                <YAxis hide/>
                <Tooltip contentStyle={{background:"#ffffff",border:"1px solid #e4dcc9",borderRadius:10,fontSize:12}} formatter={(v)=>[v+"L","Água"]}/>
                <Bar dataKey="litros" radius={[4,4,0,0]}>
                  {last7.map((d,i)=>(
                    <Cell key={i} fill={d.date===today ? "var(--amber)" : "var(--border)"}/>
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card" style={{marginTop:16}}>
        <div className="card-title">Registros de hoje <span className="badge badge-muted">{sortedEntries.length} lançamentos</span></div>
        {!sortedEntries.length && <div className="empty">Nenhum registro de água hoje ainda</div>}
        <div className="grid grid-2">
          {sortedEntries.map(entry=>(
            <div className="list-row" key={entry.id}>
              <Droplets size={15} color="var(--amber)"/>
              {editingId === entry.id ? (
                <>
                  <input className="input" type="number" value={numDisplay(editVal)} autoFocus style={{width:90}}
                    onChange={e=>setEditVal(e.target.value)} onKeyDown={e=>e.key==="Enter"&&saveEdit(entry.id)}/>
                  <span style={{fontSize:12.5,color:"var(--text-faint)"}}>ml</span>
                  <button className="btn btn-sm btn-primary" style={{marginLeft:"auto"}} onClick={()=>saveEdit(entry.id)}>Salvar</button>
                  <button className="btn btn-sm btn-ghost" onClick={()=>setEditingId(null)}>Cancelar</button>
                </>
              ) : (
                <>
                  <span style={{fontSize:11.5,color:"var(--text-faint)",width:46}}>{entry.ts ? new Date(entry.ts).toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"}) : ""}</span>
                  <span style={{flex:1,fontSize:13.5}}>{entry.ml} ml</span>
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

      <div className="card" style={{marginTop:16}}>
        <div className="card-title">Evolução — últimos 30 dias</div>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={last30}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ece4d2" vertical={false}/>
            <XAxis dataKey="date" tick={{fill:"#a89a84",fontSize:10}} axisLine={false} tickLine={false} interval={4}/>
            <YAxis tick={{fill:"#a89a84",fontSize:11}} axisLine={false} tickLine={false} width={32}/>
            <Tooltip contentStyle={{background:"#ffffff",border:"1px solid #e4dcc9",borderRadius:10,fontSize:12}} formatter={(v)=>[v+"L","Água"]}/>
            <Line type="monotone" dataKey="litros" stroke="var(--amber)" strokeWidth={2.5} dot={{r:2.5}}/>
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* ============================================================
   WORKOUT TAB
============================================================ */
