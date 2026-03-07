import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { invoicesAPI } from '../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input, Label } from '../components/ui/input';
import { ArrowLeft, Receipt, Calendar, Euro, Check } from 'lucide-react';
import { formatDate } from '../lib/utils';

const InvoiceDetail = () => {
  const { invoiceId } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadInvoice();
  }, [invoiceId]);

  const loadInvoice = async () => {
    try {
      const response = await invoicesAPI.detail(invoiceId);
      setInvoice(response.data);
    } catch (error) {
      console.error('Error loading invoice:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (status, amountPaid = null, paymentMethod = null) => {
    setUpdating(true);
    try {
      await invoicesAPI.updateStatus(invoiceId, {
        status,
        amount_paid: amountPaid,
        payment_method: paymentMethod
      });
      await loadInvoice();
    } catch (error) {
      console.error('Error updating invoice:', error);
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

          {/* Payment History (if partial payments) */}
          {invoice.last_partial_payment_date && (
            <Card>
              <CardHeader>
                <CardTitle>Historique des paiements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-background-subtle rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-slate-700">Paiement partiel</p>
                      <p className="text-xs text-foreground-muted">
                        {formatDate(invoice.last_partial_payment_date)}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-slate-700">
                      {invoice.amount_paid.toFixed(2)}€
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Actions Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          {invoice.status !== 'payee' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Actions rapides</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  className="w-full"
                  onClick={() => handleUpdateStatus('payee', invoice.amount_total, 'Virement')}
                  disabled={updating}
                  data-testid="mark-paid-button"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Marquer comme payée
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Status Info */}
          <Card className="bg-background-subtle">
            <CardContent className="pt-6">
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    invoice.status === 'payee' ? 'bg-green-500' :
                    invoice.status === 'en_attente_paiement' ? 'bg-amber-500' :
                    invoice.status === 'impayee' ? 'bg-red-500' :
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
                    Facture entièrement payée
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetail;
