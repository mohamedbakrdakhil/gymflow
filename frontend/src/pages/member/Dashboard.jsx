import { useQuery } from '@tanstack/react-query';
import { CalendarRange, CheckCircle2, CreditCard, Activity } from 'lucide-react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/common/PageHeader';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/AuthContext';
import { formatDate, formatDateTime, formatMAD } from '@/lib/utils';

export default function MemberDashboard() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ['member-dashboard'],
    queryFn: () => api.get('/dashboard/member').then((r) => r.data.data),
  });

  return (
    <div className="space-y-6">
      <PageHeader title={`Bonjour ${user?.first_name} 💪`} description="Votre espace personnel" />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-28" />)}
        </div>
      ) : !data ? (
        <Card><CardContent className="pt-6 text-center text-sm text-muted-foreground">
          Votre profil membre n'a pas été configuré. Contactez votre salle.
        </CardContent></Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Check-ins totaux</p>
                    <p className="font-display text-2xl font-bold">{data?.totalCheckins || 0}</p>
                  </div>
                  <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Total payé</p>
                    <p className="font-display text-2xl font-bold">{formatMAD(data?.totalPaid || 0)}</p>
                  </div>
                  <CreditCard className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Statut</p>
                    <Badge variant={data?.activeSubscription ? 'success' : 'destructive'}>
                      {data?.activeSubscription ? 'Actif' : 'Inactif'}
                    </Badge>
                  </div>
                  <Activity className="h-8 w-8 text-secondary" />
                </div>
              </CardContent>
            </Card>
          </div>

          {data?.activeSubscription && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <CalendarRange className="h-4 w-4" /> Mon abonnement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="font-medium">{data.activeSubscription.plan?.name}</div>
                    <div className="text-xs text-muted-foreground">
                      Du {formatDate(data.activeSubscription.start_date)} au{' '}
                      {formatDate(data.activeSubscription.end_date)}
                    </div>
                  </div>
                  <Badge variant="success">{data.activeSubscription.status}</Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {data?.recentCheckins?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Dernières visites</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data.recentCheckins.map((c) => (
                    <div key={c.id} className="flex items-center justify-between rounded-md border p-2 text-sm">
                      <span>{formatDateTime(c.check_in_time)}</span>
                      <Badge variant="outline" className="text-[10px]">{c.method}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
