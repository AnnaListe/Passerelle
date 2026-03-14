import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { contractsAPI, childrenAPI } from '../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input, Label } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { ArrowLeft, FileText, Plus, Edit2, Calendar, ToggleLeft, ToggleRight } from 'lucide-react';
import { formatDate } from '../lib/utils';

const Contracts = () => {
  const { childId } = useParams();
  const [contracts, setContracts] = useState([]);
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(childId || null);
  const [showModal, setShowModal] = useState(false);
  const [editingContract, setEditingContract] = useState(null);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    billing_mode: 'par_seance',
    session_price: '',
    hourly_rate: '',
    sessions_per_week: '',
    sessions_per_month: '',
    session_duration_minutes: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    label: '',
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
      setContracts(contractsRes.data || []);
      setChildren(childrenRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        billing_mode: formData.billing_mode,
        start_date: formData.start_date,
        end_date: formData.end_date || null,
        label: formData.label || null,
        notes: formData.notes || null,
        sessions_per_month: formData.sessions_per_month ? parseInt(formData.sessions_per_month) : null,
        sessions_per_week: formData.sessions_per_week ? parseInt(formData.sessions_per_week) : null,
        session_duration_minutes: formData.session_duration_minutes ? parseInt(formData.session_duration_minutes) : null,
        active: true,
      };

      if (formData.billing_mode === 'par_seance') {
        payload.session_price = formData.session_price ? Math.round(parseFloat(formData.session_price) * 100) / 100 : null;
        payload.hourly_rate = null;
      } else {
        payload.hourly_rate = formData.hourly_rate ? Math.round(parseFloat(formData.hourly_rate) * 100) / 100 : null;
        payload.session_price = null;
      }

      if (editingContract) {
        await contractsAPI.update(editingContract.id, payload);
      } else {
        await contractsAPI.create({
          child_id: selectedChild,
          ...payload
        });
      }
      setShowModal(false);
      setEditingContract(null);
      resetForm();
      await loadData();
    } catch (error) {
      console.error('Error saving contract:', error);
      alert("Erreur lors de l'enregistrement. Veuillez réessayer.");
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
      end_date: '',
      label: '',
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
      end_date: contract.end_date || '',
      label: contract.label || '',
      notes: contract.notes || ''
    });
    setShowModal(true);
  };

  const handleToggleActive = async (contract) => {
    try {
      await contractsAPI.update(contract.id, { active: !contract.active });
      await loadData();
    } catch (error) {
      console.error('Error toggling contract:', error);
    }
  };

  const calculateEstimate = (contract) => {
    if (contract.billing_mode === 'par_seance' && contract.session_price && contract.sessions_per_month) {
      return Math.round(contract.session_price * contract.sessions_per_month * 100) / 100;
    } else if (contract.billing_mode === 'tarif_horaire' && contract.hourly_rate && contract.sessions_per_month && contract.session_duration_minutes) {
      const hours = contract.session_duration_minutes / 60;
      return Math.round(contract.hourly_rate * hours * contract.sessions_per_month * 100) / 100;
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

  const child = children.find(c => c.id === selectedChild);
  const activeContracts = contracts.filter(c => c.active);
  const inactiveContracts = contracts.filter(c => !c.active);

  return (
    <div className="space-y-6 animate-in" data-testid="contracts-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800 font-outfit mb-2">
            Contrats {child ? `— ${child.first_name} ${child.last_name}` : ''}
          </h1>
          <p className="text-foreground-muted">Gestion des contrats et modes de facturation</p>
        </div>
        {selectedChild && (
          <Button onClick={() => { resetForm(); setEditingContract(null); setShowModal(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Nouveau contrat
          </Button>
        )}
      </div>

      {/* Sélecteur enfant */}
      {!selectedChild && (
        <Card>
          <CardHeader><CardTitle>Sélectionner un enfant</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {children.map(child => (
                <Button key={child.id} variant="outline" className="justify-start h-auto py-3" onClick={() => setSelectedChild(child.id)}>
                  {child.first_name} {child.last_name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {selectedChild && (
        <>
          {/* Contrats actifs */}
          <div>
            <h2 className="text-lg font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Contrats actifs ({activeContracts.length})
            </h2>
            {activeContracts.length === 0 ? (
              <Card className="text-center py-8">
                <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p className="text-foreground-muted mb-4">Aucun contrat actif</p>
                <Button onClick={() => setShowModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />Créer un contrat
                </Button>
              </Card>
            ) : (
              <div className="space-y-4">
                {activeContracts.map(contract => (
                  <ContractCard
                    key={contract.id}
                    contract={contract}
                    onEdit={handleEdit}
                    onToggle={handleToggleActive}
                    calculateEstimate={calculateEstimate}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Contrats inactifs */}
          {inactiveContracts.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-slate-500 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-slate-300 rounded-full"></span>
                Contrats inactifs ({inactiveContracts.length})
              </h2>
              <div className="space-y-4 opacity-70">
                {inactiveContracts.map(contract => (
                  <ContractCard
                    key={contract.id}
                    contract={contract}
                    onEdit={handleEdit}
                    onToggle={handleToggleActive}
                    calculateEstimate={calculateEstimate}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <Card className="max-w-2xl w-full my-8">
            <CardHeader>
              <CardTitle>{editingContract ? 'Modifier le contrat' : 'Nouveau contrat'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">

                {/* Label */}
                <div>
                  <Label htmlFor="label">Libellé du contrat (optionnel)</Label>
                  <Input
                    id="label"
                    value={formData.label}
                    onChange={(e) => setFormData({...formData, label: e.target.value})}
                    placeholder="Ex: Séances à domicile, Cabinet, Orthophonie..."
                  />
                </div>

                {/* Billing Mode */}
                <div>
                  <Label>Mode de facturation</Label>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <Button type="button" variant={formData.billing_mode === 'par_seance' ? 'primary' : 'outline'} onClick={() => setFormData({...formData, billing_mode: 'par_seance'})}>
                      À la séance
                    </Button>
                    <Button type="button" variant={formData.billing_mode === 'tarif_horaire' ? 'primary' : 'outline'} onClick={() => setFormData({...formData, billing_mode: 'tarif_horaire'})}>
                      Tarif horaire
                    </Button>
                  </div>
                </div>

                {/* Par séance */}
                {formData.billing_mode === 'par_seance' && (
                  <>
                    <div>
                      <Label htmlFor="session_price">Prix par séance (€) *</Label>
                      <Input id="session_price" type="number" step="0.01" value={formData.session_price} onChange={(e) => setFormData({...formData, session_price: e.target.value})} required />
                    </div>
                    <div>
                      <Label htmlFor="sessions_per_month_session">Nombre de séances par mois *</Label>
                      <Input id="sessions_per_month_session" type="number" min="1" value={formData.sessions_per_month} onChange={(e) => setFormData({...formData, sessions_per_month: e.target.value})} placeholder="Ex: 4" required />
                    </div>
                  </>
                )}

                {/* Tarif horaire */}
                {formData.billing_mode === 'tarif_horaire' && (
                  <>
                    <div>
                      <Label htmlFor="hourly_rate">Tarif horaire (€/h)</Label>
                      <Input id="hourly_rate" type="number" step="0.01" value={formData.hourly_rate} onChange={(e) => setFormData({...formData, hourly_rate: e.target.value})} required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="sessions_per_month">Séances par mois</Label>
                        <Input id="sessions_per_month" type="number" value={formData.sessions_per_month} onChange={(e) => setFormData({...formData, sessions_per_month: e.target.value})} required />
                      </div>
                      <div>
                        <Label htmlFor="session_duration">Durée (minutes)</Label>
                        <Input id="session_duration" type="number" value={formData.session_duration_minutes} onChange={(e) => setFormData({...formData, session_duration_minutes: e.target.value})} required />
                      </div>
                    </div>
                  </>
                )}

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start_date">Date de début</Label>
                    <Input id="start_date" type="date" value={formData.start_date} onChange={(e) => setFormData({...formData, start_date: e.target.value})} required />
                  </div>
                  <div>
                    <Label htmlFor="end_date">Date de fin (optionnel)</Label>
                    <Input id="end_date" type="date" value={formData.end_date} onChange={(e) => setFormData({...formData, end_date: e.target.value})} />
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Notes (optionnel)</Label>
                  <textarea id="notes" value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} className="w-full bg-input border-transparent focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl px-4 py-3 text-slate-700 outline-none min-h-[80px]" placeholder="Notes sur le contrat..." />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => { setShowModal(false); setEditingContract(null); resetForm(); }}>
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

// Composant carte contrat
const ContractCard = ({ contract, onEdit, onToggle, calculateEstimate }) => {
  return (
    <Card className={`${contract.active ? 'border-primary/20' : 'border-slate-200'}`}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 ${contract.active ? 'bg-primary' : 'bg-slate-300'} rounded-lg`}>
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-slate-800">
                {contract.label || (contract.billing_mode === 'par_seance' ? 'Contrat à la séance' : 'Contrat tarif horaire')}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={contract.active ? 'success' : 'default'}>
                  {contract.active ? 'Actif' : 'Inactif'}
                </Badge>
                <Badge variant="info">
                  {contract.billing_mode === 'par_seance' ? 'À la séance' : 'Tarif horaire'}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => onEdit(contract)}>
              <Edit2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onToggle(contract)}
              title={contract.active ? 'Désactiver' : 'Réactiver'}
            >
              {contract.active
                ? <ToggleRight className="w-5 h-5 text-green-500" />
                : <ToggleLeft className="w-5 h-5 text-slate-400" />
              }
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-foreground-muted mb-1">Début</p>
            <p className="text-sm font-medium text-slate-700">{formatDate(contract.start_date)}</p>
          </div>
          {contract.end_date && (
            <div>
              <p className="text-xs text-foreground-muted mb-1">Fin</p>
              <p className="text-sm font-medium text-slate-700">{formatDate(contract.end_date)}</p>
            </div>
          )}
          {contract.billing_mode === 'par_seance' ? (
            <>
              <div>
                <p className="text-xs text-foreground-muted mb-1">Prix/séance</p>
                <p className="text-sm font-medium text-slate-700">{contract.session_price}€</p>
              </div>
              <div>
                <p className="text-xs text-foreground-muted mb-1">Séances/mois</p>
                <p className="text-sm font-medium text-slate-700">{contract.sessions_per_month}</p>
              </div>
            </>
          ) : (
            <>
              <div>
                <p className="text-xs text-foreground-muted mb-1">Tarif horaire</p>
                <p className="text-sm font-medium text-slate-700">{contract.hourly_rate}€/h</p>
              </div>
              <div>
                <p className="text-xs text-foreground-muted mb-1">Durée séance</p>
                <p className="text-sm font-medium text-slate-700">{contract.session_duration_minutes} min</p>
              </div>
            </>
          )}
          <div>
            <p className="text-xs text-foreground-muted mb-1">Estimation/mois</p>
            <p className="text-sm font-bold text-primary">~{calculateEstimate(contract).toFixed(2)}€</p>
          </div>
        </div>

        {contract.notes && (
          <p className="text-sm text-foreground-muted mt-3 pt-3 border-t border-slate-100">{contract.notes}</p>
        )}
      </CardContent>
    </Card>
  );
};

export default Contracts;
