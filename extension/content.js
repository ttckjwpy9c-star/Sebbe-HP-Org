(()=>{
 'use strict';
 const APP_HOST='ttckjwpy9c-star.github.io';
 const APP_PATH='/Sebbe-HP-Org/';
 const appPage=location.hostname===APP_HOST&&location.pathname.startsWith(APP_PATH);
 let enabled=true,overlay=null,selectionSequence=0;
 const trustedSelection=(value)=>/^[a-zåäöéèüA-ZÅÄÖÉÈÜ-]{2,45}$/.test(value);
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
 let lookupTimer=null,lastLookupKey='',activeLookupKey='';
 function clearOverlay(){if(overlay){overlay.remove();overlay=null;}activeLookupKey='';}
 function makeOverlay(rect,word){
  clearOverlay();
  const host=document.createElement('div');host.setAttribute('data-ordtoppen-overlay','');
  Object.assign(host.style,{position:'fixed',zIndex:'2147483647',left:'12px',top:'12px',width:'min(350px, calc(100vw - 24px))',pointerEvents:'auto'});
  const root=host.attachShadow({mode:'closed'});
  const css=document.createElement('style');css.textContent=String.raw\`
  :host{all:initial}*{box-sizing:border-box}
  .panel{color:#1e2a5a;background:#fff;border:1px solid #dce3fa;box-shadow:0 16px 46px #172a4b30;border-radius:19px;padding:17px;font:14px/1.55 Nunito,system-ui,Segoe UI,Arial,sans-serif}
  .top{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:9px}
  strong{font-size:19px;color:#1e2a5a;font-weight:850}
  button{border:0;border-radius:10px;padding:5px 10px;cursor:pointer;color:#344da4;background:#edf0ff;font-size:18px;font-weight:800}
  .brand{font-size:10px;color:#6378d4;font-weight:900;text-transform:uppercase;letter-spacing:1.2px}
  p{margin:7px 0;color:#324569;line-height:1.6}
  .status{font-size:14px;color:#405274;overflow-wrap:anywhere;white-space:pre-wrap}
  .foot{font-size:11px;color:#7c88a3;border-top:1px solid #e6eaf5;padding-top:10px;margin-top:13px}
  .loading{color:#6575a5}
  .spinner{display:inline-block;width:12px;height:12px;border:2px solid #dbe1f8;border-top-color:#526af4;border-radius:50%;animation:spin .8s linear infinite;margin-right:8px;vertical-align:-1px}
  @keyframes spin{to{transform:rotate(360deg)}}
  .error{color:#9c4b37}
  \`;
  const card=document.createElement('div');card.className='panel';card.setAttribute('role','dialog');card.setAttribute('aria-label','Ordtoppen AI-förklaring');
  const brand=document.createElement('div');brand.className='brand';brand.textContent='✦ Ordtoppen läsassistent';
  const head=document.createElement('div');head.className='top';
  const title=document.createElement('strong');title.textContent=word;
  const close=document.createElement('button');close.textContent='×';close.setAttribute('aria-label','Stäng förklaring');close.onclick=()=>{selectionSequence++;clearOverlay();};
  head.append(title,close);
  const body=document.createElement('div');body.className='status loading';body.textContent='AI förklarar ordet…';
  const foot=document.createElement('div');foot.className='foot';foot.textContent='AI-genererad förklaring · kan innehålla fel · högst 20 uppslagningar/dag';
  card.append(brand,head,body,foot);root.append(css,card);
  // Clamp to viewport, including narrow mobile layouts.
  const panelWidth=Math.min(350,window.innerWidth-24);
  const x=Math.min(Math.max(12,rect?.left||12),Math.max(12,window.innerWidth-panelWidth-12));
  const y=Math.min(Math.max(12,(rect?.bottom||15)+10),Math.max(12,window.innerHeight-205));
  host.style.left=x+'px';host.style.top=y+'px';
  document.documentElement.append(host);overlay=host;
  return {body,host};
 }
 function excerptSentence(selection){
  try{
   const node=selection?.anchorNode?.parentElement;
   const raw=(node?.closest('p,li,blockquote')?.textContent||node?.textContent||'').replace(/\s+/g,' ').trim();
   if(!raw||raw.length<3)return '';
   const selected=selection.toString().trim(),at=raw.toLocaleLowerCase('sv-SE').indexOf(selected.toLocaleLowerCase('sv-SE'));
   if(at<0)return '';
   return raw.slice(Math.max(0,at-100),Math.min(raw.length,at+selected.length+120));
  }catch(_){return ''}
 }
 async function showDefinition(word,rect,sequence,sentence=''){
  if(!enabled||sequence!==selectionSequence)return;
  const {body,host}=makeOverlay(rect,word);
  activeLookupKey=word.toLocaleLowerCase('sv-SE')+'|'+sentence;
  try{
   const reply=await chrome.runtime.sendMessage({type:'ORDTOPPEN_GPT',word,sentence});
   if(sequence!==selectionSequence||overlay!==host||!enabled)return;
   body.classList.remove('loading');
   body.textContent=reply?.explanation||reply?.error||'AI-förklaringen kunde inte hämtas.';
   if(!reply?.explanation)body.classList.add('error');
  }catch(_){
   if(sequence===selectionSequence&&overlay===host){body.classList.remove('loading');body.classList.add('error');body.textContent='Det gick inte att nå GPT. Kontrollera inloggningen i tilläggets meny.';}
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
  const sentence=excerptSentence(selection);
  const key=word.toLocaleLowerCase('sv-SE')+'|'+sentence;
  if(key===activeLookupKey&&overlay)return;
  if(lookupTimer)clearTimeout(lookupTimer);
  lookupTimer=setTimeout(()=>{lookupTimer=null;if(enabled&&token===selectionSequence)showDefinition(word,rect,token,sentence);},350);
 }
 // Mouse selection and keyboard text selection
 document.addEventListener('mouseup',handleSelection,true);
 document.addEventListener('keyup',e=>{if(e.key==='Shift'||e.key.startsWith('Arrow'))handleSelection(e);},true);
 document.addEventListener('keydown',e=>{if(e.key==='Escape'){selectionSequence++;if(lookupTimer)clearTimeout(lookupTimer);clearOverlay();}},true);
 document.addEventListener('mousedown',e=>{if(overlay&&!e.composedPath().includes(overlay)){selectionSequence++;clearOverlay();}},true);
 chrome.storage.onChanged.addListener((changes,area)=>{
  if(area!=='sync'||!changes.enabled)return;
  enabled=changes.enabled.newValue!==false;
  if(!enabled){selectionSequence++;if(lookupTimer)clearTimeout(lookupTimer);clearOverlay();}
  sendBridgeState();
 });
 window.addEventListener('message',messageBridge);
 chrome.storage.sync.get({enabled:true}).then(s=>{enabled=s.enabled!==false;sendBridgeState();});
})();