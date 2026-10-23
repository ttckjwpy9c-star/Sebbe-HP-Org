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
chrome.runtime.onMessage.addListener((message,sender,sendResponse)=>{
 if(message?.type!=='ORDTOPPEN_LOOKUP')return;
 (async()=>{
  const {enabled}=await chrome.storage.sync.get({enabled:true});
  if(enabled===false)return {error:'Läsassistenten är avstängd.'};
  return lookupWord(String(message.word||''));
 })().then(sendResponse).catch(()=>sendResponse({error:'Uppslagningen misslyckades.'}));
 return true;
});