import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { quotesAPI } from '../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input, Label } from '../components/ui/input';
import { ArrowLeft, FileText, Send, Check, X, FileSignature } from 'lucide-react';
import { formatDate } from '../lib/utils';

const QuoteDetail = () => {
  const { quoteId } = useParams();
  const navigate = useNavigate();
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadQuote();
  }, [quoteId]);

  const loadQuote = async () => {
    try {
      const response = await quotesAPI.detail(quoteId);
      setQuote(response.data);
    } catch (error) {
      console.error('Error loading quote:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (status) => {
    setUpdating(true);
    try {
      await quotesAPI.updateStatus(quoteId, status);
      await loadQuote();
    } catch (error) {
      console.error('Error updating quote:', error);
    } finally {
      setUpdating(false);
    }
  };

  const handleConvertToContract = async () => {
    setUpdating(true);
    try {
      await quotesAPI.convertToContract(quoteId, { start_date: startDate });
      navigate('/contracts');
    } catch (error) {
      console.error('Error converting quote:', error);
      alert('Erreur : Le devis doit être accepté avant conversion');
    } finally {
      setUpdating(false);
      setShowConvertModal(false);
    }
  };

  const getStatusVariant = (status) => {
    const variants = {
      'brouillon': 'default',
      'envoye': 'pending',
      'accepte': 'success',
      'refuse': 'error'
    };
    return variants[status] || 'default';
  };

  const getStatusLabel = (status) => {
    const labels = {
      'brouillon': 'Brouillon',
      'envoye': 'Envoyé',
      'accepte': 'Accepté',
      'refuse': 'Refusé'
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="text-center py-12">
        <p className="text-foreground-muted">Devis non trouvé</p>
      </div>
    );
  }

  const isExpired = quote.validity_date && new Date(quote.validity_date) < new Date();

  return (
    <div className="space-y-6 animate-in" data-testid="quote-detail">
      {/* Back Button */}
      <Link to="/quotes">
        <Button variant="ghost">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour aux devis
        </Button>
      </Link>

      {/* Header Card */}
      <Card className="bg-gradient-to-br from-primary-light to-white border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary rounded-lg">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800 mb-2">
                  {quote.quote_number}
                </h1>
                <Badge variant={getStatusVariant(quote.status)} className="text-sm mb-2">
                  {getStatusLabel(quote.status)}
                </Badge>
                {isExpired && quote.status === 'envoye' && (
                  <Badge variant="error" className="ml-2">Expiré</Badge>
                )}
                {quote.converted_to_contract_id && (
                  <Badge variant="info" className="ml-2">Converti en contrat</Badge>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-foreground-muted mb-1">Estimation mensuelle</p>
              <p className="text-3xl font-bold text-slate-800">
                ~{quote.estimated_monthly_amount.toFixed(0)}€
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quote Details */}
          <Card>
            <CardHeader>
              <CardTitle>Détails du devis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-1">Date d'émission</p>
                  <p className="text-sm text-slate-700">{formatDate(quote.issue_date)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-1">Valide jusqu'au</p>
                  <p className={`text-sm font-medium ${isExpired ? 'text-red-600' : 'text-slate-700'}`}>
                    {formatDate(quote.validity_date)}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-slate-600 mb-1">Mode de facturation</p>
                <Badge variant="info">
                  {quote.billing_mode === 'par_seance' ? 'Facturation à la séance' : 'Facturation au tarif horaire'}
                </Badge>
              </div>

              {quote.billing_mode === 'par_seance' ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-slate-600 mb-1">Prix par séance</p>
                    <p className="text-lg font-semibold text-slate-800">{quote.session_price}€</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-600 mb-1">Séances par mois (estimation)</p>
                    <p className="text-sm text-slate-700">{quote.sessions_per_month || 'N/A'}</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-slate-600 mb-1">Tarif horaire</p>
                    <p className="text-lg font-semibold text-slate-800">{quote.hourly_rate}€/h</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-600 mb-1">Séances par mois</p>
                    <p className="text-sm text-slate-700">{quote.sessions_per_month}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-600 mb-1">Durée par séance</p>
                    <p className="text-sm text-slate-700">{quote.session_duration_minutes} min</p>
                  </div>
                </div>
              )}

              {quote.description && (
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-1">Description</p>
                  <p className="text-sm text-slate-700 whitespace-pre-line">{quote.description}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Actions Sidebar */}
        <div className="space-y-6">
          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {quote.status === 'brouillon' && (
                <Button 
                  className="w-full"
                  onClick={() => handleUpdateStatus('envoye')}
                  disabled={updating}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Envoyer le devis
                </Button>
              )}

              {quote.status === 'envoye' && (
                <>
                  <Button 
                    className="w-full"
                    onClick={() => handleUpdateStatus('accepte')}
                    disabled={updating}
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Marquer comme accepté
                  </Button>
                  <Button 
                    variant="outline"
                    className="w-full"
                    onClick={() => handleUpdateStatus('refuse')}
                    disabled={updating}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Marquer comme refusé
                  </Button>
                </>
              )}

              {quote.status === 'accepte' && !quote.converted_to_contract_id && (
                <Button 
                  className="w-full"
                  onClick={() => setShowConvertModal(true)}
                  disabled={updating}
                >
                  <FileSignature className="w-4 h-4 mr-2" />
                  Transformer en contrat
                </Button>
              )}

              {quote.converted_to_contract_id && (
                <Link to={`/contracts`}>
                  <Button variant="secondary" className="w-full">
                    Voir le contrat
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>

          {/* Status Info */}
          <Card className="bg-background-subtle">
            <CardContent className="pt-6">
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    quote.status === 'accepte' ? 'bg-green-500' :
                    quote.status === 'envoye' ? 'bg-amber-500' :
                    quote.status === 'refuse' ? 'bg-red-500' :
                    'bg-slate-400'
                  }`} />
                  <span className="text-foreground-muted">
                    Statut: {getStatusLabel(quote.status)}
                  </span>
                </div>
                {isExpired && quote.status === 'envoye' && (
                  <p className="text-red-600">
                    ⚠️ Ce devis a expiré le {formatDate(quote.validity_date)}
                  </p>
                )}
                {quote.converted_to_contract_id && (
                  <p className="text-green-600">
                    ✓ Converti en contrat actif
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Convert Modal */}
      {showConvertModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle>Transformer en contrat</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-foreground-muted">
                Cette action va créer un nouveau contrat basé sur ce devis.
              </p>

              <div>
                <Label htmlFor="start_date">Date de début du contrat</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowConvertModal(false)}
                  disabled={updating}
                >
                  Annuler
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleConvertToContract}
                  disabled={updating}
                >
                  {updating ? 'Conversion...' : 'Confirmer'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default QuoteDetail;
