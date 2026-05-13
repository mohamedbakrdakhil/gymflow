import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { CalendarRange, Pause, Play, X } from 'lucide-react';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tabs, TabsList, TabsTrigger, TabsContent,
} from '@/components/ui/tabs';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate, formatMAD } from '@/lib/utils';

export default function SubscriptionsList() {
  const [tab, setTab] = useState('active');

  const params = (() => {
    if (tab === 'expiring') return { status: 'active', expiring_in_days: 7 };
    if (tab === 'frozen') return { status: 'frozen' };
    if (tab === 'expired') return { status: 'expired' };
    return { status: 'active' };
  })();

  const { data, isLoading } = useQuery({
    queryKey: ['subscriptions', tab],
    queryFn: () => api.get('/subscriptions', { params: { ...params, limit: 50 } }).then((r) => r.data.data),
  });

  const items = data?.items || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Abonnements"
        description="Suivi des abonnements en cours"
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="active">Actifs</TabsTrigger>
          <TabsTrigger value="expiring">Expirent (7j)</TabsTrigger>
          <TabsTrigger value="frozen">Gelés</TabsTrigger>
          <TabsTrigger value="expired">Expirés</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="space-y-3 pt-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
            </div>
          ) : items.length === 0 ? (
            <EmptyState
              icon={CalendarRange}
              title="Aucun abonnement"
              description={tab === 'expiring' ? "Aucun abonnement n'expire dans les 7 jours" : ''}
            />
          ) : (
            items.map((s) => <SubscriptionRow key={s.id} sub={s} />)
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SubscriptionRow({ sub }) {
  const qc = useQueryClient();
  const m = sub.member;
  const isExpired = new Date(sub.end_date) < new Date();
  const daysLeft = Math.ceil((new Date(sub.end_date) - new Date()) / 86400000);

  const action = useMutation({
    mutationFn: ({ act }) => api.post(`/subscriptions/${sub.id}/${act}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['subscriptions'] });
      toast.success('Action effectuée');
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Erreur'),
  });

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-wrap items-start gap-4">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                to={`/owner/members/${m?.id}`}
                className="font-medium hover:underline"
              >
                {m?.first_name} {m?.last_name}
              </Link>
              <Badge variant="outline" className="text-[10px]">{m?.member_code}</Badge>
              <Badge variant={sub.status === 'active' ? 'success' : sub.status === 'frozen' ? 'warning' : 'outline'}>
                {sub.status}
              </Badge>
              {sub.status === 'active' && daysLeft <= 7 && daysLeft > 0 && (
                <Badge variant="warning">Expire dans {daysLeft} j</Badge>
              )}
              {sub.status === 'active' && isExpired && (
                <Badge variant="danger">Expiré</Badge>
              )}
            </div>
            <div className="mt-1 text-sm">
              <span className="font-medium">{sub.plan?.name}</span>
              <span className="text-muted-foreground"> • {formatDate(sub.start_date)} → {formatDate(sub.end_date)}</span>
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              {formatMAD(sub.price_paid)}
            </div>
          </div>

          <div className="flex flex-wrap gap-1">
            {sub.status === 'active' && (
              <Button size="sm" variant="outline" onClick={() => action.mutate({ act: 'freeze' })}>
                <Pause className="mr-1 h-3 w-3" /> Geler
              </Button>
            )}
            {sub.status === 'frozen' && (
              <Button size="sm" variant="outline" onClick={() => action.mutate({ act: 'unfreeze' })}>
                <Play className="mr-1 h-3 w-3" /> Réactiver
              </Button>
            )}
            {(sub.status === 'active' || sub.status === 'frozen') && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (confirm('Annuler cet abonnement ?')) action.mutate({ act: 'cancel' });
                }}
              >
                <X className="mr-1 h-3 w-3" /> Annuler
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
