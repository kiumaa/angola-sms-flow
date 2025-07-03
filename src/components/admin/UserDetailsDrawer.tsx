import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { User, CreditCard, MessageSquare, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface UserDetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | null;
}

interface UserDetails {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  company_name: string;
  phone: string;
  credits: number;
  created_at: string;
  role: string;
}

interface CreditHistory {
  id: string;
  adjustment_type: string;
  delta: number;
  previous_balance: number;
  new_balance: number;
  reason: string;
  created_at: string;
  admin_name: string;
}

interface SenderID {
  id: string;
  sender_id: string;
  status: string;
  is_default: boolean;
  created_at: string;
}

interface CreditRequest {
  id: string;
  amount_kwanza: number;
  credits_requested: number;
  status: string;
  payment_reference: string;
  requested_at: string;
}

export function UserDetailsDrawer({ isOpen, onClose, userId }: UserDetailsDrawerProps) {
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [creditHistory, setCreditHistory] = useState<CreditHistory[]>([]);
  const [senderIds, setSenderIds] = useState<SenderID[]>([]);
  const [creditRequests, setCreditRequests] = useState<CreditRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && userId) {
      fetchUserDetails();
    }
  }, [isOpen, userId]);

  const fetchUserDetails = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      // Fetch user details with role
      const { data: profile } = await supabase
        .from('profiles')
        .select(`
          *,
          user_roles(role)
        `)
        .eq('user_id', userId)
        .single();

      if (profile) {
        setUserDetails({
          ...profile,
          role: Array.isArray(profile.user_roles) && profile.user_roles.length > 0 
            ? profile.user_roles[0].role 
            : 'client'
        });
      }

      // Fetch credit history
      const { data: credits } = await supabase
        .from('credit_adjustments')
        .select(`
          *,
          admin:profiles!credit_adjustments_admin_id_fkey(full_name)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      setCreditHistory(credits?.map(c => ({
        ...c,
        admin_name: c.admin?.full_name || 'Sistema'
      })) || []);

      // Fetch sender IDs
      const { data: senders } = await supabase
        .from('sender_ids')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      setSenderIds(senders || []);

      // Fetch credit requests
      const { data: requests } = await supabase
        .from('credit_requests')
        .select('*')
        .eq('user_id', userId)
        .order('requested_at', { ascending: false })
        .limit(10);

      setCreditRequests(requests || []);

    } catch (error) {
      console.error('Error fetching user details:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      'pending': { variant: 'outline' as const, icon: AlertCircle, color: 'text-yellow-600' },
      'approved': { variant: 'default' as const, icon: CheckCircle, color: 'text-green-600' },
      'rejected': { variant: 'destructive' as const, icon: XCircle, color: 'text-red-600' }
    };

    const config = variants[status as keyof typeof variants] || variants.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className={`h-3 w-3 ${config.color}`} />
        {status}
      </Badge>
    );
  };

  if (!userDetails && !loading) {
    return null;
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[600px] sm:max-w-[600px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Detalhes do Usuário
          </SheetTitle>
        </SheetHeader>

        {loading ? (
          <div className="space-y-4 mt-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-20 bg-muted rounded animate-pulse"></div>
            ))}
          </div>
        ) : userDetails ? (
          <div className="mt-6 space-y-6">
            {/* User Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informações Gerais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Nome:</span>
                  <span className="font-medium">{userDetails.full_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">E-mail:</span>
                  <span className="font-medium">{userDetails.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Empresa:</span>
                  <span className="font-medium">{userDetails.company_name || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Telefone:</span>
                  <span className="font-medium">{userDetails.phone || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Papel:</span>
                  <Badge variant={userDetails.role === 'admin' ? 'default' : 'secondary'}>
                    {userDetails.role === 'admin' ? 'Administrador' : 'Cliente'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Créditos:</span>
                  <Badge variant="outline" className="font-semibold">
                    {userDetails.credits} créditos
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Criado em:</span>
                  <span className="font-medium">
                    {new Date(userDetails.created_at).toLocaleDateString('pt-AO')}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Tabs for detailed info */}
            <Tabs defaultValue="credits" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="credits" className="flex items-center gap-1">
                  <CreditCard className="h-4 w-4" />
                  Créditos
                </TabsTrigger>
                <TabsTrigger value="senders" className="flex items-center gap-1">
                  <MessageSquare className="h-4 w-4" />
                  Sender IDs
                </TabsTrigger>
                <TabsTrigger value="requests" className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Solicitações
                </TabsTrigger>
              </TabsList>

              <TabsContent value="credits" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Histórico de Créditos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {creditHistory.length > 0 ? (
                      <div className="space-y-3">
                        {creditHistory.map((credit) => (
                          <div key={credit.id} className="border rounded-lg p-3">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <Badge variant={credit.adjustment_type === 'add' ? 'default' : 'destructive'}>
                                  {credit.adjustment_type === 'add' ? '+' : '-'}{credit.delta} créditos
                                </Badge>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {credit.previous_balance} → {credit.new_balance}
                                </p>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {new Date(credit.created_at).toLocaleDateString('pt-AO')}
                              </span>
                            </div>
                            <p className="text-sm">{credit.reason}</p>
                            <p className="text-xs text-muted-foreground">Por: {credit.admin_name}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Nenhum histórico de créditos
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="senders" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Sender IDs</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {senderIds.length > 0 ? (
                      <div className="space-y-3">
                        {senderIds.map((sender) => (
                          <div key={sender.id} className="border rounded-lg p-3">
                            <div className="flex justify-between items-center">
                              <div>
                                <span className="font-medium">{sender.sender_id}</span>
                                {sender.is_default && (
                                  <Badge variant="outline" className="ml-2">Padrão</Badge>
                                )}
                              </div>
                              {getStatusBadge(sender.status)}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              Criado em: {new Date(sender.created_at).toLocaleDateString('pt-AO')}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Nenhum Sender ID cadastrado
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="requests" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Solicitações de Crédito</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {creditRequests.length > 0 ? (
                      <div className="space-y-3">
                        {creditRequests.map((request) => (
                          <div key={request.id} className="border rounded-lg p-3">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <span className="font-medium">
                                  {request.credits_requested} créditos
                                </span>
                                <p className="text-sm text-muted-foreground">
                                  {request.amount_kwanza.toLocaleString()} Kz
                                </p>
                              </div>
                              {getStatusBadge(request.status)}
                            </div>
                            <p className="text-sm">Ref: {request.payment_reference}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(request.requested_at).toLocaleDateString('pt-AO')}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Nenhuma solicitação de crédito
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}