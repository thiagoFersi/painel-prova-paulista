/* Aba "Atualizar dados · Admin": login do administrador (Supabase Auth), leitura do .xlsx,
   publicação de uma nova versão e histórico. Depende de js/supabase.js (DB) e js/dashboard.js (applyData, CUR, META). */
const norm=s=>String(s==null?'':s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
const num=v=>{if(v==null||v==='')return null;if(typeof v==='number')return isFinite(v)?v:null;let t=String(v).trim();const pc=t.includes('%');
  t=t.replace('%','').replace(/\s/g,'').replace(/\.(?=\d{3}\b)/g,'').replace(',','.');const x=parseFloat(t);return isNaN(x)?null:(pc?x/100:x)};
function parseWorkbook(wb){
  const warn=[];
  const nameD=wb.SheetNames.find(n=>norm(n)==='dados'), nameA=wb.SheetNames.find(n=>/^avaliacoes?$/.test(norm(n)));
  if(!nameD)throw new Error('Não encontrei a aba "Dados". As abas do arquivo são: '+wb.SheetNames.join(', ')+'.');
  const rd=XLSX.utils.sheet_to_json(wb.Sheets[nameD],{header:1,defval:null,raw:true});
  const blocks=[];(rd[0]||[]).forEach((h,c)=>{const m=norm(h).match(/^escolas?\s*pp\s*(\d)/);if(m)blocks.push({b:+m[1]-1,c})});
  if(!blocks.length)throw new Error('Na aba "Dados", a primeira linha precisa ter colunas como "Escolas PP 1 BIM", "Escolas PP 2 BIM" e assim por diante.');
  const nbP=Math.max(...blocks.map(x=>x.b))+1;
  const map=new Map(),tot={tec:Array(nbP).fill(null),acertos:Array(nbP).fill(null),part:Array(nbP).fill(null),alunos:Array(nbP).fill(null)};
  let scaled=false;const frac=v=>{let x=num(v);if(x!=null&&x>1.5){x/=100;scaled=true}return x};
  const blank=()=>({alunos:null,part:null,acertos:null,tec:null});
  for(let r=1;r<rd.length;r++){const row=rd[r]||[];
    for(const {b,c} of blocks){const nm=row[c];if(nm==null||String(nm).trim()==='')continue;const key=String(nm).trim();
      const rec={alunos:num(row[c+1]),part:frac(row[c+2]),acertos:frac(row[c+3]),tec:frac(row[c+4])};
      if(norm(key)==='total'){tot.alunos[b]=rec.alunos;tot.part[b]=rec.part;tot.acertos[b]=rec.acertos;tot.tec[b]=rec.tec;continue}
      if(!map.has(key))map.set(key,{n:key,pp:Array.from({length:nbP},blank),alu:[],idx:[]});
      map.get(key).pp[b]=rec}}
  if(!map.size)throw new Error('Não encontrei nenhuma escola na aba "Dados".');
  if(scaled)warn.push('Alguns percentuais da Prova Paulista estavam em escala de 0 a 100 e foram convertidos para 0 a 1.');
  const evals=[];let nbA=0,keepAlu=false,unmatched=new Set();
  const ra=nameA?XLSX.utils.sheet_to_json(wb.Sheets[nameA],{header:1,defval:null,raw:true}):[];
  if(nameA){const t0=ra[0]||[],t1=ra[1]||[];
    t1.forEach((h,c)=>{if(norm(h)!=='escola')return;
      for(let k=c;k<=c+4;k++){const m=norm(t0[k]).match(/(\d)\D*avalia\D*(\d)\D*bim/);if(m){evals.push({e:(+m[2]-1)*2+(+m[1]-1),c,bim:+m[2]});nbA=Math.max(nbA,+m[2]);break}}})}
  if(!evals.length){keepAlu=true;warn.push(nameA?'Não reconheci os títulos da aba "Avaliações" (esperado: "1ª AVALIAÇÃO - 1º BIM"). A Alura foi mantida como estava.':'O arquivo não tem a aba "Avaliações". A Alura foi mantida como estava.')}
  const NBn=Math.max(nbP,nbA,1);
  for(const s of map.values()){while(s.pp.length<NBn)s.pp.push(blank());s.alu=Array(2*NBn).fill(null);s.idx=Array(2*NBn).fill(null)}
  for(const {e,c} of evals){for(let r=2;r<ra.length;r++){const row=ra[r]||[],nm=row[c];if(nm==null||String(nm).trim()===''||norm(nm)==='total')continue;
    const s=map.get(String(nm).trim());if(!s){unmatched.add(String(nm).trim());continue}s.alu[e]=num(row[c+2]);s.idx[e]=num(row[c+3])}}
  if(keepAlu&&CUR){const old=new Map(CUR.s.map(s=>[s.n,s]));let kept=0;for(const s of map.values()){const o=old.get(s.n);if(o){o.alu.forEach((v,i)=>{if(i<s.alu.length){s.alu[i]=v;s.idx[i]=o.idx[i]}});kept++}}}
  if(unmatched.size)warn.push(`${unmatched.size} nome(s) da aba "Avaliações" não existem na aba "Dados" e foram ignorados (ex.: ${[...unmatched].slice(0,2).join('; ')}).`);
  const arr=[...map.values()];
  for(const k of ['tec','acertos','part','alunos']){while(tot[k].length<NBn)tot[k].push(null);
    for(let b=0;b<NBn;b++){if(tot[k][b]==null){const v=arr.map(s=>s.pp[b][k]).filter(x=>x!=null);if(v.length)tot[k][b]=k==='alunos'?v.reduce((p,c)=>p+c,0):v.reduce((p,c)=>p+c,0)/v.length}}}
  const stats={nb:NBn,pp:Array.from({length:NBn},(_,b)=>arr.filter(s=>s.pp[b].tec!=null).length),
    alu:Array.from({length:2*NBn},(_,e)=>arr.filter(s=>s.alu[e]!=null&&!(s.alu[e]===0&&s.idx[e]==null)).length)};
  return {D:{s:arr,tot,nb:NBn},warn,stats};
}

const note=(k,h)=>`<div class="note ${k}"${k==='bad'?' role="alert"':''}>${h}</div>`;
const up=$('#upStatus');
let pending=null;

function showView(v){['adSetup','adLogin','adDenied','adPanel'].forEach(id=>{$('#'+id).hidden=id!==v})}
function showTab(t){
  $$('#tabs button').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.t===t)));
  $('#tabPainel').hidden=t!=='painel';$('#tabDados').hidden=t!=='dados';
  if(t==='painel')renderLines();else refreshAuth();
}
async function refreshAuth(){
  if(!DB.on()){showView('adSetup');$('#setupWhy').textContent=DB.problem();return}
  try{
    const s=await DB.session();
    if(!s){showView('adLogin');return}
    $('#adUser').textContent=s.user.email;$('#deniedUser').textContent=s.user.email;
    if(!(await DB.isAdmin())){showView('adDenied');return}
    showView('adPanel');renderSource();renderHistory();
  }catch(e){showView('adLogin');$('#loginMsg').innerHTML=note('bad',esc(friendly(e)))}
}
function renderSource(){
  $('#srcNow').textContent=META.source==='supabase'
    ?`Versão no ar: "${META.label}", publicada em ${fmtAt(META.at)} (${NB} bimestres, ${N} escolas).`
    :`Nenhuma versão publicada ainda. O painel usa os dados de js/data.js (${NB} bimestres, ${N} escolas).`;
}

