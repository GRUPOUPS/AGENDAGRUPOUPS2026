(()=>{
'use strict';
const titles={dashboard:'Dashboard',oportunidades:'Radar de Oportunidades',nueva:'Nueva licitación',licitaciones:'Licitaciones',documentos:'Documentos Empresa',firmas:'Firmas requeridas',economica:'Propuesta Económica',competencia:'Competencia',analitica:'Analítica',resumen:'Resumen Ejecutivo'};
function masterGo(page){
  const target=document.getElementById(page);
  if(!target){console.error('Sección no encontrada:',page);return;}
  try{if(window.state)window.state.currentPage=page}catch{}
  document.querySelectorAll('.content > .page').forEach(p=>p.classList.remove('active'));
  target.classList.add('active');
  document.querySelectorAll('.menu .nav[data-page]').forEach(n=>n.classList.remove('active'));
  const nav=document.querySelector('.menu .nav[data-page="'+page+'"]');
  if(nav)nav.classList.add('active');
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
  }catch(e){console.error(e)}
  window.scrollTo(0,0);
}
// Sustituye la función global original que usan los módulos existentes.
window.go=masterGo;
window.gupsNavigate=masterGo;

// Reasigna todos los botones principales con una única navegación.
function rebind(){
  document.querySelectorAll('.menu .nav[data-page]').forEach(btn=>{
    const clone=btn.cloneNode(true);
    btn.replaceWith(clone);
    clone.addEventListener('click',e=>{e.preventDefault();masterGo(clone.dataset.page)});
  });
}

// Corrige cualquier estado visual duplicado que produzca código antiguo.
let current='dashboard';
const observer=new MutationObserver(()=>{
  const activePage=document.querySelector('.content > .page.active');
  if(activePage)current=activePage.id;
  const activeNavs=[...document.querySelectorAll('.menu .nav.active')];
  if(activeNavs.length!==1||activeNavs[0]?.dataset.page!==current){
    document.querySelectorAll('.menu .nav').forEach(n=>n.classList.toggle('active',n.dataset.page===current));
  }
  const activePages=[...document.querySelectorAll('.content > .page.active')];
  if(activePages.length>1){activePages.forEach(p=>p.classList.toggle('active',p.id===current));}
});

function init(){
  rebind();
  observer.observe(document.querySelector('.app')||document.body,{subtree:true,attributes:true,attributeFilter:['class']});
  const initial=document.querySelector('.content > .page.active')?.id||'dashboard';
  masterGo(initial);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,700));else setTimeout(init,700);
})();