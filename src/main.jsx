import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import Auth from "./Auth.jsx";
import { supabase } from "./supabaseClient.js";

function Root(){
  const [session, setSession] = useState(undefined); // undefined = loading, null = logged out

  useEffect(()=>{
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, sess) => setSession(sess));
    return () => listener.subscription.unsubscribe();
  }, []);

  if(session === undefined){
    return (
      <div style={{minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#15100d", color:"#ab9c8c", fontFamily:"'Inter',system-ui,sans-serif"}}>
        Carregando…
      </div>
    );
  }
  if(!session){
    return <Auth/>;
  }
  return <App user={session.user}/>;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
