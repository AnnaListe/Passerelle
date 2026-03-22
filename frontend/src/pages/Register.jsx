import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Heart, Users, Shield, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabase';

const PROFESSIONS = [
  'Orthophoniste',
  'Psychomotricien(ne)',
  'Ergothérapeute',
  'Psychologue / Neuropsychologue',
  'Éducateur(rice) spécialisé(e)',
  'Éducateur(rice) de jeunes enfants',
  'Assistant(e) de service social',
  'Infirmier(ère)',
  'Médecin',
  'Kinésithérapeute',
  'ABA Thérapeute',
  'AVS / AESH',
  'Ostéopathe',
  'Diététicien(ne)',
  'Orthoptiste',
  'Sophrologie / Relaxation',
  'Art-thérapeute',
  'Autre',
];

const ACCOUNT_TYPES = [
  {
    key: 'professional',
    icon: Users,
    title: 'Professionnel',
    desc: 'Orthophoniste, psychomotricien, éducateur spécialisé...',
    color: 'text-primary',
    bg: 'bg-primary/8',
    border: 'border-primary',
    ring: 'ring-primary/20',
  },
  {
    key: 'parent',
    icon: Heart,
    title: 'Parent / Famille',
    desc: 'Suivez le parcours de votre enfant au quotidien',
    color: 'text-rose-500',
    bg: 'bg-rose-50',
    border: 'border-rose-400',
    ring: 'ring-rose-200',
  },
  {
    key: 'center',
    icon: Shield,
    title: 'Centre / IME',
    desc: 'Coordonnez votre équipe pluridisciplinaire',
    color: 'text-blue-500',
    bg: 'bg-blue-50',
    border: 'border-blue-400',
    ring: 'ring-blue-200',
  },
];

