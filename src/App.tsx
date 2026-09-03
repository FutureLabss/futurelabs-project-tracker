import { useState } from 'react';
import { LoginScreen } from './components/LoginScreen';
import { RoleDashboardLayout } from './components/RoleDashboardLayout';
import { demoAdminCredentials } from './data/admin-credentials';
import { roleDashboards } from './data/dashboard-layouts';

export function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  if (!isAuthenticated) {
    return <LoginScreen credentials={demoAdminCredentials} onLogin={() => setIsAuthenticated(true)} />;
  }

  return <RoleDashboardLayout config={roleDashboards.admin} onLogout={() => setIsAuthenticated(false)} />;
}
