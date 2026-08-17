import React,{useState} from "react";

export function ShareComparison(){
 const [created,setCreated]=useState(false);
 return <section className="shareBox">
  <div><span className="step">📱 Comparação para o Cliente</span><h3>Preparação do QR Code</h3></div>
  <p>Esta etapa prepara o fluxo de compartilhamento. Quando a comparação pública estiver persistida no Firebase, o sistema poderá gerar um QR Code para o cliente abrir no próprio celular.</p>
  <button onClick={()=>setCreated(true)} className="primary">Preparar comparação</button>
  {created&&<div className="sharePreview"><strong>Prévia pronta</strong><span>Na próxima integração, este cartão receberá uma URL pública temporária e o QR Code.</span></div>}
 </section>
}
