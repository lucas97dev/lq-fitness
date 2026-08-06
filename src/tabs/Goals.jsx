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

export function GoalsTab({ goals, setGoals, bodyData, profile, history }){
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
export function GoalForm({ onSave, onClose, latestWeight }){
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
      <div className="field"><label className="flabel">Valor alvo</label><input className="input" type="number" value={numDisplay(target)} onChange={e=>setTarget(e.target.value)}/></div>
      <button className="btn btn-primary" style={{width:"100%",justifyContent:"center"}} onClick={save}>Criar meta</button>
    </Modal>
  );
}

/* ============================================================
   PROFILE TAB
============================================================ */
/* ============================================================
   ADMIN PANEL — Elane (and other registered admins) can view every
   patient's evolution and prescribe diet/workout for them.
============================================================ */
