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

export function WeeklyScheduleCard({ fichas, schedule, setSchedule }){
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

export function WorkoutTab({ fichas, setFichas, history, setHistory, activeSession, setActiveSession, restTimer, setRestTimer, profile, schedule, setSchedule, celebrate }){
  const [activeFichaId, setActiveFichaId] = useState(fichas[0]?.id);
  const [showNewFicha, setShowNewFicha] = useState(false);
  const [showNewTreino, setShowNewTreino] = useState(false);
  const [editingTreino, setEditingTreino] = useState(null); // treino object for exercise editing
  const [showNewExercise, setShowNewExercise] = useState(false);
  const [renamingFicha, setRenamingFicha] = useState(false);
  const [renamingTreino, setRenamingTreino] = useState(null);
  const [pendingStart, setPendingStart] = useState(null); // treino awaiting the progression-suggestion prompt
  const [finishedEntry, setFinishedEntry] = useState(null); // just-completed workout, for the share card
  const [substitutingInFicha, setSubstitutingInFicha] = useState(null); // {treinoId, ex}

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
  function renameFicha(id, name){
    setFichas(prev=>prev.map(f=>f.id!==id?f:{...f,name}));
    setRenamingFicha(false);
  }
  function duplicateFicha(id){
    const orig = fichas.find(f=>f.id===id);
    if(!orig) return;
    const copy = {
      id:uid(), name: orig.name+" (cópia)",
      treinos: orig.treinos.map(t=>({...t, id:uid(), exercises: t.exercises.map(e=>({...e, id:uid()}))})),
    };
    setFichas(prev=>[...prev, copy]);
    setActiveFichaId(copy.id);
  }
  function addTreino(name){
    setFichas(prev=>prev.map(f=>f.id!==ficha.id?f:{...f,treinos:[...f.treinos,{id:uid(),name,exercises:[]}]}));
    setShowNewTreino(false);
  }
  function deleteTreino(treinoId){
    setFichas(prev=>prev.map(f=>f.id!==ficha.id?f:{...f,treinos:f.treinos.filter(t=>t.id!==treinoId)}));
  }
  function renameTreino(treinoId, name){
    setFichas(prev=>prev.map(f=>f.id!==ficha.id?f:{...f,treinos:f.treinos.map(t=>t.id!==treinoId?t:{...t,name})}));
    setRenamingTreino(null);
  }
  function duplicateTreino(treinoId){
    const orig = ficha.treinos.find(t=>t.id===treinoId);
    if(!orig) return;
    const copy = {...orig, id:uid(), name: orig.name+" (cópia)", exercises: orig.exercises.map(e=>({...e, id:uid()}))};
    setFichas(prev=>prev.map(f=>f.id!==ficha.id?f:{...f,treinos:[...f.treinos, copy]}));
  }
  function addExercise(treinoId, ex){
    setFichas(prev=>prev.map(f=>f.id!==ficha.id?f:{...f,treinos:f.treinos.map(t=>t.id!==treinoId?t:{...t,exercises:[...t.exercises,{...ex,id:uid()}]})}));
    setShowNewExercise(false);
  }
  function deleteExercise(treinoId, exId){
    setFichas(prev=>prev.map(f=>f.id!==ficha.id?f:{...f,treinos:f.treinos.map(t=>t.id!==treinoId?t:{...t,exercises:t.exercises.filter(e=>e.id!==exId)})}));
  }
  function duplicateExercise(treinoId, exId){
    setFichas(prev=>prev.map(f=>f.id!==ficha.id?f:{...f,treinos:f.treinos.map(t=>{
      if(t.id!==treinoId) return t;
      const orig = t.exercises.find(e=>e.id===exId);
      if(!orig) return t;
      return {...t, exercises:[...t.exercises, {...orig, id:uid()}]};
    })}));
  }
  function substituteExerciseInFicha(treinoId, exId, newEx){
    setFichas(prev=>prev.map(f=>f.id!==ficha.id?f:{...f,treinos:f.treinos.map(t=>{
      if(t.id!==treinoId) return t;
      return {...t, exercises:t.exercises.map(e=> e.id!==exId ? e : {...e, name:newEx.name, group:newEx.group})};
    })}));
    setSubstitutingInFicha(null);
  }

  function suggestionFor(exName){
    const lastSession = [...history].filter(h=>h.exercises.some(e=>e.name===exName)).sort((a,b)=>b.date.localeCompare(a.date))[0];
    if(!lastSession) return null;
    const ex = lastSession.exercises.find(e=>e.name===exName);
    if(!ex || !ex.sets.length) return null;
    const top = ex.sets.reduce((a,b)=> b.weight>a.weight?b:a);
    if(top.reps>=10) return { weight: fmt1(top.weight*1.025), reps: top.reps, prevWeight: top.weight };
    return { weight: top.weight, reps: top.reps, prevWeight: top.weight };
  }

  function beginSession(treino, useSuggestions){
    setActiveSession({
      treino, ficha, startedAt: Date.now(),
      log: treino.exercises.map(ex=>{
        const sug = useSuggestions ? suggestionFor(ex.name) : null;
        const startWeight = sug ? sug.weight : ex.load;
        return { exId:ex.id, exName:ex.name, sets: Array.from({length:ex.sets}).map(()=>({weight:startWeight, reps:0, done:false})) };
      })
    });
    setPendingStart(null);
  }

  function startSession(treino){
    const hasSuggestions = treino.exercises.some(ex => suggestionFor(ex.name));
    if(hasSuggestions){
      setPendingStart(treino);
    } else {
      beginSession(treino, false);
    }
  }

  if(activeSession){
    return <WorkoutSession session={activeSession} setSession={setActiveSession} history={history} setHistory={setHistory}
      restTimer={restTimer} setRestTimer={setRestTimer} celebrate={celebrate} onFinish={setFinishedEntry} setFichas={setFichas}/>;
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

  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate()-7);
  const weekHistory = history.filter(h=> new Date(h.date+"T12:00") >= weekAgo);
  const weekVolume = weekHistory.reduce((s,h)=>s+h.volume,0);
  const lastWorkout = [...history].sort((a,b)=>b.date.localeCompare(a.date))[0];
  let streak=0, d=new Date();
  const trainedSet = new Set(history.map(h=>h.date));
  while(true){ const iso=d.toISOString().slice(0,10); if(trainedSet.has(iso)){streak++; d.setDate(d.getDate()-1);} else break; }

  return (
    <div>
      <div className="section-head">
        <h2>Treino</h2>
        <div style={{display:"flex",gap:8}}>
          <button className="btn btn-ghost btn-sm" onClick={()=>setShowNewTreino(true)}><Plus size={13}/> Novo treino</button>
          <button className="btn btn-primary btn-sm" onClick={()=>setShowNewFicha(true)}><Plus size={13}/> Nova ficha</button>
        </div>
      </div>

      <div className="grid grid-4" style={{marginBottom:18}}>
        <div className="card stat-card"><span className="stat-label">Sequência</span><span className="stat-value">{streak} 🔥</span></div>
        <div className="card stat-card"><span className="stat-label">Treinos (7 dias)</span><span className="stat-value">{weekHistory.length}</span></div>
        <div className="card stat-card"><span className="stat-label">Volume (7 dias)</span><span className="stat-value">{Math.round(weekVolume).toLocaleString("pt-BR")}kg</span></div>
        <div className="card stat-card">
          <span className="stat-label">Último treino</span>
          <span className="stat-value" style={{fontSize:15}}>{lastWorkout ? lastWorkout.treinoName : "—"}</span>
          <span className="stat-sub">{lastWorkout ? new Date(lastWorkout.date+"T12:00").toLocaleDateString("pt-BR") : "Nenhum ainda"}</span>
        </div>
      </div>

      <div className="tabs" style={{marginBottom:12}}>
        {fichas.map(f=>(
          <button key={f.id} className={"tab-btn"+(f.id===ficha.id?" active":"")} onClick={()=>setActiveFichaId(f.id)}>{f.name}</button>
        ))}
      </div>

      <div style={{display:"flex",gap:8,marginBottom:18}}>
        <button className="btn btn-sm btn-ghost" onClick={()=>setRenamingFicha(true)}><Edit3 size={13}/> Renomear ficha</button>
        <button className="btn btn-sm btn-ghost" onClick={()=>duplicateFicha(ficha.id)}><Copy size={13}/> Duplicar ficha</button>
        <button className="btn btn-sm btn-danger" onClick={()=>deleteFicha(ficha.id)}><Trash2 size={13}/> Excluir ficha</button>
      </div>

      <WeeklyScheduleCard fichas={fichas} schedule={schedule} setSchedule={setSchedule}/>

      <div className="grid grid-2">
        {ficha.treinos.map(treino=>{
          const last = [...history].filter(h=>h.treinoName===treino.name).sort((a,b)=>b.date.localeCompare(a.date))[0];
          return (
            <div className="card" key={treino.id}>
              <div className="card-title">
                <span style={{color:"var(--text)",fontSize:14.5}}>{treino.name}</span>
                <div style={{display:"flex",gap:2}}>
                  <button className="iconbtn" title="Renomear" onClick={()=>setRenamingTreino(treino)}><Edit3 size={14}/></button>
                  <button className="iconbtn" title="Duplicar" onClick={()=>duplicateTreino(treino.id)}><Copy size={14}/></button>
                  <button className="iconbtn" title="Excluir" onClick={()=>deleteTreino(treino.id)}><Trash2 size={14}/></button>
                </div>
              </div>
              {treino.exercises.map(ex=>(
                <div className="list-row" key={ex.id}>
                  <span className="badge badge-muted" style={{minWidth:70,textAlign:"center"}}>{ex.group}</span>
                  <span style={{flex:1,fontSize:13}}>{ex.name}</span>
                  <span style={{fontSize:12,color:"var(--text-dim)"}}>{ex.sets}x{ex.reps}{ex.load ? ` · ${ex.load}kg` : ""}</span>
                  <button className="iconbtn" title="Substituir exercício" onClick={()=>setSubstitutingInFicha({treinoId:treino.id, ex})}><RefreshCw size={13}/></button>
                  <button className="iconbtn" title="Duplicar exercício" onClick={()=>duplicateExercise(treino.id, ex.id)}><Copy size={13}/></button>
                  <button className="iconbtn" title="Excluir" onClick={()=>deleteExercise(treino.id, ex.id)}><X size={13}/></button>
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
      {renamingFicha && <PromptModal title="Renomear ficha" placeholder={ficha.name} onSave={(name)=>renameFicha(ficha.id,name)} onClose={()=>setRenamingFicha(false)}/>}
      {renamingTreino && <PromptModal title="Renomear treino" placeholder={renamingTreino.name} onSave={(name)=>renameTreino(renamingTreino.id,name)} onClose={()=>setRenamingTreino(null)}/>}
      {showNewExercise && editingTreino && (
        <ExerciseForm onSave={(ex)=>addExercise(editingTreino.id, ex)} onClose={()=>{setShowNewExercise(false);setEditingTreino(null);}}/>
      )}
      {pendingStart && (
        <Modal title="Sugestão de progressão" onClose={()=>setPendingStart(null)}>
          <div style={{fontSize:13,color:"var(--text-dim)",marginBottom:16}}>
            Na última vez você completou bem estas séries. Quer começar já com a carga sugerida?
          </div>
          {pendingStart.exercises.map(ex=>{
            const sug = suggestionFor(ex.name);
            if(!sug) return null;
            return (
              <div key={ex.id} style={{display:"flex",justifyContent:"space-between",fontSize:13,padding:"8px 0",borderBottom:"1px solid var(--border-soft)"}}>
                <span>{ex.name}</span>
                <span style={{color:"var(--accent)",fontWeight:700}}>{sug.prevWeight}kg → {sug.weight}kg</span>
              </div>
            );
          })}
          <div style={{display:"flex",gap:10,marginTop:18}}>
            <button className="btn btn-ghost" style={{flex:1,justifyContent:"center"}} onClick={()=>beginSession(pendingStart, false)}>Começar com valores da ficha</button>
            <button className="btn btn-primary" style={{flex:1,justifyContent:"center"}} onClick={()=>beginSession(pendingStart, true)}>Usar sugestões</button>
          </div>
        </Modal>
      )}
      {finishedEntry && <WorkoutShareCard entry={finishedEntry} patientName={profile.name} onClose={()=>setFinishedEntry(null)}/>}
      {substitutingInFicha && (
        <SubstituteExercisePicker
          currentExercise={substitutingInFicha.ex}
          onPick={(newEx)=>substituteExerciseInFicha(substitutingInFicha.treinoId, substitutingInFicha.ex.id, newEx)}
          onClose={()=>setSubstitutingInFicha(null)}
        />
      )}
    </div>
  );
}


export function WorkoutShareCard({ entry, patientName, onClose }){
  const canvasRef = useRef(null);
  const [canShareFiles, setCanShareFiles] = useState(false);

  const topSets = entry.exercises
    .map(e => ({ name:e.name, best: e.sets.length ? e.sets.reduce((a,b)=> b.weight>a.weight?b:a) : null }))
    .filter(e=>e.best)
    .slice(0,5);

  useEffect(()=>{ setCanShareFiles(!!(navigator.share && navigator.canShare)); },[]);

  function drawCard(){
    return new Promise((resolve)=>{
      const canvas = canvasRef.current;
      if(!canvas){ resolve(); return; }
      const ctx = canvas.getContext("2d");
      const W = 1080, H = 1350;
      canvas.width = W; canvas.height = H;

      const grad = ctx.createLinearGradient(0,0,0,H);
      grad.addColorStop(0, "#1c1611");
      grad.addColorStop(1, "#0f0b08");
      ctx.fillStyle = grad;
      ctx.fillRect(0,0,W,H);

      ctx.strokeStyle = "rgba(217,169,79,0.35)";
      ctx.lineWidth = 3;
      ctx.strokeRect(24,24,W-48,H-48);

      function finishDrawing(){
        ctx.textAlign = "center";
        ctx.fillStyle = "#d9a94f";
        ctx.font = "600 32px sans-serif";
        ctx.fillText("EQ FITNESS", W/2, 300);

        ctx.fillStyle = "#f5ede3";
        ctx.font = "700 56px sans-serif";
        wrapText(ctx, entry.treinoName, W/2, 385, W-160, 64);

        ctx.fillStyle = "#ab9c8c";
        ctx.font = "400 28px sans-serif";
        const dateLabel = new Date(entry.date+"T12:00").toLocaleDateString("pt-BR",{weekday:"long",day:"2-digit",month:"long"});
        ctx.fillText(dateLabel, W/2, 470);

        const stats = [
          { label:"DURAÇÃO", value:`${entry.duration} min` },
          { label:"VOLUME", value:`${Math.round(entry.volume).toLocaleString("pt-BR")}kg` },
          { label:"CALORIAS", value:`${entry.caloriesEst} kcal` },
        ];
        const statY = 590; const colW = W/3;
        stats.forEach((s,i)=>{
          const cx = colW*i + colW/2;
          ctx.fillStyle = "#d9a94f";
          ctx.font = "700 48px sans-serif";
          ctx.fillText(s.value, cx, statY);
          ctx.fillStyle = "#8a7d6f";
          ctx.font = "600 20px sans-serif";
          ctx.fillText(s.label, cx, statY+36);
        });

        ctx.strokeStyle = "rgba(217,169,79,0.25)";
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(120, 670); ctx.lineTo(W-120, 670); ctx.stroke();

        ctx.textAlign = "left";
        let y = 740;
        ctx.fillStyle = "#8a7d6f";
        ctx.font = "600 22px sans-serif";
        ctx.fillText("EXERCÍCIOS", 120, y);
        y += 50;
        topSets.forEach(ex=>{
          ctx.fillStyle = "#f5ede3";
          ctx.font = "500 30px sans-serif";
          ctx.fillText(ex.name.length>26 ? ex.name.slice(0,24)+"…" : ex.name, 120, y);
          ctx.textAlign = "right";
          ctx.fillStyle = "#d9a94f";
          ctx.font = "700 30px sans-serif";
          ctx.fillText(`${ex.best.weight}kg × ${ex.best.reps}`, W-120, y);
          ctx.textAlign = "left";
          y += 56;
        });

        ctx.textAlign = "center";
        ctx.fillStyle = "#71655a";
        ctx.font = "400 22px sans-serif";
        ctx.fillText("Elane Quezia Dias · Nutricionista", W/2, H-70);

        resolve();
      }

      const logo = new Image();
      logo.onload = ()=>{
        ctx.save();
        ctx.beginPath();
        ctx.arc(W/2, 150, 60, 0, Math.PI*2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(logo, W/2-60, 90, 120, 120);
        ctx.restore();
        finishDrawing();
      };
      logo.onerror = finishDrawing;
      logo.src = "/logo.jpg";
    });
  }

  useEffect(()=>{ drawCard(); /* eslint-disable-next-line */ },[]);

  async function download(){
    await drawCard();
    canvasRef.current.toBlob((blob)=>{
      if(!blob) return;
      const url = URL.createObjectURL(blob);
      // Try the standard download first (works on desktop and most Android browsers)...
      const link = document.createElement("a");
      link.download = `treino-${entry.date}.png`;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      // ...and also open the image in a new tab as a universal fallback —
      // iOS Safari (and some in-app browsers) silently ignore the download
      // attribute, but opening the image directly lets the person long-press
      // it and choose "Save Image" from there.
      window.open(url, "_blank");
      setTimeout(()=>URL.revokeObjectURL(url), 8000);
    }, "image/png");
  }

  async function share(){
    await drawCard();
    canvasRef.current.toBlob(async (blob)=>{
      if(!blob) return;
      const file = new File([blob], `treino-${entry.date}.png`, {type:"image/png"});
      if(navigator.canShare && navigator.canShare({files:[file]})){
        try{ await navigator.share({ files:[file], title:"Meu treino", text:`${entry.treinoName} — ${Math.round(entry.volume)}kg de volume!` }); }
        catch(e){ /* usuário cancelou o compartilhamento */ }
      } else {
        download();
      }
    }, "image/png");
  }

  return (
    <Modal title="Resumo do treino" onClose={onClose} wide>
      <div style={{display:"flex",justifyContent:"center",marginBottom:16}}>
        <canvas ref={canvasRef} style={{width:"100%",maxWidth:300,borderRadius:12,border:"1px solid var(--border-soft)"}}/>
      </div>
      <div style={{display:"flex",gap:10}}>
        <button className="btn btn-ghost" style={{flex:1,justifyContent:"center"}} onClick={download}><Download size={14}/> Baixar imagem</button>
        {canShareFiles && (
          <button className="btn btn-primary" style={{flex:1,justifyContent:"center"}} onClick={share}>Compartilhar</button>
        )}
      </div>
      <div style={{fontSize:11.5,color:"var(--text-faint)",marginTop:12,textAlign:"center"}}>
        No celular, "Baixar imagem" abre a foto numa aba — toque e segure nela pra salvar. Ou use "Compartilhar" pra mandar direto pro Instagram, WhatsApp, GymRats, ou pra Elane.
      </div>
    </Modal>
  );
}

export function WorkoutHistoryCard({ history, setHistory }){
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

export function EditSessionModal({ session, onSave, onClose }){
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
        <input className="input" type="number" value={numDisplay(duration)} onChange={e=>setDuration(e.target.value)} style={{width:120}}/>
      </div>
      {exercises.map((e, exIdx)=>(
        <div key={exIdx} style={{marginBottom:14}}>
          <div style={{fontSize:13,fontWeight:700,marginBottom:6}}>{e.name}</div>
          <div className="set-row" style={{color:"var(--text-faint)",fontSize:11,gridTemplateColumns:"28px 1fr 1fr 32px"}}>
            <span>Série</span><span>Peso (kg)</span><span>Reps</span><span></span>
          </div>
          {e.sets.map((s, setIdx)=>(
            <div className="set-row" key={setIdx} style={{gridTemplateColumns:"28px 1fr 1fr 32px"}}>
              <span className="set-num">{setIdx+1}</span>
              <input className="input" type="number" value={numDisplay(s.weight)} onChange={ev=>updateSet(exIdx,setIdx,"weight",Number(ev.target.value))}/>
              <input className="input" type="number" value={numDisplay(s.reps)} onChange={ev=>updateSet(exIdx,setIdx,"reps",Number(ev.target.value))}/>
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

export function SubstituteExercisePicker({ currentExercise, onPick, onClose }){
  const [q, setQ] = useState("");
  const [equipFilter, setEquipFilter] = useState("Todos");

  // try to find the current exercise's metadata in the library (custom/typed
  // exercises won't have it — substitution still works, just without the
  // "Equivalente" highlighting)
  const currentMeta = EXERCISE_LIBRARY.find(e=> e.name.toLowerCase() === (currentExercise.name||"").toLowerCase());
  const sameGroup = EXERCISE_LIBRARY.filter(e =>
    e.group === currentExercise.group && e.name !== currentExercise.name
  );

  const equipments = Array.from(new Set(sameGroup.map(e=>e.equipment))).filter(Boolean);

  const filtered = sameGroup
    .filter(e => e.name.toLowerCase().includes(q.toLowerCase()))
    .filter(e => equipFilter==="Todos" || e.equipment===equipFilter)
    .sort((a,b)=>{
      const aEquiv = currentMeta && a.pattern===currentMeta.pattern ? 0 : 1;
      const bEquiv = currentMeta && b.pattern===currentMeta.pattern ? 0 : 1;
      return aEquiv - bEquiv;
    });

  return (
    <Modal title={`Substituir "${currentExercise.name}"`} onClose={onClose} wide>
      <div style={{fontSize:12,color:"var(--text-faint)",marginBottom:12}}>
        Mostrando opções do mesmo grupo muscular ({currentExercise.group}){currentMeta ? ", com o padrão de movimento equivalente destacado primeiro" : ""}.
      </div>
      <div className="field" style={{position:"relative"}}>
        <Search size={15} style={{position:"absolute",left:12,top:12,color:"var(--text-faint)"}}/>
        <input className="input" style={{paddingLeft:34}} autoFocus placeholder="Buscar exercício substituto..."
          value={q} onChange={e=>setQ(e.target.value)}/>
      </div>
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:12}}>
        <button className={"chip"+(equipFilter==="Todos"?" active":"")} onClick={()=>setEquipFilter("Todos")}>Todos</button>
        {equipments.map(eq=>(
          <button key={eq} className={"chip"+(equipFilter===eq?" active":"")} onClick={()=>setEquipFilter(eq)}>{EQUIPMENT_LABELS[eq]||eq}</button>
        ))}
      </div>
      <div style={{maxHeight:340,overflowY:"auto"}}>
        {filtered.map((e,i)=>{
          const isEquivalent = currentMeta && e.pattern===currentMeta.pattern;
          return (
            <div className="food-search-item" key={i} onClick={()=>onPick(e)}>
              <div style={{fontSize:13.5,fontWeight:600}}>{e.name}</div>
              <div style={{display:"flex",gap:6,alignItems:"center"}}>
                {isEquivalent && <span className="badge badge-accent">Equivalente</span>}
                <span className="badge badge-muted">{EQUIPMENT_LABELS[e.equipment]||e.equipment}</span>
              </div>
            </div>
          );
        })}
        {!filtered.length && <div className="empty">Nenhum outro exercício desse grupo encontrado.</div>}
      </div>
    </Modal>
  );
}

export function ExercisePicker({ onPick, onClose }){
  const [q, setQ] = useState("");
  const [groupFilter, setGroupFilter] = useState("Todos");

  const filtered = EXERCISE_LIBRARY.filter(e=>
    e.name.toLowerCase().includes(q.toLowerCase()) &&
    (groupFilter==="Todos" || e.group===groupFilter)
  );

  return (
    <Modal title="Biblioteca de exercícios" onClose={onClose} wide>
      <div className="field" style={{position:"relative"}}>
        <Search size={15} style={{position:"absolute",left:12,top:12,color:"var(--text-faint)"}}/>
        <input className="input" style={{paddingLeft:34}} autoFocus placeholder="Buscar exercício (ex: supino, agachamento...)"
          value={q} onChange={e=>setQ(e.target.value)}/>
      </div>
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:12}}>
        <button className={"chip"+(groupFilter==="Todos"?" active":"")} onClick={()=>setGroupFilter("Todos")}>Todos</button>
        {MUSCLE_GROUPS.map(g=>(
          <button key={g} className={"chip"+(groupFilter===g?" active":"")} onClick={()=>setGroupFilter(g)}>{g}</button>
        ))}
      </div>
      <div style={{maxHeight:340,overflowY:"auto"}}>
        {filtered.map((e,i)=>(
          <div className="food-search-item" key={i} onClick={()=>onPick(e)}>
            <div style={{fontSize:13.5,fontWeight:600}}>{e.name}</div>
            <span className="badge badge-muted">{e.group}</span>
          </div>
        ))}
        {!filtered.length && <div className="empty">Nenhum exercício encontrado — você pode digitar o nome manualmente no formulário.</div>}
      </div>
    </Modal>
  );
}

export function ExerciseForm({ onSave, onClose }){
  const [ex, setEx] = useState({name:"",group:MUSCLE_GROUPS[0],sets:3,reps:"10-12",load:0,rest:60,notes:""});
  const [showLibrary, setShowLibrary] = useState(false);

  function pickFromLibrary(picked){
    setEx(prev=>({...prev, name:picked.name, group:picked.group}));
    setShowLibrary(false);
  }

  return (
    <Modal title="Novo exercício" onClose={onClose}>
      <div className="field">
        <label className="flabel">Nome do exercício</label>
        <div style={{display:"flex",gap:8}}>
          <input className="input" value={ex.name} onChange={e=>setEx({...ex,name:e.target.value})} placeholder="Digite ou escolha da biblioteca" autoFocus/>
          <button type="button" className="btn btn-sm btn-ghost" style={{flexShrink:0}} onClick={()=>setShowLibrary(true)}><Search size={13}/> Biblioteca</button>
        </div>
      </div>
      <div className="field"><label className="flabel">Grupo muscular</label>
        <select className="input" value={ex.group} onChange={e=>setEx({...ex,group:e.target.value})}>
          {MUSCLE_GROUPS.map(g=><option key={g} value={g}>{g}</option>)}
        </select>
      </div>
      <div className="grid grid-2">
        <div className="field"><label className="flabel">Séries</label><input className="input" type="number" value={numDisplay(ex.sets)} onChange={e=>setEx({...ex,sets:Number(e.target.value)})}/></div>
        <div className="field"><label className="flabel">Repetições</label><input className="input" value={ex.reps} onChange={e=>setEx({...ex,reps:e.target.value})}/></div>
        <div className="field"><label className="flabel">Descanso (s)</label><input className="input" type="number" value={numDisplay(ex.rest)} onChange={e=>setEx({...ex,rest:Number(e.target.value)})}/></div>
      </div>
      <div className="field"><label className="flabel">Observações</label><textarea className="input" rows={2} value={ex.notes} onChange={e=>setEx({...ex,notes:e.target.value})}/></div>
      <div style={{fontSize:11.5,color:"var(--text-faint)",marginBottom:14}}>A carga é registrada depois, quando você iniciar o treino — é lá que fica anotada a evolução.</div>
      <button className="btn btn-primary" style={{width:"100%",justifyContent:"center"}} onClick={()=>ex.name.trim()&&onSave(ex)}>Adicionar exercício</button>
      {showLibrary && <ExercisePicker onPick={pickFromLibrary} onClose={()=>setShowLibrary(false)}/>}
    </Modal>
  );
}

export function WorkoutSession({ session, setSession, history, setHistory, restTimer, setRestTimer, celebrate, onFinish, setFichas }){
  const elapsedMin = Math.round((Date.now()-session.startedAt)/60000);
  const [substitutingIdx, setSubstitutingIdx] = useState(null);
  const [pendingSubstitute, setPendingSubstitute] = useState(null); // {exIdx, newEx}

  function bestEverWeight(exName){
    let best = 0;
    history.forEach(h=> h.exercises.forEach(e=>{ if(e.name===exName) e.sets.forEach(s=>{ if(s.weight>best) best=s.weight; }); }));
    return best;
  }

  function applySubstitute(exIdx, newEx, permanent){
    setSession(prev=>{
      const log = prev.log.map((l,i)=> i!==exIdx ? l : { ...l, exName:newEx.name, sets: l.sets.map(s=>({...s, done:false})) });
      const treino = { ...prev.treino, exercises: prev.treino.exercises.map((e,i)=> i!==exIdx ? e : {...e, name:newEx.name, group:newEx.group}) };
      return {...prev, log, treino};
    });
    if(permanent && setFichas){
      const treinoId = session.treino.id;
      setFichas(prevFichas => prevFichas.map(f=> ({
        ...f,
        treinos: f.treinos.map(t=> t.id!==treinoId ? t : {
          ...t,
          exercises: t.exercises.map((e,i)=> i===exIdx ? {...e, name:newEx.name, group:newEx.group} : e)
        })
      })));
    }
    setPendingSubstitute(null);
  }

  function toggleSet(exIdx, setIdx){
    setSession(prev=>{
      const log = prev.log.map((l,i)=> i!==exIdx ? l : {...l, sets: l.sets.map((s,j)=> j!==setIdx ? s : {...s, done: !s.done})});
      return {...prev, log};
    });
    const set = session.log[exIdx].sets[setIdx];
    if(!set.done){
      const restSec = session.treino.exercises[exIdx].rest || 60;
      setRestTimer({endTime: Date.now() + restSec*1000, total: restSec});
      // check for a new personal record on this exercise
      if(celebrate && set.weight > 0){
        const exName = session.log[exIdx].exName;
        const prevBest = bestEverWeight(exName);
        if(set.weight > prevBest){
          celebrate({
            emoji: "🏆",
            title: "Novo recorde pessoal!",
            subtitle: `${exName}: ${set.weight}kg — sua maior carga de sempre nesse exercício!`,
          });
        }
      }
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
    if(onFinish) onFinish(entry);
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
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6,gap:8}}>
              <div style={{fontWeight:700,fontSize:14.5,flex:1}}>{l.exName}</div>
              <span className="badge badge-muted">Meta: {exDef.sets}x{exDef.reps}{exDef.load ? ` · ${exDef.load}kg` : ""}</span>
            </div>
            <button className="btn btn-sm btn-ghost" style={{marginBottom:10}} onClick={()=>setSubstitutingIdx(exIdx)}>
              <RefreshCw size={13}/> Substituir exercício
            </button>
            <div className="set-row" style={{color:"var(--text-faint)",fontSize:11}}>
              <span>Série</span><span>Peso (kg)</span><span>Reps</span><span></span><span></span>
            </div>
            {l.sets.map((s, setIdx)=>(
              <div className="set-row" key={setIdx}>
                <span className="set-num">{setIdx+1}</span>
                <input className={"input"+(s.done?" set-done":"")} type="number" value={numDisplay(s.weight)} onChange={e=>updateSetField(exIdx,setIdx,"weight",Number(e.target.value))}/>
                <input className={"input"+(s.done?" set-done":"")} type="number" value={numDisplay(s.reps)} onChange={e=>updateSetField(exIdx,setIdx,"reps",Number(e.target.value))}/>
                <span></span>
                <button className="iconbtn" style={{background:s.done?"var(--accent-glow)":"none",color:s.done?"var(--accent)":"var(--text-faint)"}} onClick={()=>toggleSet(exIdx,setIdx)}><Check size={16}/></button>
              </div>
            ))}
            {exDef.notes && <div style={{fontSize:11.5,color:"var(--text-faint)",marginTop:6}}>Obs: {exDef.notes}</div>}
          </div>
        );
      })}

      {substitutingIdx !== null && (
        <SubstituteExercisePicker
          currentExercise={session.treino.exercises[substitutingIdx]}
          onPick={(newEx)=>{ setPendingSubstitute({exIdx:substitutingIdx, newEx}); setSubstitutingIdx(null); }}
          onClose={()=>setSubstitutingIdx(null)}
        />
      )}

      {pendingSubstitute && (
        <Modal title="Aplicar substituição" onClose={()=>setPendingSubstitute(null)}>
          <div style={{fontSize:13,color:"var(--text-dim)",marginBottom:18}}>
            Trocar <b>{session.treino.exercises[pendingSubstitute.exIdx].name}</b> por <b>{pendingSubstitute.newEx.name}</b>:
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <button className="btn btn-primary" style={{justifyContent:"center"}} onClick={()=>applySubstitute(pendingSubstitute.exIdx, pendingSubstitute.newEx, false)}>Só neste treino de hoje</button>
            {setFichas && (
              <button className="btn btn-ghost" style={{justifyContent:"center"}} onClick={()=>applySubstitute(pendingSubstitute.exIdx, pendingSubstitute.newEx, true)}>Também na ficha (definitivo)</button>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ============================================================
   EVOLUTION TAB
============================================================ */
