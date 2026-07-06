# LQ Fitness

App de treino, dieta e evolução física (React + Vite).

## Rodar localmente
```
npm install
npm run dev
```

## Subir no GitHub
```
git init
git add .
git commit -m "LQ Fitness inicial"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/lq-fitness.git
git push -u origin main
```

## Colocar no ar (grátis) — Vercel
1. Acesse vercel.com e faça login com GitHub.
2. "Add New Project" → selecione o repositório `lq-fitness`.
3. Framework preset: Vite (detecta sozinho). Clique em Deploy.
4. Você recebe uma URL tipo `https://lq-fitness.vercel.app`.

## Usar no celular
Abra a URL da Vercel no navegador do celular (Chrome/Safari) e:
- **Android (Chrome)**: menu ⋮ → "Adicionar à tela inicial".
- **iPhone (Safari)**: botão de compartilhar → "Adicionar à Tela de Início".

Isso cria um ícone que abre o app em tela cheia, como um aplicativo nativo.

## Sobre os dados salvos
Os dados ficam salvos no `localStorage` do navegador do próprio celular/computador.
Isso significa que os dados **não sincronizam sozinhos entre aparelhos diferentes** —
cada navegador/dispositivo tem seu próprio histórico. Para sincronizar entre
dispositivos seria necessário adicionar um banco de dados na nuvem (ex: Supabase, Firebase).
