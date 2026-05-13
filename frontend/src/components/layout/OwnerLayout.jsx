import {
  LayoutDashboard,
  Users,
  Receipt,
  CalendarRange,
  CreditCard,
  QrCode,
  UserCog,
  Calendar,
  Dumbbell,
  Settings,
} from 'lucide-react';
import { AppLayout } from './AppLayout';
import { useAuth } from '@/context/AuthContext';

export default function OwnerLayout() {
  const { gym } = useAuth();
  const features = gym?.features || {};

  const items = [
    { to: '/owner', end: true, label: 'Tableau de bord', icon: LayoutDashboard },
    { to: '/owner/members', label: 'Membres', icon: Users },
    { to: '/owner/plans', label: 'Plans', icon: Receipt },
    { to: '/owner/subscriptions', label: 'Abonnements', icon: CalendarRange },
    { to: '/owner/payments', label: 'Paiements', icon: CreditCard },
    ...(features.qrCheckIn ? [{ to: '/owner/checkins', label: 'Check-ins', icon: QrCode }] : []),
    ...(features.coaches ? [{ to: '/owner/coaches', label: 'Coachs', icon: UserCog }] : []),
    ...(features.classes ? [{ to: '/owner/classes', label: 'Cours', icon: Calendar }] : []),
    ...(features.coaches ? [{ to: '/owner/programs', label: 'Programmes', icon: Dumbbell }] : []),
    { to: '/owner/settings', label: 'Paramètres', icon: Settings },
  ];

  return <AppLayout navItems={items} />;
}
