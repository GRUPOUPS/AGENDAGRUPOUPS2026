(()=>{
'use strict';
const titles={dashboard:'Dashboard',oportunidades:'Radar de Oportunidades',nueva:'Nueva licitación',licitaciones:'Licitaciones',documentos:'Documentos Empresa',firmas:'Firmas requeridas',economica:'Propuesta Económica',competencia:'Competencia',analitica:'Analítica',resumen:'Resumen Ejecutivo'};
function masterGo(page){
  const target=document.getElementById(page);
  if(!target)return;
  document.querySelectorAll('.content > .page').forEach(p=>p.classList.toggle('active',p===target));
  document.querySelectorAll('.menu .nav[data-page]').forEach(n=>n.classList.toggle('active',n.dataset.page===page));
  const title=document.getElementById('pageTitle');
  if(title)title.textContent=titles[page]||'Gestor de Licitaciones';
  document.getElementById('sidebar')?.classList.remove('open');
  document.getElementById('overlay')?.classList.remove('show');
  try{
    if(page==='documentos'&&typeof window.renderDocuments==='function')window.renderDocuments();
    if(page==='firmas'&&typeof window.renderSignatureFolders==='function')window.renderSignatureFolders();
    if(page==='licitaciones'&&typeof window.renderTenders==='function')window.renderTenders();
    if(page==='competencia'&&typeof window.renderCompetition==='function')window.renderCompetition();
    if(page==='resumen'&&typeof window.renderExecutive==='function')window.renderExecutive();
    if(page==='dashboard'&&typeof window.renderDashboard==='function')window.renderDashboard();
    if(page==='oportunidades'&&typeof window.renderOpportunities==='function')window.renderOpportunities();
  }catch(err){console.error(err)}
  window.scrollTo(0,0);
}
window.go=masterGo;
window.gupsNavigate=masterGo;

document.addEventListener('click',e=>{
  const nav=e.target.closest('.menu .nav[data-page]');
  if(!nav)return;
  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation();
  masterGo(nav.dataset.page);
},true);

document.addEventListener('click',e=>{
  const btn=e.target.closest('[data-go]');
  if(!btn||btn.closest('.menu'))return;
  const page=btn.dataset.go;
  if(!document.getElementById(page))return;
  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation();
  masterGo(page);
},true);
})();