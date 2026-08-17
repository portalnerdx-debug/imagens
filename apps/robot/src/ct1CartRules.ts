export type Ct1RequiredItem={code:string;quantity:number;unitPrice:number;reason:string};

const TRADITIONAL_REQUIRED:Ct1RequiredItem[]=[
 {code:"447164",quantity:1,unitPrice:24.90,reason:"AF Cliente Tradicional"},
 {code:"801911",quantity:3,unitPrice:59.90,reason:"Livro eletrônico CT1"}
];

const NEW_CUSTOMER_REQUIRED:Ct1RequiredItem[]=[
 {code:"447157",quantity:1,unitPrice:29.90,reason:"AF Cliente Novo"},
 {code:"801911",quantity:3,unitPrice:59.90,reason:"Livro eletrônico Cliente Novo"}
];

const ABOVE_2500:Ct1RequiredItem={
 code:"849081",quantity:1,unitPrice:199.90,reason:"Seguro prestamista acima de R$ 2.500,00"
};

export function ct1RequiredItems(mainProductPrice:number):Ct1RequiredItem[]{
 return requiredItemsForPlan("CT1",mainProductPrice);
}

export function requiredItemsForPlan(plan:"48"|"CT1"|"CT2",mainProductPrice:number):Ct1RequiredItem[]{
 if(!Number.isFinite(mainProductPrice)||mainProductPrice<=0){
  throw new Error("TRADITIONAL_PRODUCT_PRICE_REQUIRED");
 }
 const always=plan==="48"?NEW_CUSTOMER_REQUIRED:TRADITIONAL_REQUIRED;
 return mainProductPrice>2500?[...always,ABOVE_2500]:[...always];
}
