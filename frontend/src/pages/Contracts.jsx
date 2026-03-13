import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { contractsAPI, childrenAPI } from '../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input, Label } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { ArrowLeft, FileText, Plus, Edit2, Calendar, Euro } from 'lucide-react';
import { formatDate } from '../lib/utils';

const Contracts = () => {
  const { childId } = useParams();
  const [contracts, setContracts] = useState([]);
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(childId || null);
  const [showModal, setShowModal] = useState(false);
  const [editingContract, setEditingContract] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [formData, setFormData] = useState({
    billing_mode: 'par_seance',
    session_price: '',
    hourly_rate: '',
    sessions_per_week: '',
    sessions_per_month: '',
    session_duration_minutes: '',
    start_date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, [selectedChild]);

  const loadData = async () => {
    try {
      const [contractsRes, childrenRes] = await Promise.all([
        contractsAPI.list({ child_id: selectedChild }),
        childrenAPI.list()
      ]);
      setContracts(contractsRes.data);
      setChildren(childrenRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingContract) {
        await contractsAPI.update(editingContract.id, formData);
      } else {
        const child = children.find(c => c.id === selectedChild);
        // Get parent ID from child data (you might need to add this to the child detail)
        await contractsAPI.create({
          child_id: selectedChild,
          parent_id: 'parent-id', // This should come from child data
          ...formData
        });
      }
      setShowModal(false);
      setEditingContract(null);
      resetForm();
      await loadData();
    } catch (error) {
      console.error('Error saving contract:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      billing_mode: 'par_seance',
      session_price: '',
      hourly_rate: '',
      sessions_per_week: '',
      sessions_per_month: '',
      session_duration_minutes: '',
      start_date: new Date().toISOString().split('T')[0],
      notes: ''
    });
  };

  const handleEdit = (contract) => {
    setEditingContract(contract);
    setFormData({
      billing_mode: contract.billing_mode,
      session_price: contract.session_price || '',
      hourly_rate: contract.hourly_rate || '',
      sessions_per_week: contract.sessions_per_week || '',
      sessions_per_month: contract.sessions_per_month || '',
      session_duration_minutes: contract.session_duration_minutes || '',
      start_date: contract.start_date,
      notes: contract.notes || ''
    });
    setShowModal(true);
  };

  const calculateEstimate = (contract) => {
    if (contract.billing_mode === 'par_seance' && contract.session_price) {
      const sessionsPerMonth = 12; // Estimation
      return contract.session_price * sessionsPerMonth;
    } else if (contract.billing_mode === 'tarif_horaire' && contract.hourly_rate && contract.sessions_per_month && contract.session_duration_minutes) {
      const hours = contract.session_duration_minutes / 60;
      return contract.hourly_rate * hours * contract.sessions_per_month;
    }
    return 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const activeContract = contracts.find(c => c.active);
  const child = children.find(c => c.id === selectedChild);

  return (
    <div className="space-y-6 animate-in" data-testid="contracts-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800 font-outfit mb-2">
            Contrats
          </h1>
          <p className="text-foreground-muted">Gestion des contrats et modes de facturation</p>
        </div>
        <Button onClick={() => {
          resetForm();
          setEditingContract(null);
          setShowModal(true);
        }}>
          <Plus className="w-4 h-4 mr-2" />
          Nouveau contrat
        </Button>
      </div>

      {/* Child selector if not already selected */}
      {!selectedChild && (
        <Card>
          <CardHeader>
            <CardTitle>Sélectionner un enfant</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {children.map(child => (
                <Button
                  key={child.id}
                  variant="outline"
                  className="justify-start h-auto py-3"
                  onClick={() => setSelectedChild(child.id)}
                >
                  {child.first_name} {child.last_name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Contract */}
      {selectedChild && child && (
        <>
          <Card className="bg-gradient-to-br from-primary-light to-white border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary rounded-lg">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800">
                      Contrat avec {child.first_name} {child.last_name}
                    </h3>
                    {activeContract && (
                      <Badge variant="success" className="mt-1">Actif</Badge>
                    )}
                  </div>
                </div>
                {activeContract && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleEdit(activeContract)}
                  >
                    <Edit2 className="w-4 h-4 mr-2" />
                    Modifier
                  </Button>
                )}
              </div>

              {activeContract ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <p className="text-sm font-medium text-slate-600 mb-1">Date de début</p>
                    <p className="text-sm text-slate-700">{formatDate(activeContract.start_date)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-600 mb-1">Mode de facturation</p>
                    <Badge variant="info">
                      {activeContract.billing_mode === 'par_seance' ? 'À la séance' : 'Tarif horaire'}
                    </Badge>
                  </div>
                  
                  {activeContract.billing_mode === 'par_seance' ? (
                    <div>
                      <p className="text-sm font-medium text-slate-600 mb-1">Prix par séance</p>
                      <p className="text-lg font-semibold text-slate-800">{activeContract.session_price}€</p>
                    </div>
                  ) : (
                    <>
                      <div>
                        <p className="text-sm font-medium text-slate-600 mb-1">Tarif horaire</p>
                        <p className="text-lg font-semibold text-slate-800">{activeContract.hourly_rate}€/h</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-600 mb-1">Séances par mois</p>
                        <p className="text-sm text-slate-700">{activeContract.sessions_per_month}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-600 mb-1">Durée par séance</p>
                        <p className="text-sm text-slate-700">{activeContract.session_duration_minutes} min</p>
                      </div>
                    </>
                  )}

                  <div className="md:col-span-2 p-4 bg-white/50 rounded-lg border border-primary/20">
                    <p className="text-sm font-medium text-slate-600 mb-1">Estimation mensuelle</p>
                    <p className="text-2xl font-bold text-primary">
                      ~{calculateEstimate(activeContract).toFixed(2)}€/mois
                    </p>
                  </div>

                  {activeContract.notes && (
                    <div className="md:col-span-2">
                      <p className="text-sm font-medium text-slate-600 mb-1">Notes</p>
                      <p className="text-sm text-slate-700">{activeContract.notes}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p className="text-foreground-muted mb-4">Aucun contrat actif</p>
                  <Button onClick={() => setShowModal(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Créer un contrat
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>Comment utiliser les contrats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-foreground-muted">
              <p>
                <strong>Facturation à la séance :</strong> Définissez un prix fixe par séance. 
                Le montant de la facture sera calculé automatiquement en fonction du nombre de séances du mois.
              </p>
              <p>
                <strong>Facturation au tarif horaire :</strong> Définissez un tarif horaire, le nombre de séances par mois et la durée de chaque séance. 
                Le montant sera calculé selon : nombre de séances × durée × tarif horaire.
              </p>
            </CardContent>
          </Card>
        </>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <Card className="max-w-2xl w-full my-8">
            <CardHeader>
              <CardTitle>
                {editingContract ? 'Modifier le contrat' : 'Nouveau contrat'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Billing Mode */}
                <div>
                  <Label>Mode de facturation</Label>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <Button
                      type="button"
                      variant={formData.billing_mode === 'par_seance' ? 'primary' : 'outline'}
                      onClick={() => setFormData({...formData, billing_mode: 'par_seance'})}
                    >
                      À la séance
                    </Button>
                    <Button
                      type="button"
                      variant={formData.billing_mode === 'tarif_horaire' ? 'primary' : 'outline'}
                      onClick={() => setFormData({...formData, billing_mode: 'tarif_horaire'})}
                    >
                      Tarif horaire
                    </Button>
                  </div>
                </div>

                {/* Per Session */}
                {formData.billing_mode === 'par_seance' && (
                  <div>
                    <Label htmlFor="session_price">Prix par séance (€)</Label>
                    <Input
                      id="session_price"
                      type="number"
                      step="0.01"
                      value={formData.session_price}
                      onChange={(e) => setFormData({...formData, session_price: e.target.value})}
                      required
                    />
                  </div>
                )}

                {/* Hourly Rate */}
                {formData.billing_mode === 'tarif_horaire' && (
                  <>
                    <div>
                      <Label htmlFor="hourly_rate">Tarif horaire (€/h)</Label>
                      <Input
                        id="hourly_rate"
                        type="number"
                        step="0.01"
                        value={formData.hourly_rate}
                        onChange={(e) => setFormData({...formData, hourly_rate: e.target.value})}
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="sessions_per_month">Séances par mois</Label>
                        <Input
                          id="sessions_per_month"
                          type="number"
                          value={formData.sessions_per_month}
                          onChange={(e) => setFormData({...formData, sessions_per_month: e.target.value})}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="session_duration">Durée (minutes)</Label>
                        <Input
                          id="session_duration"
                          type="number"
                          value={formData.session_duration_minutes}
                          onChange={(e) => setFormData({...formData, session_duration_minutes: e.target.value})}
                          required
                        />
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <Label htmlFor="start_date">Date de début</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Notes (optionnel)</Label>
                  <textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    className="w-full bg-input border-transparent focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl px-4 py-3 text-slate-700 outline-none min-h-[80px]"
                    placeholder="Notes sur le contrat..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setShowModal(false);
                      setEditingContract(null);
                      resetForm();
                    }}
                  >
                    Annuler
                  </Button>
                  <Button type="submit" className="flex-1">
                    {editingContract ? 'Enregistrer' : 'Créer'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Contracts;
