(()=>{
'use strict';
function activateEconomic(){
  const page=document.getElementById('economica');
  const btn=document.querySelector('[data-page="economica"]');
  if(!page||!btn)return;
  document.querySelectorAll('.page').forEach(p=>p.classList.toggle('active',p===page));
  document.querySelectorAll('.nav').forEach(n=>n.classList.toggle('active',n===btn));
  const title=document.getElementById('pageTitle');
  if(title)title.textContent='Propuesta Económica';
  const sidebar=document.getElementById('sidebar');
  const overlay=document.getElementById('overlay');
  sidebar?.classList.remove('open');
  overlay?.classList.remove('show');
  try{ if(typeof renderEconomic==='function') renderEconomic(); }catch(e){ console.error('renderEconomic',e); }
  window.scrollTo({top:0,behavior:'smooth'});
}
function bind(){
  const btn=document.querySelector('[data-page="economica"]');
  if(!btn)return;
  btn.onclick=null;
  btn.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();activateEconomic();});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(bind,250));
else setTimeout(bind,250);
setTimeout(bind,1000);
window.activateEconomic=activateEconomic;
})();