import React,{useState} from "react";
import {useAuth} from "./AuthContext";

export function LoginPanel(){
 const {user,loading,configured,login,register,loginGoogle,logout}=useAuth();
 const [email,setEmail]=useState(""),[password,setPassword]=useState(""),[error,setError]=useState("");
 async function run(fn:()=>Promise<void>){try{setError("");await fn()}catch(e:any){setError(e?.message||"Falha na autenticação.")}}
 if(loading)return <div className="authPanel">Verificando sessão...</div>;
 if(!configured)return <div className="authPanel warning"><strong>🔥 Firebase ainda não configurado</strong><span>Preencha o arquivo <code>.env</code> usando <code>.env.example</code>. O restante do XVendas continua disponível em modo local.</span></div>;
 if(user)return <div className="authPanel signed"><div><strong>☁️ Sessão conectada</strong><span>{user.email||"Conta Google"} • UID {user.uid.slice(0,8)}…</span></div><button onClick={logout}>Sair</button></div>;
 return <section className="authPanel login">
  <div><strong>🔥 Entrar no XVendas</strong><span>Conecte sua conta para preparar a sincronização dos seus dados.</span></div>
  <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="E-mail"/>
  <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Senha"/>
  <button className="primary" onClick={()=>run(()=>login(email,password))}>Entrar</button>
  <button onClick={()=>run(()=>register(email,password))}>Criar conta</button>
  <button onClick={()=>run(loginGoogle)}>Entrar com Google</button>
  {error&&<small className="authError">{error}</small>}
 </section>
}
