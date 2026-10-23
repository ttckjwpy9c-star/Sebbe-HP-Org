const toggle=document.getElementById('enabled');
const status=document.getElementById('status');
chrome.storage.sync.get({enabled:true}).then(v=>{toggle.checked=v.enabled!==false;status.textContent=toggle.checked?'På – markera ett ord för att slå upp det.':'Av – inga uppslagningar görs.';});
toggle.addEventListener('change',async()=>{
 try{await chrome.storage.sync.set({enabled:toggle.checked});status.textContent=toggle.checked?'På – markera ett ord för att slå upp det.':'Av – inga uppslagningar görs.';}
 catch(e){status.textContent='Kunde inte spara inställningen.';toggle.checked=!toggle.checked;}
});
