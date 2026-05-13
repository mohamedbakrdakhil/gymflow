/**
 * Page Check-ins : scan manuel par recherche + historique du jour
 * (Le scan caméra peut être ajouté avec html5-qrcode plus tard)
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { QrCode, Search, CheckCircle2, Users } from 'lucide-react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { initials, formatDateTime } from '@/lib/utils';

export default function CheckInsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [qrInput, setQrInput] = useState('');

  const { data: today } = useQuery({
    queryKey: ['checkins-today'],
    queryFn: () => api.get('/checkins/today').then((r) => r.data.data),
    refetchInterval: 10000,
  });

  const { data: searchResults } = useQuery({
    queryKey: ['members-search', search],
    queryFn: () => api.get('/members', { params: { search, limit: 10 } }).then((r) => r.data.data.items),
    enabled: search.length >= 2,
  });

  const scanMutation = useMutation({
    mutationFn: (qr_code) => api.post('/checkins/scan', { qr_code }).then((r) => r.data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['checkins-today'] });
      const d = res.data;
      if (d.duplicate) {
        toast.warning('Check-in déjà enregistré récemment');
      } else {
        toast.success(res.message || 'Check-in OK');
      }
      setQrInput('');
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Échec'),
  });

  const manualMutation = useMutation({
    mutationFn: (member_id) => api.post('/checkins/manual', { member_id }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['checkins-today'] });
      toast.success('Check-in enregistré');
      setSearch('');
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Échec'),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Check-ins"
        description={today ? `${today.unique_members} membres uniques aujourd'hui • ${today.count} entrées` : ''}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <QrCode className="h-4 w-4" /> Scanner QR (manuel)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-3 text-xs text-muted-foreground">
              Collez le code QR scanné ici (compatible avec un scanner USB)
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="Code QR..."
                value={qrInput}
                onChange={(e) => setQrInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && qrInput.trim()) {
                    scanMutation.mutate(qrInput.trim());
                  }
                }}
                autoFocus
              />
              <Button onClick={() => qrInput.trim() && scanMutation.mutate(qrInput.trim())}>
                <CheckCircle2 className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Search className="h-4 w-4" /> Recherche membre
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="Nom, téléphone, code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {searchResults && searchResults.length > 0 && (
              <div className="mt-3 max-h-60 space-y-1 overflow-y-auto">
                {searchResults.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => manualMutation.mutate(m.id)}
                    className="flex w-full items-center gap-3 rounded-md border p-2 text-left hover:bg-accent transition-colors"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={m.photo_url} />
                      <AvatarFallback>{initials(m.first_name, m.last_name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{m.first_name} {m.last_name}</div>
                      <div className="text-xs text-muted-foreground">{m.member_code}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Aujourd'hui</CardTitle>
        </CardHeader>
        <CardContent>
          {(today?.items || []).length === 0 ? (
            <EmptyState
              icon={Users}
              title="Pas encore de check-ins"
              description="Les premiers check-ins de la journée apparaîtront ici"
            />
          ) : (
            <div className="space-y-2">
              {today.items.map((c) => (
                <div key={c.id} className="flex items-center gap-3 rounded-md border p-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={c.member?.photo_url} />
                    <AvatarFallback>{initials(c.member?.first_name, c.member?.last_name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="text-sm font-medium">
                      {c.member?.first_name} {c.member?.last_name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDateTime(c.check_in_time)}
                    </div>
                  </div>
                  <Badge variant="outline">{c.method === 'qr_code' ? 'QR' : c.method === 'manual' ? 'Manuel' : c.method}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
