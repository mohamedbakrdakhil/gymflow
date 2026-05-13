import { LayoutDashboard, Building2 } from 'lucide-react';
import { AppLayout } from './AppLayout';

export default function SuperAdminLayout() {
  const items = [
    { to: '/superadmin', end: true, label: 'Vue globale', icon: LayoutDashboard },
    { to: '/superadmin/gyms', label: 'Salles', icon: Building2 },
  ];
  return <AppLayout navItems={items} />;
}
