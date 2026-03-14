import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { invoicesAPI, childrenAPI } from '../lib/api';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Avatar } from '../components/ui/avatar';
import { Receipt, Calendar, Euro, Filter, X } from 'lucide-react';
import { formatDate } from '../lib/utils';

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [invoicesRes, childrenRes] = await Promise.all([
        invoicesAPI.list(),
        childrenAPI.list()
      ]);
      setInvoices(invoicesRes.data);
      setChildren(childrenRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
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

  // Get unique months from invoices
  const getAvailableMonths = () => {
    const months = new Set();
    invoices.forEach(inv => {
      const date = new Date(inv.issue_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      months.add(monthKey);
    });
    return Array.from(months).sort().reverse();
  };

  const availableMonths = getAvailableMonths();

  // Filter invoices
  const filteredInvoices = invoices.filter(inv => {
    // Filter by child
    if (selectedChild && inv.child_id !== selectedChild) return false;
    
    // Filter by month
    if (selectedMonth) {
      const invDate = new Date(inv.issue_date);
      const invMonthKey = `${invDate.getFullYear()}-${String(invDate.getMonth() + 1).padStart(2, '0')}`;
      if (invMonthKey !== selectedMonth) return false;
    }
    
    // Filter by status
    if (statusFilter !== 'all' && inv.status !== statusFilter) return false;
    
    return true;
  });

  // Calculate stats
  const stats = {
    total: filteredInvoices.length,
    pending: filteredInvoices.filter(inv => inv.status === 'en_attente_paiement').length,
    overdue: filteredInvoices.filter(inv => inv.status === 'impayee').length,
    paid: filteredInvoices.filter(inv => inv.status === 'payee').length,
    totalAmount: filteredInvoices.reduce((sum, inv) => sum + inv.amount_total, 0),
    remainingAmount: filteredInvoices.reduce((sum, inv) => sum + inv.amount_remaining, 0)
  };

  const getMonthLabel = (monthKey) => {
    if (!monthKey) return '';
    const [year, month] = monthKey.split('-');
    const date = new Date(year, parseInt(month) - 1);
    return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  };

  const getChildName = (childId) => {
    const child = children.find(c => c.id === childId);
    return child ? `${child.first_name} ${child.last_name}` : '';
  };

  const hasActiveFilters = selectedChild || selectedMonth || statusFilter !== 'all';

  const clearFilters = () => {
    setSelectedChild(null);
    setSelectedMonth(null);
    setStatusFilter('all');
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
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-primary-light to-white border-primary/20">
          <div className="p-4">
            <p className="text-sm text-foreground-muted mb-1">Total</p>
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
            <p className="text-sm text-foreground-muted mb-1">Payées</p>
            <p className="text-2xl font-bold text-slate-800">{stats.paid}</p>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-200">
          <div className="p-4">
            <p className="text-sm text-foreground-muted mb-1">À recevoir</p>
            <p className="text-2xl font-bold text-slate-800">{stats.remainingAmount.toFixed(0)}€</p>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-foreground-muted" />
            <h3 className="font-semibold text-slate-700">Filtres</h3>
            {hasActiveFilters && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearFilters}
                className="ml-auto"
                data-testid="clear-filters"
              >
                <X className="w-4 h-4 mr-1" />
                Effacer
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Filter by child */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Par enfant</label>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={!selectedChild ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedChild(null)}
                  data-testid="filter-all-children"
                >
                  Tous
                </Button>
                {children.map(child => (
                  <Button
                    key={child.id}
                    variant={selectedChild === child.id ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedChild(child.id)}
                    data-testid={`filter-child-${child.id}`}
                  >
                    {child.first_name}
                  </Button>
                ))}
              </div>
            </div>

            {/* Filter by month */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Par mois</label>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={!selectedMonth ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedMonth(null)}
                  data-testid="filter-all-months"
                >
                  Tous
                </Button>
                {availableMonths.slice(0, 4).map(month => (
                  <Button
                    key={month}
                    variant={selectedMonth === month ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedMonth(month)}
                    data-testid={`filter-month-${month}`}
                  >
                    {getMonthLabel(month)}
                  </Button>
                ))}
              </div>
            </div>

            {/* Filter by status */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Par statut</label>
              <div className="flex flex-wrap gap-2">
                <Button 
                  variant={statusFilter === 'all' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('all')}
                  data-testid="filter-all-status"
                >
                  Toutes
                </Button>
                <Button 
                  variant={statusFilter === 'en_attente_paiement' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('en_attente_paiement')}
                  data-testid="filter-pending"
                >
                  En attente
                </Button>
                <Button 
                  variant={statusFilter === 'impayee' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('impayee')}
                  data-testid="filter-overdue"
                >
                  Impayées
                </Button>
                <Button 
                  variant={statusFilter === 'payee' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('payee')}
                  data-testid="filter-paid"
                >
                  Payées
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Invoices list grouped by child */}
      {filteredInvoices.length > 0 ? (
        <div className="space-y-6">
          {/* Group invoices by child */}
          {children
            .filter(child => filteredInvoices.some(inv => inv.child_id === child.id))
            .map(child => {
              const childInvoices = filteredInvoices.filter(inv => inv.child_id === child.id);
              const childTotal = childInvoices.reduce((sum, inv) => sum + inv.amount_total, 0);
              const childRemaining = childInvoices.reduce((sum, inv) => sum + inv.amount_remaining, 0);

              return (
                <div key={child.id}>
                  {/* Child header */}
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar 
                      src={child.photo_url} 
                      firstName={child.first_name} 
                      lastName={child.last_name}
                      size="default"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-700">
                        {child.first_name} {child.last_name}
                      </h3>
                      <p className="text-sm text-foreground-muted">
                        {childInvoices.length} facture{childInvoices.length > 1 ? 's' : ''} • 
                        Total: {childTotal.toFixed(2)}€ • 
                        Reste: {childRemaining.toFixed(2)}€
                      </p>
                    </div>
                  </div>

                  {/* Invoices for this child */}
                  <div className="space-y-3 ml-12">
                    {childInvoices.map((invoice) => (
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
                                  <span className="hidden md:inline truncate">• {invoice.notes}</span>
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
                </div>
              );
            })}
        </div>
      ) : (
        <Card className="text-center py-12">
          <Receipt className="w-16 h-16 mx-auto mb-4 text-slate-300" />
          <p className="text-foreground-muted mb-2">
            {hasActiveFilters ? 'Aucune facture ne correspond aux filtres' : 'Aucune facture'}
          </p>
          {hasActiveFilters && (
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Effacer les filtres
            </Button>
          )}
        </Card>
      )}
    </div>
  );
};

export default Invoices;
