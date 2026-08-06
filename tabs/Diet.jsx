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

export function DietTab({ foods, setFoods, diary, setDiary, today, todayMeals, macroTotals, profile, dietPlan, setDietPlan, user }){
  const [view, setView] = useState("today"); // today | plan | history
  const [confirmUseId, setConfirmUseId] = useState(null);
  const [historyDays, setHistoryDays] = useState(null); // null = not loaded yet

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

  function openHistory(){
    setView("history");
    if(historyDays === null){
      loadDiaryHistory(user.id).then(days => setHistoryDays(days.filter(d => d.date !== today)));
    }
  }

  return (
    <div>
      <div className="section-head">
        <h2>Dieta</h2>
        <div className="tabs">
          <button className={"tab-btn"+(view==="today"?" active":"")} onClick={()=>setView("today")}>Hoje</button>
          <button className={"tab-btn"+(view==="plan"?" active":"")} onClick={()=>setView("plan")}>Plano alimentar</button>
          <button className={"tab-btn"+(view==="history"?" active":"")} onClick={openHistory}>Histórico</button>
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
      ) : view === "plan" ? (
        <>
          <div style={{fontSize:12.5,color:"var(--text-faint)",marginBottom:14}}>
            Monte aqui a dieta fixa recomendada (ex: pela nutricionista). No dia a dia, se a refeição realizada bater com o plano, basta um clique em "Usar refeição planejada" — sem precisar lançar tudo de novo.
          </div>
          <MealsList meals={dietPlan} setMeals={setDietPlan} foods={foods} setFoods={setFoods} mealTotals={mealTotals}/>
        </>
      ) : (
        <DietHistoryView days={historyDays} setDays={setHistoryDays} foods={foods} setFoods={setFoods} mealTotals={mealTotals} userId={user.id} today={today}/>
      )}
    </div>
  );
}

