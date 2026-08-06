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

export function BodyTab({ bodyData, setBodyData, profile, setProfile, user }){
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
export function EvolutionPhotos({ user }){
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


export function BodyForm({ onSave, defaults, profile }){
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
