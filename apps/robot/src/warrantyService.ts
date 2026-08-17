export const CLICK_EXTENDED_WARRANTY_CODE="831055";

export function warrantyServiceCode(enabled:boolean){
 return enabled?CLICK_EXTENDED_WARRANTY_CODE:"0";
}

export function parseWarrantyCartTotal(text:string){
 const match=text.match(/R\$\s*([\d.]+,\d{2})/i);
 if(!match)return undefined;
 const value=Number(match[1].replace(/\./g,"").replace(",","."));
 return Number.isFinite(value)?value:undefined;
}
