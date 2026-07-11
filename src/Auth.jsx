import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import Auth from "./Auth.jsx";
import UpdatePassword from "./UpdatePassword.jsx";
import { supabase } from "./supabaseClient.js";

function Root(){
  const [session, setSession] = useState(undefined); // undefined = loading, null = logged out
  const [recoveryMode, setRecoveryMode] = useState(false);

  useEffect(()=>{
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((event, sess) => {
      if(event === "PASSWORD_RECOVERY") setRecoveryMode(true);
      setSession(sess);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  if(session === undefined){
    return (
      <div style={{minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#15100d", color:"#ab9c8c", fontFamily:"'Inter',system-ui,sans-serif"}}>
        Carregando…
      </div>
    );
  }

  // clicked the "reset password" link in their email — show the set-new-password screen
  // before letting them into the app, regardless of whether a session already exists
  if(recoveryMode){
    return <UpdatePassword onDone={()=>setRecoveryMode(false)}/>;
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
