import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { invoicesAPI } from '../lib/api';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Receipt, Calendar, Euro } from 'lucide-react';
import { formatDate } from '../lib/utils';

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      const response = await invoicesAPI.list();
      setInvoices(response.data);
    } catch (error) {
      console.error('Error loading invoices:', error);
    } finally {
      setLoading(false);
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
      'en_attente_paiement': 'En attente',
      'partiellement_payee': 'Partielle',
      'impayee': 'Impayée',
      'brouillon': 'Brouillon'
    };
    return labels[status] || status;
  };

  const filteredInvoices = filter === 'all' 
    ? invoices 
    : invoices.filter(inv => inv.status === filter);

  const stats = {
    total: invoices.length,
    pending: invoices.filter(inv => inv.status === 'en_attente_paiement').length,
    overdue: invoices.filter(inv => inv.status === 'impayee').length,
    paid: invoices.filter(inv => inv.status === 'payee').length,
    totalAmount: invoices.reduce((sum, inv) => sum + inv.amount_total, 0),
    remainingAmount: invoices.reduce((sum, inv) => sum + inv.amount_remaining, 0)
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in" data-testid="invoices-page">
      {/* Header */}
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-slate-800 font-outfit mb-2">
          Factures
        </h1>
        <p className="text-foreground-muted">Gestion de vos factures</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary-light to-white border-primary/20">
          <div className="p-4">
            <p className="text-sm text-foreground-muted mb-1">Total factures</p>
            <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-amber-50 to-white border-amber-200">
          <div className="p-4">
            <p className="text-sm text-foreground-muted mb-1">En attente</p>
            <p className="text-2xl font-bold text-slate-800">{stats.pending}</p>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-red-50 to-white border-red-200">
          <div className="p-4">
            <p className="text-sm text-foreground-muted mb-1">Impayées</p>
            <p className="text-2xl font-bold text-slate-800">{stats.overdue}</p>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-white border-green-200">
          <div className="p-4">
            <p className="text-sm text-foreground-muted mb-1">À recevoir</p>
            <p className="text-2xl font-bold text-slate-800">{stats.remainingAmount.toFixed(2)}€</p>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <Button 
          variant={filter === 'all' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
          data-testid="filter-all"
        >
          Toutes ({stats.total})
        </Button>
        <Button 
          variant={filter === 'en_attente_paiement' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setFilter('en_attente_paiement')}
          data-testid="filter-pending"
        >
          En attente ({stats.pending})
        </Button>
        <Button 
          variant={filter === 'impayee' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setFilter('impayee')}
          data-testid="filter-overdue"
        >
          Impayées ({stats.overdue})
        </Button>
        <Button 
          variant={filter === 'payee' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setFilter('payee')}
          data-testid="filter-paid"
        >
          Payées ({stats.paid})
        </Button>
      </div>

      {/* Invoices List */}
      {filteredInvoices.length > 0 ? (
        <div className="space-y-3">
          {filteredInvoices.map((invoice) => (
            <Link
              key={invoice.id}
              to={`/invoices/${invoice.id}`}
              data-testid={`invoice-${invoice.id}`}
            >
              <Card interactive>
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex-shrink-0">
                    <div className="p-3 bg-amber-50 rounded-lg">
                      <Receipt className="w-6 h-6 text-amber-600" />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-3 mb-2">
                      <div className="flex-1">
                        <p className="font-semibold text-slate-700">{invoice.invoice_number}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={getStatusVariant(invoice.status)}>
                            {getStatusLabel(invoice.status)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-foreground-muted">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(invoice.issue_date)}
                      </div>
                      {invoice.notes && (
                        <span className="hidden md:inline">• {invoice.notes}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex-shrink-0 text-right">
                    <p className="text-xl font-bold text-slate-800 mb-1">
                      {invoice.amount_total.toFixed(2)}€
                    </p>
                    {invoice.amount_remaining > 0 && (
                      <div className="text-sm">
                        <span className="text-red-600 font-medium">
                          Reste: {invoice.amount_remaining.toFixed(2)}€
                        </span>
                      </div>
                    )}
                    {invoice.amount_paid > 0 && invoice.amount_remaining === 0 && (
                      <div className="text-sm text-green-600">
                        Payé: {invoice.amount_paid.toFixed(2)}€
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card className="text-center py-12">
          <Receipt className="w-16 h-16 mx-auto mb-4 text-slate-300" />
          <p className="text-foreground-muted">Aucune facture</p>
        </Card>
      )}
    </div>
  );
};

export default Invoices;
