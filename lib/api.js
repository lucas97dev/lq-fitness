import { supabase } from "../supabaseClient.js";
import { uid, fmt1 } from "./helpers.js";

export async function loadKey(userId, key, fallback){
  try{
    const { data, error } = await supabase.from("user_data").select("value").eq("user_id", userId).eq("key", key).maybeSingle();
    if(error || !data) return fallback;
    return data.value;
  }catch(e){ return fallback; }
}
export async function saveKey(userId, key, value){
  try{
    await supabase.from("user_data").upsert({ user_id:userId, key, value, updated_at:new Date().toISOString() });
  }catch(e){ console.error("Erro ao salvar", key, e); }
}
export async function deleteAllUserData(userId){
  try{ await supabase.from("user_data").delete().eq("user_id", userId); }catch(e){ /* noop */ }
}
export async function deleteKey(userId, key){
  try{ await supabase.from("user_data").delete().eq("user_id", userId).eq("key", key); }catch(e){ /* noop */ }
}
// Every day's diary is saved under its own key ("diary:2026-07-13", etc.) —
// this fetches all of them at once for the history browser, most recent first.
export async function loadDiaryHistory(userId){
  try{
    const { data, error } = await supabase.from("user_data")
      .select("key, value")
      .eq("user_id", userId)
      .like("key", "diary:%")
      .order("key", { ascending: false });
    if(error || !data) return [];
    return data.map(row => ({ date: row.key.slice(6), meals: row.value?.meals || [] }));
  }catch(e){ return []; }
}

// Used by the admin panel to prescribe diet/workout for a specific patient.
// Only works for keys the "admins" RLS policy allows writing (diet-plan, fichas) —
// enforced server-side, not just in this function.
export async function savePatientData(patientUserId, key, value){
  try{
    const { error } = await supabase.from("user_data").upsert({ user_id:patientUserId, key, value, updated_at:new Date().toISOString() });
    if(error) console.error("Erro ao salvar dado do paciente:", error.message);
  }catch(e){ console.error("Erro ao salvar dado do paciente:", e); }
}

// Free, keyless nutrition lookup via Open Food Facts — values come back per 100g/100ml.
export async function searchOpenFoodFacts(query){
  try{
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=15&fields=product_name,brands,nutriments,quantity`;
    const res = await fetch(url);
    if(!res.ok) return [];
    const data = await res.json();
    return (data.products||[])
      .filter(p => p.product_name && p.nutriments && p.nutriments["energy-kcal_100g"]!=null)
      .map(p => ({
        name: p.product_name.trim(),
        brand: (p.brands||"").split(",")[0].trim(),
        per: 100, unit:"g",
        kcal: Math.round(p.nutriments["energy-kcal_100g"]||0),
        protein: fmt1(p.nutriments["proteins_100g"]||0),
        carb: fmt1(p.nutriments["carbohydrates_100g"]||0),
        fat: fmt1(p.nutriments["fat_100g"]||0),
        fiber: fmt1(p.nutriments["fiber_100g"]||0),
        sodium: Math.round((p.nutriments["sodium_100g"]||0)*1000),
      }))
      .filter((v,i,arr)=> arr.findIndex(x=>x.name===v.name && x.brand===v.brand)===i) // dedupe
      .slice(0,12);
  }catch(e){ console.error("Erro ao buscar alimento online:", e); return []; }
}

/* ---- Supabase profile row <-> app profile object mapping ---- */
export function dbRowToProfile(row){
  return {
    name: row.name ?? "", height: row.height ?? 170, weight: row.weight ?? 70,
    initialWeight: row.initial_weight ?? row.weight ?? 70, gender: row.gender ?? "M", age: row.age ?? 25,
    goal: row.goal ?? "Manutenção", experience: row.experience ?? "Iniciante",
    caloriesTarget: row.calories_target ?? 2200, proteinTarget: row.protein_target ?? 150,
    carbTarget: row.carb_target ?? 220, fatTarget: row.fat_target ?? 60, waterTarget: row.water_target ?? 3,
  };
}
export function profileToDbRow(p, userId){
  return {
    id: userId, name: p.name, height: p.height, weight: p.weight, initial_weight: p.initialWeight,
    gender: p.gender, age: p.age, goal: p.goal, experience: p.experience,
    calories_target: p.caloriesTarget, protein_target: p.proteinTarget,
    carb_target: p.carbTarget, fat_target: p.fatTarget, water_target: p.waterTarget,
    updated_at: new Date().toISOString(),
  };
}
export async function loadProfileFromSupabase(userId){
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  if(error){ console.error("Erro ao carregar perfil:", error.message); return null; }
  return data ? dbRowToProfile(data) : null;
}
export async function saveProfileToSupabase(profile, userId){
  const row = profileToDbRow(profile, userId);
  const { error } = await supabase.from("profiles").upsert(row);
  if(error) console.error("Erro ao salvar perfil:", error.message);
}

/* ---- Evolution photos: Supabase Storage + body_photos table ---- */
export const PHOTOS_BUCKET = "progress-photos";

export async function uploadEvolutionPhoto(file, dateStr, userId){
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `${userId}/${Date.now()}-${uid()}.${ext}`;
  const { error: upErr } = await supabase.storage.from(PHOTOS_BUCKET).upload(path, file, { upsert:false });
  if(upErr) throw upErr;
  const { data, error: insErr } = await supabase.from("body_photos")
    .insert({ user_id:userId, date:dateStr, storage_path:path }).select().single();
  if(insErr) throw insErr;
  return data;
}
export async function loadEvolutionPhotos(userId){
  const { data, error } = await supabase.from("body_photos").select("*").eq("user_id", userId).order("date", { ascending:false });
  if(error){ console.error("Erro ao carregar fotos:", error.message); return []; }
  const withUrls = await Promise.all((data||[]).map(async p=>{
    const { data: signed } = await supabase.storage.from(PHOTOS_BUCKET).createSignedUrl(p.storage_path, 3600);
    return { ...p, url: signed?.signedUrl || null };
  }));
  return withUrls;
}
export async function deleteEvolutionPhoto(photo){
  await supabase.storage.from(PHOTOS_BUCKET).remove([photo.storage_path]);
  const { error } = await supabase.from("body_photos").delete().eq("id", photo.id);
  if(error) throw error;
}

/* ============================================================
   SMALL UI PRIMITIVES
============================================================ */
