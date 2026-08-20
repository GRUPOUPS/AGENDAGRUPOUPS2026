(()=>{
'use strict';
const TITLES={dashboard:'Dashboard',oportunidades:'Radar de Oportunidades',nueva:'Nueva licitación',licitaciones:'Licitaciones',documentos:'Documentos Empresa',firmas:'Firmas requeridas',economica:'Propuesta Económica',competencia:'Competencia',analitica:'Analítica',resumen:'Resumen Ejecutivo'};
function masterGo(page){
 const target=document.getElementById(page);if(!target)return;
 document.querySelectorAll('.content > .page').forEach(p=>p.classList.toggle('active',p===target));
 document.querySelectorAll('.menu .nav[data-page]').forEach(n=>n.classList.toggle('active',n.dataset.page===page));
 const title=document.getElementById('pageTitle');if(title)title.textContent=TITLES[page]||'Gestor de Licitaciones';
 document.getElementById('sidebar')?.classList.remove('open');document.getElementById('overlay')?.classList.remove('show');
 try{
  if(page==='documentos'&&typeof renderDocuments==='function')renderDocuments();
  if(page==='firmas'&&typeof renderSignatureFolders==='function')renderSignatureFolders();
  if(page==='licitaciones'&&typeof renderTenders==='function')renderTenders();
  if(page==='competencia'&&typeof renderCompetition==='function')renderCompetition();
  if(page==='resumen'&&typeof renderExecutive==='function')renderExecutive();
  if(page==='economica'&&typeof window.renderEconomicSimple==='function')window.renderEconomicSimple();
  if(page==='dashboard'&&typeof renderDashboard==='function')renderDashboard();
  if(page==='oportunidades'&&typeof renderOpportunities==='function')renderOpportunities();
 }catch(e){console.error(e)}
 window.scrollTo(0,0);
 try{history.replaceState(null,'',location.pathname+location.search+'#'+page)}catch{}
}
window.go=masterGo;window.gupsNavigate=masterGo;
document.addEventListener('click',e=>{const nav=e.target.closest('.menu .nav[data-page]');if(!nav)return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();masterGo(nav.dataset.page)},true);
document.addEventListener('click',e=>{const b=e.target.closest('[data-go]');if(!b||b.closest('.menu'))return;const p=b.dataset.go;if(!document.getElementById(p))return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();masterGo(p)},true);
function init(){const hash=(location.hash||'').slice(1);masterGo(document.getElementById(hash)?hash:'dashboard')}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,1100));else setTimeout(init,1100);
})();