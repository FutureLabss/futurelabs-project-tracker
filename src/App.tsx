import { Alert } from "@mantine/core";
import { useState } from "react";
import { LoginScreen } from "./components/LoginScreen";
import { RoleDashboardLayout } from "./components/RoleDashboardLayout";
import { demoCredentials } from "./data/admin-credentials";
import { roleDashboards } from "./data/dashboard-layouts";
import { Persona } from "./types/dashboard";

// import ManagersDashboard from "./components/horizons/manager/ManagersDashboard";

import { backendConfig } from "./lib/supabase/client";
import { SupabaseApp } from "./app/SupabaseApp";


export function App() {
  if (
    backendConfig.backend === "invalid" ||
    (window.location.pathname === "/auth/callback" &&
      backendConfig.backend !== "supabase")
  )
    return (
      <Alert color="red" m="lg">
        Project Tracker sign-in is not configured. Contact your administrator.
      </Alert>
    );
  return backendConfig.backend === "supabase" ? <SupabaseApp /> : <DemoApp />;
}

function DemoApp() {
  const [activePerson, setActivePerson] = useState<Persona | null>(null);

  if (!activePerson) {
    return (
      <LoginScreen credentials={demoCredentials} onLogin={setActivePerson} />
    );
  }

  return (
    <><RoleDashboardLayout
      config={roleDashboards[activePerson.role]}
      personId={activePerson.id}
      onLogout={() => setActivePerson(null)} /></>
  );
}






// export function App() {
//   const actorId = "demo-manager";

//   return (
//     <>
//       <ManagersDashboard actorId={actorId} />
//     </>
//   );
// }



