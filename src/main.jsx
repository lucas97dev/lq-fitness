import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import Auth from "./Auth.jsx";
import UpdatePassword from "./UpdatePassword.jsx";
import { supabase } from "./supabaseClient.js";

// Checks the URL directly (hash and query string) for the recovery flag,
// synchronously on first render — this avoids a race condition where
// Supabase's PASSWORD_RECOVERY event can fire before our listener is
// attached, which would otherwise cause the recovery link to be silently
// treated as a normal sign-in.
function isRecoveryUrl(){
  const hash = window.location.hash || "";
  const search = window.location.search || "";
  return hash.includes("type=recovery") || search.includes("type=recovery");
}

function Root(){
  const [session, setSession] = useState(undefined); // undefined = loading, null = logged out
  const [recoveryMode, setRecoveryMode] = useState(isRecoveryUrl);

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
    return (
      <UpdatePassword onDone={()=>{
        setRecoveryMode(false);
        // clean the recovery tokens out of the URL so a refresh doesn't re-trigger it
        window.history.replaceState(null, "", window.location.pathname);
      }}/>
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
