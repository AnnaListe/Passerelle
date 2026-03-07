import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { childrenAPI, appointmentsAPI } from '../lib/api';
import { Card } from '../components/ui/card';
import { Avatar } from '../components/ui/avatar';
import { Input } from '../components/ui/input';
import { Users, Search, Calendar, MessageCircle, FileText } from 'lucide-react';
import { formatDate, formatTime } from '../lib/utils';

const Children = () => {
  const [children, setChildren] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChildren();
    loadAppointments();
  }, []);

  const loadChildren = async () => {
    try {
      const response = await childrenAPI.list();
      setChildren(response.data);
    } catch (error) {
      console.error('Error loading children:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAppointments = async () => {
    try {
      const response = await appointmentsAPI.list();
      setAppointments(response.data);
    } catch (error) {
      console.error('Error loading appointments:', error);
    }
  };

  const getNextAppointment = (childId) => {
    const now = new Date();
    const childAppointments = appointments
      .filter(apt => apt.child_id === childId && new Date(apt.start_datetime) > now)
      .sort((a, b) => new Date(a.start_datetime) - new Date(b.start_datetime));
    return childAppointments[0];
  };

  const filteredChildren = children.filter(child => 
    child.first_name.toLowerCase().includes(search.toLowerCase()) ||
    child.last_name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in" data-testid="children-page">
      {/* Header */}
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-slate-800 font-outfit mb-2">
          Mes enfants
        </h1>
        <p className="text-foreground-muted">Enfants que vous accompagnez</p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <Input
          type="text"
          placeholder="Rechercher un enfant..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-11"
          data-testid="search-input"
        />
      </div>

      {/* Children Grid */}
      {filteredChildren.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredChildren.map((child) => {
            const nextApt = getNextAppointment(child.id);
            return (
              <Link
                key={child.id}
                to={`/children/${child.id}`}
                data-testid={`child-card-${child.id}`}
              >
                <Card interactive className="h-full">
                  <div className="flex items-start gap-4 mb-4">
                    <Avatar 
                      src={child.photo_url} 
                      firstName={child.first_name} 
                      lastName={child.last_name}
                      size="xl"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-slate-700 mb-1">
                        {child.first_name} {child.last_name}
                      </h3>
                      <p className="text-sm text-foreground-muted">{child.age} ans</p>
                    </div>
                  </div>

                  {nextApt && (
                    <div className="p-3 bg-primary-light rounded-lg mb-4">
                      <div className="flex items-center gap-2 text-sm text-primary font-medium mb-1">
                        <Calendar className="w-4 h-4" />
                        Prochain RDV
                      </div>
                      <p className="text-sm text-slate-700">
                        {formatDate(nextApt.start_datetime)} à {formatTime(nextApt.start_datetime)}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <div className="flex-1 p-2 bg-background-subtle rounded-lg text-center">
                      <MessageCircle className="w-4 h-4 mx-auto mb-1 text-foreground-muted" />
                      <p className="text-xs text-foreground-muted">Messages</p>
                    </div>
                    <div className="flex-1 p-2 bg-background-subtle rounded-lg text-center">
                      <FileText className="w-4 h-4 mx-auto mb-1 text-foreground-muted" />
                      <p className="text-xs text-foreground-muted">Documents</p>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        <Card className="text-center py-12">
          <Users className="w-16 h-16 mx-auto mb-4 text-slate-300" />
          <p className="text-foreground-muted">
            {search ? 'Aucun enfant trouvé' : 'Aucun enfant'}
          </p>
        </Card>
      )}
    </div>
  );
};

export default Children;
