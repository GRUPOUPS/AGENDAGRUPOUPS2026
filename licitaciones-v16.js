(()=>{
'use strict';
function fixTimeline(){
  let s=document.getElementById('v16TimelineFix');
  if(!s){
    s=document.createElement('style');
    s.id='v16TimelineFix';
    s.textContent=`
      #dashboard .timeline{position:relative!important;padding-left:0!important}
      #dashboard .timeline-item{position:relative!important;padding:10px 8px 10px 32px!important;min-height:42px!important}
      #dashboard .timeline-item::before{left:8px!important;top:14px!important;transform:none!important}
      #dashboard .timeline-item strong,#dashboard .timeline-item span{display:block!important;position:relative!important;z-index:1!important}
      #dashboard .timeline-item strong{margin:0 0 3px!important;line-height:1.3!important}
      #dashboard .timeline-item span{margin:0!important;line-height:1.35!important}
    `;
    document.head.appendChild(s);
  }
}
fixTimeline();
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',fixTimeline);
setTimeout(fixTimeline,2500);
})();