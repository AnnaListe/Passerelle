import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardAPI } from '../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Avatar } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { Calendar, Users, MessageCircle, FileText, Receipt, Clock, ArrowRight, Euro } from 'lucide-react';
import { formatDate, formatTime, truncate } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const response = await dashboardAPI.stats();
      setStats(response.data);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const getInvoiceVariant = (status) => {
    const variants = {
      'payee': 'success',
      'en_attente_paiement': 'pending',
      'partiellement_payee': 'warning',
      'impayee': 'error',
      'brouillon': 'default'
    };
    return variants[status] || 'default';
  };

  const getInvoiceLabel = (status) => {
    const labels = {
      'payee': 'Payée',
      'en_attente_paiement': 'En attente',
      'partiellement_payee': 'Partielle',
      'impayee': 'Impayée',
      'brouillon': 'Brouillon'
    };
    return labels[status] || status;
  };

  return (
    <div className="space-y-8 animate-in" data-testid="dashboard">
      {/* Header */}
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-slate-800 font-outfit mb-2">
          Bonjour, {user?.first_name}
        </h1>
        <p className="text-foreground-muted">Voici un aperçu de votre activité</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary-light to-white border-primary/20">
          <CardContent className="pt-6">
            <Users className="w-8 h-8 text-primary mb-3" strokeWidth={1.5} />
            <p className="text-3xl font-bold text-slate-800">{stats?.recent_children?.length || 0}</p>
            <p className="text-sm text-foreground-muted mt-1">Enfants suivis</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-secondary-light to-white border-secondary/20">
          <CardContent className="pt-6">
            <Calendar className="w-8 h-8 text-secondary mb-3" strokeWidth={1.5} />
            <p className="text-3xl font-bold text-slate-800">{stats?.upcoming_appointments?.length || 0}</p>
            <p className="text-sm text-foreground-muted mt-1">RDV à venir</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-white border-amber-200">
          <CardContent className="pt-6">
            <Receipt className="w-8 h-8 text-amber-600 mb-3" strokeWidth={1.5} />
            <p className="text-3xl font-bold text-slate-800">{stats?.pending_invoices_count || 0}</p>
            <p className="text-sm text-foreground-muted mt-1">En attente</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-white border-red-200">
          <CardContent className="pt-6">
            <Receipt className="w-8 h-8 text-red-600 mb-3" strokeWidth={1.5} />
            <p className="text-3xl font-bold text-slate-800">{stats?.overdue_invoices_count || 0}</p>
            <p className="text-sm text-foreground-muted mt-1">Impayées</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Larger cards */}
        <div className="lg:col-span-2 space-y-6">
          {/* Upcoming Appointments */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-light rounded-lg">
                  <Calendar className="w-5 h-5 text-primary" strokeWidth={1.5} />
                </div>
                <CardTitle>Prochains rendez-vous</CardTitle>
              </div>
              <Link to="/planning">
                <Button variant="ghost" size="sm" data-testid="view-all-appointments">
                  Voir tout
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {stats?.upcoming_appointments?.length > 0 ? (
                <div className="space-y-3">
                  {stats.upcoming_appointments.map((apt) => (
                    <div 
                      key={apt.id}
                      className="flex items-center gap-4 p-4 bg-background-subtle rounded-xl hover:bg-primary-light/30 transition-colors"
                      data-testid={`appointment-${apt.id}`}
                    >
                      <div className="flex-shrink-0 text-center">
                        <div className="text-2xl font-bold text-primary">
                          {new Date(apt.start_datetime).getDate()}
                        </div>
                        <div className="text-xs text-foreground-muted uppercase">
                          {new Date(apt.start_datetime).toLocaleDateString('fr-FR', { month: 'short' })}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-700">{apt.title}</p>
                        <p className="text-sm text-foreground-muted">{apt.appointment_type}</p>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <div className="flex items-center gap-1 text-sm font-medium text-slate-600">
                          <Clock className="w-4 h-4" />
                          {formatTime(apt.start_datetime)}
                        </div>
                        <p className="text-xs text-foreground-muted mt-1">{apt.location}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-foreground-muted">
                  <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Aucun rendez-vous à venir</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Children */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-secondary-light rounded-lg">
                  <Users className="w-5 h-5 text-secondary" strokeWidth={1.5} />
                </div>
                <CardTitle>Enfants suivis</CardTitle>
              </div>
              <Link to="/children">
                <Button variant="ghost" size="sm" data-testid="view-all-children">
                  Voir tout
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {stats?.recent_children?.map((child) => (
                  <Link
                    key={child.id}
                    to={`/children/${child.id}`}
                    data-testid={`child-card-${child.id}`}
                  >
                    <div className="flex items-center gap-3 p-4 bg-background-subtle rounded-xl hover:bg-primary-light/30 hover:shadow-md transition-all">
                      <Avatar 
                        src={child.photo_url} 
                        firstName={child.first_name} 
                        lastName={child.last_name}
                        size="lg"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-700">{child.first_name} {child.last_name}</p>
                        <p className="text-sm text-foreground-muted">{child.age} ans</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Recent Messages */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <MessageCircle className="w-5 h-5 text-blue-600" strokeWidth={1.5} />
                </div>
                <CardTitle className="text-lg">Messages</CardTitle>
              </div>
              <Link to="/messages">
                <Button variant="ghost" size="sm" data-testid="view-all-messages">
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {stats?.recent_messages?.length > 0 ? (
                <div className="space-y-3">
                  {stats.recent_messages.map((conv) => (
                    <Link
                      key={conv.conversation.id}
                      to={`/messages/${conv.conversation.id}`}
                      className="block"
                      data-testid={`message-${conv.conversation.id}`}
                    >
                      <div className="flex items-start gap-3 p-3 bg-background-subtle rounded-xl hover:bg-primary-light/30 transition-colors">
                        <Avatar 
                          firstName={conv.parent?.first_name} 
                          lastName={conv.parent?.last_name}
                          size="sm"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-700">
                            {conv.parent?.first_name} {conv.parent?.last_name}
                          </p>
                          <p className="text-xs text-foreground-muted truncate">
                            {truncate(conv.last_message?.content, 40)}
                          </p>
                        </div>
                        {conv.unread_count > 0 && (
                          <Badge variant="error" className="text-xs">{conv.unread_count}</Badge>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-foreground-muted text-sm">
                  <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p>Aucun message récent</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Invoices */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-50 rounded-lg">
                  <Receipt className="w-5 h-5 text-amber-600" strokeWidth={1.5} />
                </div>
                <CardTitle className="text-lg">Factures</CardTitle>
              </div>
              <Link to="/invoices">
                <Button variant="ghost" size="sm" data-testid="view-all-invoices">
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {stats?.recent_invoices?.length > 0 ? (
                <div className="space-y-3">
                  {stats.recent_invoices.map((invoice) => (
                    <Link
                      key={invoice.id}
                      to={`/invoices/${invoice.id}`}
                      className="block"
                      data-testid={`invoice-${invoice.id}`}
                    >
                      <div className="flex items-center justify-between p-3 bg-background-subtle rounded-xl hover:bg-primary-light/30 transition-colors">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-700">{invoice.invoice_number}</p>
                          <Badge variant={getInvoiceVariant(invoice.status)} className="mt-1">
                            {getInvoiceLabel(invoice.status)}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-slate-700">{invoice.amount_total}€</p>
                          {invoice.amount_remaining > 0 && (
                            <p className="text-xs text-red-600">Reste: {invoice.amount_remaining}€</p>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-foreground-muted text-sm">
                  <Receipt className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p>Aucune facture récente</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