/* ----- login ----- */
$('#loginForm').addEventListener('submit',async e=>{
  e.preventDefault();const btn=$('#btnLogin'),msg=$('#loginMsg');
  btn.disabled=true;btn.textContent='Entrando…';msg.innerHTML='';
  try{await DB.signIn($('#adEmail').value.trim(),$('#adPass').value);$('#adPass').value='';await refreshAuth()}
  catch(err){msg.innerHTML=note('bad',esc(friendly(err)))}
  finally{btn.disabled=false;btn.textContent='Entrar'}
});
document.addEventListener('click',async e=>{
  if(e.target.closest('.js-logout')){try{await DB.signOut()}catch(x){}pending=null;up.innerHTML='';await refreshAuth()}
  const go=e.target.closest('[data-go]');if(go)showTab(go.dataset.go);
});

/* ----- leitura do arquivo ----- */
function showErr(msg){pending=null;$('#btnApply').disabled=true;up.innerHTML=note('bad','<b>Não consegui ler o arquivo.</b> '+esc(msg))}
async function handleFile(f){
  if(!f)return;
  if(typeof XLSX==='undefined')return showErr('O leitor de planilhas não carregou. Verifique a conexão com a internet e abra o painel de novo.');
  up.innerHTML=note('','Lendo o arquivo…');
  try{
    const wb=XLSX.read(await f.arrayBuffer(),{type:'array'});
    const r=parseWorkbook(wb);pending={...r,name:f.name};
    const old=new Set(CUR.s.map(s=>s.n)),cur=new Set(r.D.s.map(s=>s.n));
    const added=[...cur].filter(x=>!old.has(x)),gone=[...old].filter(x=>!cur.has(x));
    const rows=Array.from({length:r.stats.nb},(_,b)=>`<tr><td>${b+1}º bimestre${b>=NB?' <span class="pill up">novo</span>':''}</td><td>${r.stats.pp[b]} de ${r.D.s.length}</td><td>${r.stats.alu[2*b]} de ${r.D.s.length}</td><td>${r.stats.alu[2*b+1]} de ${r.D.s.length}</td></tr>`).join('');
    const w=[...r.warn];if(added.length)w.push(`${added.length} escola(s) nova(s) em relação à versão no ar.`);if(gone.length)w.push(`${gone.length} escola(s) da versão no ar não estão no arquivo (ex.: ${gone.slice(0,2).map(x=>pretty(x)).join('; ')}).`);
    up.innerHTML=note('ok',`<b>Arquivo lido: ${esc(f.name)}.</b> ${r.D.s.length} escolas e ${r.stats.nb} bimestres encontrados. Confira abaixo e clique em Publicar no painel.`)+
      `<div class="tw" style="max-height:none"><table class="pv" style="min-width:0"><thead><tr><th style="padding:9px 10px">Bimestre</th><th style="padding:9px 10px">Prova Paulista (TEC)</th><th style="padding:9px 10px">Alura, avaliação 1</th><th style="padding:9px 10px">Alura, avaliação 2</th></tr></thead><tbody>${rows}</tbody></table></div>`+
      (w.length?`<ul class="warns">${w.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:'');
    $('#verLabel').value=(f.name.replace(/\.[^.]+$/,'')+` · ${r.stats.nb} bimestres`).slice(0,80);
    $('#btnApply').disabled=false;
  }catch(err){showErr(err.message||String(err))}
}
$('#file').addEventListener('change',e=>{handleFile(e.target.files[0]);e.target.value=''});
const dz=$('#dz');
['dragenter','dragover'].forEach(ev=>dz.addEventListener(ev,e=>{e.preventDefault();dz.classList.add('over')}));
['dragleave','drop'].forEach(ev=>dz.addEventListener(ev,e=>{e.preventDefault();dz.classList.remove('over')}));
dz.addEventListener('drop',e=>handleFile(e.dataTransfer.files[0]));

/* ----- publicar ----- */
$('#btnApply').addEventListener('click',async()=>{
  if(!pending)return;const btn=$('#btnApply');btn.disabled=true;btn.textContent='Publicando…';
  try{
    const label=($('#verLabel').value||pending.name).trim().slice(0,80);
    const row=await DB.publish({label,file_name:pending.name,payload:pending.D});
    const D=pending.D;pending=null;
    applyData(D,{source:'supabase',label,file:null,at:row.created_at,id:row.id});
    up.innerHTML=note('ok',`<b>Versão publicada.</b> Quem abrir o site a partir de agora vê estes dados. <button class="btn ghost sm" data-go="painel">Ver o painel</button>`);
    renderSource();renderHistory();
  }catch(err){up.insertAdjacentHTML('beforeend',note('bad','Não consegui publicar: '+esc(friendly(err))));btn.disabled=false}
  finally{btn.textContent='Publicar no painel'}
});

/* ----- histórico ----- */
async function renderHistory(){
  const box=$('#hist');box.innerHTML='<p class="m">Carregando…</p>';
  try{
    const rows=await DB.list();
    box.innerHTML=rows.length?`<ul class="hist">${rows.map((r,i)=>`<li><div><b>${esc(r.label)}</b> ${i===0?'<span class="pill up">No ar</span>':''}<br><span class="m">${fmtAt(r.created_at)} · ${r.nb} bimestres${r.file_name?' · '+esc(r.file_name):''}</span></div>
      <div class="hb">${i===0?'':`<button class="btn ghost sm" data-act="restore" data-id="${r.id}">Colocar no ar</button><button class="btn ghost sm danger" data-act="del" data-id="${r.id}">Excluir</button>`}</div></li>`).join('')}</ul>`:'<p class="m">Nenhuma versão publicada ainda.</p>';
  }catch(err){box.innerHTML=note('bad',esc(friendly(err)))}
}
$('#hist').addEventListener('click',async e=>{
  const b=e.target.closest('button[data-act]');if(!b)return;const id=b.dataset.id;
  try{
    if(b.dataset.act==='del'){
      if(!b.dataset.armed){b.dataset.armed='1';b.textContent='Confirmar exclusão';setTimeout(()=>{if(b.isConnected){delete b.dataset.armed;b.textContent='Excluir'}},4000);return}
      await DB.remove(id);await renderHistory();return;
    }
    b.disabled=true;b.textContent='Colocando no ar…';
    const v=await DB.get(id);const label=('Restaurada: '+v.label).slice(0,80);
    const row=await DB.publish({label,file_name:null,payload:v.payload});
    applyData(v.payload,{source:'supabase',label,at:row.created_at,id:row.id});renderSource();await renderHistory();
  }catch(err){$('#hist').insertAdjacentHTML('afterbegin',note('bad',esc(friendly(err))))}
});

function initAdmin(){
  $('#tabs').addEventListener('click',e=>{const b=e.target.closest('button');if(b)showTab(b.dataset.t)});
  const cfg=window.APP_CONFIG||{};
  if(cfg.ADMIN_TAB_PUBLIC===false&&location.hash!=='#admin')$('#tabs button[data-t="dados"]').hidden=true;
  addEventListener('hashchange',()=>{if(location.hash==='#admin'){$('#tabs button[data-t="dados"]').hidden=false;showTab('dados')}});
  if(location.hash==='#admin')showTab('dados');
  if(DB.on())DB.onAuth(()=>{if(!$('#tabDados').hidden)refreshAuth()});
}
