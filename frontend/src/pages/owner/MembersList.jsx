import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Plus, Search, Download, Users, Eye, Trash2, MoreVertical } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { MemberForm } from '@/components/members/MemberForm';
import { initials, formatDate } from '@/lib/utils';

export default function MembersList() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [openForm, setOpenForm] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['members', { search, page }],
    queryFn: () =>
      api.get('/members', { params: { search, page, limit: 20 } }).then((r) => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (payload) => api.post('/members', payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['members'] });
      setOpenForm(false);
      toast.success('Membre créé');
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Erreur'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/members/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['members'] });
      toast.success('Membre supprimé');
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Erreur'),
  });

  async function handleExport() {
    try {
      const res = await api.get('/members/export', { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'membres.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch (_) {
      toast.error('Export échoué');
    }
  }

  const items = data?.items || [];
  const meta = data?.meta;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Membres"
        description={meta ? `${meta.total} membre(s)` : ''}
        actions={
          <>
            <Button variant="outline" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" /> Exporter
            </Button>
            <Button onClick={() => setOpenForm(true)}>
              <Plus className="mr-2 h-4 w-4" /> Nouveau membre
            </Button>
          </>
        }
      />

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Rechercher par nom, téléphone, code..."
          className="pl-9"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </div>

      {isLoading ? (
        <div className="grid gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Aucun membre trouvé"
          description={search ? 'Essayez une autre recherche' : 'Commencez par ajouter votre premier membre'}
          action={
            <Button onClick={() => setOpenForm(true)}>
              <Plus className="mr-2 h-4 w-4" /> Ajouter un membre
            </Button>
          }
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {items.map((m) => (
                <MemberRow
                  key={m.id}
                  member={m}
                  onDelete={() => {
                    if (confirm(`Supprimer ${m.first_name} ${m.last_name} ?`)) {
                      deleteMutation.mutate(m.id);
                    }
                  }}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" disabled={!meta.hasPrev} onClick={() => setPage((p) => p - 1)}>
            Précédent
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {meta.page} / {meta.totalPages}
          </span>
          <Button variant="outline" disabled={!meta.hasNext} onClick={() => setPage((p) => p + 1)}>
            Suivant
          </Button>
        </div>
      )}

      <Dialog open={openForm} onOpenChange={setOpenForm}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nouveau membre</DialogTitle>
          </DialogHeader>
          <MemberForm
            onSubmit={(d) => createMutation.mutate(d)}
            submitting={createMutation.isPending}
            onCancel={() => setOpenForm(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MemberRow({ member, onDelete }) {
  const activeSub = member.subscriptions?.[0];
  return (
    <div className="flex items-center gap-4 p-4 hover:bg-muted/40 transition-colors">
      <Avatar className="h-12 w-12">
        <AvatarImage src={member.photo_url} />
        <AvatarFallback>{initials(member.first_name, member.last_name)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">
            {member.first_name} {member.last_name}
          </span>
          <Badge variant="outline" className="text-[10px]">{member.member_code}</Badge>
          {member.status === 'active' ? (
            <Badge variant="success" className="text-[10px]">Actif</Badge>
          ) : (
            <Badge variant="outline" className="text-[10px]">{member.status}</Badge>
          )}
        </div>
        <div className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
          {member.phone || '—'} {member.email && ` • ${member.email}`}
        </div>
        {activeSub && (
          <div className="mt-1 text-xs text-emerald-600">
            Abonnement actif jusqu'au {formatDate(activeSub.end_date)}
          </div>
        )}
      </div>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" asChild>
          <Link to={`/owner/members/${member.id}`}>
            <Eye className="h-4 w-4" />
          </Link>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link to={`/owner/members/${member.id}`}>Voir détails</Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete} className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" /> Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
