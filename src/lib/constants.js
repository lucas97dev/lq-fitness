import {
  LayoutDashboard, Utensils, Droplets, Dumbbell, TrendingUp, Ruler,
  Target, User
} from "lucide-react";

export const FOOD_DB_SEED = [
  { id:"f1", name:"Arroz branco cozido", brand:"", per:100, unit:"g", kcal:110, protein:2.5, carb:28, fat:0.2, fiber:1.6, sodium:1 },
  { id:"f2", name:"Feijão carioca cozido", brand:"", per:100, unit:"g", kcal:76, protein:4.8, carb:13.6, fat:0.5, fiber:8.4, sodium:2 },
  { id:"f3", name:"Peito de frango grelhado", brand:"", per:100, unit:"g", kcal:165, protein:31, carb:0, fat:3.6, fiber:0, sodium:74 },
  { id:"f4", name:"Ovo cozido", brand:"", per:1, unit:"unidade", kcal:78, protein:6.3, carb:0.6, fat:5.3, fiber:0, sodium:62 },
  { id:"f5", name:"Pão francês", brand:"", per:1, unit:"unidade", kcal:150, protein:4.7, carb:28, fat:1.6, fiber:1.2, sodium:290 },
  { id:"f6", name:"Banana prata", brand:"", per:1, unit:"unidade", kcal:89, protein:1.1, carb:23, fat:0.3, fiber:2.6, sodium:1 },
  { id:"f7", name:"Aveia em flocos", brand:"", per:100, unit:"g", kcal:389, protein:16.9, carb:66, fat:6.9, fiber:10.6, sodium:2 },
  { id:"f8", name:"Whey protein concentrado", brand:"Growth", per:1, unit:"colher (30g)", kcal:120, protein:24, carb:3, fat:1.5, fiber:0, sodium:50 },
  { id:"f9", name:"Batata doce cozida", brand:"", per:100, unit:"g", kcal:86, protein:1.6, carb:20, fat:0.1, fiber:3, sodium:36 },
  { id:"f10", name:"Azeite de oliva extra virgem", brand:"", per:1, unit:"colher de sopa", kcal:119, protein:0, carb:0, fat:13.5, fiber:0, sodium:0 },
  { id:"f11", name:"Leite integral", brand:"", per:100, unit:"ml", kcal:61, protein:3.2, carb:4.8, fat:3.3, fiber:0, sodium:40 },
  { id:"f12", name:"Iogurte natural integral", brand:"", per:100, unit:"g", kcal:61, protein:3.5, carb:4.7, fat:3.3, fiber:0, sodium:46 },
  { id:"f13", name:"Tapioca (goma hidratada)", brand:"", per:100, unit:"g", kcal:97, protein:0.2, carb:24, fat:0, fiber:0.5, sodium:5 },
  { id:"f14", name:"Patinho moído grelhado", brand:"", per:100, unit:"g", kcal:163, protein:29, carb:0, fat:5, fiber:0, sodium:60 },
  { id:"f15", name:"Salmão grelhado", brand:"", per:100, unit:"g", kcal:208, protein:20, carb:0, fat:13, fiber:0, sodium:59 },
  { id:"f16", name:"Brócolis cozido", brand:"", per:100, unit:"g", kcal:35, protein:2.4, carb:7.2, fat:0.4, fiber:3.3, sodium:33 },
  { id:"f17", name:"Amendoim torrado", brand:"", per:100, unit:"g", kcal:567, protein:25.8, carb:16, fat:49, fiber:8, sodium:18 },
  { id:"f18", name:"Queijo minas frescal", brand:"", per:100, unit:"g", kcal:264, protein:17.4, carb:3.2, fat:20, fiber:0, sodium:346 },
  { id:"f19", name:"Macarrão cozido", brand:"", per:100, unit:"g", kcal:158, protein:5.8, carb:31, fat:0.9, fiber:1.8, sodium:6 },
  { id:"f20", name:"Abacate", brand:"", per:100, unit:"g", kcal:160, protein:2, carb:8.5, fat:14.7, fiber:6.7, sodium:7 },
  { id:"f21", name:"Maçã", brand:"", per:1, unit:"unidade", kcal:95, protein:0.5, carb:25, fat:0.3, fiber:4.4, sodium:2 },
  { id:"f22", name:"Creatina monohidratada", brand:"", per:1, unit:"colher (5g)", kcal:0, protein:0, carb:0, fat:0, fiber:0, sodium:0 },
];

