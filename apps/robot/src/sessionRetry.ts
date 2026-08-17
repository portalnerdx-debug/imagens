export function isClickSessionExpired(error:unknown){
 return error instanceof Error&&error.message==="CLICK_SESSION_EXPIRED";
}

export function needsFreshClickSession(error:unknown){
 if(!(error instanceof Error))return false;
 return error.message==="CLICK_SESSION_EXPIRED";
}

/** Repete somente uma vez quando a sessão criada para a consulta expirou. */
export async function runWithSessionRetry<T>(
 task:(attempt:0|1)=>Promise<T>,refresh:()=>Promise<void>
):Promise<T>{
 try{
  return await task(0);
 }catch(error){
  if(!needsFreshClickSession(error))throw error;
  await refresh();
  return task(1);
 }
}
