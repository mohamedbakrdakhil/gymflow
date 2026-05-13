import { useQuery } from '@tanstack/react-query';
import { Building2, Users, TrendingUp, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/common/PageHeader';
import { Skeleton } from '@/components/ui/skeleton';
import { formatMAD } from '@/lib/utils';

export default function SuperAdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['superadmin-stats'],
    queryFn: () => api.get('/superadmin/stats').then((r) => r.data.data),
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Vue globale GymFlow" description="Métriques SaaS" />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28" />)}
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={Building2} label="Salles totales" value={data?.gyms?.total || 0} color="text-blue-500 bg-blue-100" />
            <StatCard icon={TrendingUp} label="Actives" value={data?.gyms?.active || 0} color="text-emerald-500 bg-emerald-100" />
            <StatCard icon={AlertCircle} label="En trial" value={data?.gyms?.trial || 0} color="text-amber-500 bg-amber-100" />
            <StatCard icon={Users} label="Membres totaux" value={data?.totalMembers || 0} color="text-violet-500 bg-violet-100" />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">MRR estimé</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-display text-4xl font-bold text-primary">{formatMAD(data?.estimatedMRR || 0)}</p>
              <p className="mt-1 text-xs text-muted-foreground">Revenue récurrent mensuel basé sur les salles actives</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Répartition par plan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 sm:grid-cols-3">
                {(data?.gyms?.byPlan || []).map((p) => (
                  <div key={p.plan_type} className="flex items-center justify-between rounded-md border p-3">
                    <div>
                      <div className="text-xs text-muted-foreground">Plan</div>
                      <Badge variant="outline" className="mt-1 capitalize">{p.plan_type}</Badge>
                    </div>
                    <div className="text-2xl font-bold">{p.count}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-1 font-display text-2xl font-bold">{value}</p>
          </div>
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${color}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
