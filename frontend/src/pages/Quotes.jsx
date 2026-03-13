import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { quotesAPI, childrenAPI } from '../lib/api';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Avatar } from '../components/ui/avatar';
import { FileText, Calendar, Euro, Plus, Filter } from 'lucide-react';
import { formatDate } from '../lib/utils';

const Quotes = () => {
  const [quotes, setQuotes] = useState([]);
  const [children, setChildren] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [quotesRes, childrenRes] = await Promise.all([
        quotesAPI.list(),
        childrenAPI.list()
      ]);
      setQuotes(quotesRes.data);
      setChildren(childrenRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
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

  const getChildName = (childId) => {
    const child = children.find(c => c.id === childId);
    return child ? `${child.first_name} ${child.last_name}` : '';
  };

  const filteredQuotes = filter === 'all' 
    ? quotes 
    : quotes.filter(quote => quote.status === filter);

  const stats = {
    total: quotes.length,
    draft: quotes.filter(q => q.status === 'brouillon').length,
    sent: quotes.filter(q => q.status === 'envoye').length,
    accepted: quotes.filter(q => q.status === 'accepte').length,
    refused: quotes.filter(q => q.status === 'refuse').length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in" data-testid="quotes-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800 font-outfit mb-2">
            Devis
          </h1>
          <p className="text-foreground-muted">Gestion de vos devis</p>
        </div>
        <Link to="/quotes/new">
          <Button data-testid="new-quote-button">
            <Plus className="w-4 h-4 mr-2" />
            Nouveau devis
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-primary-light to-white border-primary/20">
          <div className="p-4">
            <p className="text-sm text-foreground-muted mb-1">Total</p>
            <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-slate-50 to-white border-slate-200">
          <div className="p-4">
            <p className="text-sm text-foreground-muted mb-1">Brouillons</p>
            <p className="text-2xl font-bold text-slate-800">{stats.draft}</p>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-amber-50 to-white border-amber-200">
          <div className="p-4">
            <p className="text-sm text-foreground-muted mb-1">Envoyés</p>
            <p className="text-2xl font-bold text-slate-800">{stats.sent}</p>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-white border-green-200">
          <div className="p-4">
            <p className="text-sm text-foreground-muted mb-1">Acceptés</p>
            <p className="text-2xl font-bold text-slate-800">{stats.accepted}</p>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-red-50 to-white border-red-200">
          <div className="p-4">
            <p className="text-sm text-foreground-muted mb-1">Refusés</p>
            <p className="text-2xl font-bold text-slate-800">{stats.refused}</p>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <Filter className="w-5 h-5 text-foreground-muted flex-shrink-0" />
        <Button 
          variant={filter === 'all' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          Tous ({stats.total})
        </Button>
        <Button 
          variant={filter === 'brouillon' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setFilter('brouillon')}
        >
          Brouillons ({stats.draft})
        </Button>
        <Button 
          variant={filter === 'envoye' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setFilter('envoye')}
        >
          Envoyés ({stats.sent})
        </Button>
        <Button 
          variant={filter === 'accepte' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setFilter('accepte')}
        >
          Acceptés ({stats.accepted})
        </Button>
      </div>

      {/* Quotes List */}
      {filteredQuotes.length > 0 ? (
        <div className="space-y-3">
          {filteredQuotes.map((quote) => {
            const child = children.find(c => c.id === quote.child_id);
            return (
              <Link
                key={quote.id}
                to={`/quotes/${quote.id}`}
                data-testid={`quote-${quote.id}`}
              >
                <Card interactive>
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex-shrink-0">
                      <div className="p-3 bg-primary-light rounded-lg">
                        <FileText className="w-6 h-6 text-primary" />
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-3 mb-2">
                        <div className="flex-1">
                          <p className="font-semibold text-slate-700">{quote.quote_number}</p>
                          {child && (
                            <div className="flex items-center gap-2 mt-1">
                              <Avatar 
                                src={child.photo_url} 
                                firstName={child.first_name} 
                                lastName={child.last_name}
                                size="sm"
                              />
                              <span className="text-sm text-foreground-muted">
                                {child.first_name} {child.last_name}
                              </span>
                            </div>
                          )}
                        </div>
                        <Badge variant={getStatusVariant(quote.status)}>
                          {getStatusLabel(quote.status)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-foreground-muted">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(quote.issue_date)}
                        </div>
                        {quote.validity_date && (
                          <span>Valide jusqu'au {formatDate(quote.validity_date)}</span>
                        )}
                      </div>
                      {quote.description && (
                        <p className="text-sm text-foreground-muted mt-2 line-clamp-1">
                          {quote.description}
                        </p>
                      )}
                    </div>

                    <div className="flex-shrink-0 text-right">
                      <p className="text-sm text-foreground-muted mb-1">Estimation mensuelle</p>
                      <p className="text-xl font-bold text-slate-800">
                        ~{quote.estimated_monthly_amount.toFixed(0)}€
                      </p>
                      <Badge variant="info" className="mt-2">
                        {quote.billing_mode === 'par_seance' ? 'Par séance' : 'Tarif horaire'}
                      </Badge>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        <Card className="text-center py-12">
          <FileText className="w-16 h-16 mx-auto mb-4 text-slate-300" />
          <p className="text-foreground-muted mb-4">
            {filter === 'all' ? 'Aucun devis' : 'Aucun devis avec ce statut'}
          </p>
          <Link to="/quotes/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Créer un devis
            </Button>
          </Link>
        </Card>
      )}
    </div>
  );
};

export default Quotes;
