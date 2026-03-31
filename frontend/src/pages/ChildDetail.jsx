import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { childrenAPI, conversationsAPI, contractsAPI, appointmentsAPI, invoicesAPI } from '../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Avatar } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { Input, Label } from '../components/ui/input';
import { 
  ArrowLeft, User, School, Calendar, Heart, MessageCircle, 
  Activity, Target, Sparkles, Phone, Users, Mail, FileText, Edit2, Receipt
} from 'lucide-react';
import { formatDate } from '../lib/utils';
import { supabase } from '../lib/supabase';

const ChildDetail = () => {
  const { childId } = useParams();
  const navigate = useNavigate();
  const [child, setChild] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceData, setInvoiceData] = useState({
    period_start: '',
    period_end: '',
  });
  const [invoicePreview, setInvoicePreview] = useState(null);
  const [creatingInvoice, setCreatingInvoice] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteSearchResult, setInviteSearchResult] = useState(null);
  const [inviteSearching, setInviteSearching] = useState(false);
  const [inviteSending, setInviteSending] = useState(false);
  const [inviteCode, setInviteCode] = useState(null);

  useEffect(() => {
    loadChildDetail();
  }, [childId]);

  const loadChildDetail = async () => {
    try {
      const response = await childrenAPI.detail(childId);
      setChild(response.data);
    } catch (error) {
      console.error('Error loading child:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMessageParent = async () => {
    try {
      // Get conversations list
      const conversationsRes = await conversationsAPI.list();
      // Find conversation for this child
      const conversation = conversationsRes.data.find(conv => conv.conversation.child_id === childId);
      
      if (conversation) {
        navigate(`/messages/parent/${conversation.conversation.id}`);
      } else {
        // If no conversation exists, redirect to messages page
        navigate('/messages');
      }
    } catch (error) {
      console.error('Error finding conversation:', error);
      navigate('/messages');
    }
  };

  const loadInvoicePreview = async () => {
    if (!invoiceData.period_start || !invoiceData.period_end) return;
    try {
      const contractsRes = await contractsAPI.list({ child_id: childId });
      const activeContract = contractsRes.data?.find(c => c.active);
      if (!activeContract) {
        setInvoicePreview({ error: 'Aucun contrat actif trouvé' });
        return;
      }

      const appointmentsRes = await appointmentsAPI.listByChild(childId, {
        start_date: new Date(invoiceData.period_start).toISOString(),
        end_date: new Date(invoiceData.period_end + 'T23:59:59').toISOString()
      }).catch(() => ({ data: [] }));

      const appointments = appointmentsRes.data || [];
      const seances = appointments.filter(a => a.appointment_type === 'seance');

      let totalAmount = 0;
      let overrunTotal = 0;

      if (activeContract.billing_mode === 'par_seance') {
        totalAmount = seances.reduce((sum, apt) => {
          const overrun = apt.overrun_amount || 0;
          overrunTotal += overrun;
          return sum + activeContract.session_price + overrun;
        }, 0);
      } else {
        totalAmount = seances.reduce((sum, apt) => {
          const start = new Date(apt.start_datetime);
          const end = new Date(apt.end_datetime);
          const realMinutes = (end - start) / 60000;
          const roundedMinutes = Math.round(realMinutes / 15) * 15;
          const sessionAmount = Math.round(activeContract.hourly_rate * (roundedMinutes / 60) * 100) / 100;
          const overrun = apt.overrun_amount || 0;
          overrunTotal += overrun;
          return sum + sessionAmount + overrun;
        }, 0);
      }

      setInvoicePreview({
        contract: activeContract,
        appointments,
        seances,
        sessionCount: seances.length,
        totalAmount: Math.round(totalAmount * 100) / 100,
        overrunTotal: Math.round(overrunTotal * 100) / 100,
      });
    } catch (err) {
      console.error('Error loading preview:', err);
    }
  };

  useEffect(() => {
    if (showInvoiceModal) {
      loadInvoicePreview();
    }
  }, [invoiceData.period_start, invoiceData.period_end, showInvoiceModal]);

  const handleCreateInvoice = async () => {
    if (!invoicePreview || invoicePreview.error) return;
    setCreatingInvoice(true);
    try {
      await invoicesAPI.createFromContract({
        child_id: childId,
        period_start: invoiceData.period_start,
        period_end: invoiceData.period_end,
      });
      setShowInvoiceModal(false);
      navigate('/invoices');
    } catch (err) {
      console.error('Error creating invoice:', err);
    } finally {
      setCreatingInvoice(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!child) {
    return (
      <div className="text-center py-12">
        <p className="text-foreground-muted">Enfant non trouvé</p>
      </div>
    );
  }

  const daysOrder = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
  const scheduleByDay = daysOrder.map(day => ({
    day,
    items: (child.weekly_schedule || []).filter(s => s.day_of_week === day)
  }));

  const searchParentByEmail = async () => {
    if (!inviteEmail.trim()) return;
    setInviteSearching(true);
    setInviteSearchResult(null);
    try {
      const { data } = await supabase.from('parents').select('*').eq('email', inviteEmail.trim()).maybeSingle();
      if (data) {
        setInviteSearchResult({ found: true, parent: data });
      } else {
        setInviteSearchResult({ found: false });
      }
    } catch (error) {
      console.error('Error searching parent:', error);
    } finally {
      setInviteSearching(false);
    }
  };

  const sendInvitation = async () => {
    setInviteSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (inviteSearchResult?.found) {
        // Parent existe — créer une notification
        await supabase.from('notifications').insert({
          user_id: inviteSearchResult.parent.id,
          type: 'liaison_demande',
          title: 'Demande de liaison',
          message: `Un professionnel souhaite vous lier à l'enfant ${child.child.first_name} ${child.child.last_name}`,
          data: { child_id: childId, professional_id: user.id },
        });
        setInviteSearchResult(prev => ({ ...prev, sent: true }));
      } else {
        // Parent n'existe pas — générer un code
        const code = 'PASS-' + Math.random().toString(36).substr(2, 6).toUpperCase();
        await supabase.from('parent_invitations').insert({
          token: code,
          child_id: childId,
          professional_id: user.id,
          parent_email: inviteEmail.trim(),
          status: 'pending',
        });
        setInviteCode(code);
      }
    } catch (error) {
      console.error('Error sending invitation:', error);
    } finally {
      setInviteSending(false);
    }
  };

  return (
    <div className="space-y-6 animate-in" data-testid="child-detail">
      {/* Back Button */}
      <Link to="/children">
        <Button variant="ghost" data-testid="back-button">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>
      </Link>

      {/* Header */}
      <Card className="bg-gradient-to-br from-primary-light to-white border-primary/20">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-start gap-6">
            <Avatar 
              src={child.child.photo_url} 
              firstName={child.child.first_name} 
              lastName={child.child.last_name}
              size="xl"
              className="w-24 h-24 text-2xl"
            />
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-slate-800 font-outfit mb-2">
                {child.child.first_name} {child.child.last_name}
              </h1>
              <div className="flex flex-wrap gap-4 text-sm text-foreground-muted">
                <span>{child.child.age} ans</span>
                <span>•</span>
                <span>Né(e) le {formatDate(child.child.birth_date)}</span>
              </div>
              <div className="flex flex-wrap gap-3 mt-4">
                <Button size="sm" onClick={handleMessageParent} data-testid="message-parent-button">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Message parent
                </Button>
                <Link to={`/children/${childId}/planning`}>
                  <Button variant="secondary" size="sm" data-testid="view-schedule-button">
                    <Calendar className="w-4 h-4 mr-2" />
                    Planning
                  </Button>
                </Link>
                <Link to={`/contracts/${childId}`}>
                  <Button variant="outline" size="sm" data-testid="view-contract-button">
                    Contrat
                  </Button>
                </Link>
                <Link to={`/quotes/new?child=${childId}`}>
                  <Button variant="outline" size="sm" data-testid="create-quote-button">
                    <FileText className="w-4 h-4 mr-2" />
                    Nouveau devis
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowInvoiceModal(true)}
                  data-testid="create-invoice-button"
                >
                  <Receipt className="w-4 h-4 mr-2" />
                  Créer une facture
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowInviteModal(true)}>
                  <Users className="w-4 h-4 mr-2" />
                  Inviter un parent
                </Button>
                <Link to={`/children/${childId}/edit`}>
                  <Button variant="ghost" size="sm" data-testid="edit-child-button">
                    <Edit2 className="w-4 h-4 mr-2" />
                    Modifier la fiche
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* General Info */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-light rounded-lg">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <CardTitle>Informations générales</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {child.child.address && (
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-1">Adresse</p>
                  <p className="text-sm text-slate-700">{child.child.address}</p>
                </div>
              )}
              {child.child.housing_type && (
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-1">Type de logement</p>
                  <p className="text-sm text-slate-700">{child.child.housing_type}</p>
                </div>
              )}
              {child.child.own_bedroom !== null && (
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-1">Chambre personnelle</p>
                  <p className="text-sm text-slate-700">{child.child.own_bedroom ? 'Oui' : 'Non'}</p>
                </div>
              )}
              {child.child.siblings_count !== null && (
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-1">Frères et sœurs</p>
                  <p className="text-sm text-slate-700">{child.child.siblings_count}</p>
                </div>
              )}
              {child.child.parents_separated !== null && (
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-1">Situation familiale</p>
                  <p className="text-sm text-slate-700">
                    {child.child.parents_separated ? 'Parents séparés' : 'Parents ensemble'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Schooling */}
          {child.schooling && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-secondary-light rounded-lg">
                    <School className="w-5 h-5 text-secondary" />
                  </div>
                  <CardTitle>Scolarisation</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {child.schooling.school_name && (
                  <div>
                    <p className="text-sm font-medium text-slate-600 mb-1">École</p>
                    <p className="text-sm text-slate-700">{child.schooling.school_name}</p>
                  </div>
                )}
                {child.schooling.schooling_type && (
                  <div>
                    <p className="text-sm font-medium text-slate-600 mb-1">Type de scolarisation</p>
                    <p className="text-sm text-slate-700">{child.schooling.schooling_type}</p>
                  </div>
                )}
                {child.schooling.schooling_description && (
                  <div>
                    <p className="text-sm font-medium text-slate-600 mb-1">Description</p>
                    <p className="text-sm text-slate-700">{child.schooling.schooling_description}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Weekly Schedule */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <CardTitle>Planning hebdomadaire</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {scheduleByDay.map(({ day, items }) => (
                  <div key={day} className="border-b border-slate-100 last:border-0 pb-4 last:pb-0">
                    <p className="text-sm font-semibold text-slate-700 mb-2 capitalize">{day}</p>
                    {items.length > 0 ? (
                      <div className="space-y-2">
                        {items.map((item) => (
                          <div 
                            key={item.id}
                            className="flex items-center gap-3 p-3 bg-background-subtle rounded-lg"
                          >
                            <div className="flex-shrink-0 text-xs font-medium text-primary">
                              {item.start_time} - {item.end_time}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-slate-700">{item.label}</p>
                              {item.location && (
                                <p className="text-xs text-foreground-muted">{item.location}</p>
                              )}
                            </div>
                            <Badge variant={item.category === 'soin' ? 'active' : 'info'} className="text-xs">
                              {item.category}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-foreground-muted italic">Aucune activité</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Medical Profile */}
          {child.medical_profile && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-50 rounded-lg">
                    <Activity className="w-5 h-5 text-red-600" />
                  </div>
                  <CardTitle>Suivi médical et paramédical</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {child.medical_profile.treatment_active && (
                  <div>
                    <p className="text-sm font-medium text-slate-600 mb-1">Traitement</p>
                    <p className="text-sm text-slate-700">{child.medical_profile.treatment_details || 'Oui'}</p>
                  </div>
                )}
                {child.medical_profile.orthophonist_active && (
                  <div>
                    <p className="text-sm font-medium text-slate-600 mb-1">Orthophoniste</p>
                    <p className="text-sm text-slate-700">{child.medical_profile.orthophonist_frequency || 'Oui'}</p>
                  </div>
                )}
                {child.medical_profile.psychologist_active && (
                  <div>
                    <p className="text-sm font-medium text-slate-600 mb-1">Psychologue</p>
                    <p className="text-sm text-slate-700">{child.medical_profile.psychologist_frequency || 'Oui'}</p>
                  </div>
                )}
                {child.medical_profile.psychomotor_active && (
                  <div>
                    <p className="text-sm font-medium text-slate-600 mb-1">Psychomotricien</p>
                    <p className="text-sm text-slate-700">{child.medical_profile.psychomotor_frequency || 'Oui'}</p>
                  </div>
                )}
                {child.medical_profile.occupational_therapist_active && (
                  <div>
                    <p className="text-sm font-medium text-slate-600 mb-1">Ergothérapeute</p>
                    <p className="text-sm text-slate-700">{child.medical_profile.occupational_therapist_frequency || 'Oui'}</p>
                  </div>
                )}
                {child.medical_profile.sessad_active && (
                  <div>
                    <p className="text-sm font-medium text-slate-600 mb-1">SESSAD</p>
                    <p className="text-sm text-slate-700">{child.medical_profile.sessad_frequency || 'Oui'}</p>
                  </div>
                )}
                {child.medical_profile.other_professionals && (
                  <div>
                    <p className="text-sm font-medium text-slate-600 mb-1">Autres professionnels</p>
                    <p className="text-sm text-slate-700">{child.medical_profile.other_professionals}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Communication Profile */}
          {child.communication_profile && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-50 rounded-lg">
                    <MessageCircle className="w-5 h-5 text-purple-600" />
                  </div>
                  <CardTitle>Communication</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-1">Type de communication</p>
                  <Badge variant="info">{child.communication_profile.communication_type}</Badge>
                </div>
                {child.communication_profile.alternative_communication_details && (
                  <div>
                    <p className="text-sm font-medium text-slate-600 mb-1">Communication alternative</p>
                    <p className="text-sm text-slate-700">{child.communication_profile.alternative_communication_details}</p>
                  </div>
                )}
                {child.communication_profile.comprehension_level && (
                  <div>
                    <p className="text-sm font-medium text-slate-600 mb-1">Niveau de compréhension</p>
                    <p className="text-sm text-slate-700">{child.communication_profile.comprehension_level}</p>
                  </div>
                )}
                {child.communication_profile.notes && (
                  <div>
                    <p className="text-sm font-medium text-slate-600 mb-1">Notes</p>
                    <p className="text-sm text-slate-700">{child.communication_profile.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Goals */}
          {child.goals && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-50 rounded-lg">
                    <Target className="w-5 h-5 text-amber-600" />
                  </div>
                  <CardTitle>Objectifs de travail</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {child.goals.autonomy && (
                  <div>
                    <p className="text-sm font-medium text-slate-600 mb-1">Autonomie</p>
                    <p className="text-sm text-slate-700">{child.goals.autonomy}</p>
                  </div>
                )}
                {child.goals.toilet_training && (
                  <div>
                    <p className="text-sm font-medium text-slate-600 mb-1">Propreté</p>
                    <p className="text-sm text-slate-700">{child.goals.toilet_training}</p>
                  </div>
                )}
                {child.goals.socialization && (
                  <div>
                    <p className="text-sm font-medium text-slate-600 mb-1">Socialisation</p>
                    <p className="text-sm text-slate-700">{child.goals.socialization}</p>
                  </div>
                )}
                {child.goals.emotions && (
                  <div>
                    <p className="text-sm font-medium text-slate-600 mb-1">Émotions</p>
                    <p className="text-sm text-slate-700">{child.goals.emotions}</p>
                  </div>
                )}
                {child.goals.language_communication && (
                  <div>
                    <p className="text-sm font-medium text-slate-600 mb-1">Langage / Communication</p>
                    <p className="text-sm text-slate-700">{child.goals.language_communication}</p>
                  </div>
                )}
                {child.goals.motor_skills && (
                  <div>
                    <p className="text-sm font-medium text-slate-600 mb-1">Motricité</p>
                    <p className="text-sm text-slate-700">{child.goals.motor_skills}</p>
                  </div>
                )}
                {child.goals.environment_support && (
                  <div>
                    <p className="text-sm font-medium text-slate-600 mb-1">Environnement</p>
                    <p className="text-sm text-slate-700">{child.goals.environment_support}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Additional Info */}
          {child.additional_info && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-pink-50 rounded-lg">
                    <Sparkles className="w-5 h-5 text-pink-600" />
                  </div>
                  <CardTitle>Informations complémentaires</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {child.additional_info.interests && (
                  <div>
                    <p className="text-sm font-medium text-slate-600 mb-1">Intérêts</p>
                    <p className="text-sm text-slate-700">{child.additional_info.interests}</p>
                  </div>
                )}
                {child.additional_info.passions && (
                  <div>
                    <p className="text-sm font-medium text-slate-600 mb-1">Passions</p>
                    <p className="text-sm text-slate-700">{child.additional_info.passions}</p>
                  </div>
                )}
                {child.additional_info.favorite_character && (
                  <div>
                    <p className="text-sm font-medium text-slate-600 mb-1">Personnage préféré</p>
                    <p className="text-sm text-slate-700">{child.additional_info.favorite_character}</p>
                  </div>
                )}
                {child.additional_info.food_notes && (
                  <div>
                    <p className="text-sm font-medium text-slate-600 mb-1">Alimentation</p>
                    <p className="text-sm text-slate-700">{child.additional_info.food_notes}</p>
                  </div>
                )}
                {child.additional_info.allergies && (
                  <div>
                    <p className="text-sm font-medium text-slate-600 mb-1">Allergies</p>
                    <Badge variant="error">{child.additional_info.allergies}</Badge>
                  </div>
                )}
                {child.additional_info.habits && (
                  <div>
                    <p className="text-sm font-medium text-slate-600 mb-1">Habitudes</p>
                    <p className="text-sm text-slate-700">{child.additional_info.habits}</p>
                  </div>
                )}
                {child.additional_info.special_situations && (
                  <div>
                    <p className="text-sm font-medium text-slate-600 mb-1">Situations particulières</p>
                    <p className="text-sm text-slate-700">{child.additional_info.special_situations}</p>
                  </div>
                )}
                {child.additional_info.free_notes && (
                  <div>
                    <p className="text-sm font-medium text-slate-600 mb-1">Notes</p>
                    <p className="text-sm text-slate-700">{child.additional_info.free_notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Professionals */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-50 rounded-lg">
                  <Users className="w-5 h-5 text-green-600" />
                </div>
                <CardTitle className="text-lg">Professionnels</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {child.professionals && child.professionals.length > 0 ? (
                child.professionals.map((pro) => (
                  <div 
                    key={pro.id}
                    className="p-3 bg-background-subtle rounded-lg"
                    data-testid={`professional-${pro.id}`}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar 
                        src={pro.avatar_url} 
                        firstName={pro.first_name} 
                        lastName={pro.last_name}
                        size="default"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-700">
                          {pro.first_name} {pro.last_name}
                        </p>
                        <p className="text-xs text-foreground-muted">{pro.profession}</p>
                        {pro.specialty && (
                          <p className="text-xs text-foreground-muted">{pro.specialty}</p>
                        )}
                        <div className="mt-2 flex items-center gap-2">
                          {pro.has_passerelle_account ? (
                            <>
                              <Badge variant="success" className="text-xs">
                                Sur Passerelle
                              </Badge>
                              <Link to="/messages">
                                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                                  <MessageCircle className="w-3 h-3 mr-1" />
                                  Contacter
                                </Button>
                              </Link>
                            </>
                          ) : (
                            <Badge variant="default" className="text-xs">
                              Hors plateforme
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-foreground-muted text-center py-4">
                  Aucun autre professionnel enregistré
                </p>
              )}
            </CardContent>
          </Card>

          {/* Family Contacts */}
          {child.family_contacts && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Phone className="w-5 h-5 text-blue-600" />
                  </div>
                  <CardTitle className="text-lg">Contacts famille</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {child.family_contacts.parent1_name && (
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-2">
                      {child.family_contacts.parent1_name}
                    </p>
                    {child.family_contacts.parent1_phone && (
                      <div className="flex items-center gap-2 text-sm text-foreground-muted mb-1">
                        <Phone className="w-4 h-4" />
                        {child.family_contacts.parent1_phone}
                      </div>
                    )}
                    {child.family_contacts.parent1_email && (
                      <div className="flex items-center gap-2 text-sm text-foreground-muted">
                        <Mail className="w-4 h-4" />
                        {child.family_contacts.parent1_email}
                      </div>
                    )}
                  </div>
                )}
                {child.family_contacts.parent2_name && (
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-2">
                      {child.family_contacts.parent2_name}
                    </p>
                    {child.family_contacts.parent2_phone && (
                      <div className="flex items-center gap-2 text-sm text-foreground-muted mb-1">
                        <Phone className="w-4 h-4" />
                        {child.family_contacts.parent2_phone}
                      </div>
                    )}
                    {child.family_contacts.parent2_email && (
                      <div className="flex items-center gap-2 text-sm text-foreground-muted">
                        <Mail className="w-4 h-4" />
                        {child.family_contacts.parent2_email}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Invoice Creation Modal */}

      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle>Inviter un parent</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!inviteCode ? (
                <>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={e => setInviteEmail(e.target.value)}
                      placeholder="Email du parent"
                      className="flex-1 h-10 px-3 border border-slate-200 rounded-lg text-sm"
                      onKeyDown={e => e.key === 'Enter' && searchParentByEmail()}
                    />
                    <Button onClick={searchParentByEmail} disabled={inviteSearching} size="sm">
                      {inviteSearching ? '...' : 'Rechercher'}
                    </Button>
                  </div>

                  {inviteSearchResult?.found && !inviteSearchResult?.sent && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-700 font-semibold">
                        ✓ Compte trouvé : {inviteSearchResult.parent.first_name} {inviteSearchResult.parent.last_name}
                      </p>
                      <p className="text-xs text-green-600 mt-1">Une notification sera envoyée dans son application.</p>
                      <Button className="mt-3 w-full" size="sm" onClick={sendInvitation} disabled={inviteSending}>
                        {inviteSending ? 'Envoi...' : 'Envoyer la demande de liaison'}
                      </Button>
                    </div>
                  )}

                  {inviteSearchResult?.sent && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-700 font-semibold">✓ Demande envoyée !</p>
                      <p className="text-xs text-green-600 mt-1">Le parent recevra une notification dans son application.</p>
                    </div>
                  )}

                  {inviteSearchResult?.found === false && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-sm text-amber-700 font-semibold">Aucun compte trouvé</p>
                      <p className="text-xs text-amber-600 mt-1">Générez un code d'invitation à communiquer au parent.</p>
                      <Button className="mt-3 w-full" size="sm" onClick={sendInvitation} disabled={inviteSending}>
                        {inviteSending ? 'Génération...' : 'Générer un code d\'invitation'}
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-slate-600 mb-3">Code d'invitation généré :</p>
                  <div className="bg-primary/10 border-2 border-primary/30 rounded-2xl p-6">
                    <p className="text-3xl font-bold text-primary tracking-widest">{inviteCode}</p>
                  </div>
                  <p className="text-xs text-slate-500 mt-3">Communiquez ce code au parent. Il devra le saisir lors de la création de son compte ou dans ses paramètres.</p>
                </div>
              )}

              <Button variant="outline" className="w-full" onClick={() => {
                setShowInviteModal(false);
                setInviteEmail('');
                setInviteSearchResult(null);
                setInviteCode(null);
              }}>
                Fermer
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {showInvoiceModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-lg w-full">
            <CardHeader>
              <CardTitle>Créer une facture</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Period Selection */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="period_start">Début de période</Label>
                    <Input
                      id="period_start"
                      type="date"
                      value={invoiceData.period_start}
                      onChange={(e) => setInvoiceData({...invoiceData, period_start: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="period_end">Fin de période</Label>
                    <Input
                      id="period_end"
                      type="date"
                      value={invoiceData.period_end}
                      onChange={(e) => setInvoiceData({...invoiceData, period_end: e.target.value})}
                    />
                  </div>
                </div>

                {/* Preview */}
                {invoicePreview && !invoicePreview.error && (
                  <div className="p-4 bg-background-subtle rounded-xl space-y-3">
                    <h4 className="font-semibold text-slate-700">Aperçu de la facture</h4>
                    
                    <div className="text-sm space-y-2">
                      <div className="flex justify-between">
                        <span className="text-foreground-muted">Enfant:</span>
                        <span className="font-medium">{child.child.first_name} {child.child.last_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-foreground-muted">Mode de facturation:</span>
                        <span className="font-medium">
                          {invoicePreview.contract.billing_mode === 'par_seance' ? 'À la séance' : 'Tarif horaire'}
                        </span>
                      </div>
                      {invoicePreview.contract.billing_mode === 'par_seance' && (
                        <div className="flex justify-between">
                          <span className="text-foreground-muted">Prix par séance:</span>
                          <span className="font-medium">{invoicePreview.contract.session_price}€</span>
                        </div>
                      )}
                      {invoicePreview.contract.billing_mode === 'tarif_horaire' && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-foreground-muted">Tarif horaire:</span>
                            <span className="font-medium">{invoicePreview.contract.hourly_rate}€/h</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-foreground-muted">Durée séance:</span>
                            <span className="font-medium">{invoicePreview.contract.session_duration_minutes} min</span>
                          </div>
                        </>
                      )}
                      <div className="flex justify-between">
                        <span className="text-foreground-muted">Séances sur la période:</span>
                        <span className="font-medium">{invoicePreview.sessionCount}</span>
                      </div>

                      {/* Détail des séances */}
                      <div className="mt-3 space-y-2">
                        {invoicePreview.seances.map((apt, i) => {
                          const start = new Date(apt.start_datetime);
                          const end = new Date(apt.end_datetime);
                          const realMinutes = Math.round((end - start) / 60000 / 15) * 15;
                          const aptDate = start.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
                          let sessionAmount = 0;
                          if (invoicePreview.contract.billing_mode === 'par_seance') {
                            sessionAmount = invoicePreview.contract.session_price;
                          } else {
                            sessionAmount = Math.round(invoicePreview.contract.hourly_rate * (realMinutes / 60) * 100) / 100;
                          }
                          return (
                            <div key={apt.id}>
                              <div className="flex justify-between text-xs p-2 bg-white rounded-lg border border-slate-100">
                                <span className="text-slate-600">
                                  {aptDate} — {apt.title}
                                  {invoicePreview.contract.billing_mode === 'tarif_horaire' && (
                                    <span className="text-slate-400 ml-1">({realMinutes} min)</span>
                                  )}
                                </span>
                                <span className="font-medium text-slate-700">{sessionAmount.toFixed(2)}€</span>
                              </div>
                              {apt.overrun_amount && (
                                <div className="flex justify-between text-xs p-2 bg-amber-50 rounded-lg border border-amber-100 mt-1">
                                  <span className="text-amber-600">
                                    ⏱ Dépassement {apt.overrun_minutes ? `(${apt.overrun_minutes} min)` : ''}
                                  </span>
                                  <span className="font-medium text-amber-700">{apt.overrun_amount.toFixed(2)}€</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      <div className="pt-3 border-t border-slate-200">
                        <div className="flex justify-between text-lg">
                          <span className="font-semibold text-slate-700">Total:</span>
                          <span className="font-bold text-primary">{invoicePreview.totalAmount.toFixed(2)}€</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {invoicePreview?.error && (
                  <div className="p-4 bg-red-50 rounded-xl">
                    <p className="text-red-600 text-sm">{invoicePreview.error}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowInvoiceModal(false)}
                  >
                    Annuler
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleCreateInvoice}
                    disabled={!invoicePreview || invoicePreview.error || creatingInvoice || invoicePreview?.sessionCount === 0}
                  >
                    <Receipt className="w-4 h-4 mr-2" />
                    {creatingInvoice ? 'Création...' : 'Créer la facture'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ChildDetail;
