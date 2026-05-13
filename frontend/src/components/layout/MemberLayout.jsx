import { LayoutDashboard, CreditCard, Calendar, Dumbbell } from 'lucide-react';
import { AppLayout } from './AppLayout';

export default function MemberLayout() {
  const items = [
    { to: '/member', end: true, label: 'Accueil', icon: LayoutDashboard },
    { to: '/member/subscription', label: 'Mon abonnement', icon: CreditCard },
    { to: '/member/classes', label: 'Cours', icon: Calendar },
    { to: '/member/programs', label: 'Mes programmes', icon: Dumbbell },
  ];
  return <AppLayout navItems={items} />;
}
