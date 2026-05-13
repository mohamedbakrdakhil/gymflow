import { LayoutDashboard, Calendar, Dumbbell } from 'lucide-react';
import { AppLayout } from './AppLayout';

export default function CoachLayout() {
  const items = [
    { to: '/coach', end: true, label: 'Tableau de bord', icon: LayoutDashboard },
    { to: '/coach/classes', label: 'Mes cours', icon: Calendar },
    { to: '/coach/programs', label: 'Programmes', icon: Dumbbell },
  ];
  return <AppLayout navItems={items} />;
}
