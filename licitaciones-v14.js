(()=>{
'use strict';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
let DB=null,running=false;
async function ready(){for(let i=0;i<30;i++){const db=window.__gupsLicitacionesDb;if(db){const {data}=await db.auth.getSession();if(data?.session){DB=db;return true}}await new Promise(r=>setTimeout(r,250))}return false}
function findCard(title){return $$('#dashboard .priority-card').find(c=>($('h4',c)?.textContent||'').trim().toLowerCase()===title.toLowerCase())}
async function sync(){if(running||!DB)return;running=true;try{
 const now=new Date().toISOString();
 let {data:tenders,error:tErr}=await DB.from('licitaciones').select('id,code,name,object,entity,deadline,status').gte('deadline',now).order('deadline',{ascending:true}).limit(20);
 if(tErr)throw tErr;
 if(!tenders?.length){const q=await DB.from('licitaciones').select('id,code,name,object,entity,deadline,status').order('deadline',{ascending:false}).limit(20);if(q.error)throw q.error;tenders=q.data||[]}
 const priority=tenders?.[0]||null;
 const ids=(tenders||[]).map(t=>t.id);
 let reqs=[];
 if(ids.length){const q=await DB.from('licitacion_requirements').select('licitacion_id,critical,requires_signature,status,subsanability').in('licitacion_id',ids);if(q.error)throw q.error;reqs=q.data||[]}
 const pr=priority?reqs.filter(r=>r.licitacion_id===priority.id):[];
 const critical=pr.filter(r=>r.critical===true||String(r.subsanability||'').toLowerCase()==='no subsanable').length;
 const signs=pr.filter(r=>r.requires_signature===true&&!['Listo','Completado','Firmado','Revisado'].includes(r.status||'')).length;
 const critCard=findCard('No subsanables');
 if(critCard){const big=$('.big',critCard),p=$('p',critCard);if(big)big.textContent=String(critical);if(p)p.textContent=priority?`${critical} requisito${critical===1?'':'s'} no subsanable${critical===1?'':'s'} del proceso prioritario.`:'Sin proceso prioritario.'}
 const signCard=findCard('Firmas pendientes');
 if(signCard){const big=$('.big',signCard),p=$('p',signCard);if(big)big.textContent=String(signs);if(p)p.textContent=priority?`${signs} documento${signs===1?'':'s'} requiere${signs===1?'':'n'} firma.`:'Sin proceso prioritario.'}
 const statCards=$$('#licitaciones .tender-summary .stat-card');
 if(statCards.length>=5){const allCritical=reqs.filter(r=>r.critical===true||String(r.subsanability||'').toLowerCase()==='no subsanable').length;const v=$('.value',statCards[4]),sub=$('.sub',statCards[4]);if(v)v.textContent=String(allCritical);if(sub)sub.textContent='No subsanables reales';}
 window.__gupsDashboardCounts={priorityCode:priority?.code||null,critical,signs};
 }catch(e){console.error('No se pudieron sincronizar los indicadores reales',e)}finally{running=false}}
async function boot(){if(!(await ready()))return;setTimeout(sync,1200);setInterval(sync,4000);document.addEventListener('click',e=>{if(e.target.closest('[data-page="dashboard"],[data-page="licitaciones"],[data-go="dashboard"],[data-go="licitaciones"]'))setTimeout(sync,350)},true);const dash=$('#dashboard');if(dash)new MutationObserver(()=>{if(dash.classList.contains('active'))setTimeout(sync,80)}).observe(dash,{attributes:true,attributeFilter:['class']})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,3300));else setTimeout(boot,3300);
window.gupsSyncDashboardCounts=sync;
})();