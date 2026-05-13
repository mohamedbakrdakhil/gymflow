/**
 * Inscription multi-étapes : infos salle → infos owner → choix du plan
 */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, Check, Dumbbell, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { defaultPathForRole } from '@/components/common/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const gymSchema = z.object({
  name: z.string().min(2, 'Nom de la salle requis (min 2 caractères)'),
  city: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
});

const ownerSchema = z
  .object({
    first_name: z.string().min(2, 'Prénom requis'),
    last_name: z.string().min(2, 'Nom requis'),
    email: z.string().email('Email invalide'),
    phone: z.string().optional(),
    password: z.string().min(8, 'Mot de passe min 8 caractères'),
    confirm_password: z.string(),
  })
  .refine((d) => d.password === d.confirm_password, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirm_password'],
  });

const plans = [
  {
    type: 'basique',
    name: 'Basique',
    price: 200,
    desc: 'Petites salles — gestion membres, plans, paiements cash',
  },
  {
    type: 'pro',
    name: 'Pro',
    price: 500,
    desc: 'QR check-in, coachs, cours, paiement en ligne',
    popular: true,
  },
  {
    type: 'premium',
    name: 'Premium',
    price: 1500,
    desc: 'White-label, nutrition, multi-salles, chat',
  },
];

export default function Register() {
  const navigate = useNavigate();
  const { registerGym } = useAuth();
  const [step, setStep] = useState(0);
  const [gymData, setGymData] = useState(null);
  const [ownerData, setOwnerData] = useState(null);
  const [planType, setPlanType] = useState('basique');
  const [submitting, setSubmitting] = useState(false);

  const gymForm = useForm({ resolver: zodResolver(gymSchema) });
  const ownerForm = useForm({ resolver: zodResolver(ownerSchema) });

  function onGymSubmit(data) {
    setGymData(data);
    setStep(1);
  }
  function onOwnerSubmit(data) {
    setOwnerData(data);
    setStep(2);
  }
  async function finalSubmit() {
    setSubmitting(true);
    try {
      const { confirm_password: _, ...owner } = ownerData;
      const { user } = await registerGym({
        gym: gymData,
        owner,
        plan_type: planType,
      });
      toast.success('Salle créée avec succès !');
      navigate(defaultPathForRole(user.role), { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Inscription échouée');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 px-4 py-8">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Dumbbell className="h-6 w-6 text-primary" />
              <CardTitle>Créer ma salle GymFlow</CardTitle>
            </div>
            <div className="flex items-center gap-1">
              {[0, 1, 2].map((s) => (
                <div
                  key={s}
                  className={cn(
                    'h-2 w-8 rounded-full transition-colors',
                    s <= step ? 'bg-primary' : 'bg-muted',
                  )}
                />
              ))}
            </div>
          </div>
          <CardDescription>
            {step === 0 && 'Étape 1/3 — Informations de votre salle'}
            {step === 1 && 'Étape 2/3 — Votre compte propriétaire'}
            {step === 2 && 'Étape 3/3 — Choix du plan tarifaire'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {step === 0 && (
            <form onSubmit={gymForm.handleSubmit(onGymSubmit)} className="space-y-4">
              <Field label="Nom de la salle *" error={gymForm.formState.errors.name?.message}>
                <Input {...gymForm.register('name')} placeholder="ex: Fitness Casa" />
              </Field>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Ville" error={gymForm.formState.errors.city?.message}>
                  <Input {...gymForm.register('city')} placeholder="ex: Casablanca" />
                </Field>
                <Field label="Téléphone" error={gymForm.formState.errors.phone?.message}>
                  <Input {...gymForm.register('phone')} placeholder="+212..." />
                </Field>
              </div>
              <Field label="Email salle" error={gymForm.formState.errors.email?.message}>
                <Input type="email" {...gymForm.register('email')} placeholder="contact@..." />
              </Field>
              <Field label="Adresse" error={gymForm.formState.errors.address?.message}>
                <Textarea {...gymForm.register('address')} rows={2} placeholder="Rue, quartier..." />
              </Field>

              <div className="flex justify-between pt-2">
                <Button variant="outline" type="button" asChild>
                  <Link to="/login">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Connexion
                  </Link>
                </Button>
                <Button type="submit">
                  Suivant <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </form>
          )}

          {step === 1 && (
            <form onSubmit={ownerForm.handleSubmit(onOwnerSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Prénom *" error={ownerForm.formState.errors.first_name?.message}>
                  <Input {...ownerForm.register('first_name')} />
                </Field>
                <Field label="Nom *" error={ownerForm.formState.errors.last_name?.message}>
                  <Input {...ownerForm.register('last_name')} />
                </Field>
              </div>
              <Field label="Email *" error={ownerForm.formState.errors.email?.message}>
                <Input type="email" {...ownerForm.register('email')} placeholder="vous@..." />
              </Field>
              <Field label="Téléphone" error={ownerForm.formState.errors.phone?.message}>
                <Input {...ownerForm.register('phone')} placeholder="+212..." />
              </Field>
              <Field label="Mot de passe *" error={ownerForm.formState.errors.password?.message}>
                <Input type="password" {...ownerForm.register('password')} />
              </Field>
              <Field
                label="Confirmer le mot de passe *"
                error={ownerForm.formState.errors.confirm_password?.message}
              >
                <Input type="password" {...ownerForm.register('confirm_password')} />
              </Field>

              <div className="flex justify-between pt-2">
                <Button variant="outline" type="button" onClick={() => setStep(0)}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Précédent
                </Button>
                <Button type="submit">
                  Suivant <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </form>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                {plans.map((p) => (
                  <button
                    key={p.type}
                    onClick={() => setPlanType(p.type)}
                    type="button"
                    className={cn(
                      'relative rounded-lg border-2 p-4 text-left transition-all',
                      planType === p.type
                        ? 'border-primary bg-primary/5'
                        : 'border-muted hover:border-muted-foreground/30',
                    )}
                  >
                    {p.popular && (
                      <span className="absolute -top-2 right-2 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground">
                        Populaire
                      </span>
                    )}
                    <div className="flex items-center justify-between">
                      <h3 className="font-display text-lg font-bold">{p.name}</h3>
                      {planType === p.type && <Check className="h-5 w-5 text-primary" />}
                    </div>
                    <p className="mt-1 text-2xl font-bold">
                      {p.price} <span className="text-sm font-normal text-muted-foreground">DH/mois</span>
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">{p.desc}</p>
                  </button>
                ))}
              </div>

              <div className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
                Vous bénéficiez de <strong>14 jours d'essai gratuit</strong>. Aucun paiement requis maintenant.
              </div>

              <div className="flex justify-between pt-2">
                <Button variant="outline" type="button" onClick={() => setStep(1)} disabled={submitting}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Précédent
                </Button>
                <Button onClick={finalSubmit} disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Créer ma salle
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
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
