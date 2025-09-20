import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Package, Plus, Edit, Trash2, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface CreditPackage {
  id: string;
  name: string;
  description: string | null;
  credits: number;
  price_kwanza: number;
  is_active: boolean;
  created_at: string;
}

const AdminPackages = () => {
  const { isAdmin, loading: authLoading } = useAuth();
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<CreditPackage | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    credits: "",
    price_kwanza: "",
    is_active: true
  });

  const [editFormData, setEditFormData] = useState({
    name: "",
    description: "",
    credits: "",
    price_kwanza: "",
    is_active: true
  });

  useEffect(() => {
    if (!authLoading && isAdmin) {
      fetchPackages();
    }
  }, [isAdmin, authLoading]);

  const fetchPackages = async () => {
    try {
      const { data, error } = await supabase
        .from('credit_packages')
        .select('*')
        .order('credits', { ascending: true });

      if (error) throw error;
      setPackages(data || []);
    } catch (error) {
      console.error('Erro ao buscar pacotes:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar pacotes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { error } = await supabase
        .from('credit_packages')
        .insert({
          name: formData.name,
          description: formData.description || null,
          credits: parseInt(formData.credits),
          price_kwanza: parseFloat(formData.price_kwanza),
          is_active: formData.is_active
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Pacote criado com sucesso",
      });

      setIsDialogOpen(false);
      setFormData({
        name: "",
        description: "",
        credits: "",
        price_kwanza: "",
        is_active: true
      });
      fetchPackages();
    } catch (error) {
      console.error('Erro ao criar pacote:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar pacote",
        variant: "destructive",
      });
    }
  };

  const togglePackageStatus = async (packageId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('credit_packages')
        .update({ is_active: !currentStatus })
        .eq('id', packageId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `Pacote ${!currentStatus ? 'ativado' : 'desativado'}`,
      });

      fetchPackages();
    } catch (error) {
      console.error('Erro ao atualizar pacote:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar pacote",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (pkg: CreditPackage) => {
    setSelectedPackage(pkg);
    setEditFormData({
      name: pkg.name,
      description: pkg.description || "",
      credits: pkg.credits.toString(),
      price_kwanza: pkg.price_kwanza.toString(),
      is_active: pkg.is_active
    });
    setIsEditDialogOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPackage) return;
    
    try {
      const { error } = await supabase
        .from('credit_packages')
        .update({
          name: editFormData.name,
          description: editFormData.description || null,
          credits: parseInt(editFormData.credits),
          price_kwanza: parseFloat(editFormData.price_kwanza),
          is_active: editFormData.is_active
        })
        .eq('id', selectedPackage.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Pacote atualizado com sucesso",
      });

      setIsEditDialogOpen(false);
      setSelectedPackage(null);
      fetchPackages();
    } catch (error) {
      console.error('Erro ao editar pacote:', error);
      toast({
        title: "Erro",
        description: "Erro ao editar pacote",
        variant: "destructive",
      });
    }
  };

  const openDeleteDialog = (pkg: CreditPackage) => {
    setSelectedPackage(pkg);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedPackage) return;
    
    try {
      const { error } = await supabase
        .from('credit_packages')
        .delete()
        .eq('id', selectedPackage.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Pacote excluído com sucesso",
      });

      setIsDeleteDialogOpen(false);
      setSelectedPackage(null);
      fetchPackages();
    } catch (error) {
      console.error('Erro ao excluir pacote:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir pacote",
        variant: "destructive",
      });
    }
  };

  if (authLoading) {
    return <div className="flex items-center justify-center min-h-screen">Carregando...</div>;
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  // Preço fixo por crédito (definido globalmente)
  const PRICE_PER_CREDIT = 50; // AOA por crédito
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA'
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Pacotes</h1>
          <p className="text-muted-foreground">Gerir pacotes de créditos SMS</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="btn-gradient">
              <Plus className="h-4 w-4 mr-2" />
              Novo Pacote
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Novo Pacote</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Pacote</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Ex: Pacote Básico"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Descrição do pacote..."
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="credits">Créditos</Label>
                  <Input
                    id="credits"
                    type="number"
                    value={formData.credits}
                    onChange={(e) => setFormData({...formData, credits: e.target.value})}
                    placeholder="1000"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="price">Preço (AOA)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price_kwanza}
                    onChange={(e) => setFormData({...formData, price_kwanza: e.target.value})}
                    placeholder="50000.00"
                    required
                  />
                </div>
              </div>
              
              <Button type="submit" className="w-full btn-gradient">
                Criar Pacote
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="card-elegant">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Package className="h-5 w-5 mr-2" />
            Pacotes de Créditos ({packages.length})
          </CardTitle>
          <div className="text-sm text-muted-foreground mt-2">
            <DollarSign className="h-4 w-4 inline mr-1" />
            Preço geral: {formatCurrency(PRICE_PER_CREDIT)} por crédito
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-12 bg-muted rounded animate-pulse"></div>
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pacote</TableHead>
                  <TableHead>Créditos</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead>Preço por Crédito</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {packages.map((pkg) => (
                  <TableRow key={pkg.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{pkg.name}</div>
                        {pkg.description && (
                          <div className="text-sm text-muted-foreground">{pkg.description}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {pkg.credits.toLocaleString()} créditos
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(pkg.price_kwanza)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatCurrency(PRICE_PER_CREDIT)} / crédito
                    </TableCell>
                    <TableCell>
                      <Badge variant={pkg.is_active ? "default" : "secondary"}>
                        {pkg.is_active ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => togglePackageStatus(pkg.id, pkg.is_active)}
                        >
                          {pkg.is_active ? "Desativar" : "Ativar"}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => openEditDialog(pkg)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => openDeleteDialog(pkg)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {packages.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Nenhum pacote encontrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Pacote</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nome do Pacote</Label>
              <Input
                id="edit-name"
                value={editFormData.name}
                onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                placeholder="Ex: Pacote Básico"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-description">Descrição</Label>
              <Input
                id="edit-description"
                value={editFormData.description}
                onChange={(e) => setEditFormData({...editFormData, description: e.target.value})}
                placeholder="Descrição do pacote..."
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-credits">Créditos</Label>
                <Input
                  id="edit-credits"
                  type="number"
                  value={editFormData.credits}
                  onChange={(e) => setEditFormData({...editFormData, credits: e.target.value})}
                  placeholder="1000"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-price">Preço (AOA)</Label>
                <Input
                  id="edit-price"
                  type="number"
                  step="0.01"
                  value={editFormData.price_kwanza}
                  onChange={(e) => setEditFormData({...editFormData, price_kwanza: e.target.value})}
                  placeholder="50000.00"
                  required
                />
              </div>
            </div>
            
            <Button type="submit" className="w-full btn-gradient">
              Atualizar Pacote
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o pacote "{selectedPackage?.name}"? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminPackages;