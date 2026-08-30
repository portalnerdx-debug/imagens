const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const text=async(el)=>{el.scrollIntoView({block:"center"});el.click();await sleep(400)};
async function find(selectors, timeout=15000){const start=Date.now();while(Date.now()-start<timeout){for(const s of selectors){const el=document.querySelector(s);if(el)return el}await sleep(250)}throw new Error("Elemento não encontrado: "+selectors.join(" | "))}
async function fill(selectors,value){const el=await find(selectors);el.focus();el.value=String(value);el.dispatchEvent(new InputEvent("input",{bubbles:true,inputType:"insertText",data:String(value)}));el.dispatchEvent(new Event("change",{bubbles:true}));return el}
async function byText(value){return [...document.querySelectorAll("button,a,[role=button],label,div,span")].find(e=>e.offsetParent&&e.textContent?.trim().toLowerCase()===String(value).trim().toLowerCase())}
async function clickText(value){const el=await byText(value);if(!el)throw new Error("Texto não encontrado: "+value);await text(el)}
async function run(job){
  await fill(['input[name="cpf"]','input[placeholder*="CPF" i]','input[type="tel"]'],job.cpf);
  const product=await find(['input[name="produto"]','input[placeholder*="produto" i]','input[placeholder*="código" i]']);
  product.value=job.productCode;product.dispatchEvent(new Event('input',{bubbles:true}));await sleep(800);
  const first=[...document.querySelectorAll('[role="option"],.product-item,.autocomplete-item')].find(e=>e.offsetParent);if(first)await text(first);
  if(job.voltage) {const v=await byText(job.voltage)||await byText(job.voltage+"V");if(v)await text(v)}
  if(job.mode==='credit'){
    for(const a of job.auxiliary||[]){await fill(['input[name="produto"]','input[placeholder*="produto" i]','input[placeholder*="código" i]'],a.code);await sleep(700);const opt=[...document.querySelectorAll('[role="option"],.product-item,.autocomplete-item')].find(e=>e.offsetParent);if(opt)await text(opt)}
    if(job.warranty) {const w=await byText('Garantia');if(w)await text(w)}
  }
  await clickText(job.plan);
  if(job.entry)await fill(['input[name="entrada"]','input[placeholder*="entrada" i]'],job.entry);
  const installments=document.querySelector('input[name="parcelas"],input[placeholder*="parcel" i]');if(installments){installments.value=job.installments;installments.dispatchEvent(new Event('input',{bubbles:true}))}
}
(async()=>{const all=await chrome.storage.session.get(null); const entry=Object.entries(all).find(([k])=>k.startsWith('job:'));if(!entry)return;const [storageKey,job]=entry;await chrome.storage.session.remove(storageKey);try{await run(job)}catch(e){console.error('XVendas Click:',e);alert('XVendas Click: '+e.message)}})();