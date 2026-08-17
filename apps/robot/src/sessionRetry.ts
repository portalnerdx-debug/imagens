export function isClickSessionExpired(error:unknown){
 return error instanceof Error&&error.message==="CLICK_SESSION_EXPIRED";
}

/** Repete somente uma vez e apenas quando a sessão Click expirou. */
export async function runWithSessionRetry<T>(
 task:(attempt:0|1)=>Promise<T>,refresh:()=>Promise<void>
):Promise<T>{
 try{
  return await task(0);
 }catch(error){
  if(!isClickSessionExpired(error))throw error;
  await refresh();
  return task(1);
 }
}
