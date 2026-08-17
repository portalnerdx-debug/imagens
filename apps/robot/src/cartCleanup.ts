import type {Dialog,Page} from "playwright";

function decodeHtml(value:string){
 return value.replace(/&amp;/gi,"&").replace(/&#0*38;/gi,"&");
}

/**
 * Extrai somente códigos que aparecem ligados a uma linha/ação do carrinho.
 * A Plataforma Click alterna entre links, atributos data-* e JavaScript
 * inline, por isso aceitamos os formatos observados nessas versões.
 */
export function parseCartProductCodes(html:string):string[]{
 const source=decodeHtml(String(html||""));
 // O contador oficial é a confirmação mais forte. Isso também impede que
 // códigos de vitrines/recomendações da página vazia sejam tratados como itens.
 if(parseCartItemCount(source)===0)return [];
 const codes=new Set<string>();
 const add=(value:string|undefined)=>{
  if(value&&/^\d{5,9}$/.test(value))codes.add(value);
 };

 // Links de exclusão: a ordem dos parâmetros pode variar.
 for(const match of source.matchAll(/(?:href|action)=["']([^"']*carrinho\.php[^"']*)["']/gi)){
  const href=match[1];
  if(!/(?:[?&])acao=excluir(?:&|$)/i.test(href))continue;
  add(href.match(/(?:[?&])cod=(\d{5,9})(?:&|$)/i)?.[1]);
 }

 // Algumas telas executam excluir/remover por JavaScript.
 for(const match of source.matchAll(/(?:excluir|remover)[\w$]*\s*\(\s*["']?(\d{5,9})/gi))add(match[1]);

 // Fluxo atual observado na Plataforma Click: o botão possui
 // class="link-excluir" e guarda o código em data-item.
 for(const match of source.matchAll(/<(?:a|button)\b[^>]*>/gi)){
  const tag=match[0];
  if(!/class=["'][^"']*\blink-excluir\b[^"']*["']/i.test(tag))continue;
  add(tag.match(/data-item=["'](\d{5,9})["']/i)?.[1]);
 }

 // Identificadores gravados diretamente na linha do item.
 for(const match of source.matchAll(/data-(?:cod|codigo|produto|itprodd)=["'](\d{5,9})["']/gi))add(match[1]);
 for(const match of source.matchAll(/name=["'](?:cod|codigo|cd_itprodd)["'][^>]{0,100}value=["'](\d{5,9})["']/gi))add(match[1]);

 // Fallback para o texto visível da linha: "Cód.: 1032123".
 const visible=source
  .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi," ")
  .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi," ")
  .replace(/<[^>]+>/g," ")
  .replace(/&nbsp;/gi," ");
 for(const match of visible.matchAll(/\bc[oó]d(?:igo)?\.?\s*[:#-]?\s*(\d{5,9})\b/gi))add(match[1]);

 return [...codes];
}

export function parseCartItemCount(html:string):number|undefined{
 const source=String(html||"");
 const element=source.match(/<([a-z][\w:-]*)\b[^>]*\bid=["']CarrinhoNumItens["'][^>]*>([\s\S]{0,160}?)<\/\1>/i);
 const innerValue=element?.[2].replace(/<[^>]+>/g," ").match(/\d+/)?.[0];
 const attributeValue=source.match(/\bid=["']CarrinhoNumItens["'][^>]*\b(?:value|data-(?:count|quantidade|itens))=["'](\d+)["']/i)?.[1];
 const value=Number(innerValue??attributeValue);
 return (innerValue!==undefined||attributeValue!==undefined)&&Number.isFinite(value)?value:undefined;
}

export function isCartConfirmedEmpty(html:string){
 const count=parseCartItemCount(html);
 if(count!==undefined)return count===0;
 if(parseCartProductCodes(html).length>0)return false;
 const text=String(html||"")
  .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi," ")
  .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi," ")
  .replace(/<[^>]+>/g," ")
  .replace(/&nbsp;/gi," ");
 return /carrinho\s+(?:est[aá]\s+)?vazio|nenhum\s+(?:produto|item)|n[aã]o\s+(?:h[aá]|existem?)\s+(?:produto|item)/i.test(text);
}

function looksLikeLoginPage(html:string){
 return /<input\b[^>]*type=["']password["']/i.test(String(html||""));
}

async function removeThroughVisibleCart(page:Page,cartUrl:string,codes:string[]){
 await page.goto(cartUrl,{waitUntil:"domcontentloaded",timeout:60000});
 const acceptDialog=(dialog:Dialog)=>{void dialog.accept().catch(()=>{})};
 page.on("dialog",acceptDialog);
 try{
  for(const code of codes){
   const button=page.locator(`.link-excluir[data-item="${code}"], [data-item="${code}"][class*="excluir" i]`).first();
   if(!await button.isVisible({timeout:1200}).catch(()=>false))continue;
   await button.click({timeout:5000}).catch(()=>{});
   await page.waitForTimeout(700);
  }
 }finally{
  page.off("dialog",acceptDialog);
 }
}

/** Limpa a sessão do carrinho antes de iniciar uma nova simulação. */
export async function clearCreditCart(page:Page){
 const origin=new URL(page.url()).origin;
 const cartUrl=`${origin}/checkout_catalogo/carrinho.php`;
 const removeUrl=`${origin}/checkout_catalogo/carrinho_excluir_ajax.php`;
 const headers={referer:page.url(),"x-requested-with":"XMLHttpRequest"};

 // A própria tela da Click orienta resetar a condição de pagamento antes de
 // voltar ao carrinho. Com pagamento antigo ativo, a exclusão pode responder
 // 200 sem liberar os itens da sessão.
 const reset=await page.request.get(`${origin}/checkout_catalogo/processa_reseta_pagtos.php`,{
  params:{prevent_cache:new Date().toString(),_:String(Date.now())},
  headers,timeout:60000
 });
 if(!reset.ok())throw new Error("CART_CLEANUP_FAILED");

 let current=await page.request.get(cartUrl,{headers,timeout:60000});
 if(!current.ok())throw new Error("CART_CLEANUP_FAILED");
 let html=await current.text();
 if(looksLikeLoginPage(html))throw new Error("CLICK_SESSION_EXPIRED");
 const removedProducts=new Set<string>();

 // Cada exclusão pode devolver uma nova versão do carrinho. Recarregamos e
 // repetimos para também alcançar itens que só aparecem depois da primeira.
 for(let pass=0;pass<5;pass++){
  const codes=parseCartProductCodes(html);
  const count=parseCartItemCount(html);
  if(codes.length===0){
   if(isCartConfirmedEmpty(html))break;
   throw new Error("CART_CLEANUP_FAILED");
  }

  for(const code of codes){
   // É a mesma chamada feita pelo clique no X da linha do carrinho.
   const removed=await page.request.get(removeUrl,{
    params:{cod:code,prevent_cache:new Date().toString(),_:String(Date.now())},
    headers,timeout:60000
   });
   if(!removed.ok())throw new Error("CART_CLEANUP_FAILED");
   removedProducts.add(code);
   await page.waitForTimeout(250);
  }

  await page.waitForTimeout(500);
  current=await page.request.get(cartUrl,{headers,timeout:60000});
  if(!current.ok())throw new Error("CART_CLEANUP_FAILED");
  html=await current.text();
  if(looksLikeLoginPage(html))throw new Error("CLICK_SESSION_EXPIRED");

  // Algumas sessões retornam 200 na rota AJAX sem efetivar a exclusão.
  // Nessa situação repetimos pelo próprio botão da tela, preservando todos os
  // eventos e parâmetros JavaScript usados pela versão atual da Click.
  const codesAfterAjax=parseCartProductCodes(html);
  if(codesAfterAjax.length>0){
   await removeThroughVisibleCart(page,cartUrl,codesAfterAjax);
   await page.waitForTimeout(500);
   current=await page.request.get(cartUrl,{headers,timeout:60000});
   if(!current.ok())throw new Error("CART_CLEANUP_FAILED");
   html=await current.text();
   if(looksLikeLoginPage(html))throw new Error("CLICK_SESSION_EXPIRED");
  }
 }

 const remainingCodes=parseCartProductCodes(html);
 const remainingCount=parseCartItemCount(html);
 if(!isCartConfirmedEmpty(html)){
  console.warn("[cart] limpeza não confirmada; será solicitada uma sessão nova",{
   remainingCount,remainingCodes
  });
  throw new Error("CART_CLEANUP_FAILED");
 }

 return {removedProducts:[...removedProducts],confirmedEmpty:true};
}
