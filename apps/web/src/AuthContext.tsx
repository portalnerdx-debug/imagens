import React,{createContext,useContext,useEffect,useState} from "react";
import { User,onAuthStateChanged,signInWithEmailAndPassword,createUserWithEmailAndPassword,signInWithPopup,signOut } from "firebase/auth";
import { auth,firebaseConfigured,googleProvider } from "./firebase";

type AuthValue={
 user:User|null;loading:boolean;configured:boolean;
 login:(email:string,password:string)=>Promise<void>;
 register:(email:string,password:string)=>Promise<void>;
 loginGoogle:()=>Promise<void>;logout:()=>Promise<void>;
};
const C=createContext<AuthValue|null>(null);

export function AuthProvider({children}:{children:React.ReactNode}){
 const [user,setUser]=useState<User|null>(null),[loading,setLoading]=useState(true);
 useEffect(()=>{
  if(!auth){setLoading(false);return;}
  return onAuthStateChanged(auth,u=>{setUser(u);setLoading(false)});
 },[]);
 async function login(email:string,password:string){if(!auth)throw new Error("Firebase não configurado.");await signInWithEmailAndPassword(auth,email,password)}
 async function register(email:string,password:string){if(!auth)throw new Error("Firebase não configurado.");await createUserWithEmailAndPassword(auth,email,password)}
 async function loginGoogle(){if(!auth)throw new Error("Firebase não configurado.");await signInWithPopup(auth,googleProvider)}
 async function logout(){if(auth)await signOut(auth)}
 return <C.Provider value={{user,loading,configured:firebaseConfigured,login,register,loginGoogle,logout}}>{children}</C.Provider>
}
export function useAuth(){const v=useContext(C);if(!v)throw new Error("useAuth fora do AuthProvider");return v}
