import {defineSecret,defineString} from "firebase-functions/params";

export const CLICK_BASE_URL=defineString("CLICK_BASE_URL",{default:""});
export const CLICK_USERNAME=defineSecret("CLICK_USERNAME");
export const CLICK_PASSWORD=defineSecret("CLICK_PASSWORD");

export function getClickConfig(){
 const baseUrl=CLICK_BASE_URL.value().trim();
 if(!baseUrl)throw new Error("CLICK_BASE_URL_NOT_CONFIGURED");
 return {baseUrl,username:CLICK_USERNAME.value(),password:CLICK_PASSWORD.value()};
}
