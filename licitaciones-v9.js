(()=>{
'use strict';
const TITLES={dashboard:'Dashboard',oportunidades:'Radar de Oportunidades',nueva:'Nueva licitación',licitaciones:'Licitaciones',documentos:'Documentos Empresa',firmas:'Firmas requeridas',economica:'Propuesta Económica',competencia:'Competencia',analitica:'Analítica',resumen:'Resumen Ejecutivo'};
function ensureEconomicShell(){
 const menu=document.querySelector('.menu'),content=document.querySelector('.content');
 if(menu&&!document.querySelector('.nav[data-page="economica"]')){
   const b=document.createElement('button');b.className='nav';b.dataset.page='economica';b.innerHTML='<span class="ico">$</span>Propuesta Económica';
   const comp=document.querySelector('.nav[data-page="competencia"]');menu.insertBefore(b,comp||null);
 }
 if(content&&!document.getElementById('economica')){
   const s=document.createElement('section');s.className='page';s.id='economica';content.appendChild(s);
 }
}
function renderRealAnalytics(){
 const page=document.getElementById('analitica');if(!page)return;
 let records=[];try{records=JSON.parse(localStorage.getItem('gups_licit_history')||'[]');if(!Array.isArray(records))records=[]}catch{}
 const participated=records.filter(x=>x.presented||['Presentada','En evaluación','Adjudicada','No adjudicada'].includes(x.status));
 const won=participated.filter(x=>x.status==='Adjudicada'||x.won===true);
 const amount=participated.reduce((s,x)=>s+Number(x.offerAmount||0),0);
 const gaps=participated.map(x=>Number(x.priceGapPct)).filter(Number.isFinite);
 const gap=gaps.length?gaps.reduce((a,b)=>a+b,0)/gaps.length:null;
 const rate=participated.length?won.length/participated.length*100:null;
 page.innerHTML=`<div class="hero"><div><h2>Analítica de Licitaciones</h2><p>Estadísticas calculadas únicamente con licitaciones y resultados reales registrados.</p></div></div><div class="analytics-grid" style="margin-top:16px"><div class="metric-pro"><div class="k">Participadas</div><div class="v">${participated.length}</div><div class="s">Procesos registrados</div></div><div class="metric-pro"><div class="k">Adjudicadas</div><div class="v">${won.length}</div><div class="s">${rate===null?'Sin tasa aún':rate.toFixed(1)+'% de efectividad'}</div></div><div class="metric-pro"><div class="k">Monto total ofertado</div><div class="v">B/. ${amount.toLocaleString('es-PA',{minimumFractionDigits:2,maximumFractionDigits:2})}</div><div class="s">No representa monto ganado</div></div><div class="metric-pro"><div class="k">Diferencia promedio frente al precio más bajo</div><div class="v">${gap===null?'—':gap.toFixed(2)+'%'}</div><div class="s">Solo procesos con competencia registrada</div></div></div><div class="panel" style="margin-top:16px"><div class="analytics-empty"><strong>${participated.length?'Historial en construcción':'Aún no hay historial suficiente'}</strong><p>Esta pantalla se irá llenando automáticamente conforme se registren participaciones y resultados reales.</p></div></div>`;
}
function masterGo(page){
 ensureEconomicShell();
 const target=document.getElementById(page);if(!target)return;
 document.querySelectorAll('.content > .page').forEach(p=>p.classList.toggle('active',p===target));
 document.querySelectorAll('.menu .nav[data-page]').forEach(n=>n.classList.toggle('active',n.dataset.page===page));
 const title=document.getElementById('pageTitle');if(title)title.textContent=TITLES[page]||'Gestor de Licitaciones';
 document.getElementById('sidebar')?.classList.remove('open');document.getElementById('overlay')?.classList.remove('show');
 try{
  if(page==='documentos'&&typeof renderDocuments==='function')renderDocuments();
  if(page==='firmas'&&typeof renderSignatureFolders==='function')renderSignatureFolders();
  if(page==='licitaciones'){
    if(typeof window.gupsRenderRealTenders==='function') window.gupsRenderRealTenders();
    else if(typeof renderTenders==='function') renderTenders();
  }
  if(page==='competencia'&&typeof renderCompetition==='function')renderCompetition();
  if(page==='resumen'&&typeof renderExecutive==='function')renderExecutive();
  if(page==='economica'&&typeof window.renderEconomicSimple==='function')window.renderEconomicSimple();
  if(page==='analitica')renderRealAnalytics();
 }catch(e){console.error(e)}
 window.scrollTo(0,0);
 try{history.replaceState(null,'',location.pathname+location.search+'#'+page)}catch{}
}
window.go=masterGo;window.gupsNavigate=masterGo;
document.addEventListener('click',e=>{
 const nav=e.target.closest('.menu .nav[data-page]');if(!nav)return;
 e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();masterGo(nav.dataset.page);
},true);
document.addEventListener('click',e=>{
 const go=e.target.closest('[data-go]');if(!go||go.closest('.menu'))return;
 const id=go.dataset.go;if(!document.getElementById(id))return;
 e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();masterGo(id);
},true);
function init(){ensureEconomicShell();const hash=(location.hash||'').slice(1);masterGo(document.getElementById(hash)?hash:'dashboard')}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,250));else setTimeout(init,250);
})();