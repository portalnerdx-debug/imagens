import {fetchLiveProduct,type LiveProduct} from "./ProductDataService";
import {cacheProduct,getCachedProduct} from "./ProductCatalogStore";

export type SmartResult={product:LiveProduct;origin:"cache"|"live"};

export async function smartFetchProduct(uid:string|undefined,code:string,forceLive=false):Promise<SmartResult>{
  if(uid&&!forceLive){
    const cached=await getCachedProduct(uid,code,30);
    if(cached)return {product:cached,origin:"cache"};
  }
  const product=await fetchLiveProduct(code);
  if(uid&&product.found)await cacheProduct(uid,product);
  return {product,origin:"live"};
}
