// Configuração e Conexão com o Supabase
const SUPABASE_URL = "https://jjqrvczdrnexqxvnvth.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_RhZSmn6hWuxG1DqAhTuO3A_ZQODbdng";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Função para realizar o login do utilizador
async function fazerLogin(email, senha) {
  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email: email,
    password: senha,
  });

  if (error) {
    console.error("Erro ao fazer login:", error.message);
    alert("Erro ao fazer login: " + error.message);
    return null;
  }

  console.log("Login efetuado com sucesso!", data);
  return data;
}

// Função para obter o perfil do utilizador (admin ou usuario)
async function obterPerfil(userId) {
  const { data, error } = await supabaseClient
    .from('perfis')
    .select('perfil')
    .eq('id', userId)
    .single();

  if (error) {
    console.error("Erro ao obter perfil:", error.message);
    return null;
  }

  return data ? data.perfil : null;
}

// Função para ajustar a visibilidade dos recursos com base no perfil
function aplicarPermissoesInterface() {
  const perfil = localStorage.getItem('usuario_perfil');
  const areaAdmin = document.querySelector('#area-admin, .area-admin, #upload-container, button[data-t="dados"]');

  if (areaAdmin) {
    if (perfil === 'admin') {
      areaAdmin.style.display = 'inline-block';
    } else {
      areaAdmin.style.display = 'none';
    }
  }
}

// Conecta o formulário da página às funções de autenticação e gestão de perfil
document.addEventListener('DOMContentLoaded', () => {
  // Aplica as permissões assim que a página abre
  aplicarPermissoesInterface();

  const formLogin = document.querySelector('form');

  if (formLogin) {
    formLogin.addEventListener('submit', async (e) => {
      e.preventDefault();

      const emailInput = document.querySelector('input[type="email"], input[name="email"]');
      const senhaInput = document.querySelector('input[type="password"], input[name="password"]');

      if (!emailInput || !senhaInput) {
        alert("Campos de e-mail ou palavra-passe não encontrados.");
        return;
      }

      const email = emailInput.value;
      const senha = senhaInput.value;

      const resultado = await fazerLogin(email, senha);

      if (resultado && resultado.user) {
        const perfil = await obterPerfil(resultado.user.id);
        
        // Guarda o perfil localmente para controlo de acesso na interface
        localStorage.setItem('usuario_perfil', perfil);

        // Atualiza a interface imediatamente após o login
        aplicarPermissoesInterface();
        
        if (perfil === 'admin') {
          alert("Login efetuado! Acesso concedido como ADMINISTRADOR.");
        } else {
          alert("Login efetuado! Acesso concedido como USUÁRIO.");
        }
      }
    });
  }
});

/* Lógica do painel: cálculos, gráficos, tabela e leitura de planilhas. Depende de js/data.js (DATA) e da biblioteca SheetJS (XLSX). */
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
let BIM=[],PERIOD=[];
const small=new Set(['DA','DE','DO','DAS','DOS','E']);
const ABBR={PROF:'Prof.',PROFA:'Profa.',DR:'Dr.',DRA:'Dra.',DONA:'Dona',JD:'Jd.'};
function pretty(n){return n.toLowerCase().split(' ').map((w,i)=>{const u=w.toUpperCase();if(ABBR[u])return ABBR[u];if(small.has(u)&&i>0)return w;return w.charAt(0).toUpperCase()+w.slice(1)}).join(' ')}
const mean=a=>{const v=a.filter(x=>x!=null&&!isNaN(x));return v.length?v.reduce((p,c)=>p+c,0)/v.length:null};
let S=[],TOT={},NB=3,N=0,COLS=[],CUR=null,SRC={name:'planilha original'};
function build(D){
  CUR=D;NB=D.nb||D.s[0].pp.length;N=D.s.length;
  S=D.s.map(r=>{const m=r.n.match(/^(.*) - (\d+)$/);
    return {id:r.n,name:pretty(m?m[1]:r.n),code:m?m[2]:'',pp:r.pp,a:r.alu.map((v,i)=>(v==null||(v===0&&r.idx[i]==null))?null:v)}});
  TOT=D.tot;
  BIM=Array.from({length:NB},(_,i)=>`${i+1}º Bim`);
  PERIOD=[...Array.from({length:NB},(_,i)=>`${i+1}º bimestre`),'acumulado do ano'];
  COLS=[{k:'rank',t:'#',v:r=>r.rank},{k:'name',t:'Escola',v:r=>r.s.name},
    {k:'val',t:'Resultado',v:r=>r.v},{k:'d',t:'Variação',v:r=>r.d},{k:'st',t:'Status',v:r=>({up:3,flat:2,down:1,nd:0})[r.st]},
    ...BIM.map((_,i)=>({k:'p'+i,t:BIM[i],g:'pp',v:r=>r.s.pp[i].tec})),
    ...BIM.map((_,i)=>({k:'a'+i,t:BIM[i],g:'alu',v:r=>val(r.s,'alu',i)}))];
}
const fmtP=(v,d=1)=>v==null?'—':(v*100).toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d})+'%';
const fmtN=(v,d=2)=>v==null?'—':v.toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d});
const fmtV=(ind,v)=>ind==='pp'?fmtP(v):fmtN(v);
const fmtD=(ind,d)=>{if(d==null)return '—';const s=d>0?'+':d<0?'−':'';const a=Math.abs(d);
  return s+(ind==='pp'?(a*100).toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1})+' pp':a.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2}))};
