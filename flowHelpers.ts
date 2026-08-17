import type {Locator,Page} from "playwright";

export async function firstVisible(page:Page,selectors:string[],timeout=800):Promise<Locator|null>{
 for(const selector of selectors){
  const loc=page.locator(selector).first();
  if(await loc.isVisible({timeout}).catch(()=>false))return loc;
 }
 return null;
}

export async function clickText(page:Page,patterns:RegExp[],timeout=1000){
 for(const pattern of patterns){
  const byRole=page.getByRole("button",{name:pattern}).first();
  if(await byRole.isVisible({timeout}).catch(()=>false)){await byRole.click();return true}
  const byText=page.getByText(pattern,{exact:false}).first();
  if(await byText.isVisible({timeout}).catch(()=>false)){await byText.click();return true}
 }
 return false;
}

export async function fillFirst(page:Page,selectors:string[],value:string){
 const loc=await firstVisible(page,selectors);
 if(!loc)return false;
 await loc.fill(value);
 return true;
}

export async function pageContains(page:Page,pattern:RegExp){
 return page.getByText(pattern,{exact:false}).first().isVisible({timeout:700}).catch(()=>false);
}

export function moneyValues(text:string){
 return [...text.matchAll(/R\$\s*([\d.]+,\d{2})/g)].map(m=>({
  raw:m[0],value:Number(m[1].replace(/\./g,"").replace(",","."))
 })).filter(x=>Number.isFinite(x.value));
}
