import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus, Calendar, Trash2, Loader2, Users as UsersIcon } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';

const days = [
  { key: 'monday', label: 'Lundi' },
  { key: 'tuesday', label: 'Mardi' },
  { key: 'wednesday', label: 'Mercredi' },
  { key: 'thursday', label: 'Jeudi' },
  { key: 'friday', label: 'Vendredi' },
  { key: 'saturday', label: 'Samedi' },
  { key: 'sunday', label: 'Dimanche' },
];

const schema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  coach_id: z.string().uuid().optional().or(z.literal('')),
  day_of_week: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']),
  start_time: z.string(),
  end_time: z.string(),
  max_capacity: z.coerce.number().int().min(1).max(500),
  room: z.string().optional(),
});

export default function ClassesPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: schedule, isLoading } = useQuery({
    queryKey: ['classes-schedule'],
    queryFn: () => api.get('/classes/schedule').then((r) => r.data.data),
  });

  const { data: coaches = [] } = useQuery({
    queryKey: ['coaches-list'],
    queryFn: () => api.get('/coaches').then((r) => r.data.data.items),
  });

  const createMutation = useMutation({
    mutationFn: (d) => {
      const payload = { ...d };
      if (!payload.coach_id) delete payload.coach_id;
      return api.post('/classes', payload).then((r) => r.data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['classes-schedule'] });
      setOpen(false);
      toast.success('Cours créé');
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Erreur'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/classes/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['classes-schedule'] });
      toast.success('Cours supprimé');
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Planning des cours"
        description="Cours collectifs hebdomadaires"
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Nouveau cours
          </Button>
        }
      />

      {isLoading ? (
        <Skeleton className="h-64 rounded-xl" />
      ) : !schedule || Object.values(schedule).every((v) => v.length === 0) ? (
        <EmptyState
          icon={Calendar}
          title="Pas encore de cours"
          description="Créez votre premier cours hebdomadaire"
          action={
            <Button onClick={() => setOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Créer
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {days.map((d) => (
            <Card key={d.key}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">{d.label}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                {schedule[d.key]?.length === 0 ? (
                  <p className="text-xs text-muted-foreground">—</p>
                ) : (
                  schedule[d.key].map((c) => (
                    <div key={c.id} className="rounded-md border p-2.5 text-xs">
                      <div className="flex items-start justify-between gap-1">
                        <span className="font-medium">{c.name}</span>
                        <button
                          onClick={() => {
                            if (confirm(`Supprimer "${c.name}" ?`)) deleteMutation.mutate(c.id);
                          }}
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </button>
                      </div>
                      <div className="mt-0.5 text-muted-foreground">
                        {c.start_time.slice(0, 5)} - {c.end_time.slice(0, 5)}
                      </div>
                      {c.coach?.user && (
                        <div className="mt-0.5 text-muted-foreground">
                          {c.coach.user.first_name} {c.coach.user.last_name}
                        </div>
                      )}
                      <div className="mt-1 flex items-center gap-1 text-muted-foreground">
                        <UsersIcon className="h-3 w-3" />
                        Cap. {c.max_capacity}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Nouveau cours</DialogTitle>
          </DialogHeader>
          <ClassForm coaches={coaches} onSubmit={(d) => createMutation.mutate(d)} submitting={createMutation.isPending} onCancel={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ClassForm({ coaches, onSubmit, submitting, onCancel }) {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { max_capacity: 20, day_of_week: 'monday' },
  });
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Field label="Nom *" error={errors.name?.message}>
        <Input {...register('name')} placeholder="ex: CrossFit débutant" />
      </Field>
      <Field label="Description">
        <Textarea rows={2} {...register('description')} />
      </Field>
      <Field label="Coach">
        <Select value={watch('coach_id') || ''} onValueChange={(v) => setValue('coach_id', v)}>
          <SelectTrigger><SelectValue placeholder="Aucun" /></SelectTrigger>
          <SelectContent>
            {coaches.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.user?.first_name} {c.user?.last_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Jour *">
          <Select value={watch('day_of_week')} onValueChange={(v) => setValue('day_of_week', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {days.map((d) => <SelectItem key={d.key} value={d.key}>{d.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Début *" error={errors.start_time?.message}>
          <Input type="time" {...register('start_time')} />
        </Field>
        <Field label="Fin *" error={errors.end_time?.message}>
          <Input type="time" {...register('end_time')} />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Capacité max *" error={errors.max_capacity?.message}>
          <Input type="number" {...register('max_capacity')} />
        </Field>
        <Field label="Salle">
          <Input {...register('room')} placeholder="ex: Salle 1" />
        </Field>
      </div>
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
