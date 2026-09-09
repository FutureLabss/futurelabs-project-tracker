import { useState } from "react";
import { LoginScreen } from "./components/LoginScreen";
import { RoleDashboardLayout } from "./components/RoleDashboardLayout";
import { demoCredentials } from "./data/admin-credentials";
import { roleDashboards } from "./data/dashboard-layouts";
import { Persona } from "./types/dashboard";

import { backendConfig } from "./lib/supabase/client";
import { SupabaseApp } from "./app/SupabaseApp";

export function App() {
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
    <RoleDashboardLayout
      config={roleDashboards[activePerson.role]}
      personId={activePerson.id}
      onLogout={() => setActivePerson(null)}
    />
  );
}
