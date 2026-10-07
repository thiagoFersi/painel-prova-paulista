# Painel Prova Paulista e Alura

Painel por escola com a Prova Paulista (TEC) e a avaliação Alura, por bimestre. Qualquer pessoa vê o painel. Só o administrador, com e-mail e senha, publica novos dados (4º bimestre etc.) pela aba **Atualizar dados · Admin**.

Funcionamento: o site é estático (HTML, CSS e JS, sem build). Os dados publicados ficam no **Supabase**, o código no **GitHub** e o site no ar na **Vercel**.

## Chaves e valores que você precisa ter

| Valor | Onde conseguir | Onde usar |
|---|---|---|
| `SUPABASE_URL` (Project URL) | Supabase > seu projeto > Project Settings > API | `public/js/config.js` (local) e variável da Vercel |
| `SUPABASE_ANON_KEY` (anon public ou publishable) | Supabase > seu projeto > Project Settings > API | `public/js/config.js` (local) e variável da Vercel |
| E-mail e senha do administrador | Você cria em Supabase > Authentication > Users | Login na aba Admin. A senha não vai em nenhum arquivo |
| E-mail do administrador | O mesmo de cima | `supabase/02_admin.sql` (uma vez) |

**Nunca use** a chave `service_role` (ou `secret`) no site. A chave anon é pública por desenho: quem protege os dados são as regras do banco (RLS) de `supabase/01_schema.sql`. O script `scripts/generate-config.mjs` recusa chaves secretas.

## Passo 1: Supabase
1. Em supabase.com, crie um projeto (guarde a senha do banco).
2. **Authentication > Users > Add user > Create new user**: informe e-mail e senha forte e marque *Auto Confirm User*.
3. **Authentication > Sign In / Providers > Email**: desligue *Allow new users to sign up* (só você cria usuários).
4. **SQL Editor**: rode, nesta ordem, colando o conteúdo de cada arquivo:
   - `supabase/01_schema.sql`: tabelas e regras de segurança.
   - `supabase/02_admin.sql`: troque `TROQUE_PELO_EMAIL_DO_ADMIN` pelo e-mail do passo 2.
   - `supabase/03_seed_dados_originais.sql`: publica a planilha original (3 bimestres).
5. **Project Settings > API**: copie a Project URL e a anon public key.
6. Depois de ter o endereço da Vercel: **Authentication > URL Configuration > Site URL** = esse endereço (usado em e-mails de recuperação de senha).

## Passo 2: testar no seu computador (VS Code)
1. Abra a pasta no VS Code e edite `public/js/config.js`: cole a URL e a chave.
2. Instale a extensão **Live Server**, clique com o botão direito em `public/index.html` > *Open with Live Server*.
3. Aba **Atualizar dados · Admin**: entre com o e-mail e a senha do passo 1.
Alternativa: copie `.env.example` para `.env`, preencha e rode `npm run config` (gera o `config.js`) e `npm run dev`.

## Passo 3: GitHub
```bash
git init
git add .
git commit -m "Painel Prova Paulista e Alura"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/painel-prova-paulista-alura.git
git push -u origin main
```
O `.gitignore` já impede o envio de `.env`. Se você colar a chave anon em `config.js` e enviar, não há problema (ela é pública), mas na Vercel o ideal é usar as variáveis.
O arquivo `.github/workflows/check.yml` confere a sintaxe do código a cada envio.

## Passo 4: Vercel
1. Em vercel.com: **Add New > Project** e importe o repositório do GitHub.
2. Deixe *Framework Preset* em **Other**. O `vercel.json` já define o build (`node scripts/generate-config.mjs`) e a pasta de saída (`public`).
3. Em **Environment Variables**, cadastre `SUPABASE_URL` e `SUPABASE_ANON_KEY` (e, se quiser, `ADMIN_TAB_PUBLIC=false`).
4. **Deploy**. Cada `git push` na `main` publica de novo.

## Usar no dia a dia
- **Ver:** qualquer pessoa abre o endereço da Vercel.
- **Atualizar (ex.: 4º bimestre):** aba **Atualizar dados · Admin** > login > escolha o `.xlsx` > confira a prévia > **Publicar no painel**. Todos passam a ver a nova versão.
- **Voltar uma versão:** na lista *Versões publicadas*, **Colocar no ar** em uma versão antiga, ou **Excluir**.
- **Formato do arquivo:** mesma planilha de hoje, com as colunas novas ao lado das antigas. Aba **Dados**: "Escolas PP 4 BIM", "Total Alunos", "(%) Participação", "(%) Acertos", "TEC". Aba **Avaliações**: blocos "1ª AVALIAÇÃO - 4º BIM" e "2ª AVALIAÇÃO - 4º BIM". Nomes de escola iguais nas duas abas. Um exemplo está em `public/exemplo/`.
- **Esconder o botão de admin:** `ADMIN_TAB_PUBLIC=false` e acesse o site com `#admin` no final do endereço.

## Segurança em resumo
- Leitura pública da versão publicada; escrita só para quem está na tabela `admins` (regras RLS em `01_schema.sql`).
- Mesmo que alguém abra o painel de admin pelo navegador, o banco recusa a gravação sem login de administrador.
- Senha esquecida: Supabase > Authentication > Users > ... > *Send password recovery* ou defina uma nova.

## Problemas comuns
| Mensagem | Causa |
|---|---|
| "E-mail ou senha incorretos." | Usuário não existe ou senha errada em Authentication > Users |
| "Este usuário não é administrador" | Falta rodar `02_admin.sql` com o e-mail certo |
| "A tabela datasets não existe" | Falta rodar `01_schema.sql` |
| "A chave SUPABASE_ANON_KEY está inválida" | Chave de outro projeto, ou copiada incompleta |
| Banner "ainda não tem nenhuma versão publicada" | Falta rodar `03_seed_dados_originais.sql` ou publicar um arquivo |
| Aba Admin mostra "Conexão pendente" | `config.js` com COLE_AQUI ou variáveis da Vercel não cadastradas (refaça o deploy depois de cadastrar) |

## Estrutura
```
public/                    o site (esta pasta é publicada)
  index.html               estrutura
  css/style.css            visual
  js/config.js             conexão com o Supabase (URL e chave)
  js/data.js               dados originais embutidos (reserva se o Supabase estiver fora)
  js/supabase.js           leitura, login, publicação, histórico
  js/dashboard.js          cálculos, gráficos, tabela
  js/admin.js              aba de administrador e leitura do .xlsx
  js/main.js               inicialização
  exemplo/                 planilha original para testes
supabase/                  SQL para rodar no Supabase (01, 02, 03)
scripts/generate-config.mjs  gera config.js a partir das variáveis (Vercel/.env)
vercel.json                configuração da Vercel
package.json  .env.example  .gitignore  .github/workflows/check.yml
```
As bibliotecas (supabase-js e SheetJS) são carregadas por CDN, com versão fixa, no `index.html`.
