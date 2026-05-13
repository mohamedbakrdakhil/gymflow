import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Building2, Pause, Play, X, Search } from 'lucide-react';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/utils';

export default function GymsList() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['superadmin-gyms', search],
    queryFn: () => api.get('/superadmin/gyms', { params: { search, limit: 50 } }).then((r) => r.data.data),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => api.put(`/superadmin/gyms/${id}/status`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['superadmin-gyms'] });
      toast.success('Statut modifié');
    },
  });

  const items = data?.items || [];

  return (
    <div className="space-y-6">
      <PageHeader title="Salles" description={items.length ? `${items.length} salle(s)` : ''} />

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Nom, subdomain..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : items.length === 0 ? (
        <EmptyState icon={Building2} title="Aucune salle" />
      ) : (
        <div className="space-y-3">
          {items.map((g) => (
            <Card key={g.id}>
              <CardContent className="pt-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display text-lg font-bold">{g.name}</h3>
                      <Badge variant="outline">/{g.subdomain}</Badge>
                      <Badge variant={statusVariant(g.status)}>{g.status}</Badge>
                      <Badge variant={planVariant(g.plan_type)} className="capitalize">{g.plan_type}</Badge>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {g.city} • {g.memberCount} membre(s) • Plan expire le {formatDate(g.plan_expires_at)}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {g.status === 'active' || g.status === 'trial' ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => statusMutation.mutate({ id: g.id, status: 'suspended' })}
                      >
                        <Pause className="mr-1 h-3 w-3" /> Suspendre
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => statusMutation.mutate({ id: g.id, status: 'active' })}
                      >
                        <Play className="mr-1 h-3 w-3" /> Réactiver
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function statusVariant(s) {
  return s === 'active' ? 'success' : s === 'trial' ? 'warning' : s === 'suspended' ? 'destructive' : 'outline';
}
function planVariant(p) {
  return p === 'premium' ? 'default' : p === 'pro' ? 'info' : 'outline';
}
