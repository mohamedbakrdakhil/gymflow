import { useQuery } from '@tanstack/react-query';
import { Calendar, Dumbbell, Users } from 'lucide-react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/common/PageHeader';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/AuthContext';

export default function CoachDashboard() {
  const { user } = useAuth();
  const { data: classes = [], isLoading: l1 } = useQuery({
    queryKey: ['classes-coach'],
    queryFn: () => api.get('/classes/schedule').then((r) => r.data.data),
  });

  const { data: programs = [], isLoading: l2 } = useQuery({
    queryKey: ['programs-coach'],
    queryFn: () => api.get('/programs').then((r) => r.data.data),
  });

  const allClasses = Object.values(classes || {}).flat();

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Bonjour ${user?.first_name} 👋`}
        description="Votre espace coach"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Cours hebdo</p>
                <p className="font-display text-2xl font-bold">{l1 ? '...' : allClasses.length}</p>
              </div>
              <Calendar className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Programmes actifs</p>
                <p className="font-display text-2xl font-bold">
                  {l2 ? '...' : programs.filter((p) => p.status === 'active').length}
                </p>
              </div>
              <Dumbbell className="h-8 w-8 text-secondary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Membres encadrés</p>
                <p className="font-display text-2xl font-bold">
                  {l2 ? '...' : new Set(programs.map((p) => p.member_id)).size}
                </p>
              </div>
              <Users className="h-8 w-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mon planning</CardTitle>
        </CardHeader>
        <CardContent>
          {l1 ? (
            <Skeleton className="h-32" />
          ) : allClasses.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun cours assigné</p>
          ) : (
            <div className="space-y-2">
              {allClasses.map((c) => (
                <div key={c.id} className="flex justify-between rounded-md border p-3">
                  <div>
                    <div className="font-medium">{c.name}</div>
                    <div className="text-xs capitalize text-muted-foreground">
                      {c.day_of_week} • {c.start_time.slice(0, 5)} - {c.end_time.slice(0, 5)}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">Cap. {c.max_capacity}</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
