import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Download, Receipt } from 'lucide-react';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate, formatDateTime, formatMAD } from '@/lib/utils';
import { Input } from '@/components/ui/input';

const methodLabels = {
  cash: 'Espèces',
  card: 'Carte',
  bank_transfer: 'Virement',
  online_stripe: 'Stripe',
  online_cmi: 'CMI',
};

export default function PaymentsList() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['payments', { from, to }],
    queryFn: () => api.get('/payments', { params: { from, to, limit: 50 } }).then((r) => r.data.data),
  });

  const items = data?.items || [];
  const total = items.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

  async function downloadReceipt(id) {
    const res = await api.get(`/payments/${id}/receipt`);
    const url = res.data.data.receipt_url;
    if (url) {
      const fullUrl = url.startsWith('http')
        ? url
        : (import.meta.env.VITE_UPLOAD_URL || 'http://localhost:5000') + url;
      window.open(fullUrl, '_blank');
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Paiements"
        description={items.length ? `${items.length} paiement(s) — Total ${formatMAD(total)}` : ''}
      />

      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-32">
          <label className="text-xs text-muted-foreground">Du</label>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="flex-1 min-w-32">
          <label className="text-xs text-muted-foreground">Au</label>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="Aucun paiement"
          description="Les paiements apparaîtront ici après l'enregistrement d'abonnements"
        />
      ) : (
        <Card>
          <CardContent className="p-0 divide-y">
            {items.map((p) => (
              <div key={p.id} className="flex flex-wrap items-center gap-4 p-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      to={`/owner/members/${p.member?.id}`}
                      className="font-medium hover:underline"
                    >
                      {p.member?.first_name} {p.member?.last_name}
                    </Link>
                    <Badge variant="outline" className="text-[10px]">{p.reference}</Badge>
                    {p.status === 'refunded' && <Badge variant="danger">Remboursé</Badge>}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {formatDateTime(p.paid_at)} • {methodLabels[p.payment_method]}
                    {p.subscription?.plan && ` • ${p.subscription.plan.name}`}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-display text-lg font-bold">{formatMAD(p.amount)}</div>
                </div>
                <Button variant="outline" size="sm" onClick={() => downloadReceipt(p.id)}>
                  <Download className="mr-1 h-3 w-3" /> Reçu PDF
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
