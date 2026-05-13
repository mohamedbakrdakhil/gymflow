import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus, UserCog, Trash2, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { initials } from '@/lib/utils';

const schema = z.object({
  first_name: z.string().min(1, 'Prénom requis'),
  last_name: z.string().min(1, 'Nom requis'),
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Min 8 caractères'),
  phone: z.string().optional(),
  specialty: z.string().optional(),
  bio: z.string().optional(),
});

export default function CoachesList() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['coaches'],
    queryFn: () => api.get('/coaches').then((r) => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (d) => api.post('/coaches', d).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['coaches'] });
      setOpen(false);
      toast.success('Coach créé');
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Erreur'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/coaches/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['coaches'] });
      toast.success('Coach supprimé');
    },
  });

  const items = data?.items || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Coachs"
        description={items.length ? `${items.length} coach(s)` : ''}
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Nouveau coach
          </Button>
        }
      />

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={UserCog}
          title="Aucun coach"
          description="Ajoutez votre premier coach pour gérer les cours et programmes"
          action={
            <Button onClick={() => setOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Ajouter
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((c) => (
            <Card key={c.id}>
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={c.user?.avatar_url} />
                    <AvatarFallback>{initials(c.user?.first_name, c.user?.last_name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium">{c.user?.first_name} {c.user?.last_name}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-1">{c.user?.email}</p>
                    {c.specialty && (
                      <Badge variant="outline" className="mt-1 text-[10px]">{c.specialty}</Badge>
                    )}
                  </div>
                </div>
                {c.bio && <p className="mt-3 text-xs text-muted-foreground line-clamp-2">{c.bio}</p>}
                <div className="mt-3 flex justify-end">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (confirm('Supprimer ce coach ?')) deleteMutation.mutate(c.id);
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouveau coach</DialogTitle>
          </DialogHeader>
          <CoachForm submitting={createMutation.isPending} onSubmit={(d) => createMutation.mutate(d)} onCancel={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CoachForm({ onSubmit, submitting, onCancel }) {
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) });
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Prénom *" error={errors.first_name?.message}>
          <Input {...register('first_name')} />
        </Field>
        <Field label="Nom *" error={errors.last_name?.message}>
          <Input {...register('last_name')} />
        </Field>
      </div>
      <Field label="Email *" error={errors.email?.message}>
        <Input type="email" {...register('email')} />
      </Field>
      <Field label="Mot de passe *" error={errors.password?.message}>
        <Input type="password" {...register('password')} />
      </Field>
      <Field label="Téléphone" error={errors.phone?.message}>
        <Input {...register('phone')} />
      </Field>
      <Field label="Spécialité" error={errors.specialty?.message}>
        <Input {...register('specialty')} placeholder="ex: Musculation, Yoga" />
      </Field>
      <Field label="Bio" error={errors.bio?.message}>
        <Textarea rows={3} {...register('bio')} />
      </Field>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Annuler</Button>
        <Button type="submit" disabled={submitting}>
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Créer
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
