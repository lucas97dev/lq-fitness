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

export function ProfileTab({ profile, setProfile, resetAllData }){
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
            <div className="field"><label className="flabel">Altura (cm)</label><input className="input" type="number" value={numDisplay(p.height)} onChange={e=>setP({...p,height:Number(e.target.value)})}/></div>
            <div className="field"><label className="flabel">Peso atual (kg)</label><input className="input" type="number" value={numDisplay(p.weight)} onChange={e=>setP({...p,weight:Number(e.target.value)})}/></div>
            <div className="field">
              <label className="flabel">Peso inicial (kg)</label>
              <input className="input" type="number" value={numDisplay(p.initialWeight)} onChange={e=>setP({...p,initialWeight:Number(e.target.value)})}/>
            </div>
            <div className="field"><label className="flabel">Sexo</label>
              <select className="input" value={p.gender} onChange={e=>setP({...p,gender:e.target.value})}><option value="M">Masculino</option><option value="F">Feminino</option></select>
            </div>
            <div className="field"><label className="flabel">Idade</label><input className="input" type="number" value={numDisplay(p.age)} onChange={e=>setP({...p,age:Number(e.target.value)})}/></div>
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
            <div className="field"><label className="flabel">Calorias alvo</label><input className="input" type="number" value={numDisplay(p.caloriesTarget)} onChange={e=>setP({...p,caloriesTarget:Number(e.target.value)})}/></div>
            <div className="field"><label className="flabel">Proteína alvo (g)</label><input className="input" type="number" value={numDisplay(p.proteinTarget)} onChange={e=>setP({...p,proteinTarget:Number(e.target.value)})}/></div>
            <div className="field"><label className="flabel">Carboidrato alvo (g)</label><input className="input" type="number" value={numDisplay(p.carbTarget)} onChange={e=>setP({...p,carbTarget:Number(e.target.value)})}/></div>
            <div className="field"><label className="flabel">Gordura alvo (g)</label><input className="input" type="number" value={numDisplay(p.fatTarget)} onChange={e=>setP({...p,fatTarget:Number(e.target.value)})}/></div>
            <div className="field"><label className="flabel">Meta de água (L)</label><input className="input" type="number" step="0.5" value={numDisplay(p.waterTarget)} onChange={e=>setP({...p,waterTarget:Number(e.target.value)})}/></div>
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
