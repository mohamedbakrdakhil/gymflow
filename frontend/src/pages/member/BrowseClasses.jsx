import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Calendar, Users } from 'lucide-react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';

const dayLabels = {
  monday: 'Lundi', tuesday: 'Mardi', wednesday: 'Mercredi',
  thursday: 'Jeudi', friday: 'Vendredi', saturday: 'Samedi', sunday: 'Dimanche',
};

export default function BrowseClasses() {
  const qc = useQueryClient();
  const [bookingDate, setBookingDate] = useState(new Date().toISOString().slice(0, 10));

  const { data: schedule, isLoading } = useQuery({
    queryKey: ['classes-schedule'],
    queryFn: () => api.get('/classes/schedule').then((r) => r.data.data),
  });

  const bookMutation = useMutation({
    mutationFn: ({ class_id, booking_date }) =>
      api.post(`/classes/${class_id}/book`, { booking_date }).then((r) => r.data),
    onSuccess: (res) => {
      toast.success(res.message || 'Réservation confirmée');
      qc.invalidateQueries({ queryKey: ['classes-schedule'] });
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Échec'),
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Cours collectifs" description="Réserver un cours" />

      <div className="flex items-center gap-2">
        <label className="text-sm">Date :</label>
        <input
          type="date"
          value={bookingDate}
          onChange={(e) => setBookingDate(e.target.value)}
          className="rounded-md border px-3 py-1 text-sm"
        />
      </div>

      {isLoading ? (
        <Skeleton className="h-64" />
      ) : !schedule || Object.values(schedule).every((v) => v.length === 0) ? (
        <EmptyState icon={Calendar} title="Aucun cours disponible" />
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
                    <div key={c.id} className="rounded-md border p-2">
                      <div className="text-sm font-medium">{c.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {c.start_time.slice(0, 5)} - {c.end_time.slice(0, 5)}
                      </div>
                      {c.coach?.user && (
                        <div className="text-xs text-muted-foreground">
                          {c.coach.user.first_name} {c.coach.user.last_name}
                        </div>
                      )}
                      <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <Users className="h-3 w-3" />
                        {c.max_capacity}
                      </div>
                      <Button
                        size="sm"
                        className="mt-2 w-full text-xs"
                        onClick={() => bookMutation.mutate({ class_id: c.id, booking_date: bookingDate })}
                      >
                        Réserver
                      </Button>
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
