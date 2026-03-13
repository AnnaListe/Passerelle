import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { invoicesAPI } from '../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input, Label } from '../components/ui/input';
import { ArrowLeft, Receipt, Calendar, Euro, Check, AlertCircle } from 'lucide-react';
import { formatDate } from '../lib/utils';

const InvoiceDetail = () => {
  const { invoiceId } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Virement');
  const [paymentType, setPaymentType] = useState('full'); // 'full' or 'partial'

  useEffect(() => {
    loadInvoice();
  }, [invoiceId]);

  const loadInvoice = async () => {
    try {
      const response = await invoicesAPI.detail(invoiceId);
      setInvoice(response.data);
      setPaymentAmount(response.data.amount_remaining.toString());
    } catch (error) {
      console.error('Error loading invoice:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsPaid = async () => {
    setUpdating(true);
    try {
      const amount = paymentType === 'full' ? invoice.amount_total : parseFloat(paymentAmount);
      const status = paymentType === 'full' ? 'payee' : 'partiellement_payee';
      
      await invoicesAPI.updateStatus(invoiceId, {
        status,
        amount_paid: amount,
        payment_method: paymentMethod
      });
      
      await loadInvoice();
      setShowPaymentModal(false);
    } catch (error) {
      console.error('Error updating invoice:', error);
    } finally {
      setUpdating(false);
    }
  };

  const handleSendInvoice = async () => {
    setUpdating(true);
    try {
      await invoicesAPI.updateStatus(invoiceId, {
        status: 'en_attente_paiement'
      });
      await loadInvoice();
    } catch (error) {
      console.error('Error sending invoice:', error);
    } finally {
      setUpdating(false);
    }
  };

  const getStatusVariant = (status) => {
    const variants = {
      'payee': 'success',
      'en_attente_paiement': 'pending',
      'partiellement_payee': 'warning',
      'impayee': 'error',
      'brouillon': 'default'
    };
    return variants[status] || 'default';
  };

  const getStatusLabel = (status) => {
    const labels = {
      'payee': 'Payée',
      'en_attente_paiement': 'En attente de paiement',
      'partiellement_payee': 'Partiellement payée',
      'impayee': 'Impayée',
      'brouillon': 'Brouillon'
    };
    return labels[status] || status;
  };

  const getStatusDescription = (status) => {
    const descriptions = {
      'brouillon': 'La facture est en brouillon et n\'a pas encore été envoyée',
      'en_attente_paiement': 'La facture a été envoyée et est en attente de paiement',
      'partiellement_payee': 'Un paiement partiel a été reçu',
      'payee': 'La facture a été entièrement payée',
      'impayee': 'La facture est impayée (délai dépassé)'
    };
    return descriptions[status] || '';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="text-center py-12">
        <p className="text-foreground-muted">Facture non trouvée</p>
      </div>
    );
  }

  const paymentMethods = ['Virement', 'Chèque', 'Espèces', 'Carte bancaire', 'Autre'];

  return (
    <div className="space-y-6 animate-in" data-testid="invoice-detail">
      {/* Back Button */}
      <Link to="/invoices">
        <Button variant="ghost" data-testid="back-button">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>
      </Link>

      {/* Header Card */}
      <Card className="bg-gradient-to-br from-amber-50 to-white border-amber-200">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-amber-100 rounded-lg">
                <Receipt className="w-8 h-8 text-amber-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800 mb-2">
                  {invoice.invoice_number}
                </h1>
                <Badge variant={getStatusVariant(invoice.status)} className="text-sm">
                  {getStatusLabel(invoice.status)}
                </Badge>
                <p className="text-sm text-foreground-muted mt-2">
                  {getStatusDescription(invoice.status)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-foreground-muted mb-1">Montant total</p>
              <p className="text-3xl font-bold text-slate-800">
                {invoice.amount_total.toFixed(2)}€
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Invoice Details */}
          <Card>
            <CardHeader>
              <CardTitle>Détails de la facture</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-slate-600 mb-1">Date d'émission</p>
                <p className="text-sm text-slate-700">{formatDate(invoice.issue_date)}</p>
              </div>
              {invoice.sent_date && (
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-1">Date d'envoi</p>
                  <p className="text-sm text-slate-700">{formatDate(invoice.sent_date)}</p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-slate-600 mb-1">Montant total</p>
                <p className="text-sm text-slate-700">{invoice.amount_total.toFixed(2)}€</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600 mb-1">Montant payé</p>
                <p className="text-sm text-slate-700">{invoice.amount_paid.toFixed(2)}€</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600 mb-1">Montant restant</p>
                <p className={`text-sm font-semibold ${
                  invoice.amount_remaining > 0 ? 'text-red-600' : 'text-green-600'
                }`}>
                  {invoice.amount_remaining.toFixed(2)}€
                </p>
              </div>
              {invoice.payment_date && (
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-1">Date de paiement</p>
                  <p className="text-sm text-slate-700">{formatDate(invoice.payment_date)}</p>
                </div>
              )}
              {invoice.payment_method && (
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-1">Moyen de paiement</p>
                  <p className="text-sm text-slate-700">{invoice.payment_method}</p>
                </div>
              )}
              {invoice.notes && (
                <div className="md:col-span-2">
                  <p className="text-sm font-medium text-slate-600 mb-1">Notes</p>
                  <p className="text-sm text-slate-700">{invoice.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment History */}
          {(invoice.payment_date || invoice.last_partial_payment_date) && (
            <Card>
              <CardHeader>
                <CardTitle>Historique des paiements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {invoice.last_partial_payment_date && invoice.status === 'partiellement_payee' && (
                    <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200">
                      <div>
                        <p className="text-sm font-medium text-slate-700">Paiement partiel</p>
                        <p className="text-xs text-foreground-muted">
                          {formatDate(invoice.last_partial_payment_date)}
                        </p>
                        {invoice.payment_method && (
                          <p className="text-xs text-foreground-muted">
                            Moyen: {invoice.payment_method}
                          </p>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-slate-700">
                        {invoice.amount_paid.toFixed(2)}€
                      </p>
                    </div>
                  )}
                  {invoice.payment_date && invoice.status === 'payee' && (
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                      <div>
                        <p className="text-sm font-medium text-slate-700">Paiement complet</p>
                        <p className="text-xs text-foreground-muted">
                          {formatDate(invoice.payment_date)}
                        </p>
                        {invoice.payment_method && (
                          <p className="text-xs text-foreground-muted">
                            Moyen: {invoice.payment_method}
                          </p>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-slate-700">
                        {invoice.amount_paid.toFixed(2)}€
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Actions Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {invoice.status === 'brouillon' && (
                <Button 
                  className="w-full"
                  onClick={handleSendInvoice}
                  disabled={updating}
                  data-testid="send-invoice-button"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Envoyer la facture
                </Button>
              )}
              
              {invoice.status !== 'payee' && invoice.status !== 'brouillon' && (
                <>
                  <Button 
                    className="w-full"
                    onClick={() => {
                      setPaymentType('full');
                      setPaymentAmount(invoice.amount_remaining.toString());
                      setShowPaymentModal(true);
                    }}
                    disabled={updating}
                    data-testid="mark-paid-button"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Marquer comme payée
                  </Button>
                  
                  <Button 
                    variant="secondary"
                    className="w-full"
                    onClick={() => {
                      setPaymentType('partial');
                      setPaymentAmount('');
                      setShowPaymentModal(true);
                    }}
                    disabled={updating}
                    data-testid="mark-partial-button"
                  >
                    <Euro className="w-4 h-4 mr-2" />
                    Paiement partiel
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Status Info */}
          <Card className="bg-background-subtle">
            <CardContent className="pt-6">
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    invoice.status === 'payee' ? 'bg-green-500' :
                    invoice.status === 'en_attente_paiement' ? 'bg-amber-500' :
                    invoice.status === 'impayee' ? 'bg-red-500' :
                    invoice.status === 'partiellement_payee' ? 'bg-orange-500' :
                    'bg-slate-400'
                  }`} />
                  <span className="text-foreground-muted">
                    Statut: {getStatusLabel(invoice.status)}
                  </span>
                </div>
                {invoice.amount_remaining > 0 && (
                  <p className="text-foreground-muted">
                    Il reste {invoice.amount_remaining.toFixed(2)}€ à recevoir
                  </p>
                )}
                {invoice.status === 'payee' && (
                  <p className="text-green-600 font-medium">
                    ✓ Facture entièrement payée
                  </p>
                )}
                {invoice.status === 'impayee' && (
                  <div className="flex items-start gap-2 text-red-600">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <p className="text-sm">
                      Cette facture est impayée. Délai de paiement dépassé.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle>
                {paymentType === 'full' ? 'Marquer comme payée' : 'Paiement partiel'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {paymentType === 'partial' && (
                <div>
                  <Label htmlFor="amount">Montant payé</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="0.00"
                    data-testid="payment-amount-input"
                  />
                  <p className="text-xs text-foreground-muted mt-1">
                    Montant restant dû: {invoice.amount_remaining.toFixed(2)}€
                  </p>
                </div>
              )}
              
              {paymentType === 'full' && (
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm font-medium text-slate-700 mb-1">Montant à payer</p>
                  <p className="text-2xl font-bold text-slate-800">
                    {invoice.amount_remaining.toFixed(2)}€
                  </p>
                </div>
              )}

              <div>
                <Label htmlFor="payment-method">Moyen de paiement</Label>
                <select
                  id="payment-method"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full bg-input border-transparent focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl px-4 py-3 text-slate-700 outline-none"
                  data-testid="payment-method-select"
                >
                  {paymentMethods.map(method => (
                    <option key={method} value={method}>{method}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowPaymentModal(false)}
                  disabled={updating}
                >
                  Annuler
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleMarkAsPaid}
                  disabled={updating || (paymentType === 'partial' && (!paymentAmount || parseFloat(paymentAmount) <= 0))}
                  data-testid="confirm-payment-button"
                >
                  {updating ? 'Enregistrement...' : 'Confirmer'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default InvoiceDetail;
