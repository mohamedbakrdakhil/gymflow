import { useQuery } from '@tanstack/react-query';
import { Dumbbell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/utils';

export default function ProgramsPage() {
  const { data = [], isLoading } = useQuery({
    queryKey: ['programs'],
    queryFn: () => api.get('/programs').then((r) => r.data.data),
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Programmes d'entraînement" description="Programmes personnalisés créés par vos coachs" />

      {isLoading ? (
        <div className="grid gap-3">
          {[1, 2].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : data.length === 0 ? (
        <EmptyState
          icon={Dumbbell}
          title="Aucun programme"
          description="Les programmes créés par vos coachs apparaîtront ici"
        />
      ) : (
        <div className="space-y-3">
          {data.map((p) => (
            <Card key={p.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium">{p.name}</h3>
                    <div className="mt-1 text-sm text-muted-foreground">
                      Membre :{' '}
                      <Link to={`/owner/members/${p.member?.id}`} className="hover:underline">
                        {p.member?.first_name} {p.member?.last_name}
                      </Link>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      Du {formatDate(p.start_date)} au {formatDate(p.end_date)} • {p.exercises?.length || 0} exercice(s)
                    </div>
                  </div>
                  <Badge variant={p.status === 'active' ? 'success' : 'outline'}>{p.status}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
