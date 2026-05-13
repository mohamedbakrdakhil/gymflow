import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, Edit, QrCode as QrIcon, Plus, Receipt, CalendarRange } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { MemberForm } from '@/components/members/MemberForm';
import { SubscriptionForm } from '@/components/subscriptions/SubscriptionForm';
import { initials, formatDate, formatMAD } from '@/lib/utils';

export default function MemberDetail() {
  const { id } = useParams();
  const qc = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [subOpen, setSubOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);

  const { data: member, isLoading } = useQuery({
    queryKey: ['member', id],
    queryFn: () => api.get(`/members/${id}`).then((r) => r.data.data),
  });

  const updateMutation = useMutation({
    mutationFn: (payload) => api.put(`/members/${id}`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['member', id] });
      qc.invalidateQueries({ queryKey: ['members'] });
      setEditOpen(false);
      toast.success('Membre modifié');
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Erreur'),
  });

  if (isLoading) {
    return <Skeleton className="h-96 rounded-xl" />;
  }
  if (!member) return <p>Membre introuvable</p>;

  return (
    <div className="space-y-6">
      <Button variant="ghost" asChild>
        <Link to="/owner/members">
          <ArrowLeft className="mr-2 h-4 w-4" /> Retour
        </Link>
      </Button>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={member.photo_url} />
                <AvatarFallback className="text-xl">
                  {initials(member.first_name, member.last_name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="font-display text-2xl font-bold">
                  {member.first_name} {member.last_name}
                </h2>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{member.member_code}</Badge>
                  <Badge variant={member.status === 'active' ? 'success' : 'outline'}>
                    {member.status}
                  </Badge>
                  {member.gender && (
                    <Badge variant="outline" className="capitalize">
                      {member.gender === 'male' ? 'Homme' : 'Femme'}
                    </Badge>
                  )}
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                  {member.phone || '—'} {member.email && ` • ${member.email}`}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Inscrit le {formatDate(member.joined_at)}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => setQrOpen(true)}>
                <QrIcon className="mr-2 h-4 w-4" /> QR code
              </Button>
              <Button variant="outline" onClick={() => setEditOpen(true)}>
                <Edit className="mr-2 h-4 w-4" /> Modifier
              </Button>
              <Button onClick={() => setSubOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Nouvel abonnement
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="subs">
        <TabsList>
          <TabsTrigger value="subs">Abonnements</TabsTrigger>
          <TabsTrigger value="info">Informations</TabsTrigger>
        </TabsList>

        <TabsContent value="subs" className="space-y-3 pt-4">
          {(member.subscriptions || []).length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-sm text-muted-foreground">
                Aucun abonnement
              </CardContent>
            </Card>
          ) : (
            (member.subscriptions || []).map((s) => (
              <Card key={s.id}>
                <CardContent className="pt-6 flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <CalendarRange className="h-4 w-4 text-primary" />
                      <span className="font-medium">{s.plan?.name}</span>
                      <Badge variant={s.status === 'active' ? 'success' : 'outline'}>{s.status}</Badge>
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      Du {formatDate(s.start_date)} au {formatDate(s.end_date)}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
                      <Receipt className="h-3 w-3" /> {formatMAD(s.price_paid)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="info" className="space-y-2 pt-4">
          <Card>
            <CardContent className="pt-6 space-y-2 text-sm">
              <Row label="Adresse">{member.address || '—'}</Row>
              <Row label="Date de naissance">{member.birth_date ? formatDate(member.birth_date) : '—'}</Row>
              <Row label="Contact urgence">
                {member.emergency_contact_name || '—'}
                {member.emergency_contact_phone && ` (${member.emergency_contact_phone})`}
              </Row>
              <Row label="Notes médicales">{member.medical_notes || '—'}</Row>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Modifier le membre</DialogTitle>
          </DialogHeader>
          <MemberForm
            initial={member}
            onSubmit={(d) => updateMutation.mutate(d)}
            submitting={updateMutation.isPending}
            onCancel={() => setEditOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={subOpen} onOpenChange={setSubOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvel abonnement pour {member.first_name}</DialogTitle>
          </DialogHeader>
          <SubscriptionForm
            memberId={member.id}
            onSuccess={() => {
              qc.invalidateQueries({ queryKey: ['member', id] });
              setSubOpen(false);
            }}
            onCancel={() => setSubOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>QR Code — {member.first_name} {member.last_name}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="rounded-xl border bg-white p-6">
              <QRCodeSVG value={member.qr_code} size={240} level="H" />
            </div>
            <div className="text-center text-sm text-muted-foreground">
              {member.member_code}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Row({ label, children }) {
  return (
    <div className="flex flex-col gap-1 border-b py-2 last:border-0 sm:flex-row sm:items-start">
      <div className="w-40 shrink-0 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}
