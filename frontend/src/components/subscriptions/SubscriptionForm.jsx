import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatMAD } from '@/lib/utils';

const schema = z.object({
  plan_id: z.string().uuid('Plan requis'),
  start_date: z.string().min(1, 'Date requise'),
  price_paid: z.coerce.number().min(0),
  discount: z.coerce.number().min(0).default(0),
  notes: z.string().optional(),
  create_payment: z.boolean().default(true),
  payment_method: z.enum(['cash', 'card', 'bank_transfer', 'online_stripe', 'online_cmi']).default('cash'),
});

export function SubscriptionForm({ memberId, onSuccess, onCancel }) {
  const qc = useQueryClient();
  const { data: plans = [] } = useQuery({
    queryKey: ['plans'],
    queryFn: () => api.get('/plans').then((r) => r.data.data),
  });

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      start_date: new Date().toISOString().slice(0, 10),
      create_payment: true,
      payment_method: 'cash',
      discount: 0,
    },
  });
  const planId = watch('plan_id');
  const selectedPlan = plans.find((p) => p.id === planId);

  const mutation = useMutation({
    mutationFn: (data) => api.post('/subscriptions', { ...data, member_id: memberId }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['subscriptions'] });
      qc.invalidateQueries({ queryKey: ['member', memberId] });
      toast.success('Abonnement créé');
      onSuccess?.();
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Erreur'),
  });

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
      <Field label="Plan *" error={errors.plan_id?.message}>
        <Select
          value={planId || ''}
          onValueChange={(v) => {
            setValue('plan_id', v);
            const p = plans.find((pl) => pl.id === v);
            if (p) setValue('price_paid', p.price);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Choisir un plan" />
          </SelectTrigger>
          <SelectContent>
            {plans.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name} — {formatMAD(p.price)} / {p.duration_days}j
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field label="Date de début *" error={errors.start_date?.message}>
        <Input type="date" {...register('start_date')} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Prix payé (DH) *" error={errors.price_paid?.message}>
          <Input type="number" step="0.01" {...register('price_paid')} />
        </Field>
        <Field label="Remise (DH)" error={errors.discount?.message}>
          <Input type="number" step="0.01" {...register('discount')} />
        </Field>
      </div>

      <Field label="Méthode de paiement">
        <Select
          value={watch('payment_method')}
          onValueChange={(v) => setValue('payment_method', v)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cash">Espèces</SelectItem>
            <SelectItem value="card">Carte bancaire</SelectItem>
            <SelectItem value="bank_transfer">Virement</SelectItem>
            <SelectItem value="online_stripe">Stripe</SelectItem>
            <SelectItem value="online_cmi">CMI</SelectItem>
          </SelectContent>
        </Select>
      </Field>

      <Field label="Notes">
        <Textarea rows={2} {...register('notes')} />
      </Field>

      {selectedPlan && (
        <div className="rounded-md border bg-muted/50 p-3 text-xs">
          <strong>Récap :</strong> {selectedPlan.name} — {selectedPlan.duration_days} jours — fin prévue le{' '}
          {new Date(
            new Date(watch('start_date')).getTime() + selectedPlan.duration_days * 86400000,
          ).toLocaleDateString('fr-FR')}
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
        )}
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Créer l'abonnement
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
