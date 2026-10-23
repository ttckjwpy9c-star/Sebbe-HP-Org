const toggle=document.getElementById('enabled');
const status=document.getElementById('status');
const loginBtn=document.getElementById('loginBtn'),logoutBtn=document.getElementById('logoutBtn');
const authMsg=document.getElementById('authMsg');
function setAuthView(data){
 const signedIn=data?.signedIn===true;
 document.getElementById('loggedIn').hidden=!signedIn;
 document.getElementById('loggedOut').hidden=signedIn;
 document.getElementById('userEmail').textContent=signedIn?'Inloggad: '+(data.email||'Ordtoppen-konto'):'';
}
async function loadAuth(){try{setAuthView(await chrome.runtime.sendMessage({type:'ORDTOPPEN_AUTH_STATUS'}));}catch(_){authMsg.textContent='Kunde inte kontrollera inloggningen.';}}
chrome.storage.sync.get({enabled:true}).then(v=>{toggle.checked=v.enabled!==false;status.textContent=toggle.checked?'På – markera ett ord för att slå upp det.':'Av – inga uppslagningar görs.';});
toggle.addEventListener('change',async()=>{
 try{await chrome.storage.sync.set({enabled:toggle.checked});status.textContent=toggle.checked?'På – markera ett ord för att slå upp det.':'Av – inga uppslagningar görs.';}
 catch(e){status.textContent='Kunde inte spara inställningen.';toggle.checked=!toggle.checked;}
});
loginBtn.addEventListener('click',async()=>{
 const email=document.getElementById('email').value.trim();
 const password=document.getElementById('password').value;
 if(!email||!password){authMsg.textContent='Fyll i e-post och lösenord.';return;}
 loginBtn.disabled=true;authMsg.textContent='Loggar in…';
 try{const result=await chrome.runtime.sendMessage({type:'ORDTOPPEN_AUTH_LOGIN',email,password});
  authMsg.textContent=result?.signedIn?'Inloggad! Du kan nu prova GPT-knappen i läsassistenten.':(result?.error||'Det gick inte att logga in.');
  if(result?.signedIn){document.getElementById('password').value='';setAuthView(result);}
 }catch(_){authMsg.textContent='Det gick inte att ansluta till ditt konto.';}
 finally{loginBtn.disabled=false;}
});
logoutBtn.addEventListener('click',async()=>{
 await chrome.runtime.sendMessage({type:'ORDTOPPEN_AUTH_LOGOUT'});
 setAuthView({signedIn:false});authMsg.textContent='Utloggad från GPT-piloten.';
});
loadAuth();
