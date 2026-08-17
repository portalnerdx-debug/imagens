export type CreditPlan="48"|"CT1"|"CT2";
export type Ct1RequiredItem={code:string;quantity:number;unitPrice?:number;reason:string};

const TRADITIONAL_REQUIRED:Ct1RequiredItem[]=[
 {code:"447164",quantity:1,unitPrice:24.90,reason:"AF Cliente Tradicional"},
 {code:"801911",quantity:3,unitPrice:59.90,reason:"Livro eletrônico tradicional"}
];

const NEW_CUSTOMER_REQUIRED:Ct1RequiredItem[]=[
 {code:"447157",quantity:1,unitPrice:29.90,reason:"AF Cliente Novo"},
 {code:"801911",quantity:3,unitPrice:59.90,reason:"Livro eletrônico Cliente Novo"}
];

export const PRESTAMISTA_CODES=["849043","849050","849067","849074","849081"] as const;

const PRESTAMISTA_BANDS:ReadonlyArray<Ct1RequiredItem&{minimumExclusive:number}>=[
 {code:"849081",quantity:1,minimumExclusive:2500,reason:"Seguro prestamista: total acima de R$ 2.500,00"},
 {code:"849074",quantity:1,minimumExclusive:2000,reason:"Seguro prestamista: total de R$ 2.000,01 a R$ 2.500,00"},
 {code:"849067",quantity:1,minimumExclusive:1500,reason:"Seguro prestamista: total de R$ 1.500,01 a R$ 2.000,00"},
 {code:"849050",quantity:1,minimumExclusive:1000,reason:"Seguro prestamista: total de R$ 1.000,01 a R$ 1.500,00"},
 {code:"849043",quantity:1,minimumExclusive:Number.NEGATIVE_INFINITY,reason:"Seguro prestamista: total até R$ 1.000,00"}
];

export function baseRequiredItemsForPlan(plan:CreditPlan):Ct1RequiredItem[]{
 return (plan==="48"?NEW_CUSTOMER_REQUIRED:TRADITIONAL_REQUIRED).map(item=>({...item}));
}

/** O total recebido já deve excluir qualquer produto da família 849xxx. */
export function prestamistaItemForTotal(totalWithoutPrestamista:number):Ct1RequiredItem{
 if(!Number.isFinite(totalWithoutPrestamista)||totalWithoutPrestamista<0){
  throw new Error("TRADITIONAL_CART_TOTAL_REQUIRED");
 }
 const selected=PRESTAMISTA_BANDS.find(item=>totalWithoutPrestamista>item.minimumExclusive)!;
 return {code:selected.code,quantity:1,reason:selected.reason};
}

export function requiredItemsForPlan(plan:CreditPlan,totalWithoutPrestamista:number):Ct1RequiredItem[]{
 return [...baseRequiredItemsForPlan(plan),prestamistaItemForTotal(totalWithoutPrestamista)];
}

export function ct1RequiredItems(totalWithoutPrestamista:number):Ct1RequiredItem[]{
 return requiredItemsForPlan("CT1",totalWithoutPrestamista);
}
