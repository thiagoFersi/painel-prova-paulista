-- =====================================================================
-- 02 - CADASTRAR O ADMINISTRADOR (PASSO 2 de 3)
-- Faça ANTES de rodar este arquivo:
--   Supabase > Authentication > Users > Add user > Create new user
--   Informe o e-mail e uma senha forte e marque "Auto Confirm User".
--   A senha fica só com você: ela não vai para nenhum arquivo do site.
--
-- Depois: troque o e-mail abaixo pelo MESMO e-mail do usuário e rode (Run).
-- Para ter mais de um administrador, rode de novo com outro e-mail.
-- =====================================================================
insert into public.admins (user_id, email)
select id, email
from auth.users
where lower(email) = lower('TROQUE_PELO_EMAIL_DO_ADMIN')
on conflict (user_id) do nothing;

-- Deve listar 1 linha com o seu e-mail. Se vier vazio, o e-mail não confere com o usuário criado.
select user_id, email, created_at from public.admins;