const THR={pp:0.005,alu:0.1}, COL={pp:'var(--pp)',alu:'var(--alu)'}, IND={pp:'Prova Paulista (TEC)',alu:'Alura (média)'};

const st={period:2,ind:'pp',cut:'all',sel:null,ppm:'tec',q:'',stat:'all',sort:{k:'rank',d:1}};

function val(s,ind,p){
  if(ind==='pp')return p<NB?s.pp[p].tec:mean(s.pp.map(x=>x.tec));
  return p<NB?mean([s.a[2*p],s.a[2*p+1]]):mean(s.a);
}
function lastB(ind){for(let b=NB-1;b>=0;b--){if(S.some(s=>val(s,ind,b)!=null))return b}return 0}
function delta(s,ind,p){
  if(p===0)return null;
  let a,b; if(p===NB){a=val(s,ind,lastB(ind));b=val(s,ind,0);}else{a=val(s,ind,p);b=val(s,ind,p-1);}
  return a==null||b==null?null:a-b;
}
const status=(ind,d)=>d==null?'nd':d>THR[ind]?'up':d<-THR[ind]?'down':'flat';
const LBL={up:'Avanço',down:'Queda',flat:'Estável',nd:'Sem comparativo'}, ICO={up:'▲',down:'▼',flat:'●',nd:''};
const pill=k=>`<span class="pill ${k}">${ICO[k]?ICO[k]+' ':''}${LBL[k]}</span>`;
function redeVal(ind,p){
  if(ind==='pp')return p<NB?TOT.tec[p]:mean(TOT.tec);
  return mean(S.map(s=>val(s,'alu',p)));
}
function redeDelta(ind,p){
  if(p===0)return null;
  const a=p===NB?redeVal(ind,lastB(ind)):redeVal(ind,p), b=p===NB?redeVal(ind,0):redeVal(ind,p-1);
  return a==null||b==null?null:a-b;
}
function ranking(ind,p){
  const l=S.map(s=>({s,v:val(s,ind,p),d:delta(s,ind,p)})).filter(x=>x.v!=null).sort((a,b)=>b.v-a.v);
  l.forEach((x,i)=>{x.rank=i+1;x.st=status(ind,x.d)});return l;
}
function view(){ // lista após recorte
  const full=ranking(st.ind,st.period);
  let l=full; if(st.cut==='top')l=full.slice(0,15); if(st.cut==='bot')l=full.slice(-15).reverse();
  return {full,list:l};
}
const tipEl=$('#tip');
function showTip(html,e){tipEl.innerHTML=html;tipEl.hidden=false;const w=tipEl.offsetWidth,h=tipEl.offsetHeight;
  let x=e.clientX+14,y=e.clientY+14;if(x+w>innerWidth-8)x=e.clientX-w-14;if(y+h>innerHeight-8)y=e.clientY-h-14;tipEl.style.left=Math.max(8,x)+'px';tipEl.style.top=Math.max(8,y)+'px'}
const hideTip=()=>{tipEl.hidden=true};
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

