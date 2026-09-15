// import { useState } from 'react';
// import { LoginScreen } from './components/LoginScreen';
// import { RoleDashboardLayout } from './components/RoleDashboardLayout';
// import { demoCredentials } from './data/admin-credentials';
// import { roleDashboards } from './data/dashboard-layouts';
// import { UserRole } from './types/dashboard';
import ManagerDashboard from './app/ManagerDashboard';

export function App() {
  // const [activeRole, setActiveRole] = useState<UserRole | null>(null);

  // if (!activeRole) {
  //   return <LoginScreen credentials={demoCredentials} onLogin={(role) => setActiveRole(role)} />;
  // }

  // return <RoleDashboardLayout config={roleDashboards[activeRole]} onLogout={() => setActiveRole(null)} />;
   return <ManagerDashboard />;
}
