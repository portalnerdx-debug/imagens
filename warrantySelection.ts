function optionCode(href:string){
 try{
  const decoded=href.replace(/&amp;/g,"&");
  return new URL(decoded,"https://plataformaclick.com.br").searchParams.get("op_garantia");
 }catch{return null}
}

export function chooseWarrantyHref(hrefs:string[],withWarranty:boolean){
 return hrefs.find(href=>{
  const code=optionCode(href);
  if(code===null)return false;
  return withWarranty?code!==""&&code!=="0":code==="0";
 });
}
