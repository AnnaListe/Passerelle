import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { childrenAPI } from '../lib/api';
import { supabase } from '../lib/supabase';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Avatar } from '../components/ui/avatar';
import { Button } from '../components/ui/button';
import { Input, Label } from '../components/ui/input';
import { 
  ArrowLeft, Save, User, School, Activity, MessageCircle, 
  Target, Users, Sparkles, ChevronDown, ChevronUp, Plus, Trash2, Calendar
} from 'lucide-react';

const SCHOOLING_TYPES = [
  { value: 'classe_ordinaire', label: 'Classe ordinaire' },
  { value: 'ulis', label: 'ULIS' },
  { value: 'uema', label: "Unité d'Enseignement Maternelle Autisme (UEMA)" },
  { value: 'ueea', label: "Unité d'Enseignement Élémentaire Autisme (UEEA)" },
  { value: 'ime', label: 'IME / Institution' },
  { value: 'aucune', label: 'Aucune prise en charge ou scolarisation' },
];

const DAYS_OF_WEEK = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

const GOALS_OPTIONS = [
  { key: 'autonomy', label: 'Autonomie (habillage, repas, toilette, transitions, etc.)' },
  { key: 'toilet_training', label: 'Acquisition de la propreté diurne' },
  { key: 'socialization', label: 'Socialisation (jeux, interactions, gestion de groupe, etc.)' },
  { key: 'emotions', label: 'Émotions (expression, régulation, compréhension)' },
  { key: 'language_communication', label: 'Langage / communication' },
  { key: 'motor_skills', label: 'Motricité (fine, globale, coordination, schéma corporel)' },
  { key: 'environment_support', label: "Environnement de l'enfant (adaptations à la maison, routines, supports visuels, etc.)" },
];

