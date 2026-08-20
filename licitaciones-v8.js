(()=>{
'use strict';
const TITLES={dashboard:'Dashboard',oportunidades:'Radar de Oportunidades',nueva:'Nueva licitación',licitaciones:'Licitaciones',documentos:'Documentos Empresa',firmas:'Firmas requeridas',economica:'Propuesta Económica',competencia:'Competencia',analitica:'Analítica',resumen:'Resumen Ejecutivo'};
function renderPage(id){
  try{
    if(id==='dashboard'&&typeof renderDashboard==='function')renderDashboard();
    if(id==='oportunidades'&&typeof renderOpportunities==='function')renderOpportunities();
    if(id==='licitaciones'&&typeof renderTenders==='function')renderTenders();
    if(id==='documentos'&&typeof renderDocuments==='function')renderDocuments();
    if(id==='firmas'&&typeof renderSignatureFolders==='function')renderSignatureFolders();
    if(id==='economica'&&typeof renderEconomic==='function')renderEconomic();
    if(id==='competencia'&&typeof renderCompetition==='function')renderCompetition();
    if(id==='analitica'&&typeof renderAnalytics==='function')renderAnalytics();
    if(id==='resumen'&&typeof renderExecutive==='function')renderExecutive();
  }catch(err){console.error('Error al renderizar '+id,err)}
}
function navigate(id){
  const page=document.getElementById(id);
  if(!page){console.warn('Página no encontrada:',id);return false;}
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  page.classList.add('active');
  document.querySelectorAll('.menu .nav').forEach(n=>n.classList.remove('active'));
  const nav=document.querySelector(`.menu .nav[data-page="${CSS.escape(id)}"]`);
  if(nav)nav.classList.add('active');
  const title=document.getElementById('pageTitle');
  if(title)title.textContent=TITLES[id]||'Gestor de Licitaciones';
  document.getElementById('sidebar')?.classList.remove('open');
  document.getElementById('overlay')?.classList.remove('show');
  renderPage(id);
  window.scrollTo({top:0,behavior:'auto'});
  try{history.replaceState(null,'',location.pathname+location.search+'#'+id)}catch{}
  return true;
}
// Captura antes que los manejadores antiguos y evita que dos módulos se activen a la vez.
document.addEventListener('click',e=>{
  const nav=e.target.closest('.menu .nav[data-page]');
  if(!nav)return;
  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation();
  navigate(nav.dataset.page);
},true);
// También estabiliza atajos internos que usan data-go.
document.addEventListener('click',e=>{
  const go=e.target.closest('[data-go]');
  if(!go||go.closest('.menu'))return;
  const id=go.dataset.go;
  if(!document.getElementById(id))return;
  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation();
  navigate(id);
},true);
window.gupsNavigate=navigate;
window.addEventListener('load',()=>{
  setTimeout(()=>{
    const hash=(location.hash||'').slice(1);
    if(hash&&document.getElementById(hash))navigate(hash);
    else{
      const active=document.querySelector('.page.active');
      if(active)navigate(active.id);
      else navigate('dashboard');
    }
  },300);
});
})();