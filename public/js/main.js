/* Inicialização: busca a versão publicada no Supabase e, se não der, usa os dados de js/data.js. */
function validPayload(p){return !!(p&&Array.isArray(p.s)&&p.s.length&&p.s[0]&&Array.isArray(p.s[0].pp)&&p.tot&&Array.isArray(p.tot.tec))}
(async function boot(){
  let D=DATA,meta={source:'local'};
  if(DB.on()){
    try{
      const r=await DB.latest();
      if(r&&validPayload(r.payload)){D=r.payload;meta={source:'supabase',label:r.label,file:r.file_name,at:r.created_at,id:r.id}}
      else meta.warn='O Supabase está conectado, mas ainda não tem nenhuma versão publicada. O painel mostra os dados de js/data.js. Rode supabase/03_seed_dados_originais.sql ou publique um arquivo na aba de administrador.';
    }catch(e){meta.warn='Não consegui ler os dados do Supabase ('+friendly(e)+'). O painel mostra os dados de js/data.js.'}
  }
  try{applyData(D,meta)}catch(e){console.error(e);applyData(DATA,{source:'local',warn:'A versão publicada tem um formato inválido. O painel mostra os dados de js/data.js.'})}
  document.body.classList.remove('is-loading');
  initAdmin();
})();