export function DietHistoryView({ days, setDays, foods, setFoods, mealTotals, userId, today }){
  const [openDate, setOpenDate] = useState(null);
  const [pickDate, setPickDate] = useState("");
  const yesterday = daysAgoISO(1);

  function setMealsForDay(date, updater){
    setDays(prevDays=>{
      const exists = prevDays.some(d=>d.date===date);
      const base = exists ? prevDays : [...prevDays, {date, meals:[]}];
      return base.map(d=>{
        if(d.date!==date) return d;
        const newMeals = typeof updater==="function" ? updater(d.meals) : updater;
        saveKey(userId, "diary:"+date, {meals:newMeals});
        return {...d, meals:newMeals};
      }).sort((a,b)=> b.date.localeCompare(a.date));
    });
  }

  function openOrCreateDay(){
    if(!pickDate || pickDate >= today) return;
    const exists = days.find(d=>d.date===pickDate);
    if(!exists){
      const blankDay = { date:pickDate, meals:[
        { id:uid(), name:"Café da manhã", items:[] },
        { id:uid(), name:"Almoço", items:[] },
        { id:uid(), name:"Lanche da tarde", items:[] },
        { id:uid(), name:"Jantar", items:[] },
      ]};
      setDays(prev=>[...prev, blankDay].sort((a,b)=> b.date.localeCompare(a.date)));
    }
    setOpenDate(pickDate);
    setPickDate("");
  }

  if(days === null) return <div className="empty">Carregando histórico…</div>;

  return (
    <div>
      <div className="card" style={{marginBottom:16}}>
        <div className="card-title">Completar um dia esquecido</div>
        <div style={{fontSize:12,color:"var(--text-faint)",marginBottom:10}}>
          Esqueceu de lançar algo num dia anterior? Escolha a data e complete normalmente.
        </div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <input className="input" type="date" style={{maxWidth:200}} max={yesterday} value={pickDate} onChange={e=>setPickDate(e.target.value)}/>
          <button className="btn btn-sm btn-primary" disabled={!pickDate} onClick={openOrCreateDay}>Abrir esse dia</button>
        </div>
      </div>

      {!days.length && <div className="empty">Ainda não há dias anteriores registrados. Volte aqui depois de lançar refeições em outros dias, ou use o campo acima.</div>}

      {days.map(day=>{
        const allItems = day.meals.flatMap(m=>m.items);
        const t = mealTotals(allItems);
        const isOpen = openDate === day.date;
        return (
          <div className="card" key={day.date} style={{marginBottom:12}}>
            <div className="card-title" style={{cursor:"pointer"}} onClick={()=>setOpenDate(isOpen?null:day.date)}>
              <span style={{color:"var(--text)",fontSize:14}}>
                {new Date(day.date+"T12:00").toLocaleDateString("pt-BR",{weekday:"short",day:"2-digit",month:"short"})}
              </span>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                <span className="badge badge-muted">{Math.round(t.kcal)} kcal · P{fmt1(t.p)} C{fmt1(t.c)} G{fmt1(t.f)}</span>
                {isOpen ? <ChevronDown size={15} color="var(--text-faint)"/> : <ChevronRight size={15} color="var(--text-faint)"/>}
              </div>
            </div>
            {isOpen && (
              <div style={{marginTop:10}}>
                <MealsList
                  meals={day.meals}
                  setMeals={(updater)=>setMealsForDay(day.date, updater)}
                  foods={foods} setFoods={setFoods} mealTotals={mealTotals}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function MealsList({ meals, setMeals, foods, setFoods, mealTotals, renderExtra }){
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
                  <input className="input" type="number" value={numDisplay(it.qty)} style={{width:70}} min={0}
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

export function FoodPicker({ foods, setFoods, onPick, onClose }){
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState(null);
  const [qty, setQty] = useState(100);
  const [showCustom, setShowCustom] = useState(false);
  const [editingFood, setEditingFood] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [onlineResults, setOnlineResults] = useState(null); // null = not searched yet
  const [searchingOnline, setSearchingOnline] = useState(false);
  const [reviewingOnlineFood, setReviewingOnlineFood] = useState(null);
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

  async function searchOnline(){
    if(!q.trim()) return;
    setSearchingOnline(true);
    const results = await searchOpenFoodFacts(q.trim());
    setOnlineResults(results);
    setSearchingOnline(false);
  }

  function saveOnlineFood(reviewedFood){
    const withId = {...reviewedFood, id:"custom-"+uid(), custom:true};
    setFoods(prev=>[...prev, withId]);
    setReviewingOnlineFood(null);
    selectFood(withId);
  }

  return (
    <Modal title="Adicionar alimento" onClose={onClose}>
      {!selected ? (
        <>
          <div className="field" style={{position:"relative"}}>
            <Search size={15} style={{position:"absolute",left:12,top:12,color:"var(--text-faint)"}}/>
            <input className="input" style={{paddingLeft:34}} autoFocus placeholder="Buscar alimento (ex: arroz, frango...)"
              value={q} onChange={e=>{setQ(e.target.value); setOnlineResults(null);}}
              onKeyDown={e=>e.key==="Enter" && !filtered.length && searchOnline()}/>
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
            {!filtered.length && !onlineResults && (
              <div className="empty" style={{padding:"16px 20px"}}>
                Nenhum alimento encontrado na sua lista.
                {q.trim() && (
                  <div style={{marginTop:10}}>
                    <button className="btn btn-sm btn-primary" onClick={searchOnline} disabled={searchingOnline}>
                      <Search size={13}/> {searchingOnline ? "Buscando..." : `Buscar "${q.trim()}" online`}
                    </button>
                  </div>
                )}
              </div>
            )}
            {onlineResults && onlineResults.length>0 && (
              <div style={{marginTop:8}}>
                <div style={{fontSize:11,fontWeight:700,color:"var(--text-faint)",textTransform:"uppercase",letterSpacing:"0.04em",padding:"6px 4px"}}>Resultados online</div>
                {onlineResults.map((f,i)=>(
                  <div className="food-search-item" key={i} onClick={()=>setReviewingOnlineFood(f)}>
                    <div>
                      <div style={{fontSize:13.5,fontWeight:600}}>{f.name}{f.brand?` · ${f.brand}`:""}</div>
                      <div style={{fontSize:11.5,color:"var(--text-faint)"}}>{f.kcal} kcal / 100g · P{f.protein}g C{f.carb}g G{f.fat}g</div>
                    </div>
                    <span className="badge badge-blue">online</span>
                  </div>
                ))}
              </div>
            )}
            {onlineResults && !onlineResults.length && (
              <div className="empty">Não encontramos esse alimento online. Você pode criar manualmente abaixo.</div>
            )}
          </div>
          <button className="btn btn-ghost btn-sm" style={{marginTop:10}} onClick={()=>setShowCustom(true)}><Plus size={13}/> Criar alimento personalizado</button>
          {showCustom && <CustomFoodForm onSave={(f)=>{setFoods(prev=>[...prev,f]); setShowCustom(false); selectFood(f);}} onClose={()=>setShowCustom(false)}/>}
          {editingFood && <CustomFoodForm initial={editingFood} onSave={saveEditedFood} onClose={()=>setEditingFood(null)}/>}
          {reviewingOnlineFood && (
            <CustomFoodForm initial={reviewingOnlineFood} title="Revisar alimento (dados online)" onSave={saveOnlineFood} onClose={()=>setReviewingOnlineFood(null)}/>
          )}
        </>
      ) : (
        <div>
          <div style={{fontSize:15,fontWeight:700,marginBottom:4}}>{selected.name}</div>
          <div style={{fontSize:12,color:"var(--text-faint)",marginBottom:16}}>Base: {selected.per} {selected.unit}</div>
          <div className="field">
            <label className="flabel">Quantidade ({selected.unit})</label>
            <input className="input" type="number" value={numDisplay(qty)} onChange={e=>setQty(Number(e.target.value))} autoFocus/>
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

export function CustomFoodForm({ onSave, onClose, initial, title }){
  const [f, setF] = useState(initial || {name:"",brand:"",per:100,unit:"g",kcal:0,protein:0,carb:0,fat:0,fiber:0,sodium:0});
  const isEditing = !!initial;
  return (
    <Modal title={title || (isEditing ? "Editar alimento" : "Alimento personalizado")} onClose={onClose}>
      <div className="field"><label className="flabel">Nome</label><input className="input" value={f.name} onChange={e=>setF({...f,name:e.target.value})}/></div>
      <div className="grid grid-2" style={{marginBottom:14}}>
        <div><label className="flabel">Base</label><input className="input" type="number" value={numDisplay(f.per)} onChange={e=>setF({...f,per:Number(e.target.value)})}/></div>
        <div><label className="flabel">Unidade</label>
          <select className="input" value={f.unit} onChange={e=>setF({...f,unit:e.target.value})}>
            <option value="g">g</option><option value="ml">ml</option><option value="unidade">unidade</option><option value="colher">colher</option>
          </select>
        </div>
      </div>
      <div className="grid grid-2">
        <div className="field"><label className="flabel">Calorias</label><input className="input" type="number" value={numDisplay(f.kcal)} onChange={e=>setF({...f,kcal:Number(e.target.value)})}/></div>
        <div className="field"><label className="flabel">Proteína (g)</label><input className="input" type="number" value={numDisplay(f.protein)} onChange={e=>setF({...f,protein:Number(e.target.value)})}/></div>
        <div className="field"><label className="flabel">Carboidrato (g)</label><input className="input" type="number" value={numDisplay(f.carb)} onChange={e=>setF({...f,carb:Number(e.target.value)})}/></div>
        <div className="field"><label className="flabel">Gordura (g)</label><input className="input" type="number" value={numDisplay(f.fat)} onChange={e=>setF({...f,fat:Number(e.target.value)})}/></div>
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
