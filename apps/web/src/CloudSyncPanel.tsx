import React,{useEffect,useState} from "react";
import {useAuth} from "./AuthContext";
import {listAtendimentos,listSales,listObjections,listLostSales} from "./CloudStore";

export function CloudSyncPanel(){
  const {user,configured}=useAuth();
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const [stats,setStats]=useState({atendimentos:0,sales:0,objections:0,lost:0});

  async function refresh(){
    if(!user)return;
    try{
      setLoading(true);setError("");
      const [a,s,o,l]=await Promise.all([
        listAtendimentos(user.uid),listSales(user.uid),listObjections(user.uid),listLostSales(user.uid)
      ]);
      setStats({atendimentos:a.length,sales:s.length,objections:o.length,lost:l.length});
    }catch(e:any){setError(e?.message||"Falha ao sincronizar.");}
    finally{setLoading(false);}
  }

  useEffect(()=>{if(user)refresh()},[user?.uid]);

  if(!configured)return null;
  if(!user)return <section className="syncPanel mutedSync"><strong>☁️ Sincronização</strong><span>Entre na sua conta para salvar histórico na nuvem.</span></section>;

  return <section className="syncPanel">
    <div><strong>☁️ Firestore conectado</strong><span>Dados vinculados ao seu UID.</span></div>
    <div className="syncStats">
      <span><b>{stats.atendimentos}</b> atendimentos</span>
      <span><b>{stats.sales}</b> resultados</span>
      <span><b>{stats.objections}</b> objeções</span>
      <span><b>{stats.lost}</b> perdas</span>
    </div>
    <button onClick={refresh} disabled={loading}>{loading?"Sincronizando...":"Atualizar"}</button>
    {error&&<small className="syncError">{error}</small>}
  </section>
}
