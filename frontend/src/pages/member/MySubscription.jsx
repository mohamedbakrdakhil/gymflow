import { useQuery } from '@tanstack/react-query';
import { CalendarRange, CreditCard } from 'lucide-react';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate, formatMAD } from '@/lib/utils';

export default function MySubscription() {
  const { data, isLoading } = useQuery({
    queryKey: ['member-dashboard'],
    queryFn: () => api.get('/dashboard/member').then((r) => r.data.data),
  });

  const member = data?.member;
  const subs = member?.subscriptions || [];

  return (
    <div className="space-y-6">
      <PageHeader title="Mon abonnement" description="Historique de mes abonnements" />

      {isLoading ? (
        <Skeleton className="h-48" />
      ) : !data?.activeSubscription && subs.length === 0 ? (
        <EmptyState
          icon={CalendarRange}
          title="Aucun abonnement"
          description="Contactez votre salle pour souscrire"
        />
      ) : (
        <>
          {data?.activeSubscription && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-display text-xl font-bold">
                      {data.activeSubscription.plan?.name}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Du {formatDate(data.activeSubscription.start_date)} au{' '}
                      {formatDate(data.activeSubscription.end_date)}
                    </p>
                    <div className="mt-2 flex items-center gap-1 text-sm">
                      <CreditCard className="h-3 w-3 text-muted-foreground" />
                      <span className="font-medium">{formatMAD(data.activeSubscription.price_paid)}</span>
                    </div>
                  </div>
                  <Badge variant="success" className="text-base">Actif</Badge>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
