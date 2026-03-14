import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { quotesAPI, childrenAPI } from '../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input, Label } from '../components/ui/input';
import { Avatar } from '../components/ui/avatar';
import { ArrowLeft, FileText, Copy, Save } from 'lucide-react';

const QuoteForm = () => {
  const { quoteId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const duplicateFromId = searchParams.get('duplicate');
  const preselectedChildId = searchParams.get('child');
  
  const isEditing = !!quoteId;
  const isDuplicating = !!duplicateFromId;
  
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    child_id: preselectedChildId || '',
    billing_mode: 'par_seance',
    session_price: '',
    hourly_rate: '',
    sessions_per_week: '',
    sessions_per_month: '',
    session_duration_minutes: '',
    description: '',
    validity_days: 30
  });

  useEffect(() => {
    loadData();
  }, [quoteId, duplicateFromId]);

  const loadData = async () => {
    try {
      // Load children list
      const childrenRes = await childrenAPI.list();
      setChildren(childrenRes.data);
      
      // If editing, load existing quote
      if (isEditing) {
        const quoteRes = await quotesAPI.detail(quoteId);
        const quote = quoteRes.data;
        setFormData({
          child_id: quote.child_id,
          billing_mode: quote.billing_mode,
          session_price: quote.session_price || '',
          hourly_rate: quote.hourly_rate || '',
          sessions_per_week: quote.sessions_per_week || '',
          sessions_per_month: quote.sessions_per_month || '',
          session_duration_minutes: quote.session_duration_minutes || '',
          description: quote.description || '',
          validity_days: 30
        });
      }
      
      // If duplicating, load source quote
      if (isDuplicating) {
        const quoteRes = await quotesAPI.detail(duplicateFromId);
        const quote = quoteRes.data;
        setFormData({
          child_id: quote.child_id,
          billing_mode: quote.billing_mode,
          session_price: quote.session_price || '',
          hourly_rate: quote.hourly_rate || '',
          sessions_per_week: quote.sessions_per_week || '',
          sessions_per_month: quote.sessions_per_month || '',
          session_duration_minutes: quote.session_duration_minutes || '',
          description: quote.description || '',
          validity_days: 30
        });
      }
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const calculateEstimate = () => {
    if (formData.billing_mode === 'par_seance' && formData.session_price) {
      const sessionsPerMonth = formData.sessions_per_month || 12;
      return parseFloat(formData.session_price) * sessionsPerMonth;
    } else if (formData.billing_mode === 'tarif_horaire' && formData.hourly_rate && formData.sessions_per_month && formData.session_duration_minutes) {
      const hours = parseFloat(formData.session_duration_minutes) / 60;
      return parseFloat(formData.hourly_rate) * hours * parseInt(formData.sessions_per_month);
    }
    return 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    
    try {
      // Get parent_id from child
      const child = children.find(c => c.id === formData.child_id);
      if (!child) {
        setError('Veuillez sélectionner un enfant');
        setSaving(false);
        return;
      }
      
      const payload = {
        child_id: formData.child_id,
        parent_id: child?.parent_id || null, // Utiliser le vrai parent_id
        billing_mode: formData.billing_mode,
        validity_days: parseInt(formData.validity_days) || 30,
        description: formData.description || null
      };
      
      if (formData.billing_mode === 'par_seance') {
        payload.session_price = formData.session_price ? Math.round(parseFloat(formData.session_price) * 100) / 100 : null;
        payload.sessions_per_month = parseInt(formData.sessions_per_month) || null;
      } else {
        payload.hourly_rate = formData.hourly_rate ? Math.round(parseFloat(formData.hourly_rate) * 100) / 100 : null;
        payload.sessions_per_week = parseInt(formData.sessions_per_week) || null;
        payload.sessions_per_month = parseInt(formData.sessions_per_month) || null;
        payload.session_duration_minutes = parseInt(formData.session_duration_minutes) || null;
      }
      
      if (isEditing) {
        await quotesAPI.update(quoteId, payload);
        navigate(`/quotes/${quoteId}`);
      } else {
        const response = await quotesAPI.create(payload);
        navigate(`/quotes/${response.data.id}`);
      }
    } catch (err) {
      console.error('Error saving quote:', err);
      setError(err.response?.data?.detail || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const selectedChild = children.find(c => c.id === formData.child_id);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in" data-testid="quote-form">
      {/* Back Button */}
      <Link to="/quotes">
        <Button variant="ghost" data-testid="back-button">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour aux devis
        </Button>
      </Link>

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 bg-primary rounded-lg">
          {isDuplicating ? (
            <Copy className="w-8 h-8 text-white" />
          ) : (
            <FileText className="w-8 h-8 text-white" />
          )}
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 font-outfit">
            {isEditing ? 'Modifier le devis' : isDuplicating ? 'Dupliquer le devis' : 'Nouveau devis'}
          </h1>
          <p className="text-foreground-muted">
            {isEditing ? 'Modifiez les informations du devis' : 'Créez un nouveau devis pour un enfant'}
          </p>
        </div>
      </div>

      {error && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="pt-4">
            <p className="text-red-600 text-sm">{error}</p>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Child Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Enfant concerné</CardTitle>
              </CardHeader>
              <CardContent>
                {!isEditing && !preselectedChildId ? (
                  <div className="space-y-4">
                    <Label htmlFor="child_id">Sélectionner un enfant *</Label>
                    <select
                      id="child_id"
                      data-testid="child-select"
                      value={formData.child_id}
                      onChange={(e) => setFormData({...formData, child_id: e.target.value})}
                      className="w-full bg-input border-transparent focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl px-4 py-3 text-slate-700 outline-none"
                      required
                    >
                      <option value="">-- Choisir un enfant --</option>
                      {children.map(child => (
                        <option key={child.id} value={child.id}>
                          {child.first_name} {child.last_name} ({child.age} ans)
                        </option>
                      ))}
                    </select>
                  </div>
                ) : selectedChild ? (
                  <div className="flex items-center gap-4 p-4 bg-background-subtle rounded-xl">
                    <Avatar 
                      src={selectedChild.photo_url} 
                      firstName={selectedChild.first_name} 
                      lastName={selectedChild.last_name}
                      size="lg"
                    />
                    <div>
                      <p className="font-semibold text-slate-700">
                        {selectedChild.first_name} {selectedChild.last_name}
                      </p>
                      <p className="text-sm text-foreground-muted">{selectedChild.age} ans</p>
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            {/* Billing Mode */}
            <Card>
              <CardHeader>
                <CardTitle>Mode de facturation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    data-testid="billing-mode-session"
                    variant={formData.billing_mode === 'par_seance' ? 'primary' : 'outline'}
                    className="h-auto py-4"
                    onClick={() => setFormData({...formData, billing_mode: 'par_seance'})}
                  >
                    <div className="text-center">
                      <p className="font-semibold">A la séance</p>
                      <p className="text-xs opacity-80 mt-1">Prix fixe par séance</p>
                    </div>
                  </Button>
                  <Button
                    type="button"
                    data-testid="billing-mode-hourly"
                    variant={formData.billing_mode === 'tarif_horaire' ? 'primary' : 'outline'}
                    className="h-auto py-4"
                    onClick={() => setFormData({...formData, billing_mode: 'tarif_horaire'})}
                  >
                    <div className="text-center">
                      <p className="font-semibold">Tarif horaire</p>
                      <p className="text-xs opacity-80 mt-1">Calcul basé sur la durée</p>
                    </div>
                  </Button>
                </div>

                {/* Per Session Fields */}
                {formData.billing_mode === 'par_seance' && (
                  <div className="space-y-4 pt-4 border-t border-slate-100">
                    <div>
                      <Label htmlFor="session_price">Prix par séance (€) *</Label>
                      <Input
                        id="session_price"
                        data-testid="session-price-input"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.session_price}
                        onChange={(e) => setFormData({...formData, session_price: e.target.value})}
                        placeholder="Ex: 45.00"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="sessions_per_month">Séances par mois (estimation)</Label>
                      <Input
                        id="sessions_per_month"
                        data-testid="sessions-per-month-input"
                        type="number"
                        min="1"
                        value={formData.sessions_per_month}
                        onChange={(e) => setFormData({...formData, sessions_per_month: e.target.value})}
                        placeholder="Ex: 4"
                      />
                      <p className="text-xs text-foreground-muted mt-1">
                        Utilisé pour calculer l'estimation mensuelle
                      </p>
                    </div>
                  </div>
                )}

                {/* Hourly Rate Fields */}
                {formData.billing_mode === 'tarif_horaire' && (
                  <div className="space-y-4 pt-4 border-t border-slate-100">
                    <div>
                      <Label htmlFor="hourly_rate">Tarif horaire (€/h) *</Label>
                      <Input
                        id="hourly_rate"
                        data-testid="hourly-rate-input"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.hourly_rate}
                        onChange={(e) => setFormData({...formData, hourly_rate: e.target.value})}
                        placeholder="Ex: 50.00"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="sessions_per_month_hourly">Séances par mois *</Label>
                        <Input
                          id="sessions_per_month_hourly"
                          data-testid="sessions-per-month-hourly-input"
                          type="number"
                          min="1"
                          value={formData.sessions_per_month}
                          onChange={(e) => setFormData({...formData, sessions_per_month: e.target.value})}
                          placeholder="Ex: 4"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="session_duration">Durée par séance (min) *</Label>
                        <Input
                          id="session_duration"
                          data-testid="session-duration-input"
                          type="number"
                          min="15"
                          step="15"
                          value={formData.session_duration_minutes}
                          onChange={(e) => setFormData({...formData, session_duration_minutes: e.target.value})}
                          placeholder="Ex: 60"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="sessions_per_week">Séances par semaine</Label>
                      <Input
                        id="sessions_per_week"
                        data-testid="sessions-per-week-input"
                        type="number"
                        min="1"
                        value={formData.sessions_per_week}
                        onChange={(e) => setFormData({...formData, sessions_per_week: e.target.value})}
                        placeholder="Ex: 1"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Validity and Description */}
            <Card>
              <CardHeader>
                <CardTitle>Validité et description</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="validity_days">Durée de validité (jours)</Label>
                  <Input
                    id="validity_days"
                    data-testid="validity-days-input"
                    type="number"
                    min="1"
                    max="365"
                    value={formData.validity_days}
                    onChange={(e) => setFormData({...formData, validity_days: e.target.value})}
                  />
                  <p className="text-xs text-foreground-muted mt-1">
                    Le devis sera valide pendant {formData.validity_days || 30} jours à partir de sa création
                  </p>
                </div>
                <div>
                  <Label htmlFor="description">Description / Notes</Label>
                  <textarea
                    id="description"
                    data-testid="description-input"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full bg-input border-transparent focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl px-4 py-3 text-slate-700 outline-none min-h-[120px]"
                    placeholder="Description des prestations, conditions particulières..."
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Summary */}
          <div className="space-y-6">
            <Card className="bg-gradient-to-br from-primary-light to-white border-primary/20 sticky top-6">
              <CardHeader>
                <CardTitle className="text-lg">Récapitulatif</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedChild && (
                  <div>
                    <p className="text-sm text-foreground-muted mb-1">Enfant</p>
                    <p className="font-medium text-slate-700">
                      {selectedChild.first_name} {selectedChild.last_name}
                    </p>
                  </div>
                )}

                <div>
                  <p className="text-sm text-foreground-muted mb-1">Mode de facturation</p>
                  <p className="font-medium text-slate-700">
                    {formData.billing_mode === 'par_seance' ? 'A la séance' : 'Tarif horaire'}
                  </p>
                </div>

                {formData.billing_mode === 'par_seance' && formData.session_price && (
                  <div>
                    <p className="text-sm text-foreground-muted mb-1">Prix par séance</p>
                    <p className="font-medium text-slate-700">{formData.session_price}€</p>
                  </div>
                )}

                {formData.billing_mode === 'tarif_horaire' && formData.hourly_rate && (
                  <>
                    <div>
                      <p className="text-sm text-foreground-muted mb-1">Tarif horaire</p>
                      <p className="font-medium text-slate-700">{formData.hourly_rate}€/h</p>
                    </div>
                    {formData.session_duration_minutes && (
                      <div>
                        <p className="text-sm text-foreground-muted mb-1">Durée séance</p>
                        <p className="font-medium text-slate-700">{formData.session_duration_minutes} min</p>
                      </div>
                    )}
                  </>
                )}

                {formData.sessions_per_month && (
                  <div>
                    <p className="text-sm text-foreground-muted mb-1">Séances par mois</p>
                    <p className="font-medium text-slate-700">{formData.sessions_per_month}</p>
                  </div>
                )}

                <div>
                  <p className="text-sm text-foreground-muted mb-1">Validité</p>
                  <p className="font-medium text-slate-700">{formData.validity_days || 30} jours</p>
                </div>

                <div className="pt-4 border-t border-primary/20">
                  <p className="text-sm text-foreground-muted mb-1">Estimation mensuelle</p>
                  <p className="text-2xl font-bold text-primary">
                    ~{calculateEstimate().toFixed(0)}€/mois
                  </p>
                </div>

                <Button 
                  type="submit" 
                  className="w-full mt-4"
                  disabled={saving || !formData.child_id}
                  data-testid="submit-button"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Enregistrement...' : isEditing ? 'Enregistrer les modifications' : 'Créer le devis'}
                </Button>
              </CardContent>
            </Card>

            {/* Help Card */}
            <Card className="bg-background-subtle">
              <CardContent className="pt-6">
                <h4 className="font-semibold text-slate-700 mb-3">Aide</h4>
                <div className="space-y-3 text-sm text-foreground-muted">
                  <p>
                    <strong>A la séance :</strong> Idéal pour une facturation simple avec un prix fixe par rendez-vous.
                  </p>
                  <p>
                    <strong>Tarif horaire :</strong> Adapté si la durée des séances varie ou pour un suivi régulier avec facturation au temps passé.
                  </p>
                  <p>
                    Le devis créé sera en statut "Brouillon". Vous pourrez ensuite l'envoyer au parent et le marquer comme accepté ou refusé.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
};

export default QuoteForm;