/* ---------- cards ---------- */
function renderCards(){
  const p=st.period, {full}=view(), ind=st.ind;
  const dtxt=(i,d,p)=>{if(d==null)return '<span class="m">Primeira medição do ano</span>';const k=status(i,d);
    return `<span class="pill ${k}">${ICO[k]} ${fmtD(i,d)}</span> <span class="m">${p===NB?BIM[lastB(i)].toLowerCase()+' vs 1º bim':'vs '+BIM[p-1].toLowerCase()}</span>`};
  const ppV=redeVal('pp',p), aluV=redeVal('alu',p);
  const ppb=BIM.map((_,i)=>`<span>${i+1}º <b>${fmtP(TOT.tec[i])}</b></span>`).join('');
  const alb=BIM.map((_,i)=>`<span>${i+1}º <b>${fmtN(redeVal('alu',i))}</b></span>`).join('');
  const cnt={up:0,down:0,flat:0,nd:0};full.forEach(x=>cnt[x.st]++);
  const tot=full.length, pc=k=>tot?(cnt[k]/tot*100):0;
  const wd=full.filter(x=>x.d!=null).sort((a,b)=>b.d-a.d);
  const b=wd[0], w=wd[wd.length-1];
  const sc=(x,tag)=>!x?'<div class="m" style="font-size:13px">O 1º bimestre é o ponto de partida. Escolha o 2º bimestre, o 3º ou o acumulado para ver o avanço.</div>':`<div class="n">${esc(x.s.name)}</div><div class="v" style="font-size:24px">${fmtD(ind,x.d)}</div><div class="m">${pill(x.st)} de ${fmtV(ind,val(x.s,ind,p===NB?0:p-1))} para ${fmtV(ind,val(x.s,ind,p===NB?lastB(ind):p))}</div><div class="row"><span>${tag}</span><span>Cód. <b>${x.s.code}</b></span></div>`;
  const ppPart=p<NB?TOT.part[p]:mean(TOT.part), ppAc=p<NB?TOT.acertos[p]:mean(TOT.acertos);
  $('#cards').innerHTML=`
   <article class="card"><div class="k"><span class="dot" style="background:var(--pp)"></span>Prova Paulista · TEC</div>
     <div class="v">${fmtP(ppV)}</div><div>${dtxt('pp',redeDelta('pp',p),p)}</div>
     <div class="row"><span>Acertos <b>${fmtP(ppAc)}</b></span><span>Participação <b>${fmtP(ppPart)}</b></span></div>
     <div class="row" style="margin-top:0;border-top:0;padding-top:0">${ppb}</div></article>
   <article class="card"><div class="k"><span class="dot" style="background:var(--alu)"></span>Avaliação Alura · média</div>
     <div class="v">${fmtN(aluV)}<small>de 10</small></div><div>${dtxt('alu',redeDelta('alu',p),p)}</div>
     <div class="row">${alb}</div></article>
   <article class="card"><div class="k">Situação · ${ind==='pp'?'Prova Paulista':'Alura'}</div>
     ${p===0?'<div class="m" style="font-size:13px">O 1º bimestre é o ponto de partida. Escolha o 2º bimestre, o 3º ou o acumulado para ver avanço e queda.</div>':`
     <div class="sitnum"><span style="color:var(--good)"><b>${cnt.up}</b>avanço</span><span style="color:var(--bad)"><b>${cnt.down}</b>queda</span><span style="color:var(--flat)"><b>${cnt.flat}</b>estável</span></div>
     <div class="sit" role="img" aria-label="${cnt.up} em avanço, ${cnt.down} em queda,${cnt.flat} estáveis"><span class="up" style="width:${pc('up')}%"></span><span class="down" style="width:${pc('down')}%"></span><span class="flat" style="width:${pc('flat')}%"></span></div>
     <div class="m">${tot} escolas,${p===NB?BIM[lastB(ind)].toLowerCase()+' contra 1º bim':BIM[p]+' contra '+BIM[p-1].toLowerCase()}. Estável: variação menor que ${ind==='pp'?'0,5 pp':'0,10 ponto'}.</div>`}</article>
   <article class="card"><div class="k">Maior avanço · ${PERIOD[p]}</div>${sc(b,'Maior alta do período')}</article>
   <article class="card"><div class="k">Menor avanço · ${PERIOD[p]}</div>${sc(w,'Menor alta ou maior queda')}</article>`;
}

