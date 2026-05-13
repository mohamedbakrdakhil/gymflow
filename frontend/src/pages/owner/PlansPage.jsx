import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Receipt, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { formatMAD } from '@/lib/utils';

const schema = z.object({
  name: z.string().min(1, 'Nom requis'),
  duration_days: z.coerce.number().int().min(1).max(3650),
  price: z.coerce.number().min(0),
  description: z.string().optional(),
  is_active: z.boolean().default(true),
});

export default function PlansPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['plans'],
    queryFn: () => api.get('/plans').then((r) => r.data.data),
  });

  const saveMutation = useMutation({
    mutationFn: (data) =>
      editing
        ? api.put(`/plans/${editing.id}`, data).then((r) => r.data)
        : api.post('/plans', data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['plans'] });
      setOpen(false);
      setEditing(null);
      toast.success(editing ? 'Plan modifié' : 'Plan créé');
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Erreur'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/plans/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['plans'] });
      toast.success('Plan supprimé');
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Plans d'abonnement"
        description="Les formules proposées aux membres"
        actions={
          <Button onClick={() => { setEditing(null); setOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" /> Nouveau plan
          </Button>
        }
      />

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
        </div>
      ) : plans.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="Aucun plan"
          description="Créez votre premier plan d'abonnement"
          action={
            <Button onClick={() => setOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Créer un plan
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((p) => (
            <Card key={p.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-display text-lg font-bold">{p.name}</h3>
                    <p className="text-xs text-muted-foreground">{p.duration_days} jours</p>
                  </div>
                  {p.is_active ? (
                    <Badge variant="success">Actif</Badge>
                  ) : (
                    <Badge variant="outline">Inactif</Badge>
                  )}
                </div>
                <div className="mt-3 font-display text-2xl font-bold text-primary">
                  {formatMAD(p.price)}
                </div>
                {p.description && (
                  <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{p.description}</p>
                )}
                <div className="mt-4 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { setEditing(p); setOpen(true); }}
                    className="flex-1"
                  >
                    <Edit className="mr-2 h-3 w-3" /> Modifier
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (confirm(`Supprimer "${p.name}" ?`)) deleteMutation.mutate(p.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Modifier le plan' : 'Nouveau plan'}</DialogTitle>
          </DialogHeader>
          <PlanForm
            initial={editing}
            submitting={saveMutation.isPending}
            onSubmit={(d) => saveMutation.mutate(d)}
            onCancel={() => { setOpen(false); setEditing(null); }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PlanForm({ initial, onSubmit, submitting, onCancel }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: initial || { is_active: true },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Field label="Nom *" error={errors.name?.message}>
        <Input {...register('name')} placeholder="ex: Mensuel" />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Durée (jours) *" error={errors.duration_days?.message}>
          <Input type="number" {...register('duration_days')} />
        </Field>
        <Field label="Prix (DH) *" error={errors.price?.message}>
          <Input type="number" step="0.01" {...register('price')} />
        </Field>
      </div>
      <Field label="Description">
        <Textarea rows={2} {...register('description')} />
      </Field>
      <div className="flex items-center gap-2">
        <input type="checkbox" id="active" {...register('is_active')} />
        <Label htmlFor="active" className="cursor-pointer">Plan actif</Label>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Annuler</Button>
        <Button type="submit" disabled={submitting}>
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initial ? 'Modifier' : 'Créer'}
        </Button>
      </div>
    </form>
  );
}

function Field({ label, error, children }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
