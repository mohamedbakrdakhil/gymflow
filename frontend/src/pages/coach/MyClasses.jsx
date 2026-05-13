import { useQuery } from '@tanstack/react-query';
import { Calendar } from 'lucide-react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';

const dayLabels = {
  monday: 'Lundi', tuesday: 'Mardi', wednesday: 'Mercredi',
  thursday: 'Jeudi', friday: 'Vendredi', saturday: 'Samedi', sunday: 'Dimanche',
};

export default function MyClasses() {
  const { data: schedule, isLoading } = useQuery({
    queryKey: ['classes-schedule'],
    queryFn: () => api.get('/classes/schedule').then((r) => r.data.data),
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Mes cours" description="Planning hebdomadaire" />

      {isLoading ? (
        <Skeleton className="h-64" />
      ) : !schedule || Object.values(schedule).every((v) => v.length === 0) ? (
        <EmptyState icon={Calendar} title="Aucun cours" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Object.entries(schedule).map(([day, items]) => (
            <Card key={day}>
              <CardHeader>
                <CardTitle className="text-sm">{dayLabels[day]}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {items.length === 0 ? (
                  <p className="text-xs text-muted-foreground">—</p>
                ) : (
                  items.map((c) => (
                    <div key={c.id} className="rounded-md border p-2 text-xs">
                      <div className="font-medium">{c.name}</div>
                      <div className="text-muted-foreground">
                        {c.start_time.slice(0, 5)} - {c.end_time.slice(0, 5)}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
