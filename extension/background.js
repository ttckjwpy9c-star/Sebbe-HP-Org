const PROJECT_URL='https://hkijnyhmpcczihmnepww.supabase.co';
const responseCache=new Map();
const MAX_CACHE_SIZE=120;
const PUBLISHABLE='sb_publishable_Hn4cS6QdGCf4_853RjtICg_xV3WFV3b';
function authHeaders(token){return {'apikey':PUBLISHABLE,...(token?{'authorization':'Bearer '+token}:{})};}
async function loginToOrdtoppen(email,password){
 responseCache.clear();
 if(typeof email!=='string'||typeof password!=='string'||email.length>200||password.length>200)return {error:'Fyll i e-post och lösenord.'};
 const res=await fetch(PROJECT_URL+'/auth/v1/token?grant_type=password',{
 method:'POST',headers:{...authHeaders(),'content-type':'application/json'},
 body:JSON.stringify({email:email.trim(),password})});
 const data=await res.json();
 if(!res.ok||!data.access_token)return {error:'Inloggningen misslyckades. Kontrollera dina uppgifter.'};
 await chrome.storage.local.set({ordtoppenAuth:{access_token:data.access_token,refresh_token:data.refresh_token,expires_at:Date.now()+data.expires_in*1000,email:email.trim()}});
 return {signedIn:true,email:email.trim()};
}
async function logoutFromOrdtoppen(){responseCache.clear();await chrome.storage.local.remove('ordtoppenAuth');return {signedIn:false};}
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
 const token=await getSessionToken();
 if(!token)return {error:'Logga in med ditt Ordtoppen-konto via tilläggets ikon för att se AI-förklaringar.'};
 const cleanWord=String(word||'').trim().normalize('NFC');
 const context=String(sentence||'').trim().slice(0,260);
 if(!/^[a-zA-ZåäöÅÄÖéèÉÈüÜ-]{2,48}$/.test(cleanWord))return {error:'Markera ett enda svenskt ord.'};
 const ss=await chrome.storage.local.get('ordtoppenAuth');
 const account=String(ss.ordtoppenAuth?.email||'').toLocaleLowerCase('sv-SE');
 const cacheKey=account+'|'+cleanWord.toLocaleLowerCase('sv-SE')+'|'+context;
 if(responseCache.has(cacheKey))return responseCache.get(cacheKey);
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),15000);
 try{
  const res=await fetch(PROJECT_URL+'/functions/v1/ordtoppen-gpt-pilot',{
   method:'POST',signal:controller.signal,
   headers:{...authHeaders(token),'content-type':'application/json'},
   body:JSON.stringify({word:cleanWord,sentence:context})
  });
  const data=await res.json().catch(()=>({}));
  const result=res.ok?data:{error:data.error||'GPT-förklaringen kunde inte hämtas.'};
  if(result.explanation){
   responseCache.set(cacheKey,result);
   if(responseCache.size>MAX_CACHE_SIZE)responseCache.delete(responseCache.keys().next().value);
  }
  return result;
 }catch(_){return {error:'Kunde inte nå AI-tjänsten just nu. Försök igen lite senare.'};}
 finally{clearTimeout(timeout);}
}

async function savePersonalWord(word,definition,sentence){
 const token=await getSessionToken();
 if(!token)return {error:'Logga in i tillägget för att spara ord till din personliga samling.'};
 const w=String(word||'').trim().normalize('NFC'),explanation=String(definition||'').trim();
 if(!/^[a-zA-ZåäöÅÄÖéèÉÈüÜ-]{2,48}$/.test(w)||explanation.length<3||explanation.length>1000)
  return {error:'Ordet eller förklaringen kunde inte sparas.'};
 const payload={
  term:w,normalized_term:w.toLocaleLowerCase('sv-SE'),
  definition:explanation,context_sentence:String(sentence||'').trim().slice(0,260)||null
 };
 // Retrieve trusted user ID via Supabase Auth; RLS checks ownership.
 const who=await fetch(PROJECT_URL+'/auth/v1/user',{headers:authHeaders(token)});
 if(!who.ok)return {error:'Inloggningen behöver förnyas. Öppna tilläggets meny.'};
 const account=await who.json();
 if(!account?.id)return {error:'Kunde inte identifiera ditt konto.'};
 payload.user_id=account.id;
 const res=await fetch(PROJECT_URL+'/rest/v1/personal_words',{
   method:'POST',
   headers:{...authHeaders(token),'content-type':'application/json','Prefer':'return=minimal'},
   body:JSON.stringify(payload)
 });
 if(res.ok)return {saved:true,alreadySaved:false};
 const error=await res.json().catch(()=>({}));
 if(res.status===409&&error?.code==='23505')return {saved:true,alreadySaved:true};
 return {error:'Det gick inte att spara ordet. Försök igen.'};
}
chrome.runtime.onMessage.addListener((msg,_sender,sendResponse)=>{
 const run=async()=>{
  switch(msg?.type){
   case 'ORDTOPPEN_AUTH_LOGIN': return loginToOrdtoppen(msg.email,msg.password);
   case 'ORDTOPPEN_AUTH_LOGOUT': return logoutFromOrdtoppen();
   case 'ORDTOPPEN_AUTH_STATUS': {
    const token=await getSessionToken();
    const ss=await chrome.storage.local.get('ordtoppenAuth');
    return {signedIn:!!token,email:token?ss.ordtoppenAuth?.email:''};
   }
   case 'ORDTOPPEN_GPT': return gptExplanation(String(msg.word||''),String(msg.sentence||'').slice(0,260));
   case 'ORDTOPPEN_SAVE_PERSONAL': return savePersonalWord(msg.word,msg.definition,msg.sentence);
   default: return {error:'Okänd förfrågan.'};
  }
 };
 run().then(sendResponse).catch(()=>sendResponse({error:'Det gick inte att utföra åtgärden.'}));return true;
});
