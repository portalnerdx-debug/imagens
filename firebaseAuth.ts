import {createRemoteJWKSet,jwtVerify} from "jose";
import {FIREBASE_PROJECT_ID} from "./config.js";

const JWKS=createRemoteJWKSet(new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"));
const issuer=`https://securetoken.google.com/${FIREBASE_PROJECT_ID}`;

export async function verifyFirebaseBearer(header?:string){
 const match=String(header||"").match(/^Bearer\s+(.+)$/i);
 if(!match)throw new Error("AUTH_REQUIRED");
 const {payload}=await jwtVerify(match[1],JWKS,{issuer,audience:FIREBASE_PROJECT_ID});
 if(!payload.sub)throw new Error("AUTH_INVALID");
 return {uid:String(payload.sub),email:typeof payload.email==="string"?payload.email:undefined};
}
