import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

const schema = z.object({
  first_name: z.string().min(1, 'Prénom requis'),
  last_name: z.string().min(1, 'Nom requis'),
  phone: z.string().optional(),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  birth_date: z.string().optional(),
  gender: z.enum(['male', 'female', '']).optional(),
  address: z.string().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  medical_notes: z.string().optional(),
});

export function MemberForm({ initial, onSubmit, submitting, onCancel }) {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: initial || {},
  });
  const gender = watch('gender');

  return (
    <form
      onSubmit={handleSubmit((values) => {
        const data = { ...values };
        if (data.gender === '') delete data.gender;
        if (!data.birth_date) delete data.birth_date;
        onSubmit(data);
      })}
      className="space-y-4"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Prénom *" error={errors.first_name?.message}>
          <Input {...register('first_name')} />
        </Field>
        <Field label="Nom *" error={errors.last_name?.message}>
          <Input {...register('last_name')} />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Téléphone" error={errors.phone?.message}>
          <Input {...register('phone')} placeholder="+212..." />
        </Field>
        <Field label="Email" error={errors.email?.message}>
          <Input type="email" {...register('email')} />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Date de naissance" error={errors.birth_date?.message}>
          <Input type="date" {...register('birth_date')} />
        </Field>
        <Field label="Genre" error={errors.gender?.message}>
          <Select value={gender || ''} onValueChange={(v) => setValue('gender', v)}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Homme</SelectItem>
              <SelectItem value="female">Femme</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>
      <Field label="Adresse" error={errors.address?.message}>
        <Textarea rows={2} {...register('address')} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Contact urgence (nom)" error={errors.emergency_contact_name?.message}>
          <Input {...register('emergency_contact_name')} />
        </Field>
        <Field label="Contact urgence (téléphone)" error={errors.emergency_contact_phone?.message}>
          <Input {...register('emergency_contact_phone')} />
        </Field>
      </div>
      <Field label="Notes médicales" error={errors.medical_notes?.message}>
        <Textarea rows={3} {...register('medical_notes')} placeholder="Allergies, blessures, restrictions..." />
      </Field>

      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
            Annuler
          </Button>
        )}
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
