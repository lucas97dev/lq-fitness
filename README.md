[README.md](https://github.com/user-attachments/files/29719726/README.md)
# EQ Fitness

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
git commit -m "EQ Fitness inicial"
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

## Login (Supabase)
O app agora tem tela de entrar/criar conta com email e senha. O perfil (dados pessoais e metas) fica
salvo no Supabase e sincroniza entre qualquer aparelho em que você logar com a mesma conta.
Dieta, treinos e medidas por enquanto continuam salvos só no aparelho (localStorage).

**Importante — confirmação de email:** por padrão, o Supabase exige que o usuário confirme o email
antes de conseguir entrar (chega um link na caixa de entrada). Se quiser testar mais rápido sem esse
passo, vá em **Authentication → Providers → Email** no painel do Supabase e desative a opção
**"Confirm email"**. Se deixar ativado, ao criar conta é só abrir o email recebido e clicar no link
antes de tentar entrar.

## Sobre os dados salvos
Os dados ficam salvos no `localStorage` do navegador do próprio celular/computador.
Isso significa que os dados **não sincronizam sozinhos entre aparelhos diferentes** —
cada navegador/dispositivo tem seu próprio histórico. Para sincronizar entre
dispositivos seria necessário adicionar um banco de dados na nuvem (ex: Supabase, Firebase).