const Register = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: choix type, 2: formulaire
  const [accountType, setAccountType] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    profession: '',
    center_name: '',
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Créer le compte Supabase Auth
      const { data, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.first_name,
            last_name: formData.last_name,
            account_type: accountType,
          }
        }
      });

      if (authError) throw authError;

      const userId = data.user?.id;
      if (!userId) throw new Error('Erreur lors de la création du compte');

      // Créer le profil selon le type
      if (accountType === 'professional') {
        await supabase.from('professional_profiles').upsert({
          id: userId,
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          profession: formData.profession,
        });
      } else if (accountType === 'parent') {
        await supabase.from('parents').upsert({
          id: userId,
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          account_type: 'classique',
        });
      } else if (accountType === 'center') {
        await supabase.from('professional_profiles').upsert({
          id: userId,
          first_name: formData.center_name,
          last_name: '',
          email: formData.email,
          profession: 'Centre / IME',
          structure_name: formData.center_name,
        });
      }

      // Connexion automatique après inscription
      await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      // Rediriger selon le type
      if (accountType === 'parent') {
        navigate('/');
      }

    } catch (err) {
      console.error('Registration error:', err);
      if (err.message?.includes('already registered')) {
        setError('Un compte existe déjà avec cet email.');
      } else if (err.message?.includes('Password should be at least')) {
        setError('Le mot de passe doit contenir au moins 6 caractères.');
      } else {
        setError('Erreur lors de la création du compte. Veuillez réessayer.');
      }
    } finally {
      setLoading(false);
    }
  };

  const selectedType = ACCOUNT_TYPES.find(t => t.key === accountType);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-primary/3 flex flex-col">

      {/* Header */}
      <div className="p-6 flex items-center justify-between">
        <button
          onClick={() => step === 1 ? navigate('/accueil') : setStep(1)}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors font-outfit"
        >
          <ArrowLeft className="w-4 h-4" />
          {step === 1 ? 'Accueil' : 'Retour'}
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xs font-outfit">P</span>
          </div>
          <span className="font-bold text-slate-700 font-outfit">Passerelle</span>
        </div>
      </div>

      {/* Progress */}
      <div className="px-6 mb-8">
        <div className="max-w-md mx-auto flex gap-2">
          <div className="flex-1 h-1 rounded-full bg-primary" />
          <div className={`flex-1 h-1 rounded-full transition-colors duration-300 ${step === 2 ? 'bg-primary' : 'bg-slate-200'}`} />
        </div>
      </div>

      <div className="flex-1 px-6 pb-12">
        <div className="max-w-md mx-auto">

          {/* Step 1 — Choix du profil */}
          {step === 1 && (
            <div>
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-800 font-outfit mb-2">Créer un compte</h1>
                <p className="text-slate-500 font-outfit">Qui êtes-vous ?</p>
              </div>

              <div className="space-y-3 mb-8">
                {ACCOUNT_TYPES.map(type => {
                  const Icon = type.icon;
                  const isSelected = accountType === type.key;
                  return (
                    <button
                      key={type.key}
                      onClick={() => setAccountType(type.key)}
                      className={`w-full p-5 rounded-2xl border-2 text-left transition-all duration-200 ${
                        isSelected
                          ? `${type.border} ${type.ring} ring-4 bg-white shadow-md`
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${isSelected ? type.bg : 'bg-slate-50'}`}>
                          <Icon className={`w-6 h-6 ${isSelected ? type.color : 'text-slate-400'}`} />
                        </div>
                        <div>
                          <p className={`font-semibold font-outfit ${isSelected ? 'text-slate-800' : 'text-slate-700'}`}>
                            {type.title}
                          </p>
                          <p className="text-sm text-slate-400 font-outfit mt-0.5">{type.desc}</p>
                        </div>
                        {isSelected && (
                          <div className={`ml-auto w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${type.bg}`}>
                            <div className={`w-2.5 h-2.5 rounded-full ${type.color.replace('text-', 'bg-')}`} />
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={!accountType}
                className="w-full py-4 bg-primary text-white font-semibold rounded-2xl flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary-dark transition-all duration-200 shadow-sm hover:shadow-md font-outfit"
              >
                Continuer
                <ArrowRight className="w-4 h-4" />
              </button>

              <p className="text-center text-sm text-slate-500 mt-6 font-outfit">
                Déjà un compte ?{' '}
                <button onClick={() => navigate('/login')} className="text-primary font-semibold hover:underline">
                  Se connecter
                </button>
              </p>
            </div>
          )}

          {/* Step 2 — Formulaire */}
          {step === 2 && (
            <div>
              <div className="mb-8">
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold mb-4 font-outfit ${selectedType?.bg} ${selectedType?.color}`}>
                  {selectedType && <selectedType.icon className="w-4 h-4" />}
                  {selectedType?.title}
                </div>
                <h1 className="text-2xl font-bold text-slate-800 font-outfit mb-2">Vos informations</h1>
                <p className="text-slate-500 font-outfit">Quelques détails pour configurer votre compte</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">

                {/* Nom du centre */}
                {accountType === 'center' && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-600 mb-1.5 font-outfit">Nom du centre *</label>
                    <input
                      type="text"
                      value={formData.center_name}
                      onChange={(e) => handleChange('center_name', e.target.value)}
                      placeholder="Ex: IME Les Hirondelles"
                      className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl text-slate-700 font-outfit text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
                      required
                    />
                  </div>
                )}

                {/* Prénom + Nom */}
                {accountType !== 'center' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-semibold text-slate-600 mb-1.5 font-outfit">Prénom *</label>
                      <input
                        type="text"
                        value={formData.first_name}
                        onChange={(e) => handleChange('first_name', e.target.value)}
                        placeholder="Marie"
                        className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl text-slate-700 font-outfit text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-600 mb-1.5 font-outfit">Nom *</label>
                      <input
                        type="text"
                        value={formData.last_name}
                        onChange={(e) => handleChange('last_name', e.target.value)}
                        placeholder="Dupont"
                        className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl text-slate-700 font-outfit text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
                        required
                      />
                    </div>
                  </div>
                )}

                {/* Profession (Pro seulement) */}
                {accountType === 'professional' && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-600 mb-1.5 font-outfit">Profession *</label>
                    <select
                      value={formData.profession}
                      onChange={(e) => handleChange('profession', e.target.value)}
                      className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl text-slate-700 font-outfit text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
                      required
                    >
                      <option value="">Sélectionnez votre profession</option>
                      {PROFESSIONS.map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Email */}
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-1.5 font-outfit">Adresse email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="votre@email.fr"
                    className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl text-slate-700 font-outfit text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
                    required
                  />
                </div>

                {/* Mot de passe */}
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-1.5 font-outfit">Mot de passe *</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => handleChange('password', e.target.value)}
                      placeholder="6 caractères minimum"
                      className="w-full h-12 px-4 pr-12 bg-white border border-slate-200 rounded-xl text-slate-700 font-outfit text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 font-outfit">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-primary text-white font-semibold rounded-2xl flex items-center justify-center gap-2 disabled:opacity-40 hover:bg-primary-dark transition-all duration-200 shadow-sm hover:shadow-md font-outfit mt-2"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      Créer mon compte
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <p className="text-center text-xs text-slate-400 font-outfit pt-2">
                  En créant un compte, vous acceptez nos conditions d'utilisation et notre politique de confidentialité.
                </p>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Register;
