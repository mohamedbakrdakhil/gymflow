import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dumbbell, ChevronDown } from 'lucide-react';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/utils';

export default function MyPrograms() {
  const [expanded, setExpanded] = useState(null);
  const { data = [], isLoading } = useQuery({
    queryKey: ['programs-mine'],
    queryFn: () => api.get('/programs').then((r) => r.data.data),
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Mes programmes" description="Programmes d'entraînement personnalisés" />

      {isLoading ? (
        <Skeleton className="h-64" />
      ) : data.length === 0 ? (
        <EmptyState
          icon={Dumbbell}
          title="Aucun programme"
          description="Votre coach créera bientôt votre programme"
        />
      ) : (
        <div className="space-y-3">
          {data.map((p) => (
            <Card key={p.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium">{p.name}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDate(p.start_date)} → {formatDate(p.end_date)}
                    </p>
                    {p.description && (
                      <p className="mt-2 text-sm text-muted-foreground">{p.description}</p>
                    )}
                  </div>
                  <Badge variant={p.status === 'active' ? 'success' : 'outline'}>{p.status}</Badge>
                </div>

                {p.exercises && p.exercises.length > 0 && (
                  <div className="mt-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpanded(expanded === p.id ? null : p.id)}
                    >
                      <ChevronDown
                        className={`mr-1 h-4 w-4 transition-transform ${expanded === p.id ? 'rotate-180' : ''}`}
                      />
                      {p.exercises.length} exercice(s)
                    </Button>

                    {expanded === p.id && (
                      <div className="mt-3 space-y-1">
                        {p.exercises.map((ex, i) => (
                          <div key={i} className="rounded-md border p-2 text-sm">
                            <div className="font-medium">{ex.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {ex.sets && `${ex.sets} × `}
                              {ex.reps && `${ex.reps} reps `}
                              {ex.rest_seconds && `• repos ${ex.rest_seconds}s`}
                            </div>
                            {ex.notes && <div className="mt-1 text-xs italic">{ex.notes}</div>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