/* ---------- barras ---------- */
function renderBars(){
  const {full,list}=view(), ind=st.ind, p=st.period;
  const max=Math.max(...full.map(x=>x.v)), dom=ind==='pp'?Math.ceil(max*10)/10:Math.ceil(max);
  const av=redeVal(ind,p);
  $('#barTitle').textContent=`${IND[ind]} por escola · ${PERIOD[p]}`;
  $('#barSub').textContent={all:`${list.length} escolas, da maior para a menor.`,top:'As 15 escolas com maior resultado, da primeira para a décima quinta.',bot:'Escolas prioritárias: as 15 com menor resultado, da última colocada para cima.'}[st.cut]+' Clique numa barra para ver a evolução da escola.';
  $('#barLegend').innerHTML=`<span><i style="--c:${COL[ind]}"></i>${IND[ind]}</span><span><i class="dv"></i>Média da rede ${fmtV(ind,av)}</span>`;
  $('#bars').innerHTML=list.map(x=>`<button class="brow${st.sel===x.s.id?' sel':''}" data-id="${esc(x.s.id)}" aria-label="${esc(x.s.name)}, ${fmtV(ind,x.v)}">
    <span class="r">${x.rank}</span><span class="nm" title="${esc(x.s.name)}">${esc(x.s.name)}</span>
    <span class="tr"><span class="fl" style="width:${x.v/dom*100}%;--c:${COL[ind]}"></span><span class="av" style="left:${av/dom*100}%"></span></span>
    <span class="vl">${fmtV(ind,x.v)}</span></button>`).join('');
}
$('#bars').addEventListener('click',e=>{const b=e.target.closest('.brow');if(b)focus(b.dataset.id)});
$('#bars').addEventListener('mousemove',e=>{const b=e.target.closest('.brow');if(!b)return hideTip();
  const s=S.find(x=>x.id===b.dataset.id),ind=st.ind,p=st.period,d=delta(s,ind,p),k=status(ind,d);
  showTip(`<b>${esc(s.name)}</b><br><span class="t">Cód. ${s.code}</span><br>${IND[ind]}: <b>${fmtV(ind,val(s,ind,p))}</b><br>${d==null?'Sem comparativo':LBL[k]+' '+fmtD(ind,d)}`,e)});
$('#bars').addEventListener('mouseleave',hideTip);