// Accordion Section Component
const AccordionSection = ({ title, icon: Icon, iconBg, isOpen, onToggle, children }) => (
  <Card className="overflow-hidden">
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center justify-between p-4 hover:bg-background-subtle/50 transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className={`p-2 ${iconBg} rounded-lg`}>
          <Icon className="w-5 h-5" />
        </div>
        <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
      </div>
      {isOpen ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
    </button>
    {isOpen && (
      <CardContent className="border-t border-slate-100 pt-6">
        {children}
      </CardContent>
    )}
  </Card>
);

const ChildForm = () => {
  const { childId } = useParams();
  const navigate = useNavigate();
  const isEditing = !!childId;

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  // Accordion state
  const [openSections, setOpenSections] = useState({
    general: true,
    schooling: false,
    medical: false,
    communication: false,
    goals: false,
    family: false,
    additional: false,
  });

  // Form state
  const [formData, setFormData] = useState({
    // Section I - Informations générales
    photo_url: '',
    first_name: '',
    last_name: '',
    birth_date: '',
    address: '',
    housing_type: 'maison',
    own_bedroom: null,
    siblings_count: '',
    parents_separated: null,
    
    // Section II - Scolarisation
    is_schooled_or_institution: null,
    schooling_description: '',
    school_name: '',
    schooling_type: '',
    institution_name: '',
    
    // Section II - Emploi du temps
    weekly_schedule: [],
    
    // Section II suite - Médical
    treatment_active: false,
    treatment_details: '',
    orthophonist_active: false,
    orthophonist_frequency: '',
    psychologist_active: false,
    psychologist_frequency: '',
    psychomotor_active: false,
    psychomotor_frequency: '',
    occupational_therapist_active: false,
    occupational_therapist_frequency: '',
    sessad_active: false,
    sessad_frequency: '',
    other_professionals: '',
    
    // Section III - Communication
    communication_verbal: false,
    communication_non_verbal: false,
    communication_alternative: false,
    alternative_communication_details: '',
    comprehension_level: '',
    
    // Section IV - Objectifs
    goals_autonomy: false,
    goals_autonomy_details: '',
    goals_toilet_training: false,
    goals_toilet_training_details: '',
    goals_socialization: false,
    goals_socialization_details: '',
    goals_emotions: false,
    goals_emotions_details: '',
    goals_language: false,
    goals_language_details: '',
    goals_motor: false,
    goals_motor_details: '',
    goals_environment: false,
    goals_environment_details: '',
    other_goals: '',
    
    // Section V - Famille
    parent1_name: '',
    parent1_phone: '',
    parent1_email: '',
    parent2_name: '',
    parent2_phone: '',
    parent2_email: '',
    
    // Section VI - Informations complémentaires
    free_notes: '',
  });

  useEffect(() => {
    if (isEditing) {
      loadChildData();
    }
  }, [childId]);

  const loadChildData = async () => {
    try {
      const response = await childrenAPI.detail(childId);
      const data = response.data;
      
      setFormData({
        // General
        first_name: data.child?.first_name || '',
        last_name: data.child?.last_name || '',
        birth_date: data.child?.birth_date || '',
        address: data.child?.address || '',
        housing_type: data.child?.housing_type || 'maison',
        own_bedroom: data.child?.own_bedroom,
        siblings_count: data.child?.siblings_count ?? '',
        parents_separated: data.child?.parents_separated,
        
        // Schooling
        is_schooled_or_institution: data.schooling?.is_schooled_or_institution,
        schooling_description: data.schooling?.schooling_description || '',
        school_name: data.schooling?.school_name || '',
        schooling_type: data.schooling?.schooling_type || '',
        institution_name: data.schooling?.institution_name || '',
        
        // Weekly schedule
        weekly_schedule: data.weekly_schedule || [],
        
        // Medical
        treatment_active: data.medical_profile?.treatment_active || false,
        treatment_details: data.medical_profile?.treatment_details || '',
        orthophonist_active: data.medical_profile?.orthophonist_active || false,
        orthophonist_frequency: data.medical_profile?.orthophonist_frequency || '',
        psychologist_active: data.medical_profile?.psychologist_active || false,
        psychologist_frequency: data.medical_profile?.psychologist_frequency || '',
        psychomotor_active: data.medical_profile?.psychomotor_active || false,
        psychomotor_frequency: data.medical_profile?.psychomotor_frequency || '',
        occupational_therapist_active: data.medical_profile?.occupational_therapist_active || false,
        occupational_therapist_frequency: data.medical_profile?.occupational_therapist_frequency || '',
        sessad_active: data.medical_profile?.sessad_active || false,
        sessad_frequency: data.medical_profile?.sessad_frequency || '',
        other_professionals: data.medical_profile?.other_professionals || '',
        
        // Communication
        communication_verbal: data.communication_profile?.communication_type === 'verbal',
        communication_non_verbal: data.communication_profile?.communication_type === 'non_verbal',
        communication_alternative: !!data.communication_profile?.alternative_communication_details,
        alternative_communication_details: data.communication_profile?.alternative_communication_details || '',
        comprehension_level: data.communication_profile?.comprehension_level || '',
        
        // Goals
        goals_autonomy: !!data.goals?.autonomy,
        goals_autonomy_details: data.goals?.autonomy || '',
        goals_toilet_training: !!data.goals?.toilet_training,
        goals_toilet_training_details: data.goals?.toilet_training || '',
        goals_socialization: !!data.goals?.socialization,
        goals_socialization_details: data.goals?.socialization || '',
        goals_emotions: !!data.goals?.emotions,
        goals_emotions_details: data.goals?.emotions || '',
        goals_language: !!data.goals?.language_communication,
        goals_language_details: data.goals?.language_communication || '',
        goals_motor: !!data.goals?.motor_skills,
        goals_motor_details: data.goals?.motor_skills || '',
        goals_environment: !!data.goals?.environment_support,
        goals_environment_details: data.goals?.environment_support || '',
        other_goals: data.goals?.other_goals || '',
        
        // Family
        parent1_name: data.family_contacts?.parent1_name || '',
        parent1_phone: data.family_contacts?.parent1_phone || '',
        parent1_email: data.family_contacts?.parent1_email || '',
        parent2_name: data.family_contacts?.parent2_name || '',
        parent2_phone: data.family_contacts?.parent2_phone || '',
        parent2_email: data.family_contacts?.parent2_email || '',
        
        // Additional
        free_notes: data.additional_info?.free_notes || '',
      });
    } catch (err) {
      console.error('Error loading child:', err);
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const calculateAge = (birthDate) => {
    if (!birthDate) return '';
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const addScheduleEntry = () => {
    setFormData(prev => ({
      ...prev,
      weekly_schedule: [
        ...prev.weekly_schedule,
        {
          id: `new-${Date.now()}`,
          day_of_week: 'lundi',
          start_time: '09:00',
          end_time: '10:00',
          label: '',
          category: 'autre',
          location: ''
        }
      ]
    }));
  };

  const updateScheduleEntry = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      weekly_schedule: prev.weekly_schedule.map((entry, i) => 
        i === index ? { ...entry, [field]: value } : entry
      )
    }));
  };

  const removeScheduleEntry = (index) => {
    setFormData(prev => ({
      ...prev,
      weekly_schedule: prev.weekly_schedule.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const payload = {
        // Child basic info
        photo_url: formData.photo_url || null,
        first_name: formData.first_name,
        last_name: formData.last_name,
        birth_date: formData.birth_date,
        address: formData.address || null,
        housing_type: formData.housing_type,
        own_bedroom: formData.own_bedroom,
        siblings_count: formData.siblings_count ? parseInt(formData.siblings_count) : null,
        parents_separated: formData.parents_separated,
        
        // Schooling
        schooling: {
          is_schooled_or_institution: formData.is_schooled_or_institution,
          schooling_description: formData.schooling_description || null,
          school_name: formData.school_name || null,
          schooling_type: formData.schooling_type || null,
          institution_name: formData.schooling_type === 'ime' ? formData.institution_name : null,
        },
        
        // Weekly schedule
        weekly_schedule: formData.weekly_schedule,
        
        // Medical profile
        medical_profile: {
          treatment_active: formData.treatment_active,
          treatment_details: formData.treatment_details || null,
          orthophonist_active: formData.orthophonist_active,
          orthophonist_frequency: formData.orthophonist_frequency || null,
          psychologist_active: formData.psychologist_active,
          psychologist_frequency: formData.psychologist_frequency || null,
          psychomotor_active: formData.psychomotor_active,
          psychomotor_frequency: formData.psychomotor_frequency || null,
          occupational_therapist_active: formData.occupational_therapist_active,
          occupational_therapist_frequency: formData.occupational_therapist_frequency || null,
          sessad_active: formData.sessad_active,
          sessad_frequency: formData.sessad_frequency || null,
          other_professionals: formData.other_professionals || null,
        },
        
        // Communication profile
        communication_profile: {
          communication_type: formData.communication_verbal ? 'verbal' : 
                             formData.communication_non_verbal ? 'non_verbal' : 'alternatif',
          alternative_communication_details: formData.alternative_communication_details || null,
          comprehension_level: formData.comprehension_level || null,
        },
        
        // Goals
        goals: {
          autonomy: formData.goals_autonomy ? (formData.goals_autonomy_details || 'Oui') : null,
          toilet_training: formData.goals_toilet_training ? (formData.goals_toilet_training_details || 'Oui') : null,
          socialization: formData.goals_socialization ? (formData.goals_socialization_details || 'Oui') : null,
          emotions: formData.goals_emotions ? (formData.goals_emotions_details || 'Oui') : null,
          language_communication: formData.goals_language ? (formData.goals_language_details || 'Oui') : null,
          motor_skills: formData.goals_motor ? (formData.goals_motor_details || 'Oui') : null,
          environment_support: formData.goals_environment ? (formData.goals_environment_details || 'Oui') : null,
          other_goals: formData.other_goals || null,
        },
        
        // Family contacts
        family_contacts: {
          parent1_name: formData.parent1_name || null,
          parent1_phone: formData.parent1_phone || null,
          parent1_email: formData.parent1_email || null,
          parent2_name: formData.parent2_name || null,
          parent2_phone: formData.parent2_phone || null,
          parent2_email: formData.parent2_email || null,
        },
        
        // Additional info
        additional_info: {
          free_notes: formData.free_notes || null,
        },
      };

      if (isEditing) {
        await childrenAPI.update(childId, payload);
        navigate(`/children/${childId}`);
      } else {
        const response = await childrenAPI.create(payload);
        navigate(`/children/${response.data.id}`);
      }
    } catch (err) {
      console.error('Error saving child:', err);
      setError(err.response?.data?.detail || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const age = calculateAge(formData.birth_date);

  return (
    <div className="space-y-6 animate-in pb-24" data-testid="child-form">
      {/* Back Button */}
      <Link to="/children">
        <Button variant="ghost" data-testid="back-button">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>
      </Link>

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 bg-primary rounded-lg">
          <User className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 font-outfit">
            {isEditing ? 'Modifier la fiche enfant' : 'Nouvel enfant'}
          </h1>
          <p className="text-foreground-muted">
            {isEditing ? 'Modifiez les informations de l\'enfant' : 'Créez une nouvelle fiche enfant complète'}
          </p>
        </div>
      </div>

      {error && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="pt-4">
            <p className="text-red-600 text-sm">{error}</p>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
      {/* Photo de profil */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-6">
              <div className="relative">
                <Avatar
                  src={formData.photo_url}
                  firstName={formData.first_name}
                  lastName={formData.last_name}
                  size="xl"
                  className="w-24 h-24 text-2xl"
                />
                <label className="absolute bottom-0 right-0 bg-primary text-white rounded-full p-1.5 cursor-pointer hover:bg-primary/90 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files[0];
                      if (!file) return;
                      const fileExt = file.name.split('.').pop();
                      const fileName = `child-${Date.now()}.${fileExt}`;
                      const { data, error } = await supabase.storage
                        .from('avatar')
                        .upload(fileName, file, { upsert: true });
                      if (!error) {
                        const { data: urlData } = supabase.storage
                          .from('avatar')
                          .getPublicUrl(fileName);
                        setFormData({...formData, photo_url: urlData.publicUrl});
                      }
                    }}
                  />
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                </label>
              </div>
              <div>
                <p className="font-medium text-slate-700">Photo de profil</p>
                <p className="text-sm text-foreground-muted">Cliquez sur l'icône pour ajouter une photo</p>
              </div>
            </div>
          </CardContent>
        </Card>
        {/* SECTION I - Informations générales */}
        <AccordionSection
          title="I - Informations générales"
          icon={User}
          iconBg="bg-primary-light text-primary"
          isOpen={openSections.general}
          onToggle={() => toggleSection('general')}
        >
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first_name">Prénom *</Label>
                <Input
                  id="first_name"
                  data-testid="first-name-input"
                  value={formData.first_name}
                  onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="last_name">Nom *</Label>
                <Input
                  id="last_name"
                  data-testid="last-name-input"
                  value={formData.last_name}
                  onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="birth_date">Date de naissance *</Label>
                <Input
                  id="birth_date"
                  type="date"
                  data-testid="birth-date-input"
                  value={formData.birth_date}
                  onChange={(e) => setFormData({...formData, birth_date: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label>Âge (calculé automatiquement)</Label>
                <div className="bg-input rounded-xl px-4 py-3 text-slate-700">
                  {age ? `${age} ans` : '-'}
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="address">Adresse complète</Label>
              <textarea
                id="address"
                data-testid="address-input"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                className="w-full bg-input border-transparent focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl px-4 py-3 text-slate-700 outline-none min-h-[80px]"
                placeholder="Numéro, rue, code postal, ville..."
              />
            </div>

            <div>
              <Label>Environnement de vie</Label>
              <div className="flex gap-4 mt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="housing_type"
                    value="maison"
                    checked={formData.housing_type === 'maison'}
                    onChange={(e) => setFormData({...formData, housing_type: e.target.value})}
                    className="w-4 h-4 text-primary"
                  />
                  <span className="text-slate-700">Maison</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="housing_type"
                    value="appartement"
                    checked={formData.housing_type === 'appartement'}
                    onChange={(e) => setFormData({...formData, housing_type: e.target.value})}
                    className="w-4 h-4 text-primary"
                  />
                  <span className="text-slate-700">Appartement</span>
                </label>
              </div>
            </div>

            <div>
              <Label>L'enfant dispose-t-il de sa propre chambre ?</Label>
              <div className="flex gap-4 mt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="own_bedroom"
                    checked={formData.own_bedroom === true}
                    onChange={() => setFormData({...formData, own_bedroom: true})}
                    className="w-4 h-4 text-primary"
                  />
                  <span className="text-slate-700">Oui</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="own_bedroom"
                    checked={formData.own_bedroom === false}
                    onChange={() => setFormData({...formData, own_bedroom: false})}
                    className="w-4 h-4 text-primary"
                  />
                  <span className="text-slate-700">Non</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="siblings_count">Nombre de frères et soeurs</Label>
                <Input
                  id="siblings_count"
                  type="number"
                  min="0"
                  data-testid="siblings-input"
                  value={formData.siblings_count}
                  onChange={(e) => setFormData({...formData, siblings_count: e.target.value})}
                />
              </div>
              <div>
                <Label>Parents séparés ?</Label>
                <div className="flex gap-4 mt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="parents_separated"
                      checked={formData.parents_separated === true}
                      onChange={() => setFormData({...formData, parents_separated: true})}
                      className="w-4 h-4 text-primary"
                    />
                    <span className="text-slate-700">Oui</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="parents_separated"
                      checked={formData.parents_separated === false}
                      onChange={() => setFormData({...formData, parents_separated: false})}
                      className="w-4 h-4 text-primary"
                    />
                    <span className="text-slate-700">Non</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </AccordionSection>

        {/* SECTION II - Scolarisation */}
        <AccordionSection
          title="II - Situation scolaire et accompagnements extérieurs"
          icon={School}
          iconBg="bg-secondary-light text-secondary"
          isOpen={openSections.schooling}
          onToggle={() => toggleSection('schooling')}
        >
          <div className="space-y-6">
            <div>
              <Label>L'enfant est-il scolarisé ou en institution ?</Label>
              <div className="flex gap-4 mt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="is_schooled"
                    checked={formData.is_schooled_or_institution === true}
                    onChange={() => setFormData({...formData, is_schooled_or_institution: true})}
                    className="w-4 h-4 text-primary"
                  />
                  <span className="text-slate-700">Oui</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="is_schooled"
                    checked={formData.is_schooled_or_institution === false}
                    onChange={() => setFormData({...formData, is_schooled_or_institution: false})}
                    className="w-4 h-4 text-primary"
                  />
                  <span className="text-slate-700">Non</span>
                </label>
              </div>
            </div>

            {formData.is_schooled_or_institution && (
              <>
                <div>
                  <Label htmlFor="schooling_description">Décrivez la situation</Label>
                  <textarea
                    id="schooling_description"
                    value={formData.schooling_description}
                    onChange={(e) => setFormData({...formData, schooling_description: e.target.value})}
                    className="w-full bg-input border-transparent focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl px-4 py-3 text-slate-700 outline-none min-h-[80px]"
                    placeholder="Description de la situation scolaire..."
                  />
                </div>

                <div>
                  <Label htmlFor="school_name">Établissement fréquenté</Label>
                  <Input
                    id="school_name"
                    value={formData.school_name}
                    onChange={(e) => setFormData({...formData, school_name: e.target.value})}
                    placeholder="Nom de l'établissement"
                  />
                </div>

                <div>
                  <Label>Type de scolarisation</Label>
                  <div className="space-y-2 mt-2">
                    {SCHOOLING_TYPES.map(type => (
                      <label key={type.value} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="schooling_type"
                          value={type.value}
                          checked={formData.schooling_type === type.value}
                          onChange={(e) => setFormData({...formData, schooling_type: e.target.value})}
                          className="w-4 h-4 text-primary"
                        />
                        <span className="text-slate-700">{type.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {formData.schooling_type === 'ime' && (
                  <div>
                    <Label htmlFor="institution_name">Nom de l'institution</Label>
                    <Input
                      id="institution_name"
                      value={formData.institution_name}
                      onChange={(e) => setFormData({...formData, institution_name: e.target.value})}
                      placeholder="Précisez le nom de l'IME ou institution"
                    />
                  </div>
                )}
              </>
            )}

            {/* Emploi du temps hebdomadaire */}
            <div className="pt-6 border-t border-slate-100">
              <div className="flex items-center justify-between mb-4">
                <Label className="text-base">Emploi du temps hebdomadaire</Label>
                <Button type="button" variant="outline" size="sm" onClick={addScheduleEntry}>
                  <Plus className="w-4 h-4 mr-1" />
                  Ajouter
                </Button>
              </div>
              
              {formData.weekly_schedule.length > 0 ? (
                <div className="space-y-3">
                  {formData.weekly_schedule.map((entry, index) => (
                    <div key={entry.id} className="p-4 bg-background-subtle rounded-xl">
                      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                        <select
                          value={entry.day_of_week}
                          onChange={(e) => updateScheduleEntry(index, 'day_of_week', e.target.value)}
                          className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm"
                        >
                          {DAYS_OF_WEEK.map((day, i) => (
                            <option key={day} value={day.toLowerCase()}>{day}</option>
                          ))}
                        </select>
                        <Input
                          type="time"
                          value={entry.start_time}
                          onChange={(e) => updateScheduleEntry(index, 'start_time', e.target.value)}
                          className="text-sm"
                        />
                        <Input
                          type="time"
                          value={entry.end_time}
                          onChange={(e) => updateScheduleEntry(index, 'end_time', e.target.value)}
                          className="text-sm"
                        />
                        <Input
                          placeholder="Activité"
                          value={entry.label}
                          onChange={(e) => updateScheduleEntry(index, 'label', e.target.value)}
                          className="text-sm"
                        />
                        <select
                          value={entry.category}
                          onChange={(e) => updateScheduleEntry(index, 'category', e.target.value)}
                          className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm"
                        >
                          <option value="ecole">École</option>
                          <option value="soin">Soin</option>
                          <option value="activite">Activité</option>
                          <option value="autre">Autre</option>
                        </select>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeScheduleEntry(index)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="mt-2">
                        <Input
                          placeholder="Lieu (optionnel)"
                          value={entry.location || ''}
                          onChange={(e) => updateScheduleEntry(index, 'location', e.target.value)}
                          className="text-sm"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-foreground-muted text-center py-4">
                  Aucun créneau ajouté. Cliquez sur "Ajouter" pour créer un emploi du temps.
                </p>
              )}
            </div>
          </div>
        </AccordionSection>

        {/* SECTION II suite - Médical et paramédical */}
        <AccordionSection
          title="II suite - Médical et paramédical"
          icon={Activity}
          iconBg="bg-red-50 text-red-600"
          isOpen={openSections.medical}
          onToggle={() => toggleSection('medical')}
        >
          <div className="space-y-6">
            {/* Traitement */}
            <div className="p-4 bg-background-subtle rounded-xl">
              <div className="flex items-center gap-4 mb-3">
                <Label className="mb-0">Traitement en cours</Label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={formData.treatment_active === true}
                      onChange={() => setFormData({...formData, treatment_active: true})}
                      className="w-4 h-4 text-primary"
                    />
                    <span className="text-slate-700">Oui</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={formData.treatment_active === false}
                      onChange={() => setFormData({...formData, treatment_active: false})}
                      className="w-4 h-4 text-primary"
                    />
                    <span className="text-slate-700">Non</span>
                  </label>
                </div>
              </div>
              {formData.treatment_active && (
                <Input
                  placeholder="Détails du traitement"
                  value={formData.treatment_details}
                  onChange={(e) => setFormData({...formData, treatment_details: e.target.value})}
                />
              )}
            </div>

            {/* Professionnels */}
            {[
              { key: 'orthophonist', label: 'Orthophoniste' },
              { key: 'psychologist', label: 'Psychologue / Neuropsychologue' },
              { key: 'psychomotor', label: 'Psychomotricien(ne)' },
              { key: 'occupational_therapist', label: 'Ergothérapeute' },
              { key: 'sessad', label: 'SESSAD' },
            ].map(pro => (
              <div key={pro.key} className="p-4 bg-background-subtle rounded-xl">
                <div className="flex items-center gap-4 mb-3">
                  <Label className="mb-0 min-w-[200px]">{pro.label}</Label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={formData[`${pro.key}_active`] === true}
                        onChange={() => setFormData({...formData, [`${pro.key}_active`]: true})}
                        className="w-4 h-4 text-primary"
                      />
                      <span className="text-slate-700">Oui</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={formData[`${pro.key}_active`] === false}
                        onChange={() => setFormData({...formData, [`${pro.key}_active`]: false})}
                        className="w-4 h-4 text-primary"
                      />
                      <span className="text-slate-700">Non</span>
                    </label>
                  </div>
                </div>
                {formData[`${pro.key}_active`] && (
                  <Input
                    placeholder="Fréquence (ex: 1x/semaine)"
                    value={formData[`${pro.key}_frequency`]}
                    onChange={(e) => setFormData({...formData, [`${pro.key}_frequency`]: e.target.value})}
                  />
                )}
              </div>
            ))}

            <div>
              <Label htmlFor="other_professionals">Autres professionnels</Label>
              <textarea
                id="other_professionals"
                value={formData.other_professionals}
                onChange={(e) => setFormData({...formData, other_professionals: e.target.value})}
                className="w-full bg-input border-transparent focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl px-4 py-3 text-slate-700 outline-none min-h-[80px]"
                placeholder="Autres professionnels intervenant auprès de l'enfant..."
              />
            </div>
          </div>
        </AccordionSection>

        {/* SECTION III - Communication */}
        <AccordionSection
          title="III - Communication et profil de l'enfant"
          icon={MessageCircle}
          iconBg="bg-purple-50 text-purple-600"
          isOpen={openSections.communication}
          onToggle={() => toggleSection('communication')}
        >
          <div className="space-y-6">
            <div>
              <Label>Mode de communication (plusieurs choix possibles)</Label>
              <div className="space-y-3 mt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.communication_verbal}
                    onChange={(e) => setFormData({...formData, communication_verbal: e.target.checked})}
                    className="w-4 h-4 text-primary rounded"
                  />
                  <span className="text-slate-700">Verbal</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.communication_non_verbal}
                    onChange={(e) => setFormData({...formData, communication_non_verbal: e.target.checked})}
                    className="w-4 h-4 text-primary rounded"
                  />
                  <span className="text-slate-700">Non verbal</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.communication_alternative}
                    onChange={(e) => setFormData({...formData, communication_alternative: e.target.checked})}
                    className="w-4 h-4 text-primary rounded"
                  />
                  <span className="text-slate-700">Utilise un moyen alternatif de communication</span>
                </label>
              </div>
            </div>

            {formData.communication_alternative && (
              <div>
                <Label htmlFor="alternative_details">Précisez le moyen alternatif</Label>
                <Input
                  id="alternative_details"
                  value={formData.alternative_communication_details}
                  onChange={(e) => setFormData({...formData, alternative_communication_details: e.target.value})}
                  placeholder="Pictogrammes, PECS, tablette, gestes, etc."
                />
              </div>
            )}

            <div>
              <Label htmlFor="comprehension_level">Langage et compréhension</Label>
              <textarea
                id="comprehension_level"
                value={formData.comprehension_level}
                onChange={(e) => setFormData({...formData, comprehension_level: e.target.value})}
                className="w-full bg-input border-transparent focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl px-4 py-3 text-slate-700 outline-none min-h-[100px]"
                placeholder="Décrivez le niveau de compréhension de l'enfant..."
              />
            </div>
          </div>
        </AccordionSection>

        {/* SECTION IV - Objectifs */}
        <AccordionSection
          title="IV - Points à travailler / objectifs prioritaires"
          icon={Target}
          iconBg="bg-amber-50 text-amber-600"
          isOpen={openSections.goals}
          onToggle={() => toggleSection('goals')}
        >
          <div className="space-y-4">
            <p className="text-sm text-foreground-muted">
              Cochez les domaines à travailler et précisez si besoin.
            </p>
            
            {[
              { key: 'autonomy', label: 'Autonomie (habillage, repas, toilette, transitions, etc.)' },
              { key: 'toilet_training', label: 'Acquisition de la propreté diurne' },
              { key: 'socialization', label: 'Socialisation (jeux, interactions, gestion de groupe, etc.)' },
              { key: 'emotions', label: 'Émotions (expression, régulation, compréhension)' },
              { key: 'language', label: 'Langage / communication' },
              { key: 'motor', label: 'Motricité (fine, globale, coordination, schéma corporel)' },
              { key: 'environment', label: "Environnement de l'enfant (adaptations à la maison, routines, supports visuels, etc.)" },
            ].map(goal => (
              <div key={goal.key} className="p-4 bg-background-subtle rounded-xl">
                <label className="flex items-center gap-2 cursor-pointer mb-2">
                  <input
                    type="checkbox"
                    checked={formData[`goals_${goal.key}`]}
                    onChange={(e) => setFormData({...formData, [`goals_${goal.key}`]: e.target.checked})}
                    className="w-4 h-4 text-primary rounded"
                  />
                  <span className="text-slate-700">{goal.label}</span>
                </label>
                {formData[`goals_${goal.key}`] && (
                  <Input
                    placeholder="Précisions (optionnel)"
                    value={formData[`goals_${goal.key}_details`]}
                    onChange={(e) => setFormData({...formData, [`goals_${goal.key}_details`]: e.target.value})}
                    className="mt-2"
                  />
                )}
              </div>
            ))}

            <div>
              <Label htmlFor="other_goals">Autre(s) point(s) spécifique(s)</Label>
              <textarea
                id="other_goals"
                value={formData.other_goals}
                onChange={(e) => setFormData({...formData, other_goals: e.target.value})}
                className="w-full bg-input border-transparent focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl px-4 py-3 text-slate-700 outline-none min-h-[80px]"
                placeholder="Autres points à travailler..."
              />
            </div>
          </div>
        </AccordionSection>

        {/* SECTION V - Famille */}
        <AccordionSection
          title="V - Famille et contacts"
          icon={Users}
          iconBg="bg-blue-50 text-blue-600"
          isOpen={openSections.family}
          onToggle={() => toggleSection('family')}
        >
          <div className="space-y-6">
            <div className="p-4 bg-background-subtle rounded-xl">
              <h4 className="font-medium text-slate-700 mb-4">Parent 1</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="parent1_name">Nom et prénom</Label>
                  <Input
                    id="parent1_name"
                    value={formData.parent1_name}
                    onChange={(e) => setFormData({...formData, parent1_name: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="parent1_phone">Téléphone</Label>
                  <Input
                    id="parent1_phone"
                    type="tel"
                    value={formData.parent1_phone}
                    onChange={(e) => setFormData({...formData, parent1_phone: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="parent1_email">Email</Label>
                  <Input
                    id="parent1_email"
                    type="email"
                    value={formData.parent1_email}
                    onChange={(e) => setFormData({...formData, parent1_email: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div className="p-4 bg-background-subtle rounded-xl">
              <h4 className="font-medium text-slate-700 mb-4">Parent 2</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="parent2_name">Nom et prénom</Label>
                  <Input
                    id="parent2_name"
                    value={formData.parent2_name}
                    onChange={(e) => setFormData({...formData, parent2_name: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="parent2_phone">Téléphone</Label>
                  <Input
                    id="parent2_phone"
                    type="tel"
                    value={formData.parent2_phone}
                    onChange={(e) => setFormData({...formData, parent2_phone: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="parent2_email">Email</Label>
                  <Input
                    id="parent2_email"
                    type="email"
                    value={formData.parent2_email}
                    onChange={(e) => setFormData({...formData, parent2_email: e.target.value})}
                  />
                </div>
              </div>
            </div>
          </div>
        </AccordionSection>

        {/* SECTION VI - Informations complémentaires */}
        <AccordionSection
          title="VI - Informations complémentaires"
          icon={Sparkles}
          iconBg="bg-pink-50 text-pink-600"
          isOpen={openSections.additional}
          onToggle={() => toggleSection('additional')}
        >
          <div>
            <Label htmlFor="free_notes">Notes libres</Label>
            <textarea
              id="free_notes"
              value={formData.free_notes}
              onChange={(e) => setFormData({...formData, free_notes: e.target.value})}
              className="w-full bg-input border-transparent focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl px-4 py-3 text-slate-700 outline-none min-h-[200px]"
              placeholder="Attraits, passions, personnage préféré, habitudes quotidiennes, situations particulières, alimentation, allergies, notes libres..."
            />
          </div>
        </AccordionSection>

        {/* Submit Button */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 md:pl-72 z-30">
          <div className="max-w-4xl mx-auto flex gap-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => navigate('/children')}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={saving || !formData.first_name || !formData.last_name || !formData.birth_date}
              data-testid="submit-button"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Enregistrement...' : isEditing ? 'Enregistrer' : 'Créer l\'enfant'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ChildForm;
