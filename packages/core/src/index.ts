export type CustomerTemperature = "fria" | "morna" | "quente";
export type CreditPlan = "48" | "CT1" | "CT2";
export type SalesStage = "abordagem" | "descoberta" | "produto" | "demonstracao" | "objecao" | "negociacao" | "fechamento" | "pos-venda";
export interface Product { code:string; name:string; price?:number; stock?:number; features?:string[] }
export interface SalesSession { id:string; startedAt:string; stage:SalesStage; customerTemperature:CustomerTemperature; productCodes:string[] }
export interface CreditSimulationInput { productCode:string; plan:CreditPlan; installments:number; downPayment?:number }
