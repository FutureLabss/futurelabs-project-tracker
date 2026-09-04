import { Persona } from '../types/dashboard';

export const demoAdminCredentials: Persona = {
  id: 'p-sarah',
  name: 'Sarah Connor',
  email: 'admin@futurelabs.io',
  password: 'Admin@2026',
  role: 'admin',
  title: 'VP of Engineering',
};

export const demoMemberCredentials: Persona = {
  id: 'p-alex',
  name: 'Alex Chen',
  email: 'member@futurelabs.io',
  password: 'Member@2026',
  role: 'member',
  title: 'Frontend Engineer',
};

export const demoCredentials: Persona[] = [demoAdminCredentials, demoMemberCredentials];
