import React,{useEffect,useRef,useState} from "react";

type Props={onTranscript:(text:string)=>void};

export function VoiceCopilot({onTranscript}:Props){
 const [supported,setSupported]=useState(true);
 const [listening,setListening]=useState(false);
 const [text,setText]=useState("");
 const [error,setError]=useState("");
 const recognition=useRef<any>(null);

 useEffect(()=>{
  const SR=(window as any).SpeechRecognition||(window as any).webkitSpeechRecognition;
  if(!SR){setSupported(false);return}
  const r=new SR();
  r.lang="pt-BR"; r.continuous=true; r.interimResults=true;
  r.onresult=(ev:any)=>{
   let finalText="";
   for(let i=ev.resultIndex;i<ev.results.length;i++){
    if(ev.results[i].isFinal) finalText+=ev.results[i][0].transcript+" ";
   }
   if(finalText)setText(v=>(v+" "+finalText).trim());
  };
  r.onerror=(ev:any)=>{setError(`Microfone: ${ev.error||"erro"}`);setListening(false)};
  r.onend=()=>setListening(false);
  recognition.current=r;
  return ()=>{try{r.stop()}catch{}};
 },[]);

 function toggle(){
  setError("");
  if(!recognition.current)return;
  if(listening){recognition.current.stop();setListening(false)}
  else{try{recognition.current.start();setListening(true)}catch{}}
 }
 function add(){
  const value=text.trim(); if(!value)return;
  onTranscript(value); setText("");
 }
 return <section className="voiceCopilot">
  <div className="voiceHead"><div><span className="step">🗣️ Módulo 24</span><h3>Copiloto por Voz</h3></div><span className={listening?"voiceState on":"voiceState"}>{listening?"● Ouvindo":"Microfone parado"}</span></div>
  {!supported&&<div className="voiceError">Este navegador não oferece reconhecimento de voz pela Web Speech API. Você ainda pode digitar abaixo.</div>}
  <div className="voiceActions">
   <button className={listening?"voiceButton listening":"voiceButton"} onClick={toggle} disabled={!supported}>{listening?"■ Parar":"🎙️ Falar situação"}</button>
   <textarea value={text} onChange={e=>setText(e.target.value)} placeholder='Ex.: "O cliente quer uma geladeira, mas a parcela precisa ficar até 250 reais..."'/>
   <button className="primary" onClick={add} disabled={!text.trim()}>Usar no atendimento</button>
  </div>
  {error&&<div className="voiceError">{error}</div>}
  <div className="voiceInfo"><strong>Como funciona</strong><span>O texto confirmado entra nas anotações e passa a alimentar Perfil do Cliente, Radar de Necessidades, Chance de Fechamento, Objeções e Mapa da Conversa.</span></div>
  <p className="voicePrivacy">A transcrição depende do recurso de reconhecimento de voz do navegador/dispositivo. Evite registrar dados sensíveis do cliente.</p>
 </section>
}
