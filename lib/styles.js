export const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700;800&display=swap');

:root{
  --bg: #f6f1e8;
  --bg-elev: #efe7d6;
  --card: #ffffff;
  --card-hover: #faf6ee;
  --border: #e4dcc9;
  --border-soft: #ece4d2;
  --text: #2c2419;
  --text-dim: #7d7161;
  --text-faint: #a89a84;
  --accent: #b8863a;
  --accent-dim: #8a6528;
  --accent-glow: rgba(184,134,58,0.14);
  --blue: #71844a;
  --blue-dim: rgba(113,132,74,0.14);
  --amber: #8c3350;
  --amber-dim: rgba(140,51,80,0.13);
  --red: #ab4530;
  --purple: #a8677a;
}
*{box-sizing:border-box;}
.fitapp{
  font-family:'Inter',system-ui,sans-serif;
  background:var(--bg);
  color:var(--text);
  min-height:100vh;
  width:100%;
  display:flex;
  position:relative;
  -webkit-font-smoothing:antialiased;
}
.fitapp h1,.fitapp h2,.fitapp h3,.fitapp .display{
  font-family:'Space Grotesk',system-ui,sans-serif;
  letter-spacing:-0.01em;
}
.fitapp ::-webkit-scrollbar{width:8px;height:8px;}
.fitapp ::-webkit-scrollbar-thumb{background:#e4dcc9;border-radius:8px;}
.fitapp ::-webkit-scrollbar-track{background:transparent;}
.fitapp button{font-family:inherit;cursor:pointer;}
.fitapp input,.fitapp select,.fitapp textarea{font-family:inherit;}

/* ---- SIDEBAR ---- */
.sidebar{
  width:236px; flex-shrink:0; background:var(--bg-elev);
  border-right:1px solid var(--border-soft);
  padding:22px 14px; display:flex; flex-direction:column; gap:4px;
  position:fixed; top:0; left:0; height:100vh; z-index:200;
  transition:transform .25s ease; transform:translateX(0);
  box-shadow:0 0 50px rgba(0,0,0,0.35);
}
.sidebar.closed{ transform:translateX(-100%); box-shadow:none; }
.sidebar-backdrop{ display:none; }
@media(max-width:900px){
  .sidebar-backdrop.show{ display:block; position:fixed; inset:0; background:rgba(4,7,10,0.6); z-index:150; }
}
.sidebar-top{display:flex;align-items:center;justify-content:space-between;padding:0 2px 4px;}
.collapse-btn{background:none;border:1px solid var(--border);border-radius:8px;color:var(--text-dim);padding:6px;flex-shrink:0;}
.collapse-btn:hover{background:var(--card);color:var(--text);}
.menu-toggle{
  position:fixed; top:18px; left:18px; z-index:120;
  background:var(--card); border:1px solid var(--border); border-radius:10px;
  padding:9px; color:var(--text); display:flex; box-shadow:0 4px 18px rgba(0,0,0,0.3);
}
.menu-toggle:hover{border-color:#334252;}
.brand{display:flex;align-items:center;gap:10px;padding:6px 10px 22px 10px;}
.brand-mark{
  width:40px;height:40px;border-radius:11px;
  background:#ffffff;
  display:flex;align-items:center;justify-content:center;
  overflow:hidden; flex-shrink:0;
  border:1px solid rgba(184,134,58,0.35);
  box-shadow:0 2px 8px rgba(44,36,25,0.10);
}
.brand-mark img{width:100%;height:100%;object-fit:cover;}
.brand-name{font-family:'Space Grotesk';font-weight:700;font-size:16.5px;letter-spacing:-0.02em;}
.brand-sub{font-size:10.5px;color:var(--text-faint);margin-top:1px;}

.navitem{
  display:flex;align-items:center;gap:11px;padding:10px 12px;border-radius:10px;
  color:var(--text-dim); font-size:13.5px; font-weight:600; border:1px solid transparent;
  transition:all .15s ease; background:none;
}
.navitem:hover{background:var(--card); color:var(--text);}
.navitem.active{background:var(--accent-glow); color:var(--accent); border-color:rgba(62,230,168,0.25);}
.navitem svg{flex-shrink:0;}

.sidebar-foot{margin-top:auto;padding:12px 10px;border-top:1px solid var(--border-soft);}
.streak-pill{
  display:flex;align-items:center;gap:8px;background:var(--amber-dim);
  border:1px solid rgba(255,182,72,0.25); border-radius:12px;padding:9px 12px;
}
.streak-pill b{font-family:'Space Grotesk';font-size:15px;color:var(--amber);}
.streak-pill span{font-size:11px;color:var(--text-dim);}

/* ---- MAIN ---- */
.main{flex:1; min-width:0; padding:28px 34px 60px; max-width:1360px; margin-left:236px; transition:margin-left .25s ease;}
.main.full{margin-left:0; padding-top:64px;}
@media(max-width:900px){ .main{margin-left:0 !important; padding:66px 16px 40px;} }
.topbar{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:26px;flex-wrap:wrap;gap:14px;}
.greeting{font-size:23px;font-weight:700;}
.greeting-date{color:var(--text-dim);font-size:13px;margin-top:3px;text-transform:capitalize;}

.grid{display:grid;gap:16px;}
.grid-4{grid-template-columns:repeat(4,1fr);}
.grid-3{grid-template-columns:repeat(3,1fr);}
.grid-2{grid-template-columns:repeat(2,1fr);}
@media(max-width:1100px){.grid-4{grid-template-columns:repeat(2,1fr);}.grid-3{grid-template-columns:repeat(2,1fr);}}
@media(max-width:720px){.grid-4,.grid-3,.grid-2{grid-template-columns:1fr;}}

.card{
  background:var(--card); border:1px solid var(--border-soft); border-radius:16px;
  padding:18px 20px;
}
.card-title{font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:0.06em; color:var(--text-dim); margin-bottom:12px; display:flex;align-items:center;justify-content:space-between;}

.stat-card{display:flex;flex-direction:column;gap:6px;}
.stat-label{font-size:11.5px;color:var(--text-dim);font-weight:600;text-transform:uppercase;letter-spacing:0.04em;}
.stat-value{font-family:'Space Grotesk';font-size:26px;font-weight:700;}
.stat-sub{font-size:12px;color:var(--text-faint);}
.stat-delta{font-size:12px;font-weight:700;display:flex;align-items:center;gap:3px;}
.delta-up{color:var(--accent);}
.delta-down{color:var(--red);}

/* rings */
.rings-wrap{display:flex;align-items:center;gap:26px;flex-wrap:wrap;}
.ring-legend{display:flex;flex-direction:column;gap:10px;flex:1;min-width:180px;}
.ring-leg-item{display:flex;align-items:center;gap:9px;font-size:12.5px;}
.ring-dot{width:9px;height:9px;border-radius:3px;flex-shrink:0;}
.ring-leg-val{margin-left:auto;font-weight:700;color:var(--text);font-family:'Space Grotesk';}

/* progress bars */
.pbar-row{margin-bottom:12px;}
.pbar-top{display:flex;justify-content:space-between;font-size:12.5px;margin-bottom:6px;}
.pbar-top b{font-weight:700;}
.pbar-track{height:8px;border-radius:5px;background:var(--border-soft);overflow:hidden;}
.pbar-fill{height:100%;border-radius:5px;transition:width .4s ease;}

.btn{
  display:inline-flex;align-items:center;gap:7px;padding:9px 15px;border-radius:10px;
  border:1px solid var(--border); background:var(--card-hover); color:var(--text);
  font-size:13px; font-weight:600; transition:all .15s;
}
.btn:hover{border-color:#334252;}
.btn-primary{background:var(--accent); color:#241505; border-color:var(--accent);}
.btn-primary:hover{background:#e6bb6c;}
.btn-blue{background:var(--blue); color:#161d08; border-color:var(--blue);}
.btn-amber{background:var(--amber); color:#fbe9ec; border-color:var(--amber);}
.btn-amber:hover{background:#a83c54;}
.btn-ghost{background:transparent;border-color:transparent;color:var(--text-dim);}
.btn-ghost:hover{background:var(--card-hover);color:var(--text);}
.btn-danger{background:transparent;border-color:rgba(255,107,107,0.3);color:var(--red);}
.btn-sm{padding:6px 11px;font-size:12px;border-radius:8px;}
.btn:disabled{opacity:0.4;cursor:not-allowed;}

.input, select.input, textarea.input{
  background:var(--bg-elev); border:1px solid var(--border); border-radius:9px;
  padding:9px 12px; color:var(--text); font-size:13.5px; width:100%; outline:none;
}
.input:focus{border-color:var(--accent);}
label.flabel{font-size:11.5px;font-weight:700;color:var(--text-dim);text-transform:uppercase;letter-spacing:0.04em;display:block;margin-bottom:6px;}
.field{margin-bottom:14px;}

.section-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:10px;}
.section-head h2{font-size:19px;font-weight:700;}

.tabs{display:flex;gap:4px;background:var(--bg-elev);padding:4px;border-radius:11px;border:1px solid var(--border-soft);width:fit-content;flex-wrap:wrap;}
.tab-btn{padding:7px 14px;border-radius:8px;font-size:12.5px;font-weight:600;color:var(--text-dim);background:none;border:none;}
.tab-btn.active{background:var(--card); color:var(--text);}

.list-row{display:flex;align-items:center;gap:12px;padding:11px 4px;border-bottom:1px solid var(--border-soft);}
.list-row:last-child{border-bottom:none;}

.badge{font-size:10.5px;font-weight:700;padding:3px 8px;border-radius:6px;text-transform:uppercase;letter-spacing:0.03em;}
.badge-accent{background:var(--accent-glow);color:var(--accent);}
.badge-blue{background:var(--blue-dim);color:var(--blue);}
.badge-amber{background:var(--amber-dim);color:var(--amber);}
.badge-muted{background:var(--border-soft);color:var(--text-dim);}

.empty{text-align:center;padding:34px 20px;color:var(--text-faint);font-size:13px;}

.modal-overlay{position:fixed;inset:0;background:rgba(4,7,10,0.68);backdrop-filter:blur(3px);z-index:100;display:flex;align-items:center;justify-content:center;padding:16px;}
.modal{background:var(--bg-elev);border:1px solid var(--border);border-radius:18px;padding:22px;width:100%;max-width:480px;max-height:88vh;overflow-y:auto;}
.modal-wide{max-width:640px;}
.modal-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;}
.modal-head h3{font-size:16.5px;font-weight:700;}
.iconbtn{background:none;border:none;color:var(--text-dim);padding:5px;border-radius:8px;}
.iconbtn:hover{background:var(--card);color:var(--text);}

.food-search-item{display:flex;justify-content:space-between;align-items:center;padding:10px 8px;border-radius:9px;cursor:pointer;}
.food-search-item:hover{background:var(--card);}

.exercise-card{background:var(--bg-elev);border:1px solid var(--border-soft);border-radius:13px;padding:14px 16px;margin-bottom:10px;}
.set-row{display:grid;grid-template-columns:28px 1fr 1fr 1fr 32px;gap:8px;align-items:center;margin-bottom:6px;}
.set-row input{text-align:center;padding:7px 4px;}
.set-num{font-size:11.5px;color:var(--text-faint);font-weight:700;text-align:center;}
.set-done{background:var(--accent-glow) !important;border-color:var(--accent) !important;}

.chip{display:inline-flex;align-items:center;gap:5px;padding:5px 10px;border-radius:20px;background:var(--bg-elev);border:1px solid var(--border);font-size:12px;font-weight:600;color:var(--text-dim);}
.chip.active{background:var(--accent-glow);border-color:var(--accent);color:var(--accent);}

.timer-fab{
  position:fixed; bottom:24px; right:24px; background:var(--accent); color:#241505;
  border-radius:50px; padding:14px 22px; font-family:'Space Grotesk'; font-weight:700; font-size:16px;
  display:flex; align-items:center; gap:10px; box-shadow:0 8px 30px rgba(62,230,168,0.35); z-index:60; border:none;
}
@media(max-width:720px){.timer-fab{bottom:80px;}}

.water-glass-grid{display:grid;grid-template-columns:repeat(8,1fr);gap:7px;margin-top:14px;}
.water-glass{aspect-ratio:1;border-radius:8px;border:1.5px solid var(--border);background:var(--bg-elev);}
.water-glass.filled{background:var(--amber-dim);border-color:var(--amber);}

.pr-tag{display:flex;align-items:center;gap:5px;font-size:11px;font-weight:700;color:#0a1a12;background:linear-gradient(135deg,#ffd76b,#ffb648);padding:3px 9px;border-radius:7px;}

.calendar-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:5px;}
.cal-cell{aspect-ratio:1;border-radius:9px;border:1px solid var(--border-soft);display:flex;align-items:center;justify-content:center;font-size:12px;color:var(--text-dim);position:relative;background:var(--card);}
.cal-cell.trained{background:#dcefd5;border-color:#7fb56d;color:#2f5c26;font-weight:700;}
.cal-cell.today{outline:1.5px solid var(--text);}
.cal-legend{display:flex;align-items:center;gap:6px;font-size:11px;color:var(--text-faint);}
.cal-legend-dot{width:9px;height:9px;border-radius:3px;background:#dcefd5;border:1px solid #7fb56d;}
.cal-dot{position:absolute;bottom:4px;width:4px;height:4px;border-radius:50%;background:var(--blue);}

@media(max-width:900px){
  .greeting{font-size:20px;}
}

/* ---- Print / PDF export (admin evolution report) ---- */
@media print{
  body *{ visibility:hidden; }
  .admin-print-report, .admin-print-report *{ visibility:visible; }
  .admin-print-report{ position:absolute; left:0; top:0; width:100%; padding:20px; }
  .no-print{ display:none !important; }
  .card{ break-inside:avoid; border:1px solid #ddd; }
  .fitapp{ background:#fff; }
}
`;

/* ============================================================
   SEED DATA
============================================================ */
