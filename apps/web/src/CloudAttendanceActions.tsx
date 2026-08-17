import React,{useState} from "react";
import {useAuth} from "./AuthContext";
import {createAtendimento,updateAtendimento} from "./CloudStore";

type Props={
  customerName?:string; objective:string; budget?:string; stage:string;
  notes:string[]; productCode?:string;
};

export function CloudAttendanceActions(props:Props){
  const {user,configured}=useAuth();
  const [id,setId]=useState<string|null>(null);
  const [status,setStatus]=useState("");
  const [busy,setBusy]=useState(false);

  async function save(){
    if(!user)return;
    try{
      setBusy(true);setStatus("");
      const payload={
        customerName:props.customerName||undefined,
        objective:props.objective,
        budget:Number(props.budget||0)||undefined,
        stage:props.stage,
        status:"em_atendimento" as const,
        notes:props.notes,
        productCode:props.productCode||undefined
      };
      if(!id){
        const newId=await createAtendimento(user.uid,payload);
        setId(newId);setStatus("Atendimento salvo na nuvem.");
      }else{
        await updateAtendimento(user.uid,id,payload);
        setStatus("Atendimento atualizado.");
      }
    }catch(e:any){setStatus(e?.message||"Falha ao salvar.");}
    finally{setBusy(false);}
  }

  async function finish(result:"fechada"|"perdida"){
    if(!user)return;
    try{
      setBusy(true);
      let current=id;
      if(!current){
        current=await createAtendimento(user.uid,{
          customerName:props.customerName||undefined,
          objective:props.objective,
          budget:Number(props.budget||0)||undefined,
          stage:"fechamento",
          status:result,
          notes:props.notes,
          productCode:props.productCode||undefined
        });
        setId(current);
      }else{
        await updateAtendimento(user.uid,current,{stage:"fechamento",status:result,notes:props.notes});
      }
      setStatus(result==="fechada"?"Venda marcada como fechada.":"Atendimento marcado como perdido.");
    }catch(e:any){setStatus(e?.message||"Falha ao finalizar.");}
    finally{setBusy(false);}
  }

  if(!configured||!user)return null;
  return <section className="cloudActions">
    <div><span className="step">☁️ Persistência do Atendimento</span><strong>{id?`Registro ${id.slice(0,8)}…`:"Ainda não salvo"}</strong></div>
    <div className="cloudButtons">
      <button onClick={save} disabled={busy}>{id?"Salvar alterações":"Salvar atendimento"}</button>
      <button className="success" onClick={()=>finish("fechada")} disabled={busy}>✓ Venda fechada</button>
      <button className="dangerBtn" onClick={()=>finish("perdida")} disabled={busy}>✕ Venda perdida</button>
    </div>
    {status&&<small>{status}</small>}
  </section>
}
