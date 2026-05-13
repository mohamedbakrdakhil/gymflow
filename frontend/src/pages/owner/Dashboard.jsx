import { useQuery } from '@tanstack/react-query';
import { Users, CalendarRange, TrendingUp, AlertCircle, QrCode } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { formatMAD } from '@/lib/utils';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
} from 'recharts';

export default function OwnerDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-owner'],
    queryFn: () => api.get('/dashboard/owner').then((r) => r.data.data),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tableau de bord"
        description="Vue d'ensemble de votre salle"
        actions={
          <Button asChild>
            <Link to="/owner/checkins">
              <QrCode className="mr-2 h-4 w-4" /> Scanner QR
            </Link>
          </Button>
        }
      />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={Users}
              label="Membres actifs"
              value={data?.members?.active || 0}
              hint={`Total: ${data?.members?.total || 0}`}
              color="text-blue-500 bg-blue-100 dark:bg-blue-900/40"
            />
            <StatCard
              icon={CalendarRange}
              label="Abonnements actifs"
              value={data?.subscriptions?.active || 0}
              hint={`${data?.subscriptions?.expiringThisWeek || 0} expirent cette semaine`}
              color="text-emerald-500 bg-emerald-100 dark:bg-emerald-900/40"
            />
            <StatCard
              icon={TrendingUp}
              label="Revenue ce mois"
              value={formatMAD(data?.revenue?.thisMonth || 0)}
              hint={`Total: ${formatMAD(data?.revenue?.allTime || 0)}`}
              color="text-violet-500 bg-violet-100 dark:bg-violet-900/40"
            />
            <StatCard
              icon={AlertCircle}
              label="Check-ins aujourd'hui"
              value={data?.checkins?.today || 0}
              hint={`Nouveaux ce mois: ${data?.members?.newThisMonth || 0}`}
              color="text-amber-500 bg-amber-100 dark:bg-amber-900/40"
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Revenue par mois</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={(data?.revenue?.byMonth || []).map((r) => ({ month: r.month, total: parseFloat(r.total) }))}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="month" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip
                      formatter={(v) => formatMAD(v)}
                      contentStyle={{ borderRadius: 8, border: '1px solid hsl(var(--border))' }}
                    />
                    <Bar dataKey="total" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Check-ins (30 derniers jours)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={(data?.checkins?.byDay || []).map((r) => ({ day: r.day, count: parseInt(r.count) }))}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="day" fontSize={10} />
                    <YAxis fontSize={12} />
                    <Tooltip contentStyle={{ borderRadius: 8 }} />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="hsl(var(--secondary))"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {data?.topPlans?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Top plans</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data.topPlans.map((p) => (
                    <div key={p.plan_id} className="flex items-center justify-between rounded-md border p-3">
                      <div>
                        <div className="font-medium">{p.plan?.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatMAD(p.plan?.price)}
                        </div>
                      </div>
                      <div className="text-2xl font-bold">{p.count}</div>
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

function StatCard({ icon: Icon, label, value, hint, color }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
            <p className="mt-1 font-display text-2xl font-bold">{value}</p>
            {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
          </div>
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${color}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
