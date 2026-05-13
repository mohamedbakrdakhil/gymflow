/**
 * Page d'accueil publique — présente le SaaS et redirige vers register/login
 */
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dumbbell, CheckCircle2, Smartphone, BarChart3, QrCode, Sparkles } from 'lucide-react';

const plans = [
  {
    name: 'Basique',
    price: 200,
    description: 'Pour les petites salles',
    features: ['Gestion membres', 'Plans personnalisés', 'Paiements cash + reçus PDF', 'Alertes expiration', 'Dashboard basique'],
  },
  {
    name: 'Pro',
    price: 500,
    description: 'Pour les salles modernes',
    features: [
      'Tout du plan Basique',
      'QR Code + scanner check-in',
      'Notifications email + in-app',
      'Paiement en ligne (Stripe)',
      'Gestion coachs + cours collectifs',
      'Réservation membres',
      'Programmes d\'entraînement digitaux',
      'Statistiques avancées',
    ],
    highlight: true,
  },
  {
    name: 'Premium',
    price: 1500,
    yearly: 15000,
    description: 'Pour les salles haut de gamme',
    features: [
      'Tout du plan Pro',
      'White-label (logo + couleurs + domaine)',
      'Suivi nutrition + composition corporelle',
      'Multi-salles (chaîne)',
      'Chat in-app coach/member',
      'Analytics avancée (churn, LTV)',
      'API publique',
      'Support prioritaire 24/7',
    ],
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <header className="container flex items-center justify-between py-6">
        <div className="flex items-center gap-2">
          <Dumbbell className="h-8 w-8 text-primary" />
          <span className="font-display text-xl font-bold">GymFlow</span>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" asChild>
            <Link to="/login">Se connecter</Link>
          </Button>
          <Button asChild>
            <Link to="/register">Créer ma salle</Link>
          </Button>
        </div>
      </header>

      <section className="container py-16 text-center">
        <div className="mx-auto max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            <Sparkles className="h-4 w-4" />
            La plateforme tout-en-un pour les salles de sport au Maroc
          </div>
          <h1 className="mt-6 font-display text-4xl font-bold tracking-tight sm:text-6xl">
            Gérez votre salle de sport <span className="text-primary">simplement</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground">
            Membres, abonnements, paiements, coachs, cours, check-ins QR code. Tout au même
            endroit, accessible partout, à un prix marocain.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button size="lg" asChild>
              <Link to="/register">Démarrer gratuitement (14 jours)</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/login">J'ai déjà un compte</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="container grid gap-6 py-12 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: Dumbbell, title: 'Gestion membres', desc: 'CRUD complet, recherche, filtres, photos' },
          { icon: QrCode, title: 'Check-in QR', desc: 'Scanner QR ou recherche manuelle' },
          { icon: BarChart3, title: 'Statistiques', desc: 'Revenue, fréquentation, top plans' },
          { icon: Smartphone, title: 'Mobile-first', desc: 'Responsive, marche sur tous les écrans' },
        ].map((f) => (
          <Card key={f.title}>
            <CardContent className="pt-6">
              <f.icon className="h-8 w-8 text-primary" />
              <h3 className="mt-3 font-display text-lg font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="container py-16" id="pricing">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">Tarifs simples et transparents</h2>
          <p className="mt-3 text-muted-foreground">Choisissez le plan qui correspond à votre salle</p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {plans.map((p) => (
            <Card key={p.name} className={p.highlight ? 'border-primary shadow-lg' : ''}>
              <CardHeader>
                {p.highlight && (
                  <div className="mb-2 inline-flex w-fit rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                    Plus populaire
                  </div>
                )}
                <CardTitle>{p.name}</CardTitle>
                <CardDescription>{p.description}</CardDescription>
                <div className="mt-4">
                  <span className="font-display text-4xl font-bold">{p.price}</span>
                  <span className="text-muted-foreground"> DH/mois</span>
                  {p.yearly && (
                    <p className="mt-1 text-sm text-muted-foreground">ou {p.yearly} DH/an</p>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {p.features.map((f) => (
                    <li key={f} className="flex gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button className="mt-6 w-full" variant={p.highlight ? 'default' : 'outline'} asChild>
                  <Link to="/register">Choisir {p.name}</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <footer className="border-t py-8">
        <div className="container text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} GymFlow. Fait avec ❤️ au Maroc.
        </div>
      </footer>
    </div>
  );
}
