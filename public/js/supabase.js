/* Conexão com o Supabase: leitura pública da versão publicada, login do administrador e publicação.
   Depende de js/config.js e da biblioteca @supabase/supabase-js (carregada no index.html). */
(function(){
  const CFG=window.APP_CONFIG||{};
  const TABLE=CFG.TABLE||'datasets';
  const urlOk=typeof CFG.SUPABASE_URL==='string'&&/^https:\/\/\S+$/.test(CFG.SUPABASE_URL)&&!/COLE_AQUI/.test(CFG.SUPABASE_URL);
  const keyOk=typeof CFG.SUPABASE_ANON_KEY==='string'&&CFG.SUPABASE_ANON_KEY.length>20&&!/COLE_AQUI/.test(CFG.SUPABASE_ANON_KEY);
  let sb=null,why='';
  if(!urlOk||!keyOk)why='Preencha SUPABASE_URL e SUPABASE_ANON_KEY em js/config.js (ou nas variáveis de ambiente da Vercel).';
  else if(!window.supabase||!window.supabase.createClient)why='A biblioteca do Supabase não carregou. Verifique a conexão com a internet.';
  else{try{sb=window.supabase.createClient(CFG.SUPABASE_URL.replace(/\/+$/,''),CFG.SUPABASE_ANON_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}})}catch(e){why='Configuração do Supabase inválida: '+e.message}}

  function withTimeout(p,ms,msg){let t;return Promise.race([p,new Promise((_,rej)=>{t=setTimeout(()=>rej(new Error(msg||'Tempo esgotado ao falar com o Supabase.')),ms)})]).finally(()=>clearTimeout(t))}
  const unwrap=r=>{if(r.error)throw r.error;return r.data};

  window.friendly=function(e){
    const m=String((e&&e.message)||e||''),c=e&&e.code;
    if(/invalid login credentials/i.test(m))return 'E-mail ou senha incorretos.';
    if(/email not confirmed/i.test(m))return 'O e-mail ainda não foi confirmado. Confirme o usuário em Supabase > Authentication > Users.';
    if(/failed to fetch|networkerror|load failed/i.test(m))return 'Sem conexão com o Supabase. Verifique a internet e a SUPABASE_URL.';
    if(/invalid api key|jwt|apikey/i.test(m))return 'A chave SUPABASE_ANON_KEY está inválida ou de outro projeto.';
    if(c==='42P01'||c==='PGRST205'||/does not exist|could not find the table/i.test(m))return 'A tabela "'+TABLE+'" não existe. Rode o arquivo supabase/01_schema.sql no SQL Editor.';
    if(c==='42501'||/row-level security|permission denied/i.test(m))return 'Sem permissão. Confirme que este usuário está na tabela admins (supabase/02_admin.sql).';
    if(/rate limit|too many/i.test(m))return 'Muitas tentativas. Espere um minuto e tente de novo.';
    return m||'Erro desconhecido.';
  };
  window.withTimeout=withTimeout;

  window.DB={
    on:()=>!!sb,
    problem:()=>why,
    async latest(){return (unwrap(await withTimeout(sb.from(TABLE).select('id,created_at,label,file_name,nb,payload').order('created_at',{ascending:false}).limit(1),9000)))[0]||null},
    async list(){return unwrap(await sb.from(TABLE).select('id,created_at,label,file_name,nb').order('created_at',{ascending:false}).limit(20))},
    async get(id){return unwrap(await sb.from(TABLE).select('payload,label').eq('id',id).single())},
    async publish({label,file_name,payload}){return unwrap(await sb.from(TABLE).insert({label,file_name,nb:payload.nb,payload}).select('id,created_at').single())},
    async remove(id){const rows=unwrap(await sb.from(TABLE).delete().eq('id',id).select('id'));if(!rows||!rows.length)throw new Error('Nada foi excluído. Confira se este usuário é administrador.');return true},
    async signIn(email,password){return unwrap(await sb.auth.signInWithPassword({email,password}))},
    async signOut(){await sb.auth.signOut()},
    async session(){return unwrap(await sb.auth.getSession()).session},
    async isAdmin(){return unwrap(await sb.rpc('is_admin'))===true},
    onAuth(cb){sb.auth.onAuthStateChange(()=>cb())}
  };
})();
