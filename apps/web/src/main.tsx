import React from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import "./app-layout.css";
import { AppIcon } from "./AppIcon";
import { AuthProvider } from "./AuthContext";
import { LoginPanel } from "./LoginPanel";
import { LiveProductProvider } from "./LiveProductContext";
import { CrediarioSimulator } from "./CrediarioSimulator";

function CreditPortal() {
  return (
    <main className="portalShell">
      <aside className="portalSidebar">
        <div className="portalBrand" aria-label="XVendas">
          <span className="brandMark">XV</span>
          <span><strong>XVendas</strong><small>Venda com inteligência</small></span>
        </div>
        <nav className="portalNav" aria-label="Menu principal">
          <button className="portalNavItem active" type="button" aria-current="page">
            <AppIcon name="credit" />
            <span>Crédito</span>
          </button>
        </nav>
      </aside>

      <section className="portalViewport">
        <header className="portalTopbar">
          <div className="portalMobileBrand">
            <span className="brandMark">XV</span>
            <strong>XVendas</strong>
          </div>
          <div className="portalBreadcrumb">
            <small>CT1, CT2 e 48</small>
            <strong>Crédito</strong>
          </div>
          <LoginPanel />
        </header>

        <div className="portalPage">
          <section className="toolPage toolPage-credito">
            <header className="toolPageHero">
              <div className="toolPageTitle">
                <span className="toolPageIcon"><AppIcon name="credit" size={28} /></span>
                <div>
                  <span className="eyebrow">CT1, CT2 e 48</span>
                  <h1>Crédito</h1>
                  <p>Consulte o crediário e prepare as condições para o cliente.</p>
                </div>
              </div>
            </header>
            <div className="toolPageSurface">
              <CrediarioSimulator />
            </div>
          </section>
        </div>

        <nav className="portalBottomNav" aria-label="Navegação do aplicativo">
          <button className="active" type="button" aria-current="page">
            <AppIcon name="credit" />
            <span>Crédito</span>
          </button>
        </nav>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <LiveProductProvider>
        <CreditPortal />
      </LiveProductProvider>
    </AuthProvider>
  </React.StrictMode>
);
