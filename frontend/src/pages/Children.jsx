import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { childrenAPI, appointmentsAPI } from '../lib/api';
import { supabase } from '../lib/supabase';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Avatar } from '../components/ui/avatar';
import { Input } from '../components/ui/input';
import { Users, Search, Calendar, MessageCircle, FileText, Plus, Archive } from 'lucide-react';
import { formatDate, formatTime } from '../lib/utils';

const calculateAge = (birthDate) => {
  if (!birthDate) return null;
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

const Children = () => {
  const navigate = useNavigate();
  const [children, setChildren] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkEmail, setLinkEmail] = useState('');
  const [linkSearchResult, setLinkSearchResult] = useState(null);
  const [linkSearching, setLinkSearching] = useState(false);
  const [linking, setLinking] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [archivedChildren, setArchivedChildren] = useState([]);

  useEffect(() => {
    loadChildren();
    loadAppointments();
    loadArchivedChildren();
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

  const searchParentChildren = async () => {
    if (!linkEmail.trim()) return;
    setLinkSearching(true);
    setLinkSearchResult(null);
    try {
      const { data: parent } = await supabase.from('parents').select('*').eq('email', linkEmail.trim()).maybeSingle();
      if (!parent) { setLinkSearchResult({ found: false }); return; }
      const { data: links } = await supabase.from('parent_child_links').select('child_id').eq('parent_id', parent.id);
      if (!links?.length) { setLinkSearchResult({ found: true, parent, children: [] }); return; }
      const childIds = links.map(l => l.child_id);
      const { data: childrenData } = await supabase.from('children').select('*').in('id', childIds);
      setLinkSearchResult({ found: true, parent, children: childrenData || [] });
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setLinkSearching(false);
    }
  };

  const linkChild = async (child) => {
    setLinking(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('children').update({ professional_id: user.id }).eq('id', child.id);
      setShowLinkModal(false);
      setLinkEmail('');
      setLinkSearchResult(null);
      loadChildren();
    } catch (error) {
      console.error('Error linking:', error);
    } finally {
      setLinking(false);
    }
  };



  const unarchiveChild = async (childId, e) => {
    e.preventDefault();
    e.stopPropagation();
    await supabase.from('children').update({ archived: false, archived_at: null }).eq('id', childId);
    loadChildren();
    loadArchivedChildren();
  };

  const loadArchivedChildren = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data } = await supabase.from('children').select('*')
        .eq('professional_id', user.id)
        .eq('archived', true)
        .order('archived_at', { ascending: false });
      setArchivedChildren(data || []);
    } catch (error) {
      console.error('Error loading archived:', error);
    }
  };

  const archiveChild = async (childId, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm('Archiver cet enfant ?')) return;
    await supabase.from('children').update({ archived: true, archived_at: new Date().toISOString() }).eq('id', childId);
    loadChildren();
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800 font-outfit mb-2">
            Mes enfants
          </h1>
          <p className="text-foreground-muted">Enfants que vous accompagnez</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowLinkModal(true)}>
            <Users className="w-4 h-4 mr-2" />
            Lier un enfant existant
          </Button>
          <Link to="/children/new">
            <Button data-testid="create-child-button">
              <Plus className="w-4 h-4 mr-2" />
              Créer un nouvel enfant
            </Button>
          </Link>
        </div>
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
            const age = calculateAge(child.birth_date);
            return (
              <Link key={child.id} to={`/children/${child.id}`} data-testid={`child-card-${child.id}`}>
                <Card interactive className="h-full">
                  <div className="flex items-start gap-4 mb-4">
                    <Avatar src={child.photo_url} firstName={child.first_name} lastName={child.last_name} size="xl" />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-slate-700 mb-1">
                        {child.first_name} {child.last_name}
                      </h3>
                      <p className="text-sm text-foreground-muted">{age !== null ? `${age} ans` : ''}</p>
                    </div>
                  </div>
                  {nextApt ? (
                    <div className="p-3 bg-primary-light rounded-lg mb-4">
                      <div className="flex items-center gap-2 text-sm text-primary font-medium mb-1">
                        <Calendar className="w-4 h-4" />
                        Prochain RDV
                      </div>
                      <p className="text-sm text-slate-700">
                        {formatDate(nextApt.start_datetime)} à {formatTime(nextApt.start_datetime)}
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 bg-background-subtle rounded-lg mb-4">
                      <p className="text-sm text-foreground-muted text-center italic">Aucun RDV de prévu</p>
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
                    <div className="flex-1 p-2 bg-background-subtle rounded-lg text-center cursor-pointer hover:bg-red-50"
                      onClick={(e) => archiveChild(child.id, e)}>
                      <Archive className="w-4 h-4 mx-auto mb-1 text-foreground-muted" />
                      <p className="text-xs text-foreground-muted">Archiver</p>
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

      {/* Section archives */}
      <div>
        <button
          onClick={() => { setShowArchived(!showArchived); if (!showArchived) loadArchivedChildren(); }}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-600 font-semibold">
          <span>{showArchived ? '▼' : '▶'}</span> Archives ({archivedChildren.length})
        </button>
        {showArchived && archivedChildren.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4 opacity-60">
            {archivedChildren.map(child => (
              <div key={child.id} className="p-4 border border-dashed border-slate-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar src={child.photo_url} firstName={child.first_name} lastName={child.last_name} size="default" />
                  <div>
                    <p className="text-sm font-medium text-slate-600">{child.first_name} {child.last_name}</p>
                    <p className="text-xs text-slate-400">{calculateAge(child.birth_date)} ans</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={(e) => unarchiveChild(child.id, e)}>
                  Restaurer
                </Button>
              </div>
            ))}
          </div>
        )}
        {showArchived && archivedChildren.length === 0 && (
          <p className="text-sm text-slate-400 mt-3 italic">Aucun enfant archivé</p>
        )}
      </div>

      {/* Modal lier un enfant */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-bold text-slate-800 font-outfit mb-4">Lier un enfant existant</h3>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <input type="email" value={linkEmail} onChange={e => setLinkEmail(e.target.value)}
                    placeholder="Email du parent"
                    className="flex-1 h-10 px-3 border border-slate-200 rounded-lg text-sm"
                    onKeyDown={e => e.key === 'Enter' && searchParentChildren()} />
                  <Button onClick={searchParentChildren} disabled={linkSearching} size="sm">
                    {linkSearching ? '...' : 'Rechercher'}
                  </Button>
                </div>

                {linkSearchResult?.found === false && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm text-amber-700">Aucun compte parent trouvé avec cet email.</p>
                  </div>
                )}

                {linkSearchResult?.found && linkSearchResult.children.length === 0 && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-700">Compte trouvé : {linkSearchResult.parent.first_name} {linkSearchResult.parent.last_name}</p>
                    <p className="text-xs text-blue-600 mt-1">Ce parent n'a pas encore d'enfant enregistré.</p>
                  </div>
                )}

                {linkSearchResult?.found && linkSearchResult.children.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-slate-700">Enfants trouvés :</p>
                    {linkSearchResult.children.map(child => (
                      <div key={child.id} className="flex items-center justify-between p-3 bg-background-subtle rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-slate-700">{child.first_name} {child.last_name}</p>
                          <p className="text-xs text-foreground-muted">{calculateAge(child.birth_date)} ans</p>
                        </div>
                        <Button size="sm" onClick={() => linkChild(child)} disabled={linking}>
                          {linking ? '...' : 'Lier'}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <Button variant="outline" className="w-full" onClick={() => {
                  setShowLinkModal(false);
                  setLinkEmail('');
                  setLinkSearchResult(null);
                }}>
                  Fermer
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Children;
