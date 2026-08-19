function attribute(tag:string,name:string){
 return tag.match(new RegExp(`${name}\\s*=\\s*["']([^"']+)["']`,"i"))?.[1];
}

function validPaymentId(value:string|undefined){
 return value&&/^\d{4,}$/.test(value)?value:undefined;
}

/**
 * Captura o id dinâmico da primeira entrada dentro de pagamentos_ent.
 * A Click já apresentou esse id em data-cdpagamento e em data-item.
 */
export function parsePaymentEntryId(html:string):string|undefined{
 const source=String(html||"");
 const formStart=source.search(/<form\b[^>]*(?:id|name)=["']pagamentos_ent["'][^>]*>/i);
 const containerStart=formStart>=0?formStart:source.search(/<(?:div|section)\b[^>]*(?:id|name)=["']pagamentos_ent["'][^>]*>/i);
 const start=containerStart;
 if(start<0)return undefined;
 const tail=source.slice(start);
 const formEnd=formStart>=0?tail.search(/<\/form>/i):-1;
 const section=formEnd>=0?tail.slice(0,formEnd):tail.slice(0,120000);
 const tags=section.match(/<[^>]+>/g)||[];

 // Formato principal observado no HAR.
 for(const tag of tags){
  const id=validPaymentId(attribute(tag,"data-cdpagamento"));
  if(id)return id;
 }

 // Alternativas usadas por outras versões do carrinho.
 for(const className of ["remove-payment","col-excluir","entrada-variavel","change-payment"]){
  for(const tag of tags){
   if(!new RegExp(`class\\s*=\\s*["'][^"']*${className}`,"i").test(tag))continue;
   const id=validPaymentId(attribute(tag,"data-item"));
   if(id)return id;
  }
 }

 // Último fallback, ainda restrito ao formulário e a ids dinâmicos longos.
 for(const tag of tags){
  const id=validPaymentId(attribute(tag,"data-item"));
  if(id)return id;
 }
 return undefined;
}

/**
 * A rota que cria a condição 48 devolve JSON e coloca o formulário da entrada
 * em `html`. No Render esse payload costuma chegar antes de o recarregamento
 * da página refletir o novo pagamento, portanto ele é a fonte prioritária.
 */
export function parsePaymentEntryIdPayload(payload:string):string|undefined{
 const source=String(payload||"");
 const direct=parsePaymentEntryId(source);
 if(direct)return direct;

 try{
  const parsed=JSON.parse(source) as unknown;
  if(parsed&&typeof parsed==="object"&&"html" in parsed){
   const html=(parsed as {html?:unknown}).html;
   if(typeof html==="string")return parsePaymentEntryId(html);
  }
 }catch{
  // Algumas versões respondem HTML puro; a tentativa direta acima já cobre.
 }
 return undefined;
}

export function isPaymentEntryId(value:string|undefined):value is string{
 return Boolean(validPaymentId(value));
}
