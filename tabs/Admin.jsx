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

import { MealsList } from "./Diet.jsx";
import { ExerciseForm } from "./Workout.jsx";

export function AdminTab({ user }){
  const [patients, setPatients] = useState(null); // null = loading
  const [selected, setSelected] = useState(null);
  const [patientData, setPatientData] = useState(null);
  const [loadingPatient, setLoadingPatient] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(()=>{
    (async ()=>{
      const { data, error } = await supabase.from("profiles").select("*").neq("id", user.id).order("name");
      if(error){ setError(error.message); setPatients([]); return; }
      setPatients(data || []);
    })();
  },[user.id]);

  async function openPatient(p){
    setSelected(p);
    setLoadingPatient(true);
    const [bodyRow, historyRow, dietRow, fichasRow, diaryDays, noteRow, photos] = await Promise.all([
      supabase.from("user_data").select("value").eq("user_id", p.id).eq("key","body-measurements").maybeSingle(),
      supabase.from("user_data").select("value").eq("user_id", p.id).eq("key","workout-history").maybeSingle(),
      supabase.from("user_data").select("value").eq("user_id", p.id).eq("key","diet-plan").maybeSingle(),
      supabase.from("user_data").select("value").eq("user_id", p.id).eq("key","fichas").maybeSingle(),
      loadDiaryHistory(p.id),
      supabase.from("user_data").select("value").eq("user_id", p.id).eq("key","admin-note").maybeSingle(),
      loadEvolutionPhotos(p.id),
    ]);
    setPatientData({
      bodyData: bodyRow.data?.value || [],
      history: historyRow.data?.value || [],
      dietPlan: dietRow.data?.value || [],
      fichas: fichasRow.data?.value || [],
      diaryDays: diaryDays || [],
      adminNote: noteRow.data?.value || null,
      photos: photos || [],
    });
    setLoadingPatient(false);
  }

  function updatePatientField(field, key, updater){
    setPatientData(prev=>{
      const newVal = typeof updater==="function" ? updater(prev[field]) : updater;
      savePatientData(selected.id, key, newVal);
      return {...prev, [field]: newVal};
    });
  }

  if(selected){
    return (
      <div>
        <div className="section-head">
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <button className="iconbtn" onClick={()=>{setSelected(null);setPatientData(null);}}><ChevronLeft size={18}/></button>
            <h2>{selected.name || "Paciente sem nome"}</h2>
          </div>
        </div>
        {loadingPatient || !patientData ? <div className="empty">Carregando dados do paciente…</div> : (
          <AdminPatientDetail
            patient={selected}
            data={patientData}
            setDietPlan={(updater)=>updatePatientField("dietPlan","diet-plan",updater)}
            setFichas={(updater)=>updatePatientField("fichas","fichas",updater)}
            setAdminNote={(updater)=>updatePatientField("adminNote","admin-note",updater)}
          />
        )}
      </div>
    );
  }

  const filtered = (patients||[]).filter(p => (p.name||"").toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="section-head"><h2>Pacientes</h2></div>
      <div className="field" style={{position:"relative",maxWidth:340,marginBottom:18}}>
        <Search size={15} style={{position:"absolute",left:12,top:12,color:"var(--text-faint)"}}/>
        <input className="input" style={{paddingLeft:34}} placeholder="Buscar paciente por nome..." value={search} onChange={e=>setSearch(e.target.value)}/>
      </div>
      {patients === null && <div className="empty">Carregando pacientes…</div>}
      {error && <div style={{color:"var(--red)",fontSize:13,marginBottom:12}}>{error}</div>}
      {patients && !patients.length && <div className="empty">Nenhum paciente cadastrado ainda. Assim que alguém criar conta no app, aparece aqui.</div>}
      {patients && patients.length>0 && !filtered.length && <div className="empty">Nenhum paciente encontrado com esse nome.</div>}
      <div className="grid grid-3">
        {filtered.map(p=>(
          <div className="card" key={p.id} style={{cursor:"pointer"}} onClick={()=>openPatient(p)}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:38,height:38,borderRadius:10,background:"var(--accent-glow)",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--accent)",fontWeight:700,flexShrink:0}}>
                {(p.name||"?").slice(0,1).toUpperCase()}
              </div>
              <div style={{minWidth:0}}>
                <div style={{fontWeight:700,fontSize:14,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name || "Sem nome"}</div>
                <div style={{fontSize:11.5,color:"var(--text-faint)"}}>{p.goal || "Objetivo não definido"}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminPatientDetail({ patient, data, setDietPlan, setFichas, setAdminNote }){
  const [tab, setTab] = useState("evolucao"); // evolucao | dieta | treino | recado
  const { bodyData, history, dietPlan, fichas, diaryDays, adminNote, photos } = data;
  const [foods] = useState(FOOD_DB_SEED);

  const latest = bodyData[bodyData.length-1];
  const weightSeries = bodyData.slice(-12).map(b=>({date:b.date.slice(5), peso:b.weight}));
  const bodyFatSeries = bodyData.filter(b=>b.bodyFatJP7!=null).slice(-12).map(b=>({date:b.date.slice(5), pct:b.bodyFatJP7}));
  const totalVolume = history.reduce((s,h)=>s+h.volume, 0);
  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate()-7);
  const weekWorkouts = history.filter(h=> new Date(h.date+"T12:00") >= weekAgo).length;
  const recentWorkouts = [...history].sort((a,b)=> b.date.localeCompare(a.date)).slice(0,5);

  const volumeByWeek = useMemo(()=>{
    const weeks = {};
    history.forEach(h=>{ const wk = getWeekLabel(new Date(h.date+"T12:00")); weeks[wk]=(weeks[wk]||0)+h.volume; });
    return Object.entries(weeks).sort((a,b)=>a[0]<b[0]?-1:1).slice(-8).map(([wk,v])=>({week:wk, volume:Math.round(v)}));
  },[history]);
  const freqByWeek = useMemo(()=>{
    const weeks = {};
    history.forEach(h=>{ const wk = getWeekLabel(new Date(h.date+"T12:00")); weeks[wk]=(weeks[wk]||0)+1; });
    return Object.entries(weeks).sort((a,b)=>a[0]<b[0]?-1:1).slice(-8).map(([wk,v])=>({week:wk, treinos:v}));
  },[history]);

  const personalRecords = useMemo(()=>{
    const map = new Map(); // name -> best weight/reps/volume
    history.forEach(h=> h.exercises.forEach(e=>{
      e.sets.forEach(s=>{
        const cur = map.get(e.name) || {name:e.name, bestWeight:0, bestReps:0, bestVolume:0};
        if(s.weight>cur.bestWeight) cur.bestWeight = s.weight;
        if(s.reps>cur.bestReps) cur.bestReps = s.reps;
        const vol = s.weight*s.reps;
        if(vol>cur.bestVolume) cur.bestVolume = vol;
        map.set(e.name, cur);
      });
    }));
    return Array.from(map.values()).sort((a,b)=>b.bestWeight-a.bestWeight).slice(0,6);
  },[history]);

  const dietAdherence = useMemo(()=>{
    const last30 = (diaryDays||[]).filter(d=>{
      const diff = (Date.now() - new Date(d.date+"T12:00").getTime())/86400000;
      return diff <= 30;
    });
    const daysWithFood = last30.filter(d => d.meals.some(m=>m.items.length>0)).length;
    return { daysWithFood, totalDays: last30.length };
  },[diaryDays]);

  function mealTotals(items){
    let kcal=0,p=0,c=0,f=0;
    items.forEach(it=>{
      const food = foods.find(x=>x.id===it.foodId); if(!food) return;
      const factor = it.qty/food.per;
      kcal+=food.kcal*factor; p+=food.protein*factor; c+=food.carb*factor; f+=food.fat*factor;
    });
    return {kcal,p,c,f};
  }

  function exportPDF(){
    window.print();
  }

  return (
    <div>
      <div className="tabs no-print" style={{marginBottom:18}}>
        <button className={"tab-btn"+(tab==="evolucao"?" active":"")} onClick={()=>setTab("evolucao")}>Evolução</button>
        <button className={"tab-btn"+(tab==="dieta"?" active":"")} onClick={()=>setTab("dieta")}>Prescrever dieta</button>
        <button className={"tab-btn"+(tab==="treino"?" active":"")} onClick={()=>setTab("treino")}>Prescrever treino</button>
        <button className={"tab-btn"+(tab==="recado"?" active":"")} onClick={()=>setTab("recado")}>Recado</button>
      </div>

      {tab==="evolucao" && (
        <div className="admin-print-report">
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}} className="print-header">
            <div>
              <div style={{fontSize:16,fontWeight:700}}>Relatório de evolução — {patient.name || "Paciente"}</div>
              <div style={{fontSize:11.5,color:"var(--text-faint)"}}>Gerado em {new Date().toLocaleDateString("pt-BR")} · EQ Fitness</div>
            </div>
            <button className="btn btn-sm btn-primary no-print" onClick={exportPDF}><Download size={13}/> Exportar / Imprimir PDF</button>
          </div>

          <div className="grid grid-4" style={{marginBottom:16}}>
            <div className="card stat-card"><span className="stat-label">Peso atual</span><span className="stat-value">{latest ? latest.weight+"kg" : "—"}</span></div>
            <div className="card stat-card"><span className="stat-label">IMC</span><span className="stat-value">{latest?.bmi ?? "—"}</span></div>
            <div className="card stat-card"><span className="stat-label">% Gordura (JP7)</span><span className="stat-value">{latest?.bodyFatJP7 != null ? latest.bodyFatJP7+"%" : "—"}</span></div>
            <div className="card stat-card"><span className="stat-label">Massa magra</span><span className="stat-value">{latest?.leanMassJP7 != null ? latest.leanMassJP7+"kg" : "—"}</span></div>
          </div>
          <div className="grid grid-4" style={{marginBottom:16}}>
            <div className="card stat-card"><span className="stat-label">Treinos (7 dias)</span><span className="stat-value">{weekWorkouts}</span></div>
            <div className="card stat-card"><span className="stat-label">Treinos no total</span><span className="stat-value">{history.length}</span></div>
            <div className="card stat-card"><span className="stat-label">Volume total</span><span className="stat-value">{Math.round(totalVolume).toLocaleString("pt-BR")}kg</span></div>
            <div className="card stat-card">
              <span className="stat-label">Aderência à dieta (30 dias)</span>
              <span className="stat-value">{dietAdherence.totalDays ? Math.round(dietAdherence.daysWithFood/dietAdherence.totalDays*100)+"%" : "—"}</span>
              <span className="stat-sub">{dietAdherence.daysWithFood} de {dietAdherence.totalDays} dias com refeições lançadas</span>
            </div>
          </div>

          <div className="grid grid-2" style={{marginBottom:16}}>
            <div className="card">
              <div className="card-title">Evolução do peso</div>
              {weightSeries.length>1 ? (
                <ResponsiveContainer width="100%" height={190}>
                  <LineChart data={weightSeries}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ece4d2" vertical={false}/>
                    <XAxis dataKey="date" tick={{fill:"#a89a84",fontSize:11}} axisLine={false} tickLine={false}/>
                    <YAxis tick={{fill:"#a89a84",fontSize:11}} axisLine={false} tickLine={false} width={34} domain={['dataMin-1','dataMax+1']}/>
                    <Tooltip contentStyle={{background:"#ffffff",border:"1px solid #e4dcc9",borderRadius:10,fontSize:12}}/>
                    <Line type="monotone" dataKey="peso" stroke="var(--accent)" strokeWidth={2.5} dot={false}/>
                  </LineChart>
                </ResponsiveContainer>
              ) : <div className="empty">Sem medições suficientes ainda</div>}
            </div>
            <div className="card">
              <div className="card-title">Evolução do % de gordura</div>
              {bodyFatSeries.length>1 ? (
                <ResponsiveContainer width="100%" height={190}>
                  <LineChart data={bodyFatSeries}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ece4d2" vertical={false}/>
                    <XAxis dataKey="date" tick={{fill:"#a89a84",fontSize:11}} axisLine={false} tickLine={false}/>
                    <YAxis tick={{fill:"#a89a84",fontSize:11}} axisLine={false} tickLine={false} width={34}/>
                    <Tooltip contentStyle={{background:"#ffffff",border:"1px solid #e4dcc9",borderRadius:10,fontSize:12}}/>
                    <Line type="monotone" dataKey="pct" stroke="var(--amber)" strokeWidth={2.5} dot={false}/>
                  </LineChart>
                </ResponsiveContainer>
              ) : <div className="empty">Sem dados de dobras cutâneas suficientes ainda</div>}
            </div>
          </div>

          <div className="grid grid-2" style={{marginBottom:16}}>
            <div className="card">
              <div className="card-title">Volume por semana (kg)</div>
              {volumeByWeek.length>1 ? (
                <ResponsiveContainer width="100%" height={170}>
                  <BarChart data={volumeByWeek}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ece4d2" vertical={false}/>
                    <XAxis dataKey="week" tick={{fill:"#a89a84",fontSize:10}} axisLine={false} tickLine={false}/>
                    <YAxis tick={{fill:"#a89a84",fontSize:11}} axisLine={false} tickLine={false} width={40}/>
                    <Tooltip contentStyle={{background:"#ffffff",border:"1px solid #e4dcc9",borderRadius:10,fontSize:12}}/>
                    <Bar dataKey="volume" fill="var(--accent)" radius={[5,5,0,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              ) : <div className="empty">Ainda sem dados suficientes</div>}
            </div>
            <div className="card">
              <div className="card-title">Frequência semanal</div>
              {freqByWeek.length>1 ? (
                <ResponsiveContainer width="100%" height={170}>
                  <BarChart data={freqByWeek}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ece4d2" vertical={false}/>
                    <XAxis dataKey="week" tick={{fill:"#a89a84",fontSize:10}} axisLine={false} tickLine={false}/>
                    <YAxis tick={{fill:"#a89a84",fontSize:11}} axisLine={false} tickLine={false} width={30}/>
                    <Tooltip contentStyle={{background:"#ffffff",border:"1px solid #e4dcc9",borderRadius:10,fontSize:12}}/>
                    <Bar dataKey="treinos" fill="var(--blue)" radius={[5,5,0,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              ) : <div className="empty">Ainda sem dados suficientes</div>}
            </div>
          </div>

          <div className="card" style={{marginBottom:16}}>
            <div className="card-title">Recordes pessoais</div>
            {personalRecords.length ? personalRecords.map(pr=>(
              <div className="list-row" key={pr.name}>
                <Trophy size={15} color="var(--amber)"/>
                <span style={{flex:1,fontSize:13.5}}>{pr.name}</span>
                <span style={{fontSize:12,color:"var(--text-dim)"}}>{pr.bestWeight}kg · {pr.bestReps} reps · {Math.round(pr.bestVolume)}kg volume</span>
              </div>
            )) : <div className="empty">Nenhum recorde registrado ainda</div>}
          </div>

          <div className="card" style={{marginBottom:16}}>
            <div className="card-title">Últimos treinos</div>
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

          <div className="card" style={{marginBottom:16}}>
            <div className="card-title">Alimentação recente <span className="badge badge-muted">últimos 7 dias registrados</span></div>
            {(!diaryDays || !diaryDays.length) && <div className="empty">Nenhuma refeição lançada ainda</div>}
            {(diaryDays||[]).slice(0,7).map(day=>{
              const allItems = day.meals.flatMap(m=>m.items);
              const dt = mealTotals(allItems);
              const loggedMeals = day.meals.filter(m=>m.items.length>0);
              return (
                <div key={day.date} style={{marginBottom:10, paddingBottom:10, borderBottom:"1px solid var(--border-soft)"}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                    <span style={{fontSize:13,fontWeight:600}}>{new Date(day.date+"T12:00").toLocaleDateString("pt-BR",{weekday:"short",day:"2-digit",month:"short"})}</span>
                    <span className="badge badge-muted">{Math.round(dt.kcal)} kcal · P{fmt1(dt.p)} C{fmt1(dt.c)} G{fmt1(dt.f)}</span>
                  </div>
                  {!loggedMeals.length && <div style={{fontSize:12,color:"var(--text-faint)"}}>Nenhuma refeição lançada nesse dia</div>}
                  {loggedMeals.map(m=>(
                    <div key={m.id} style={{fontSize:12,color:"var(--text-dim)"}}>
                      {m.name}: {m.items.map(it=>{
                        const food = foods.find(f=>f.id===it.foodId);
                        return food ? food.name : null;
                      }).filter(Boolean).join(", ")}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>

          <div className="card">
            <div className="card-title">Fotos de evolução <span className="badge badge-muted">{(photos||[]).length}</span></div>
            {!(photos||[]).length ? (
              <div className="empty">O paciente ainda não enviou fotos de evolução</div>
            ) : (
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(100px,1fr))",gap:10}}>
                {photos.map(p=>(
                  <div key={p.id}>
                    <div style={{aspectRatio:"3/4", borderRadius:10, overflow:"hidden", background:"var(--bg-elev)", border:"1px solid var(--border-soft)"}}>
                      {p.url ? <img src={p.url} alt={p.date} style={{width:"100%",height:"100%",objectFit:"cover"}}/> : null}
                    </div>
                    <div style={{fontSize:10.5,color:"var(--text-faint)",marginTop:4,textAlign:"center"}}>
                      {new Date(p.date+"T12:00").toLocaleDateString("pt-BR")}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab==="dieta" && (
        <>
          <div style={{fontSize:12.5,color:"var(--text-faint)",marginBottom:14}}>
            Esse plano aparece pro paciente na aba Dieta → Plano alimentar. Ele pode usar com um clique quando seguir certinho.
          </div>
          <MealsList meals={dietPlan} setMeals={setDietPlan} foods={foods} setFoods={()=>{}} mealTotals={mealTotals}/>
        </>
      )}

      {tab==="treino" && <AdminFichaEditor fichas={fichas} setFichas={setFichas}/>}

      {tab==="recado" && <AdminNoteEditor note={adminNote} setNote={setAdminNote} patientName={patient.name}/>}
    </div>
  );
}

export function AdminNoteEditor({ note, setNote, patientName }){
  const [text, setText] = useState(note?.text || "");
  const [saved, setSaved] = useState(false);

  function save(){
    setNote({ text: text.trim(), date: new Date().toISOString() });
    setSaved(true);
    setTimeout(()=>setSaved(false), 2000);
  }
  function clear(){
    setText("");
    setNote(null);
  }

  return (
    <div className="card">
      <div className="card-title">Recado para {patientName || "o paciente"}</div>
      <div style={{fontSize:12.5,color:"var(--text-faint)",marginBottom:14}}>
        Esse recado aparece em destaque no Dashboard do paciente, até ele marcar como lido.
      </div>
      <textarea className="input" rows={5} value={text} onChange={e=>setText(e.target.value)}
        placeholder="Ex: Parabéns pela evolução dessa semana! Vamos aumentar a proteína a partir de segunda..."/>
      {note?.date && <div style={{fontSize:11,color:"var(--text-faint)",marginTop:8}}>Último recado enviado em {new Date(note.date).toLocaleDateString("pt-BR")}</div>}
      <div style={{display:"flex",gap:10,marginTop:14}}>
        <button className="btn btn-primary" style={{flex:1,justifyContent:"center"}} onClick={save} disabled={!text.trim()}>
          {saved ? "Enviado!" : "Enviar recado"}
        </button>
        {note && <button className="btn btn-danger" onClick={clear}><Trash2 size={13}/> Remover</button>}
      </div>
    </div>
  );
}

export function AdminFichaEditor({ fichas, setFichas }){
  const [activeFichaId, setActiveFichaId] = useState(fichas[0]?.id);
  const [showNewFicha, setShowNewFicha] = useState(false);
  const [showNewTreino, setShowNewTreino] = useState(false);
  const [editingTreino, setEditingTreino] = useState(null);
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

  if(!ficha){
    return (
      <div>
        <div className="section-head">
          <h2 style={{fontSize:15}}>Ficha de treino do paciente</h2>
          <button className="btn btn-sm btn-primary" onClick={()=>setShowNewFicha(true)}><Plus size={13}/> Nova ficha</button>
        </div>
        <div className="empty">Esse paciente ainda não tem nenhuma ficha. Crie a primeira.</div>
        {showNewFicha && <PromptModal title="Nova ficha" placeholder="Ex: Hipertrofia, Cutting..." onSave={addFicha} onClose={()=>setShowNewFicha(false)}/>}
      </div>
    );
  }

  return (
    <div>
      <div className="section-head">
        <h2 style={{fontSize:15}}>Ficha de treino do paciente</h2>
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

      <div style={{marginBottom:12}}>
        <button className="btn btn-sm btn-danger" onClick={()=>deleteFicha(ficha.id)}><Trash2 size={13}/> Excluir esta ficha</button>
      </div>

      <div className="grid grid-2">
        {ficha.treinos.map(treino=>(
          <div className="card" key={treino.id}>
            <div className="card-title">
              <span style={{color:"var(--text)",fontSize:14.5}}>{treino.name}</span>
              <button className="iconbtn" onClick={()=>deleteTreino(treino.id)}><Trash2 size={14}/></button>
            </div>
            {treino.exercises.map(ex=>(
              <div className="list-row" key={ex.id}>
                <span className="badge badge-muted" style={{minWidth:70,textAlign:"center"}}>{ex.group}</span>
                <span style={{flex:1,fontSize:13}}>{ex.name}</span>
                <span style={{fontSize:12,color:"var(--text-dim)"}}>{ex.sets}x{ex.reps}</span>
                <button className="iconbtn" onClick={()=>deleteExercise(treino.id, ex.id)}><X size={13}/></button>
              </div>
            ))}
            {!treino.exercises.length && <div className="empty" style={{padding:"12px 0"}}>Sem exercícios</div>}
            <button className="btn btn-sm btn-ghost" style={{marginTop:10}} onClick={()=>{setEditingTreino(treino); setShowNewExercise(true);}}><Plus size={13}/> Exercício</button>
          </div>
        ))}
        {!ficha.treinos.length && <div className="empty">Nenhum treino nesta ficha ainda.</div>}
      </div>

      {showNewFicha && <PromptModal title="Nova ficha" placeholder="Ex: Hipertrofia, Cutting..." onSave={addFicha} onClose={()=>setShowNewFicha(false)}/>}
      {showNewTreino && <PromptModal title="Novo treino" placeholder="Ex: Treino D — Ombro" onSave={addTreino} onClose={()=>setShowNewTreino(false)}/>}
      {showNewExercise && editingTreino && (
        <ExerciseForm onSave={(ex)=>addExercise(editingTreino.id, ex)} onClose={()=>{setShowNewExercise(false);setEditingTreino(null);}}/>
      )}
    </div>
  );
}

