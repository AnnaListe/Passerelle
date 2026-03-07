import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { childrenAPI } from '../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Avatar } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { 
  ArrowLeft, User, School, Calendar, Heart, MessageCircle, 
  Activity, Target, Sparkles, Phone, Users, Mail
} from 'lucide-react';
import { formatDate } from '../lib/utils';

const ChildDetail = () => {
  const { childId } = useParams();
  const [child, setChild] = useState(null);
  const [loading, setLoading] = useState(true);

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
              <div className="flex gap-3 mt-4">
                <Link to={`/messages`}>
                  <Button size="sm" data-testid="message-parent-button">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Message parent
                  </Button>
                </Link>
                <Link to={`/planning?child=${childId}`}>
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
    </div>
  );
};

export default ChildDetail;
