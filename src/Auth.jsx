import React, { useState } from "react";
import { supabase } from "./supabaseClient.js";

export default function Auth(){
  const [mode, setMode] = useState("login"); // login | signup | forgot
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  function resetFeedback(){ setError(null); setMessage(null); }

  async function handleSubmit(e){
    e.preventDefault();
    resetFeedback(); setLoading(true);
    try{
      if(mode === "login"){
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if(error) throw error;
      } else if(mode === "signup"){
        const { error } = await supabase.auth.signUp({ email, password });
        if(error) throw error;
        setMessage("Conta criada! Se a confirmação por email estiver ativa no projeto, verifique sua caixa de entrada antes de entrar.");
      } else if(mode === "forgot"){
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        });
        if(error) throw error;
        setMessage("Enviamos um link para redefinir sua senha no email informado. Abra o email e clique no link — ele vai te trazer de volta aqui para escolher uma senha nova.");
      }
    }catch(err){
      setError(traduzErro(err.message));
    }finally{
      setLoading(false);
    }
  }

  function traduzErro(msg){
    if(!msg) return "Algo deu errado. Tente novamente.";
    if(msg.includes("Invalid login credentials")) return "Email ou senha incorretos.";
    if(msg.includes("User already registered")) return "Já existe uma conta com esse email. Tente entrar.";
    if(msg.includes("Password should be at least")) return "A senha precisa ter pelo menos 6 caracteres.";
    if(msg.includes("Email not confirmed")) return "Confirme seu email antes de entrar (verifique sua caixa de entrada).";
    if(msg.includes("rate limit") || msg.includes("For security purposes")) return "Aguarde um pouco antes de tentar de novo.";
    return msg;
  }

  const titles = { login:"Entrar na sua conta", signup:"Criar conta", forgot:"Recuperar senha" };
  const buttonLabels = { login:"Entrar", signup:"Criar conta", forgot:"Enviar link de redefinição" };

  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={S.brandRow}>
          <div style={S.brandMark}><img src="/logo.jpg" alt="EQ Fitness" style={S.brandMarkImg}/></div>
          <div>
            <div style={S.brandName}>EQ Fitness</div>
            <div style={S.brandSub}>Elane Quezia Dias · Nutricionista</div>
          </div>
        </div>
        <h2 style={S.title}>{titles[mode]}</h2>
        {mode === "forgot" && (
          <div style={{fontSize:12.5, color:"#ab9c8c", marginBottom:16, lineHeight:1.5}}>
            Digite o email da sua conta. Vamos te enviar um link pra escolher uma senha nova.
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div style={{marginBottom:14}}>
            <label style={S.label}>Email</label>
            <input type="email" required value={email} onChange={e=>setEmail(e.target.value)} style={S.input}/>
          </div>
          {mode !== "forgot" && (
            <div style={{marginBottom:20}}>
              <label style={S.label}>Senha</label>
              <input type="password" required minLength={6} value={password} onChange={e=>setPassword(e.target.value)} style={S.input}/>
            </div>
          )}
          {error && <div style={S.error}>{error}</div>}
          {message && <div style={S.success}>{message}</div>}
          <button type="submit" disabled={loading} style={{...S.button, opacity: loading ? 0.6 : 1}}>
            {loading ? "Aguarde..." : buttonLabels[mode]}
          </button>
        </form>

        {mode === "login" && (
          <div style={{textAlign:"center", marginTop:12}}>
            <button style={S.linkBtn} onClick={()=>{ setMode("forgot"); resetFeedback(); }}>Esqueci minha senha</button>
          </div>
        )}

        <div style={S.switchRow}>
          {mode === "login" && (
            <>Ainda não tem conta?{" "}
              <button style={S.linkBtn} onClick={()=>{ setMode("signup"); resetFeedback(); }}>Criar conta</button>
            </>
          )}
          {mode === "signup" && (
            <>Já tem conta?{" "}
              <button style={S.linkBtn} onClick={()=>{ setMode("login"); resetFeedback(); }}>Entrar</button>
            </>
          )}
          {mode === "forgot" && (
            <>Lembrou a senha?{" "}
              <button style={S.linkBtn} onClick={()=>{ setMode("login"); resetFeedback(); }}>Voltar para o login</button>
            </>
          )}
        </div>
        <div style={S.footerCredit}>Feito por Lucas Morais</div>
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
  brandSub:{ color:"#d9a94f", fontSize:11, fontWeight:600, marginTop:2 },
  title:{ color:"#f5ede3", fontSize:16, marginBottom:16 },
  label:{ fontSize:11.5, fontWeight:700, color:"#ab9c8c", textTransform:"uppercase", letterSpacing:"0.04em", display:"block", marginBottom:6 },
  input:{ width:"100%", background:"#1c1611", border:"1px solid #382a20", borderRadius:9, padding:"9px 12px", color:"#f5ede3", fontSize:13.5, outline:"none", boxSizing:"border-box" },
  error:{ color:"#e0684a", fontSize:12.5, marginBottom:14 },
  success:{ color:"#d9a94f", fontSize:12.5, marginBottom:14 },
  button:{ width:"100%", background:"#d9a94f", color:"#241505", border:"none", borderRadius:10, padding:"10px 15px", fontWeight:700, fontSize:13.5, cursor:"pointer" },
  switchRow:{ marginTop:16, textAlign:"center", fontSize:12.5, color:"#ab9c8c" },
  linkBtn:{ background:"none", border:"none", color:"#c98a9c", cursor:"pointer", fontWeight:600, fontSize:12.5, padding:0 },
  footerCredit:{ textAlign:"center", fontSize:10, color:"#71655a", marginTop:20, paddingTop:14, borderTop:"1px solid #382a20" },
};
