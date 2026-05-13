import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Plus, Dumbbell, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/utils';

export default function MyPrograms() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: programs = [], isLoading } = useQuery({
    queryKey: ['programs'],
    queryFn: () => api.get('/programs').then((r) => r.data.data),
  });

  const { data: membersData } = useQuery({
    queryKey: ['members-list'],
    queryFn: () => api.get('/members', { params: { limit: 100 } }).then((r) => r.data.data.items),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mes programmes"
        description="Programmes créés pour vos membres"
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Nouveau programme
          </Button>
        }
      />

      {isLoading ? (
        <Skeleton className="h-64" />
      ) : programs.length === 0 ? (
        <EmptyState
          icon={Dumbbell}
          title="Aucun programme"
          description="Créez un programme pour un membre"
          action={
            <Button onClick={() => setOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Créer
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {programs.map((p) => (
            <Card key={p.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium">{p.name}</h3>
                    <div className="mt-1 text-sm text-muted-foreground">
                      {p.member?.first_name} {p.member?.last_name}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {formatDate(p.start_date)} → {formatDate(p.end_date)} • {p.exercises?.length || 0} exercice(s)
                    </div>
                  </div>
                  <Badge variant={p.status === 'active' ? 'success' : 'outline'}>{p.status}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouveau programme</DialogTitle>
          </DialogHeader>
          <ProgramForm
            members={membersData || []}
            onSubmit={async (d) => {
              try {
                await api.post('/programs', d);
                qc.invalidateQueries({ queryKey: ['programs'] });
                setOpen(false);
                toast.success('Programme créé');
              } catch (e) {
                toast.error(e.response?.data?.message || 'Erreur');
              }
            }}
            onCancel={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProgramForm({ members, onSubmit, onCancel }) {
  const { register, handleSubmit, watch, setValue } = useForm({
    defaultValues: { exercises: [], start_date: new Date().toISOString().slice(0, 10) },
  });
  const [submitting, setSubmitting] = useState(false);
  const [exercises, setExercises] = useState([{ name: '', sets: 3, reps: '10', rest_seconds: 60 }]);

  function addExercise() {
    setExercises([...exercises, { name: '', sets: 3, reps: '10', rest_seconds: 60 }]);
  }
  function updateEx(i, field, value) {
    const next = [...exercises];
    next[i] = { ...next[i], [field]: value };
    setExercises(next);
  }
  function removeEx(i) {
    setExercises(exercises.filter((_, idx) => idx !== i));
  }

  return (
    <form
      onSubmit={handleSubmit(async (d) => {
        setSubmitting(true);
        const exs = exercises.filter((e) => e.name.trim()).map((e) => ({
          ...e,
          sets: parseInt(e.sets) || undefined,
          rest_seconds: parseInt(e.rest_seconds) || undefined,
        }));
        await onSubmit({ ...d, exercises: exs });
        setSubmitting(false);
      })}
      className="space-y-4"
    >
      <Field label="Nom du programme *">
        <Input {...register('name', { required: true })} />
      </Field>
      <Field label="Membre *">
        <Select value={watch('member_id') || ''} onValueChange={(v) => setValue('member_id', v)}>
          <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
          <SelectContent>
            {members.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.first_name} {m.last_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Du *"><Input type="date" {...register('start_date', { required: true })} /></Field>
        <Field label="Au *"><Input type="date" {...register('end_date', { required: true })} /></Field>
      </div>
      <Field label="Description"><Textarea rows={2} {...register('description')} /></Field>

      <div>
        <Label>Exercices</Label>
        <div className="mt-2 space-y-2">
          {exercises.map((e, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 rounded-md border p-2">
              <Input
                className="col-span-5"
                placeholder="Nom"
                value={e.name}
                onChange={(ev) => updateEx(i, 'name', ev.target.value)}
              />
              <Input
                className="col-span-2"
                placeholder="Séries"
                value={e.sets}
                onChange={(ev) => updateEx(i, 'sets', ev.target.value)}
              />
              <Input
                className="col-span-2"
                placeholder="Reps"
                value={e.reps}
                onChange={(ev) => updateEx(i, 'reps', ev.target.value)}
              />
              <Input
                className="col-span-2"
                placeholder="Repos (s)"
                value={e.rest_seconds}
                onChange={(ev) => updateEx(i, 'rest_seconds', ev.target.value)}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="col-span-1"
                onClick={() => removeEx(i)}
              >
                ×
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addExercise}>
            <Plus className="mr-1 h-3 w-3" /> Ajouter
          </Button>
        </div>
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

function Field({ label, children }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