/* ---------- linhas ---------- */
function niceDomain(vals,fixed){
  if(fixed)return fixed;
  const v=vals.filter(x=>x!=null),lo0=Math.min(...v),hi0=Math.max(...v),R=hi0-lo0||0.1;
  const steps=[0.01,0.02,0.05,0.1,0.2,0.25,0.5,1,2];let step=steps.find(s=>R/s<=6)||2;
  return {lo:Math.floor(lo0/step)*step,hi:Math.ceil(hi0/step)*step,step};
}
function drawLine(el,cfg){
  const W=Math.max(300,el.clientWidth||600),H=300,m={l:46,r:16,t:16,b:cfg.groups?54:36};
  const n=cfg.labels.length,iw=W-m.l-m.r,ih=H-m.t-m.b;
  const all=[...cfg.ctx.flat(),...cfg.rede,...(cfg.sel||[])];
  const d=niceDomain(all,cfg.fixed);
  const X=i=>m.l+16+(n>1?i*(iw-32)/(n-1):(iw-32)/2),Y=v=>m.t+ih-(v-d.lo)/(d.hi-d.lo)*ih;
  const path=a=>{let s='',pen=false;a.forEach((v,i)=>{if(v==null){pen=false;return}s+=(pen?'L':'M')+X(i).toFixed(1)+' '+Y(v).toFixed(1);pen=true});return s};
  let g='';
  for(let t=d.lo;t<=d.hi+d.step/2;t+=d.step){const y=Y(t);g+=`<line x1="${m.l}" x2="${W-m.r}" y1="${y}" y2="${y}" stroke="var(--grid)"/><text x="${m.l-8}" y="${y+4}" text-anchor="end">${cfg.tick(t)}</text>`}
  cfg.labels.forEach((l,i)=>{g+=`<text x="${X(i)}" y="${m.t+ih+18}" text-anchor="middle">${l}</text>`});
  if(cfg.groups){cfg.groups.forEach((gr,gi)=>{const x1=X(gi*2),x2=X(gi*2+1);g+=`<text x="${(x1+x2)/2}" y="${m.t+ih+38}" text-anchor="middle" style="font-weight:600;fill:var(--ink)">${gr}</text>`;
    if(gi>0){const xs=(X(gi*2-1)+x1)/2;g+=`<line x1="${xs}" x2="${xs}" y1="${m.t}" y2="${m.t+ih+42}" stroke="var(--line)" stroke-dasharray="3 3"/>`}})}
  cfg.ctx.forEach(a=>{g+=`<path d="${path(a)}" fill="none" stroke="var(--ctx)" stroke-width="1" opacity=".75"/>`});
  const draw=(a,color,w,dash,lab,pos)=>{let o=`<path d="${path(a)}" fill="none" stroke="${color}" stroke-width="${w}" ${dash?'stroke-dasharray="6 4"':''} stroke-linejoin="round" stroke-linecap="round"/>`;
    a.forEach((v,i)=>{if(v==null)return;o+=`<circle cx="${X(i)}" cy="${Y(v)}" r="4" fill="${color}" stroke="var(--surface)" stroke-width="2"/>`;
      if(lab)o+=`<text x="${X(i)}" y="${Y(v)+pos}" text-anchor="middle" style="font-weight:600;fill:var(--ink);stroke:var(--surface);stroke-width:3.5px;paint-order:stroke">${cfg.fmt(v)}</text>`});return o};
  g+=draw(cfg.rede,'var(--rede)',2,true,!cfg.sel,-10);
  if(cfg.sel)g+=draw(cfg.sel,cfg.color,3,false,true,-10);
  g+=`<line id="xh" y1="${m.t}" y2="${m.t+ih}" stroke="var(--ink2)" stroke-width="1" opacity="0"/><rect x="${m.l-10}" y="${m.t}" width="${iw+20}" height="${ih+10}" fill="transparent" id="ov"/>`;
  el.innerHTML=`<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${cfg.aria}">${g}</svg>`;
  const ov=el.querySelector('#ov'),xh=el.querySelector('#xh');
  const at=e=>{const r=el.querySelector('svg').getBoundingClientRect(),x=e.clientX-r.left;let bi=0,bd=1e9;for(let i=0;i<n;i++){const dd=Math.abs(X(i)-x);if(dd<bd){bd=dd;bi=i}}return bi};
  ov.addEventListener('mousemove',e=>{const i=at(e);xh.setAttribute('x1',X(i));xh.setAttribute('x2',X(i));xh.setAttribute('opacity','.5');
    showTip(`<b>${cfg.tipLabel(i)}</b><br><span style="display:inline-block;width:10px;border-top:2px dashed #cfd8e3;margin-right:6px"></span>Média da rede: <b>${cfg.fmt(cfg.rede[i])}</b>${cfg.sel?`<br><span style="display:inline-block;width:10px;border-top:3px solid ${cfg.color==='var(--pp)'?'#6aa6ee':'#f59a73'};margin-right:6px"></span>${esc(cfg.selName)}: <b>${cfg.fmt(cfg.sel[i])}</b>`:''}`,e)});
  ov.addEventListener('mouseleave',()=>{xh.setAttribute('opacity','0');hideTip()});
}
function renderLines(){
  const s=S.find(x=>x.id===st.sel),m=st.ppm;
  const mlabel={tec:'TEC',acertos:'% de acertos',part:'% de participação'}[m];
  const redePP=m==='tec'?TOT.tec:m==='acertos'?TOT.acertos:TOT.part;
  const lg=(c,sel,name)=>`<span><i class="d" style="--c:var(--rede)"></i>Média da rede</span>${sel?`<span><i style="--c:${c}"></i>${esc(name)}</span>`:''}<span><i style="--c:var(--ctx)"></i>Demais escolas</span>`;
  $('#lg1').innerHTML=lg(COL.pp,s,s&&s.name);$('#lg2').innerHTML=lg(COL.alu,s,s&&s.name);
  drawLine($('#chPP'),{labels:BIM,ctx:S.map(x=>x.pp.map(q=>q[m])),rede:redePP,sel:s?s.pp.map(q=>q[m]):null,color:COL.pp,selName:s&&s.name,
    fmt:v=>
