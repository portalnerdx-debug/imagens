import React,{useState} from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import "./app-layout.css";
import { AppIcon } from "./AppIcon";
import { AuthProvider } from "./AuthContext";
import { LoginPanel } from "./LoginPanel";
import { LiveProductProvider } from "./LiveProductContext";
import { CrediarioSimulator } from "./CrediarioSimulator";
import { CartaoCreditoSimulator } from "./CartaoCreditoSimulator";

type Mode="credito"|"cartao";

function CreditPortal(){
 const [mode,setMode]=useState<Mode>("credito");
 return <main className="portalShell">
  <aside className="portalSidebar">
   <div className="portalBrand" aria-label="XVendas"><span className="brandMark">XV</span><span><strong>XVendas</strong><small>Venda com inteligência</small></span></div>
   <nav className="portalNav" aria-label="Menu principal">
    <button className={mode==="credito"?"portalNavItem active":"portalNavItem"} type="button" onClick={()=>setMode("credito")}><AppIcon name="credit"/><span>Crédito</span></button>
    <button className={mode==="cartao"?"portalNavItem active":"portalNavItem"} type="button" onClick={()=>setMode("cartao")}><AppIcon name="credit"/><span>Cartão</span></button>
   </nav>
  </aside>
  <section className="portalViewport">
   <header className="portalTopbar">
    <div className="portalMobileBrand"><span className="brandMark">XV</span><strong>XVendas</strong></div>
    <div className="portalBreadcrumb"><small>{mode==="credito"?"CT1, CT2 e 48":"1 a 24 parcelas"}</small><strong>{mode==="credito"?"Crédito":"Cartão de crédito"}</strong></div>
    <LoginPanel/>
   </header>
   <div className="portalPage">
    <section className={mode==="credito"?"toolPage toolPage-credito":"toolPage toolPage-cartao"}>
     <header className="toolPageHero"><div className="toolPageTitle"><span className="toolPageIcon"><AppIcon name="credit" size={28}/></span><div>
      <span className="eyebrow">{mode==="credito"?"CT1, CT2 e 48":"Consulta individual"}</span>
      <h1>{mode==="credito"?"Crédito":"Cartão de crédito"}</h1>
      <p>{mode==="credito"?"Consulte o crediário e prepare as condições para o cliente.":"Consulte o cartão de crédito do produto informado, sem adicionar produtos, seguro ou garantia."}</p>
     </div></div></header>
     <div className="toolPageSurface">{mode==="credito"?<CrediarioSimulator/>:<CartaoCreditoSimulator/>}</div>
    </section>
   </div>
   <nav className="portalBottomNav" aria-label="Navegação do aplicativo">
    <button className={mode==="credito"?"active":""} type="button" onClick={()=>setMode("credito")}><AppIcon name="credit"/><span>Crédito</span></button>
    <button className={mode==="cartao"?"active":""} type="button" onClick={()=>setMode("cartao")}><AppIcon name="credit"/><span>Cartão</span></button>
   </nav>
  </section>
 </main>;
}

createRoot(document.getElementById("root")!).render(<React.StrictMode><AuthProvider><LiveProductProvider><CreditPortal/></LiveProductProvider></AuthProvider></React.StrictMode>);