export const MUSCLE_GROUPS = ["Peito","Costas","Pernas","Ombro","Bíceps","Tríceps","Abdômen","Glúteos","Panturrilha","Cardio"];


export const EXERCISE_LIBRARY = [
  // Peito
  {name:"Supino reto barra", group:"Peito", pattern:"empurrar_horizontal", equipment:"barra"},
  {name:"Supino inclinado barra", group:"Peito", pattern:"empurrar_horizontal", equipment:"barra"},
  {name:"Supino reto halteres", group:"Peito", pattern:"empurrar_horizontal", equipment:"halteres"},
  {name:"Supino inclinado halteres", group:"Peito", pattern:"empurrar_horizontal", equipment:"halteres"},
  {name:"Crucifixo reto halteres", group:"Peito", pattern:"isolamento_peito", equipment:"halteres"},
  {name:"Crucifixo inclinado halteres", group:"Peito", pattern:"isolamento_peito", equipment:"halteres"},
  {name:"Crossover (cabo)", group:"Peito", pattern:"isolamento_peito", equipment:"cabo"},
  {name:"Peck deck (voador)", group:"Peito", pattern:"isolamento_peito", equipment:"maquina"},
  {name:"Flexão de braço", group:"Peito", pattern:"empurrar_horizontal", equipment:"peso_corporal"},
  {name:"Supino declinado barra", group:"Peito", pattern:"empurrar_horizontal", equipment:"barra"},
  {name:"Pullover halteres", group:"Peito", pattern:"isolamento_peito", equipment:"halteres"},
  // Costas
  {name:"Puxada frontal (pulley)", group:"Costas", pattern:"puxar_vertical", equipment:"cabo"},
  {name:"Puxada supinada", group:"Costas", pattern:"puxar_vertical", equipment:"cabo"},
  {name:"Remada curvada barra", group:"Costas", pattern:"puxar_horizontal", equipment:"barra"},
  {name:"Remada baixa (cabo)", group:"Costas", pattern:"puxar_horizontal", equipment:"cabo"},
  {name:"Remada unilateral halter (serrote)", group:"Costas", pattern:"puxar_horizontal", equipment:"halteres"},
  {name:"Remada cavalinho (T-bar)", group:"Costas", pattern:"puxar_horizontal", equipment:"barra"},
  {name:"Barra fixa (pull-up)", group:"Costas", pattern:"puxar_vertical", equipment:"peso_corporal"},
  {name:"Levantamento terra", group:"Costas", pattern:"dobradica_quadril", equipment:"barra"},
  {name:"Hiperextensão lombar", group:"Costas", pattern:"dobradica_quadril", equipment:"peso_corporal"},
  {name:"Pulldown com corda", group:"Costas", pattern:"puxar_vertical", equipment:"cabo"},
  // Pernas
  {name:"Agachamento livre", group:"Pernas", pattern:"agachamento", equipment:"barra"},
  {name:"Agachamento smith", group:"Pernas", pattern:"agachamento", equipment:"maquina"},
  {name:"Leg press 45°", group:"Pernas", pattern:"agachamento", equipment:"maquina"},
  {name:"Hack machine", group:"Pernas", pattern:"agachamento", equipment:"maquina"},
  {name:"Cadeira extensora", group:"Pernas", pattern:"isolamento_quadriceps", equipment:"maquina"},
  {name:"Cadeira flexora", group:"Pernas", pattern:"isolamento_posterior", equipment:"maquina"},
  {name:"Mesa flexora", group:"Pernas", pattern:"isolamento_posterior", equipment:"maquina"},
  {name:"Agachamento búlgaro", group:"Pernas", pattern:"agachamento_unilateral", equipment:"halteres"},
  {name:"Avanço (afundo)", group:"Pernas", pattern:"agachamento_unilateral", equipment:"halteres"},
  {name:"Stiff barra", group:"Pernas", pattern:"dobradica_quadril", equipment:"barra"},
  {name:"Stiff halteres", group:"Pernas", pattern:"dobradica_quadril", equipment:"halteres"},
  {name:"Cadeira adutora", group:"Pernas", pattern:"isolamento_adutor", equipment:"maquina"},
  {name:"Cadeira abdutora", group:"Pernas", pattern:"isolamento_abdutor", equipment:"maquina"},
  // Ombro
  {name:"Desenvolvimento militar barra", group:"Ombro", pattern:"empurrar_vertical", equipment:"barra"},
  {name:"Desenvolvimento halteres", group:"Ombro", pattern:"empurrar_vertical", equipment:"halteres"},
  {name:"Desenvolvimento máquina", group:"Ombro", pattern:"empurrar_vertical", equipment:"maquina"},
  {name:"Elevação lateral halteres", group:"Ombro", pattern:"isolamento_ombro", equipment:"halteres"},
  {name:"Elevação frontal halteres", group:"Ombro", pattern:"isolamento_ombro", equipment:"halteres"},
  {name:"Elevação lateral cabo", group:"Ombro", pattern:"isolamento_ombro", equipment:"cabo"},
  {name:"Crucifixo invertido (posterior)", group:"Ombro", pattern:"isolamento_ombro", equipment:"halteres"},
  {name:"Remada alta barra", group:"Ombro", pattern:"puxar_vertical", equipment:"barra"},
  {name:"Encolhimento de ombros (trapézio)", group:"Ombro", pattern:"isolamento_ombro", equipment:"halteres"},
  // Bíceps
  {name:"Rosca direta barra", group:"Bíceps", pattern:"flexao_cotovelo", equipment:"barra"},
  {name:"Rosca direta halteres", group:"Bíceps", pattern:"flexao_cotovelo", equipment:"halteres"},
  {name:"Rosca alternada halteres", group:"Bíceps", pattern:"flexao_cotovelo", equipment:"halteres"},
  {name:"Rosca martelo", group:"Bíceps", pattern:"flexao_cotovelo", equipment:"halteres"},
  {name:"Rosca scott", group:"Bíceps", pattern:"flexao_cotovelo", equipment:"maquina"},
  {name:"Rosca concentrada", group:"Bíceps", pattern:"flexao_cotovelo", equipment:"halteres"},
  {name:"Rosca cabo (polia baixa)", group:"Bíceps", pattern:"flexao_cotovelo", equipment:"cabo"},
  // Tríceps
  {name:"Tríceps corda (polia)", group:"Tríceps", pattern:"extensao_cotovelo", equipment:"cabo"},
  {name:"Tríceps barra (polia)", group:"Tríceps", pattern:"extensao_cotovelo", equipment:"cabo"},
  {name:"Tríceps testa barra", group:"Tríceps", pattern:"extensao_cotovelo", equipment:"barra"},
  {name:"Tríceps francês halter", group:"Tríceps", pattern:"extensao_cotovelo", equipment:"halteres"},
  {name:"Tríceps coice (kickback)", group:"Tríceps", pattern:"extensao_cotovelo", equipment:"halteres"},
  {name:"Mergulho (dips) no banco", group:"Tríceps", pattern:"extensao_cotovelo", equipment:"peso_corporal"},
  {name:"Supino fechado (pegada fechada)", group:"Tríceps", pattern:"empurrar_horizontal", equipment:"barra"},
  // Abdômen
  {name:"Abdominal supra", group:"Abdômen", pattern:"flexao_tronco", equipment:"peso_corporal"},
  {name:"Abdominal infra", group:"Abdômen", pattern:"flexao_tronco", equipment:"peso_corporal"},
  {name:"Prancha isométrica", group:"Abdômen", pattern:"anti_extensao", equipment:"peso_corporal"},
  {name:"Prancha lateral", group:"Abdômen", pattern:"anti_extensao", equipment:"peso_corporal"},
  {name:"Elevação de pernas", group:"Abdômen", pattern:"flexao_tronco", equipment:"peso_corporal"},
  {name:"Abdominal na polia (crunch cabo)", group:"Abdômen", pattern:"flexao_tronco", equipment:"cabo"},
  {name:"Abdominal bicicleta", group:"Abdômen", pattern:"flexao_tronco", equipment:"peso_corporal"},
  {name:"Rotação de tronco (russian twist)", group:"Abdômen", pattern:"rotacao_tronco", equipment:"peso_corporal"},
  // Glúteos
  {name:"Elevação de quadril (hip thrust)", group:"Glúteos", pattern:"dobradica_quadril", equipment:"barra"},
  {name:"Glúteo na polia (coice)", group:"Glúteos", pattern:"isolamento_gluteo", equipment:"cabo"},
  {name:"Cadeira glúteo (glute machine)", group:"Glúteos", pattern:"isolamento_gluteo", equipment:"maquina"},
  {name:"Abdução de quadril", group:"Glúteos", pattern:"isolamento_abdutor", equipment:"maquina"},
  {name:"Ponte de glúteo", group:"Glúteos", pattern:"dobradica_quadril", equipment:"peso_corporal"},
  // Panturrilha
  {name:"Panturrilha em pé", group:"Panturrilha", pattern:"isolamento_panturrilha", equipment:"maquina"},
  {name:"Panturrilha sentado", group:"Panturrilha", pattern:"isolamento_panturrilha", equipment:"maquina"},
  {name:"Panturrilha no leg press", group:"Panturrilha", pattern:"isolamento_panturrilha", equipment:"maquina"},
  // Cardio
  {name:"Esteira (corrida)", group:"Cardio", pattern:"cardio", equipment:"maquina"},
  {name:"Esteira (caminhada inclinada)", group:"Cardio", pattern:"cardio", equipment:"maquina"},
  {name:"Bicicleta ergométrica", group:"Cardio", pattern:"cardio", equipment:"maquina"},
  {name:"Elíptico", group:"Cardio", pattern:"cardio", equipment:"maquina"},
  {name:"Escada (stairmaster)", group:"Cardio", pattern:"cardio", equipment:"maquina"},
  {name:"Pular corda", group:"Cardio", pattern:"cardio", equipment:"peso_corporal"},
  {name:"Remo (remada cardio)", group:"Cardio", pattern:"cardio", equipment:"maquina"},
];

export const EQUIPMENT_LABELS = { barra:"Barra", halteres:"Halteres", maquina:"Máquina", cabo:"Cabo/Polia", peso_corporal:"Peso corporal" };

export const NAV = [
  { key:"dashboard", label:"Dashboard", icon:LayoutDashboard },
  { key:"diet", label:"Dieta", icon:Utensils },
  { key:"water", label:"Água", icon:Droplets },
  { key:"workout", label:"Treino", icon:Dumbbell },
  { key:"evolution", label:"Evolução", icon:TrendingUp },
  { key:"body", label:"Medidas", icon:Ruler },
  { key:"goals", label:"Metas", icon:Target },
  { key:"profile", label:"Perfil", icon:User },
];

/* ============================================================
   MAIN APP
============================================================ */

export const WEEKDAYS = [
  { dow:1, label:"Segunda" }, { dow:2, label:"Terça" }, { dow:3, label:"Quarta" },
  { dow:4, label:"Quinta" }, { dow:5, label:"Sexta" }, { dow:6, label:"Sábado" }, { dow:0, label:"Domingo" },
];

