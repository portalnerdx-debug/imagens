import type {Page} from "playwright";

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
 const match=String(html||"").match(/id=["']CarrinhoNumItens["'][^>]*>\s*(\d+)/i);
 if(!match)return undefined;
 const value=Number(match[1]);
 return Number.isFinite(value)?value:undefined;
}

/** Limpa a sessão do carrinho antes de iniciar uma nova simulação. */
export async function clearCreditCart(page:Page){
 const origin=new URL(page.url()).origin;
 const cartUrl=`${origin}/checkout_catalogo/carrinho.php`;
 const removeUrl=`${origin}/checkout_catalogo/carrinho_excluir_ajax.php`;
 const headers={referer:page.url(),"x-requested-with":"XMLHttpRequest"};

 let current=await page.request.get(cartUrl,{headers,timeout:60000});
 if(!current.ok())throw new Error("CART_CLEANUP_FAILED");
 let html=await current.text();
 const removedProducts=new Set<string>();

 // Cada exclusão pode devolver uma nova versão do carrinho. Recarregamos e
 // repetimos para também alcançar itens que só aparecem depois da primeira.
 for(let pass=0;pass<5;pass++){
  const codes=parseCartProductCodes(html);
  const count=parseCartItemCount(html);
  if(codes.length===0){
   if(count===undefined||count===0)break;
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
  }

  current=await page.request.get(cartUrl,{headers,timeout:60000});
  if(!current.ok())throw new Error("CART_CLEANUP_FAILED");
  html=await current.text();
 }

 const remainingCodes=parseCartProductCodes(html);
 const remainingCount=parseCartItemCount(html);
 if(remainingCodes.length>0||(remainingCount!==undefined&&remainingCount>0)){
  throw new Error("CART_CLEANUP_FAILED");
 }

 // Remove uma condição/entrada variável antiga que ainda esteja na sessão.
 const reset=await page.request.get(`${origin}/checkout_catalogo/processa_reseta_pagtos.php`,{
  params:{prevent_cache:new Date().toString(),_:String(Date.now())},
  headers,timeout:60000
 });
 if(!reset.ok())throw new Error("CART_CLEANUP_FAILED");

 return {removedProducts:[...removedProducts],confirmedEmpty:true};
}
