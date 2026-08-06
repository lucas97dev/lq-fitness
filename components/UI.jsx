import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { X } from "lucide-react";

export function ProgressBar({ label, value, max, unit="", color="var(--accent)" }){
  const pct = Math.min(100, Math.round((value/Math.max(max,0.0001))*100));
  return (
    <div className="pbar-row">
      <div className="pbar-top">
        <span style={{color:"var(--text-dim)"}}>{label}</span>
        <b>{fmt1(value)}{unit} <span style={{color:"var(--text-faint)",fontWeight:500}}>/ {fmt1(max)}{unit} · {pct}%</span></b>
      </div>
      <div className="pbar-track"><div className="pbar-fill" style={{width:pct+"%", background:color}} /></div>
    </div>
  );
}

export function Ring({ pct, color, r, sw, cx, cy }){
  const circ = 2*Math.PI*r;
  const off = circ * (1 - Math.min(1,pct));
  return (
    <>
      <circle cx={cx} cy={cy} r={r} stroke="var(--border-soft)" strokeWidth={sw} fill="none" />
      <circle cx={cx} cy={cy} r={r} stroke={color} strokeWidth={sw} fill="none"
        strokeDasharray={circ} strokeDashoffset={off} strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`} style={{transition:"stroke-dashoffset .6s ease"}}/>
    </>
  );
}

export function VitalRings({ calPct, proPct, waterPct }){
  const size=178, cx=size/2, cy=size/2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Ring pct={calPct} color="var(--accent)" r={78} sw={12} cx={cx} cy={cy} />
      <Ring pct={proPct} color="var(--blue)" r={58} sw={12} cx={cx} cy={cy} />
      <Ring pct={waterPct} color="var(--amber)" r={38} sw={12} cx={cx} cy={cy} />
    </svg>
  );
}

export function Modal({ title, onClose, children, wide }){
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={"modal" + (wide?" modal-wide":"")} onClick={e=>e.stopPropagation()}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="iconbtn" onClick={onClose}><X size={19}/></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function CelebrationModal({ celebration, onClose }){
  if(!celebration) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{textAlign:"center", maxWidth:360}} onClick={e=>e.stopPropagation()}>
        <div style={{fontSize:52, marginBottom:10, lineHeight:1}}>{celebration.emoji || "🎉"}</div>
        <h3 style={{fontSize:19, marginBottom:8}}>{celebration.title}</h3>
        <div style={{fontSize:13.5, color:"var(--text-dim)", marginBottom:22, lineHeight:1.5}}>{celebration.subtitle}</div>
        <button className="btn btn-primary" style={{width:"100%",justifyContent:"center"}} onClick={onClose}>Continuar</button>
      </div>
    </div>
  );
}


export class ErrorBoundary extends React.Component {
  constructor(props){ super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error){ return { error }; }
  componentDidCatch(error, info){ console.error("Erro na tela:", error, info); }
  render(){
    if(this.state.error){
      return (
        <div className="card" style={{margin:"20px 0"}}>
          <div className="card-title" style={{color:"var(--red)"}}>Ops, algo deu errado nessa tela</div>
          <div style={{fontSize:12.5,color:"var(--text-dim)",marginBottom:10}}>
            Tenta trocar de aba e voltar. Se continuar acontecendo, manda esse texto pro suporte:
          </div>
          <pre style={{fontSize:11,color:"var(--text-faint)",whiteSpace:"pre-wrap",background:"var(--bg-elev)",padding:10,borderRadius:8,overflowX:"auto"}}>
            {String(this.state.error?.message || this.state.error)}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}


export function PromptModal({ title, placeholder, onSave, onClose }){
  const [val, setVal] = useState("");
  return (
    <Modal title={title} onClose={onClose}>
      <div className="field"><input className="input" autoFocus placeholder={placeholder} value={val} onChange={e=>setVal(e.target.value)} onKeyDown={e=>e.key==="Enter"&&val.trim()&&onSave(val.trim())}/></div>
      <button className="btn btn-primary" style={{width:"100%",justifyContent:"center"}} onClick={()=>val.trim()&&onSave(val.trim())}>Salvar</button>
    </Modal>
  );
}


export function NumField({ label, value, onChange }){
  return (
    <div className="field">
      <label className="flabel">{label}</label>
      <input className="input" type="number" step="0.1" value={numDisplay(value)} onChange={e=>onChange(Number(e.target.value))}/>
    </div>
  );
}

