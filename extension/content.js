(()=>{
 'use strict';
 const APP_HOST='ttckjwpy9c-star.github.io';
 const APP_PATH='/Sebbe-HP-Org/';
 const appPage=location.hostname===APP_HOST&&location.pathname.startsWith(APP_PATH);
 let enabled=true,overlay=null,selectionSequence=0;
 const trustedSelection=(value)=>/^[a-zåäöéèüA-ZÅÄÖÉÈÜ-]{2,45}$/.test(value);
 function clearOverlay(){if(overlay){overlay.remove();overlay=null;}}
 function sendBridgeState(){
  if(!appPage)return;
  window.postMessage({type:'ORDTOPPEN_EXTENSION_STATE',enabled,installed:true},location.origin);
 }
 function messageBridge(event){
  if(!appPage||event.source!==window||event.origin!==location.origin)return;
  const msg=event.data;
  if(!msg||typeof msg!=='object')return;
  if(msg.type==='ORDTOPPEN_EXTENSION_REQUEST_STATE'){sendBridgeState();return;}
  if(msg.type!=='ORDTOPPEN_EXTENSION_SET_ENABLED'||typeof msg.enabled!=='boolean')return;
  chrome.storage.sync.set({enabled:msg.enabled}).then(()=>{
   enabled=msg.enabled;if(!enabled)clearOverlay();sendBridgeState();
  }).catch(()=>window.postMessage({type:'ORDTOPPEN_EXTENSION_ERROR'},location.origin));
 }
 function makeOverlay(rect,word){
  clearOverlay();
  const host=document.createElement('div');host.setAttribute('data-ordtoppen-overlay','');
  Object.assign(host.style,{position:'fixed',zIndex:'2147483647',left:'10px',top:'10px',width:'min(340px, calc(100vw - 24px))',pointerEvents:'auto'});
  const root=host.attachShadow({mode:'closed'});
  const css=document.createElement('style');css.textContent=`
  :host{all:initial}*{box-sizing:border-box}
  .panel{color:#192d4b;background:#fff;border:1px solid #c7d6ed;box-shadow:0 15px 42px #172a4b35;border-radius:16px;padding:15px;font:14px/1.5 system-ui,Segoe UI,Arial,sans-serif}
  .top{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px}
  strong{font-size:17px;color:#17376e}button{border:0;border-radius:9px;padding:6px 10px;cursor:pointer;color:#27426f;background:#eaf1ff;font-size:15px}
  p{margin:9px 0;color:#2c4263}a{display:inline-block;color:#254cb8;font-weight:700;margin-top:6px;text-decoration:underline}
  .status{color:#465c7b}.foot{font-size:11px;color:#61758e;border-top:1px solid #e4eaf4;padding-top:8px;margin-top:10px}.gpt-area{margin-top:11px;padding-top:10px;border-top:1px solid #dae4f4}.gpt-button{width:100%;background:#eaf1ff;color:#183b82;border:1px solid #bdcff4;border-radius:10px;padding:10px 12px;font-size:13px;font-weight:800;text-align:center;cursor:pointer}.gpt-button:hover{background:#dce8ff}.gpt-button:disabled{cursor:wait;opacity:.7}.gpt-explain{color:#213b64;line-height:1.55;margin:10px 0 0}.gpt-info{font-size:11px;color:#65748e;margin:8px 0 0}
  `;
  const card=document.createElement('div');card.className='panel';card.setAttribute('role','dialog');card.setAttribute('aria-label','Ordtoppen orddefinition');
  const head=document.createElement('div');head.className='top';
  const title=document.createElement('strong');title.textContent=word;
  const close=document.createElement('button');close.textContent='×';close.setAttribute('aria-label','Stäng definition');close.onclick=clearOverlay;
  head.append(title,close);
  const body=document.createElement('div');body.className='status';body.textContent='Söker betydelse…';
  const foot=document.createElement('div');foot.className='foot';foot.textContent='Definitioner från svenska Wiktionary';
  card.append(head,body,foot);root.append(css,card);
  const x=Math.min(Math.max(12,rect?.left||12),window.innerWidth-360);
  const y=Math.min(Math.max(12,(rect?.bottom||15)+10),Math.max(12,window.innerHeight-200));
  host.style.left=Math.max(12,x)+'px';host.style.top=y+'px';
  document.documentElement.append(host);overlay=host;
  return {body,host};
 }
function excerptSentence(selection){
 try{
  const node=selection?.anchorNode?.parentElement;
  const raw=(node?.closest('p,li,blockquote,article')?.textContent||node?.textContent||'').replace(/\s+/g,' ').trim();
  if(!raw||raw.length<3)return '';
  const selected=selection.toString().trim();const pos=raw.toLocaleLowerCase('sv-SE').indexOf(selected.toLocaleLowerCase('sv-SE'));
  if(pos<0)return raw.slice(0,260);
  return raw.slice(Math.max(0,pos-110),Math.min(raw.length,pos+selected.length+145));
 }catch(_){return ''}
}
 async function showDefinition(word,rect,sequence,sentence=''){
  if(!enabled)return;
  const {body,host}=makeOverlay(rect,word);
  try{
   const reply=await chrome.runtime.sendMessage({type:'ORDTOPPEN_LOOKUP',word});
   if(sequence!==selectionSequence||overlay!==host||!enabled)return;
   body.replaceChildren();
   const defs=Array.isArray(reply?.definitions)?reply.definitions.slice(0,3):[];
   if(defs.length){defs.forEach(d=>{const p=document.createElement('p');p.textContent=d;body.append(p);});}
   else{const p=document.createElement('p');p.textContent=reply?.error||'Ingen säker svensk definition kunde hämtas för det här ordet.';body.append(p);}
   if(reply?.url&&reply.url.startsWith('https://sv.wiktionary.org/wiki/')){
    const link=document.createElement('a');link.textContent='Öppna i Wiktionary ↗';link.href=reply.url;link.target='_blank';link.rel='noopener noreferrer';body.append(link);
   }
   const area=document.createElement('div');area.className='gpt-area';
   const button=document.createElement('button');button.className='gpt-button';
   button.textContent='✨ Förklara enklare med GPT';
   const explain=document.createElement('div');explain.className='gpt-explain';
   const info=document.createElement('div');info.className='gpt-info';
   info.textContent='Valfritt AI-svar – kan innehålla fel. Wiktionary finns kvar ovanför.';
   button.onclick=async()=>{
    if(overlay!==host||!enabled||button.disabled)return;
    button.disabled=true;button.textContent='GPT förklarar…';explain.textContent='';
    try{
     const result=await chrome.runtime.sendMessage({type:'ORDTOPPEN_GPT',word,sentence});
     if(overlay!==host)return;
     explain.textContent=result?.explanation||result?.error||'Ingen AI-förklaring tillgänglig.';
     button.textContent=result?.explanation?'Förklara med GPT igen':'Prova GPT igen';
    }catch(_){explain.textContent='Kunde inte nå GPT. Prova Wiktionary.';button.textContent='Prova GPT igen';}
    finally{button.disabled=false;}
   };
   area.append(button,explain,info);body.append(area);
  }catch(_){
   if(overlay===host){body.textContent='Kunde inte hämta betydelsen just nu.';}
  }
 }
 function handleSelection(event){
  if(!enabled)return;
  if(event?.target?.closest?.('[data-ordtoppen-overlay]'))return;
  const selection=window.getSelection();
  if(!selection||selection.isCollapsed)return;
  const word=selection.toString().trim();
  if(!trustedSelection(word))return;
  const node=selection.anchorNode?.parentElement;
  if(node?.closest('input, textarea, [contenteditable="true"], [role="textbox"]'))return;
  let rect;try{rect=selection.getRangeAt(0).getBoundingClientRect();}catch(_){return;}
  if(!rect||!Number.isFinite(rect.bottom))return;
  const token=++selectionSequence;
  showDefinition(word,rect,token,excerptSentence(selection));
 }
 // Mouse selection and keyboard text selection
 document.addEventListener('mouseup',handleSelection,true);
 document.addEventListener('keyup',e=>{if(e.key==='Shift'||e.key.startsWith('Arrow'))handleSelection(e);},true);
 document.addEventListener('keydown',e=>{if(e.key==='Escape')clearOverlay();},true);
 document.addEventListener('mousedown',e=>{if(overlay&&!e.composedPath().includes(overlay))clearOverlay();},true);
 chrome.storage.onChanged.addListener((changes,area)=>{
  if(area!=='sync'||!changes.enabled)return;
  enabled=changes.enabled.newValue!==false;
  if(!enabled)clearOverlay();
  sendBridgeState();
 });
 window.addEventListener('message',messageBridge);
 chrome.storage.sync.get({enabled:true}).then(s=>{enabled=s.enabled!==false;sendBridgeState();});
})();