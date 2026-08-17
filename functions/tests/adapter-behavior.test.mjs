import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";

async function withServer(handler,fn){
 const server=http.createServer(handler);
 await new Promise(r=>server.listen(0,"127.0.0.1",r));
 const {port}=server.address();
 try{await fn(`http://127.0.0.1:${port}`)}finally{await new Promise(r=>server.close(r))}
}
test("mock API retorna produto",async()=>{
 await withServer((req,res)=>{res.setHeader("content-type","application/json");res.end(JSON.stringify({codigo:"77",nome:"Geladeira"}))},async base=>{
  const r=await fetch(base+"/products/lookup",{method:"POST",body:"{}"});
  assert.equal(r.status,200);const j=await r.json();assert.equal(j.codigo,"77");
 });
});
test("mock API simula 401",async()=>{
 await withServer((req,res)=>{res.statusCode=401;res.end("{}")},async base=>{
  const r=await fetch(base+"/credit/simulate",{method:"POST",body:"{}"});assert.equal(r.status,401);
 });
});
test("mock API simula 429",async()=>{
 await withServer((req,res)=>{res.statusCode=429;res.end("{}")},async base=>{
  const r=await fetch(base+"/credit/simulate",{method:"POST",body:"{}"});assert.equal(r.status,429);
 });
});
