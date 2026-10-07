/* =====================================================================
   CONFIGURAÇÃO DE CONEXÃO COM O SUPABASE  (arquivo: public/js/config.js)

   Preencha os dois campos abaixo. Os dois valores ficam em:
   Supabase > seu projeto > Project Settings (engrenagem) > API

   1) SUPABASE_URL       = "Project URL"            (ex.: https://abcdefgh.supabase.co)
   2) SUPABASE_ANON_KEY  = "anon public"            (começa com eyJ...)
                           ou "Publishable key"     (começa com sb_publishable_...)

   ATENÇÃO
   - Use SOMENTE a chave "anon public" (ou "publishable"). Ela é pública por
     desenho e é protegida pelas regras de segurança (RLS) do banco.
   - NUNCA cole aqui a chave "service_role" (ou "secret"). Ela dá acesso total
     ao banco e não pode aparecer em nenhum arquivo do site.
   - Na Vercel, você não precisa editar este arquivo: cadastre SUPABASE_URL e
     SUPABASE_ANON_KEY em Settings > Environment Variables e o build gera este
     arquivo sozinho (scripts/generate-config.mjs).
   - Enquanto os valores abaixo forem "COLE_AQUI...", o painel funciona só com
     os dados de js/data.js e a aba de administrador mostra as instruções.
   ===================================================================== */
window.APP_CONFIG = {
  SUPABASE_URL: "https://jjqrvczdrnexqxvnnvth.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_RhZSmn6hWuxGlDqAhTuO3A_ZQODbdng",

  // Nome da tabela criada por supabase/01_schema.sql (não mude, a menos que mude o SQL).
  TABLE: "datasets",

  // true: o botão "Atualizar dados · Admin" aparece para todos (o acesso exige senha).
  // false: o botão fica escondido; para abrir o login acesse o site com #admin no final do endereço.
  ADMIN_TAB_PUBLIC: true
};
