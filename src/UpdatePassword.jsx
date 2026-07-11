import React, { useState } from "react";
import { supabase } from "./supabaseClient.js";

export default function UpdatePassword({ onDone }){
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e){
    e.preventDefault();
    setError(null);
    if(password.length < 6){ setError("A senha precisa ter pelo menos 6 caracteres."); return; }
    if(password !== confirm){ setError("As senhas não coincidem."); return; }
    setLoading(true);
    try{
      const { error } = await supabase.auth.updateUser({ password });
      if(error) throw error;
      setDone(true);
    }catch(err){
      setError(err.message || "Não foi possível atualizar a senha.");
    }finally{
      setLoading(false);
    }
  }

  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={S.brandRow}>
          <div style={S.brandMark}><img src="/logo.jpg" alt="EQ Fitness" style={S.brandMarkImg}/></div>
          <div style={S.brandName}>EQ Fitness</div>
        </div>
        <h2 style={S.title}>Escolher nova senha</h2>

        {done ? (
          <>
            <div style={S.success}>Senha atualizada com sucesso!</div>
            <button style={S.button} onClick={onDone}>Continuar para o app</button>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{marginBottom:14}}>
              <label style={S.label}>Nova senha</label>
              <input type="password" required minLength={6} value={password} onChange={e=>setPassword(e.target.value)} style={S.input}/>
            </div>
            <div style={{marginBottom:20}}>
              <label style={S.label}>Confirmar nova senha</label>
              <input type="password" required minLength={6} value={confirm} onChange={e=>setConfirm(e.target.value)} style={S.input}/>
            </div>
            {error && <div style={S.error}>{error}</div>}
            <button type="submit" disabled={loading} style={{...S.button, opacity: loading ? 0.6 : 1}}>
              {loading ? "Salvando..." : "Salvar nova senha"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

const S = {
  page:{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#15100d", fontFamily:"'Inter',system-ui,sans-serif", padding:16 },
  card:{ width:"100%", maxWidth:380, background:"#221a15", border:"1px solid #382a20", borderRadius:18, padding:28 },
  brandRow:{ display:"flex", alignItems:"center", gap:12, marginBottom:24 },
  brandMark:{ width:44, height:44, borderRadius:12, background:"#efe6d8", display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden", flexShrink:0, border:"1px solid rgba(217,169,79,0.35)" },
  brandMarkImg:{ width:"100%", height:"100%", objectFit:"cover" },
  brandName:{ color:"#f5ede3", fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:18 },
  title:{ color:"#f5ede3", fontSize:16, marginBottom:16 },
  label:{ fontSize:11.5, fontWeight:700, color:"#ab9c8c", textTransform:"uppercase", letterSpacing:"0.04em", display:"block", marginBottom:6 },
  input:{ width:"100%", background:"#1c1611", border:"1px solid #382a20", borderRadius:9, padding:"9px 12px", color:"#f5ede3", fontSize:13.5, outline:"none", boxSizing:"border-box" },
  error:{ color:"#e0684a", fontSize:12.5, marginBottom:14 },
  success:{ color:"#d9a94f", fontSize:12.5, marginBottom:16 },
  button:{ width:"100%", background:"#d9a94f", color:"#241505", border:"none", borderRadius:10, padding:"10px 15px", fontWeight:700, fontSize:13.5, cursor:"pointer" },
};
