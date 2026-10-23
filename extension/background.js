const API='https://sv.wiktionary.org/w/api.php';
function cleanWiki(raw){
 let text=raw.replace(/\{\{tagg\|text=([^{}|]+)\}\}/gi,'($1)');
 text=text.replace(/\{\{(?:förklaring|betydelse)\|([^{}|]+)(?:\|[^{}]*)?\}\}/gi,'$1');
 text=text.replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g,'$2').replace(/\[\[([^\]]+)\]\]/g,'$1');
 text=text.replace(/\[https?:\/\/[^\s\]]+(?:\s+([^\]]+))?\]/g,'$1');
 text=text.replace(/<ref\b[^>]*>.*?<\/ref>/gi,'').replace(/<[^>]+>/g,'');
 text=text.replace(/\{\{[^{}]*\}\}/g,'').replace(/'{2,}/g,'').replace(/&nbsp;/g,' ');
 return text.replace(/\s+/g,' ').trim();
}
function parseSwedish(wikitext){
 const sections=wikitext.split(/(?=^==[^=]+==\s*$)/m);
 const swedish=sections.find(s=>/^==\s*svenska\s*==\s*$/im.test(s.split('\n')[0]||''))||'';
 if(!swedish)return [];
 const defs=[];
 for(const line of swedish.split('\n')){
  if(!/^#(?![:*#])\s*\S/.test(line))continue;
  if(/\{\{\s*(?:översätt|translation|uttal)/i.test(line))continue;
  const out=cleanWiki(line.replace(/^#\s*/,''));
  if(out.length>=3&&out.length<=500&&!/^\(/.test(out)&&!defs.includes(out))defs.push(out);
  if(out.startsWith('(')&&out.length>8&&!defs.includes(out))defs.push(out);
  if(defs.length===3)break;
 }
 return defs;
}
async function lookupWord(input){
 const word=input.normalize('NFC').trim();
 if(!/^[a-zåäöéèüA-ZÅÄÖÉÈÜ-]{2,45}$/.test(word))return {error:'Markera ett enda svenskt ord.'};
 const u=new URL(API);u.searchParams.set('action','parse');u.searchParams.set('page',word);
 u.searchParams.set('prop','wikitext');u.searchParams.set('format','json');u.searchParams.set('formatversion','2');
 const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),8500);
 try{
  const response=await fetch(u.toString(),{signal:ctl.signal,credentials:'omit'});
  if(!response.ok)throw new Error('http_'+response.status);
  const data=await response.json();
  const raw=typeof data?.parse?.wikitext==='string'?data.parse.wikitext:'';
  return {word,definitions:parseSwedish(raw),url:'https://sv.wiktionary.org/wiki/'+encodeURIComponent(word)};
 }catch(e){return {word,definitions:[],url:'https://sv.wiktionary.org/wiki/'+encodeURIComponent(word),error:'Ordboken kunde inte nås just nu.'};}
 finally{clearTimeout(timer);}
}

const PROJECT_URL='https://hkijnyhmpcczihmnepww.supabase.co';
const PUBLISHABLE='sb_publishable_Hn4cS6QdGCf4_853RjtICg_xV3WFV3b';
function authHeaders(token){return {'apikey':PUBLISHABLE,...(token?{'authorization':'Bearer '+token}:{})};}
async function loginToOrdtoppen(email,password){
 if(typeof email!=='string'||typeof password!=='string'||email.length>200||password.length>200)return {error:'Fyll i e-post och lösenord.'};
 const res=await fetch(PROJECT_URL+'/auth/v1/token?grant_type=password',{
 method:'POST',headers:{...authHeaders(),'content-type':'application/json'},
 body:JSON.stringify({email:email.trim(),password})});
 const data=await res.json();
 if(!res.ok||!data.access_token)return {error:'Inloggningen misslyckades. Kontrollera dina uppgifter.'};
 await chrome.storage.local.set({ordtoppenAuth:{access_token:data.access_token,refresh_token:data.refresh_token,expires_at:Date.now()+data.expires_in*1000,email:email.trim()}});
 return {signedIn:true,email:email.trim()};
}
async function logoutFromOrdtoppen(){await chrome.storage.local.remove('ordtoppenAuth');return {signedIn:false};}
async function getSessionToken(){
 const local=await chrome.storage.local.get('ordtoppenAuth');const sess=local.ordtoppenAuth;
 if(!sess?.access_token)return null;
 if(sess.expires_at>Date.now()+60000)return sess.access_token;
 if(!sess.refresh_token)return null;
 const res=await fetch(PROJECT_URL+'/auth/v1/token?grant_type=refresh_token',{
  method:'POST',headers:{...authHeaders(),'content-type':'application/json'},
  body:JSON.stringify({refresh_token:sess.refresh_token})});
 const data=await res.json().catch(()=>({}));
 if(!res.ok||!data.access_token){await chrome.storage.local.remove('ordtoppenAuth');return null;}
 const next={access_token:data.access_token,refresh_token:data.refresh_token,expires_at:Date.now()+data.expires_in*1000,email:sess.email};
 await chrome.storage.local.set({ordtoppenAuth:next});return next.access_token;
}
async function gptExplanation(word,sentence){
 const {enabled}=await chrome.storage.sync.get({enabled:true});
 if(enabled===false)return {error:'Läsassistenten är avstängd.'};
 const token=await getSessionToken();if(!token)return {error:'Logga in med ditt Ordtoppen-konto via tilläggets ikon för att använda GPT.'};
 const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),15000);
 try{
  const res=await fetch(PROJECT_URL+'/functions/v1/ordtoppen-gpt-pilot',{
  method:'POST',signal:controller.signal,
  headers:{...authHeaders(token),'content-type':'application/json'},
  body:JSON.stringify({word,sentence})});
  const data=await res.json().catch(()=>({}));
  return res.ok?data:{error:data.error||'GPT-förklaringen kunde inte hämtas.'};
 }catch(_){return {error:'Kunde inte nå GPT-tjänsten. Prova Wiktionary.'};}
 finally{clearTimeout(timeout);}
}
chrome.runtime.onMessage.addListener((msg,_sender,sendResponse)=>{
 const run=async()=>{
  switch(msg?.type){
   case 'ORDTOPPEN_LOOKUP': {
    const {enabled}=await chrome.storage.sync.get({enabled:true});
    return enabled===false?{error:'Läsassistenten är avstängd.'}:lookupWord(String(msg.word||''));
   }
   case 'ORDTOPPEN_AUTH_LOGIN': return loginToOrdtoppen(msg.email,msg.password);
   case 'ORDTOPPEN_AUTH_LOGOUT': return logoutFromOrdtoppen();
   case 'ORDTOPPEN_AUTH_STATUS': {
    const token=await getSessionToken();
    const ss=await chrome.storage.local.get('ordtoppenAuth');
    return {signedIn:!!token,email:token?ss.ordtoppenAuth?.email:''};
   }
   case 'ORDTOPPEN_GPT': return gptExplanation(String(msg.word||''),String(msg.sentence||'').slice(0,260));
   default: return {error:'Okänd förfrågan.'};
  }
 };
 run().then(sendResponse).catch(()=>sendResponse({error:'Det gick inte att utföra åtgärden.'}));return true;
});
