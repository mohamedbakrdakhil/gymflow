/**
 * Page Paramètres — info salle, profil owner, et white-label (Premium)
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Loader2, Sparkles } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/common/PageHeader';

export default function SettingsPage() {
  const { user, gym, refreshMe } = useAuth();
  const qc = useQueryClient();

  return (
    <div className="space-y-6">
      <PageHeader title="Paramètres" description="Gérer votre salle et votre profil" />

      <Tabs defaultValue="gym">
        <TabsList>
          <TabsTrigger value="gym">Salle</TabsTrigger>
          <TabsTrigger value="profile">Mon profil</TabsTrigger>
          <TabsTrigger value="branding" disabled={gym?.plan_type !== 'premium'}>
            Branding {gym?.plan_type !== 'premium' && '(Premium)'}
          </TabsTrigger>
          <TabsTrigger value="password">Mot de passe</TabsTrigger>
        </TabsList>

        <TabsContent value="gym" className="pt-4">
          <GymSettings gym={gym} onSaved={refreshMe} />
        </TabsContent>
        <TabsContent value="profile" className="pt-4">
          <ProfileSettings user={user} onSaved={refreshMe} />
        </TabsContent>
        <TabsContent value="branding" className="pt-4">
          {gym?.plan_type === 'premium' ? (
            <BrandingSettings gym={gym} onSaved={refreshMe} />
          ) : (
            <PremiumLocked />
          )}
        </TabsContent>
        <TabsContent value="password" className="pt-4">
          <PasswordSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function GymSettings({ gym, onSaved }) {
  const { register, handleSubmit } = useForm({ defaultValues: gym || {} });
  const mutation = useMutation({
    mutationFn: (d) => api.put('/gym', d),
    onSuccess: () => { toast.success('Salle modifiée'); onSaved?.(); },
    onError: (e) => toast.error(e.response?.data?.message || 'Erreur'),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Informations de la salle</CardTitle>
        <CardDescription>
          Plan actuel : <Badge variant="default">{gym?.plan_type}</Badge>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
          <Field label="Nom"><Input {...register('name')} /></Field>
          <Field label="Email"><Input type="email" {...register('email')} /></Field>
          <Field label="Téléphone"><Input {...register('phone')} /></Field>
          <Field label="Ville"><Input {...register('city')} /></Field>
          <Field label="Adresse"><Textarea rows={2} {...register('address')} /></Field>
          <div className="flex justify-end">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enregistrer
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function ProfileSettings({ user, onSaved }) {
  const { register, handleSubmit } = useForm({ defaultValues: user || {} });
  const mutation = useMutation({
    mutationFn: (d) => api.put('/users/me', d),
    onSuccess: () => { toast.success('Profil modifié'); onSaved?.(); },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Profil personnel</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Prénom"><Input {...register('first_name')} /></Field>
            <Field label="Nom"><Input {...register('last_name')} /></Field>
          </div>
          <Field label="Téléphone"><Input {...register('phone')} /></Field>
          <div className="flex justify-end">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enregistrer
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function BrandingSettings({ gym, onSaved }) {
  const [primary, setPrimary] = useState(gym?.primary_color || '#2563EB');
  const [secondary, setSecondary] = useState(gym?.secondary_color || '#F97316');
  const mutation = useMutation({
    mutationFn: () => api.put('/gym/branding', { primary_color: primary, secondary_color: secondary }),
    onSuccess: () => { toast.success('Couleurs mises à jour'); onSaved?.(); },
    onError: (e) => toast.error(e.response?.data?.message || 'Erreur'),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-4 w-4 text-secondary" /> White-label
        </CardTitle>
        <CardDescription>Personnalisez les couleurs de votre interface</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Couleur primaire">
            <div className="flex gap-2">
              <input
                type="color"
                value={primary}
                onChange={(e) => setPrimary(e.target.value)}
                className="h-10 w-16 cursor-pointer rounded-md border"
              />
              <Input value={primary} onChange={(e) => setPrimary(e.target.value)} />
            </div>
          </Field>
          <Field label="Couleur secondaire">
            <div className="flex gap-2">
              <input
                type="color"
                value={secondary}
                onChange={(e) => setSecondary(e.target.value)}
                className="h-10 w-16 cursor-pointer rounded-md border"
              />
              <Input value={secondary} onChange={(e) => setSecondary(e.target.value)} />
            </div>
          </Field>
        </div>
        <div className="flex justify-end">
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enregistrer
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function PremiumLocked() {
  return (
    <Card>
      <CardContent className="pt-6 text-center">
        <Sparkles className="mx-auto mb-3 h-10 w-10 text-secondary" />
        <h3 className="font-display text-lg font-semibold">Feature Premium</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Le white-label permet de personnaliser les couleurs et le logo de votre interface.
          Disponible avec le plan Premium (1500 DH/mois).
        </p>
      </CardContent>
    </Card>
  );
}

function PasswordSettings() {
  const { register, handleSubmit, reset } = useForm();
  const mutation = useMutation({
    mutationFn: (d) => api.post('/auth/change-password', d),
    onSuccess: () => { toast.success('Mot de passe modifié'); reset(); },
    onError: (e) => toast.error(e.response?.data?.message || 'Erreur'),
  });
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Mot de passe</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
          <Field label="Mot de passe actuel">
            <Input type="password" {...register('current_password', { required: true })} />
          </Field>
          <Field label="Nouveau mot de passe (min 8 caractères)">
            <Input type="password" {...register('new_password', { required: true, minLength: 8 })} />
          </Field>
          <div className="flex justify-end">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Changer
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
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
